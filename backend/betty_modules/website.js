return;
return;
return;
return;
return;


module.exports = {
	name: "website",
	event: "",
	desc: "This is not a Discord command",
}

const fs = require('fs')
const psTail = fs.readFileSync('./betty_other/powershell.tail').toString()
const rp = require('request-promise')
const clientSecret = require('../config.json').clientSecret

let Betty = module.parent.exports
let session = require('express-session')
let bodyParser = require('body-parser')
let express = require('express')
let app = express()

app.set('port', (5001));
app.use(express.static(__dirname + '/../public'));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'kako-chan is a very curious girl',
  resave: false,
  saveUninitialized: true
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/../views');
app.set('view engine', 'ejs');

app.listen(app.get('port'), () => {
    console.log(`[Betty] Website app port: ${app.get('port')}`)
})

app.get('/browse/:guildID/:channelID', (req, res, next) => {
	//req.params.guildID
	//req.params.channelID
	
	let guild = Betty.guildsData.get(req.params.guildID)
	let channel = null
	let errMsg = null
	
	if (!guild){
		errMsg = "Could not get the guild"
	} else {
		channel = guild.channels.get(req.params.channelID)
		if (!channel) errMsg = "Could not get the channel"
	}
	
	// no need for this for now i guess
	//if (req.params.channelID != req.params.channelID.replace(/([^0-9_]+)/gi, '')){ }
	
	if (errMsg){
		res.render('pages/browse_channel', {
			data: { error: errMsg }
		})
		return
	}
	//let guild = Betty.guildsData.find( g => g.channels.get(req.params.channelID) != undefined )
	
	let queryStarted = new Date().getTime()

	const stmt = Betty.db.prepare(`SELECT * FROM "${channel.id}"`)
	const filteredMessages = stmt.all()
	
	let queryEnded = new Date().getTime()
	let duration = (queryEnded - queryStarted) / 1000
	console.log(`[SQLite] Query took ${duration} s to complete`)
	
	// DB COLUMNS LOOK LIKE THIS:
	//
	//	"${message.channel.id}" ( url, 			   filename, 	   author, 			   id )
	//							  attachment.url   filename.ext    message.author.id   message.id
	/*
	
	const stmt = Betty.db.prepare(`SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "permalinks"`)
	const dbTables = stmt.all()
	
	for (let i = 0; i < dbTables.length; i++){
		// CREATE INDEX id_index ON "${dbTables[i].name}"(id);
		// nvm INDEX doesnt have to be unique? i think? wtf?
	}
	
	*/
	
	let matchingChannels = getChannelsListForGuild(guild)
	let chID = channel.id
	let chName = channel.name.replace(/([^a-z0-9_]+)/gi, '') || "images"
	
	res.render('pages/browse_channel', {
		data: {
			botUser: Betty.botUser,
			messages: filteredMessages,
			channel: channel,
			channels: matchingChannels,
			psTail: psTail.replace("CHANNEL_ID", chID).replace("CHANNEL_NAME", chName),
			fixedname: chName
		}
	})
})

app.get('/browse/:guildID/', (req, res, next) => {
	//req.params.guildID
	//req.params.channelID
	
	let guild = Betty.guildsData.get(req.params.guildID)
	let errMsg = null
	
	if (!guild){
		errMsg = "Could not get the guild"
	}
	
	// no need for this for now i guess
	//if (req.params.channelID != req.params.channelID.replace(/([^0-9_]+)/gi, '')){ }

	if (errMsg){
		res.render('pages/browse_guild', {
			data: { error: errMsg }
		})
		return
	}
	
	let matchingChannels = getChannelsListForGuild(guild)
	
	if (matchingChannels.length < 1){
		res.redirect(`/browse/${req.params.guildID}/0`)
	} else {
		res.redirect(`/browse/${req.params.guildID}/${matchingChannels[0].id}`)
	}
	
})

function getChannelsListForGuild(guild){

	const stmt = Betty.db.prepare(`SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "permalinks"`)
	const dbTables = stmt.all()
	
	let channels = []
	
	for (let i = 0; i < dbTables.length; i++){
		let ch = guild.channels.get(dbTables[i].name)
		if (!ch) continue
		
		if (ch.guild.id == guild.id){
			let lastImageQuery = Betty.db.prepare(`SELECT * FROM "${dbTables[i].name}" ORDER BY id DESC LIMIT 1`)
			let lastImage = lastImageQuery.get()
			ch.lastImage = lastImage.url
			
			channels.push(ch)
		}
	}
	
	return channels
}

app.get('/', (req, res) => {
	res.redirect('/browse')
})

app.get('/browse', async (req, res) => {
	
	if (req.query.logout == "true"){
		req.session.access_token = null
	}
	
	if (req.query.code || req.session.access_token){
		
		try {
			
			let response
			let accessToken
			
			if (req.session.access_token){
				
				accessToken = req.session.access_token
				
			} else {
				
				let redirectURL = (req.protocol + '://' + req.get('host') + req.originalUrl).split('?')[0]
				
				response = await rp({
					url: 'https://discordapp.com/api/oauth2/token', 
					method: 'POST',
					form: {
						client_id: "675458545809883149", //Betty.bot.user.id,
						client_secret: clientSecret,
						grant_type: "authorization_code",
						code: req.query.code,
						redirect_uri: redirectURL,
						scope: 'identify guilds'
					},
					headers: {
						/* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
					}
				})
				
				let auth_json = JSON.parse(response)
				accessToken = auth_json.access_token
				req.session.access_token = accessToken
			}
			
			let userRes = await rp({
				url: 'https://discordapp.com/api/users/@me',
				method: 'GET',
				headers: { authorization: `Bearer ${accessToken}` }
			})
			let guildsRes = await rp({
				url: 'https://discordapp.com/api/users/@me/guilds',
				method: 'GET',
				headers: { authorization: `Bearer ${accessToken}` }
			})
			
			let userJSON = JSON.parse(userRes)
			let guildsJSON = JSON.parse(guildsRes)
			
			let sharedGuilds = guildsJSON.filter( g => Betty.guildsData.get(g.id) )
			let sharedGuildIDs = guildsJSON.map( g => g.id )
			
			const stmt = Betty.db.prepare(`SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "permalinks"`)
			const dbTables = stmt.all()
			
			sharedGuilds.forEach( g => {
				g.count = 0
			})

			for (let i = 0; i < dbTables.length; i++){
				let ch = Betty.bot.getChannel(dbTables[i].name)
				if (!ch) continue
				
				let shared = sharedGuilds.find( g => g.id == ch.guild.id )
				shared.available = true
				shared.count++
			}
			
			sharedGuilds.sort((a, b) => (a.count > b.count) ? -1 : 1)
			
			console.log(`\nOAUTH - ${userJSON.username} (${userJSON.id}):`)
			console.log(sharedGuilds.filter(g => g.available).map(g => `${g.id} : ${g.name}`))
			//console.log(`access token: ${req.session.access_token}`)
			
			res.render('pages/browse', {
				data: {
					user: userJSON,
					guilds: sharedGuilds
				}
			})
			
		} catch (e) {
			res.render('pages/browse', { data: {} })
		}
		
	} else {
		res.render('pages/browse', { data: {} })
	}
})
