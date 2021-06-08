const Betty      = require('./betty.js')
const session    = require('express-session')
const bodyParser = require('body-parser')
const express    = require('express')
const axios      = require('axios')
const cors       = require('cors')
const app        = express()
const _FormData  = require('form-data')

const MemoryStore = require('memorystore')(session)

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000') 
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: true,
    secret: 'kako-chan is a very curious girl',
    saveUninitialized: true,
}))

const clientSecret = require('./config.json').clientSecret

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.set('trust proxy', 1) // trust first proxy
app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.set('port', 5050)

app.listen(app.get('port'), () => {
    console.log(`[Betty] API port: ${app.get('port')}`)
})

app.get('/', (req, res) => {
    return res.status(200).json({ message: ":)" })
})

app.get('/api', (req, res) => {
    return res.redirect(301, '/');
})

// gets accessToken (on front save it in localStorage later!!!) or session...
app.get('/api/accessToken', async (req, res) => {
    
    const code = req.query.code
    
    if (!code) return res.status(500).json({ error: ':-(' })

    const redirectURL = `${req.headers.origin}/servers`
    
    try {

        const formData = new _FormData() 
        formData.append('client_id', '675458545809883149')
        formData.append('client_secret', clientSecret)
        formData.append('grant_type', 'authorization_code')
        formData.append('code', code)
        formData.append('redirect_uri', redirectURL)
        formData.append('scope', 'identify guilds')

        const response = await axios.post('https://discordapp.com/api/oauth2/token', formData, {
            headers: formData.getHeaders()
        })

        const accessToken = response.data.access_token
        req.session.access_token = accessToken

        return res.status(200).json({ message: 'Discord access token has been granted' })

    } catch (error){
        console.log(error)
        return res.status(500).json({ error: "Couldn't authenticate" })
    }
})

app.get('/api/getGuilds', async (req,res) => {
    const accessToken = req.session.access_token

    if (!accessToken) return res.status(500).json({ error: "Couldn't authenticate" })

    try {
        const headers  = { headers: { authorization: `Bearer ${accessToken}` } }
        const requests = [ 
            axios.get('https://discordapp.com/api/users/@me', headers ),
            axios.get('https://discordapp.com/api/users/@me/guilds', headers )
        ]
        const [ user , guilds ] = await Promise.all(requests)


        // filter to get only the servers that Betty can see
        const sharedGuilds = guilds.data.filter( g => Betty.guildsData.get(g.id) )
        
        // unga bunga ot get table names (which happen to be guild ids)
        const stmt = Betty.db.prepare(`SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "permalinks"`)
        const dbTables = stmt.all()
        
        sharedGuilds.forEach( g => g.availableChannels = [] )

        for (let i = 0; i < dbTables.length; i++){
            const ch = Betty.bot.getChannel(dbTables[i].name)
            if (!ch) continue
            
            const lastImageQuery = Betty.db.prepare(`SELECT * FROM "${dbTables[i].name}" ORDER BY id DESC LIMIT 1`)
            const lastImageUrl = optimizeDiscordUrl(lastImageQuery.get().url)

            const shared = sharedGuilds.find( g => g.id == ch.guild.id )
            shared.availableChannels.push({ ...ch, lastImageUrl })
        }
        
        sharedGuilds.sort((a, b) => (a.count > b.count) ? -1 : 1)

        // map it again and remove all unneeded stuff!!!! too much data (8mb!! ish)

        return res.status(200).json({ 
            user: user.data, 
            guilds: sharedGuilds 
        })

    } catch (error){
        console.log(error)
        return res.status(500).json({ error: "Couldn't get any guilds" })
    }
})

app.get('/api/member/:guildID/:userID/', async (req, res, next) => {

	const guild = Betty.guildsData.get(req.params.guildID)

    let user = guild.members.get(req.params.userID)
    if (user?.username) console.log('found ', user.username)
    if (user) return res.status(200).json({ user })
    try {
        const response = await Betty.bot.getRESTGuildMember(req.params.guildID, req.params.userID)
        guild.members.add(response)
        console.log('did a rest on...', response)

        // deconstruct response object to get rid of unneeded properties such as guild object
        const { roles, username, nick, id, status, user : _user } = response
        const color = getUserColor(guild, roles )
        
        user = { user: _user, username, id, nick, status, color }

        return res.status(200).json({ user })
    } catch (error){
        return res.status(200).json({
            user: { id: req.params.userID }
        })
    }
})

// shows all messages(images)
app.get('/api/browse/:guildID/:channelID/', async (req, res, next) => {
	
	const guild = Betty.guildsData.get(req.params.guildID)

	let channel = null
    let pageNum  = isNaN(Number(req.query.p)) ? 0  : Number(req.query.p)
    let pageSize = isNaN(Number(req.query.s)) ? 10 : Number(req.query.s)

    pageNum  = Math.max(1, pageNum) - 1 // min page number: 1 >> shift indexing by 1
    pageSize = Math.min(100, Math.max(5, pageSize)) // min page size: 5, max page size: 100

	if (!guild){
        return res.status(500).json({ error: "Could not get the guild" })
	} else {
		channel = guild.channels.get(req.params.channelID)
		if (!channel) return res.status(500).json({ error: "Could not get the channel" })
        
        //if (!pageNum) return res.status(500).json({ error: "Invalid pagination param" })
	}
    
	
	const queryStarted = new Date().getTime()


    // ----------------------------------------------
    // this works for ORDER BY DESC
    
    const msgCountQuery = Betty.db.prepare(`SELECT MAX(_ROWID_) as value FROM "${channel.id}"`)
    const msgCount = msgCountQuery.get().value

    const rowID = pageNum * pageSize
    const querySQL = `SELECT * FROM "${channel.id}" WHERE _ROWID_ <= ${msgCount - rowID} ORDER BY id DESC LIMIT ${pageSize}`
    
    // ----------------------------------------------


	const stmt = Betty.db.prepare(querySQL)
	const filteredMessages = stmt.all()
    
	const queryEnded = new Date().getTime()
	const duration = (queryEnded - queryStarted) / 1000
	console.log(`[SQLite] Query took ${duration} s to complete`)
	
    const unavailableUsers = {}

    for(let i = 0; i < filteredMessages.length; i++) {

        if (unavailableUsers[filteredMessages[i].author]) continue
        
        let user = guild.members.get(filteredMessages[i].author)

        if (!user) {
            try {

                //const response = await Betty.bot.getRESTGuildMember(guild.id, msg.author)
                //guild.members.add(response)
                //console.log('did a rest on...', response.user.username)
                // deconstruct response object to get rid of unneeded properties such as guild object
                //const { roles, nick, id, status, user : _user } = response
                //user = { id, nick, roles, status, ..._user }
                
            } catch (error){
                // user was most likely deleted
                unavailableUsers[filteredMessages[i].author] = true
            }
        }

        if (user) filteredMessages[i].author = { ...user }
        filteredMessages[i].author.color = getUserColor(guild, filteredMessages[i].author.roles)
        delete filteredMessages[i].author.guild
        //console.log(filteredMessages[i].author)
        //console.log(msg.author)
    }

    // FOR LATER
    // FOR LATER

    //  send members and messages separately and then just have userID on messages to get to them
    //  why? less data sent over the network!!!

    // FOR LATER
    // FOR LATER
	
	const matchingChannels = getChannelsListForGuild(guild)
	//let chID = channel.id
	const chName = channel.name.replace(/([^a-z0-9_]+)/gi, '') || "images"
    
    return res.status(200).json({
        botUser: Betty.botUser,
        messages: filteredMessages,
        channel: channel,
        channels: matchingChannels,
        //psTail: psTail.replace("CHANNEL_ID", chID).replace("CHANNEL_NAME", chName),
        fixedname: chName,
        msgCount: msgCount
    })
})

function decimalColorToHTMLcolor(num){
    const r = Math.floor(num / (256*256))
    const g = Math.floor(num / 256) % 256
    const b = num % 256

    // desired format example:
    // color: rgb(215, 52, 42)
    
    return `rgb(${r}, ${g}, ${b})`
}

function getUserColor( guild, roles = [] ){
    // get their roles, filter out the ones that have no set color, 
    // and then get the one with the highest position
    
    if (roles.length == 0) return "rgb(94, 97, 101)"
    
    const roleList = []
    
    roles.forEach( roleID => {
        const r = guild.roles.get(roleID)
        if (r.color) roleList.push(r)
    })
    
    const highestPosition = Math.max(...roleList.map( o => o.position ))
    const highestRole = guild.roles.find( r => r.position == highestPosition )
    
    return highestRole ? decimalColorToHTMLcolor(highestRole.color) : null
} 

function getChannelsListForGuild(guild){

	const stmt = Betty.db.prepare(`SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "permalinks"`)
	const dbTables = stmt.all()
	
	const channels = []
	
	for (let i = 0; i < dbTables.length; i++){
		const ch = guild.channels.get(dbTables[i].name)
		if (!ch) continue
		
		if (ch.guild.id == guild.id){
			const lastImageQuery = Betty.db.prepare(`SELECT * FROM "${dbTables[i].name}" ORDER BY id DESC LIMIT 1`)
			const lastImage = lastImageQuery.get()
			ch.lastImage = optimizeDiscordUrl(lastImage.url)
			
			channels.push(ch)
		}
	}
	
	return channels
}

function optimizeDiscordUrl(url : string){
	if (url.includes("media.discordapp.net")) {
		return `${url.split("?")[0]}?width=640&height=640`
	} else if (url.includes(".discordapp.")){
		return `${url.replace("cdn.discordapp.com", "media.discordapp.net")}?width=128&height=128`
	} else {
		return url
	}
}