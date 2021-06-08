return;

const fs = require('fs')

let Betty = module.parent.exports
let psTail = fs.readFileSync('./betty_other/powershell.tail')
let batchTail = fs.readFileSync('./betty_other/batchscript.tail')
//let cooldown = []

let usageEx = "```md\n# b?dl\n> Use this command to create custom download queries\n\n> Examples:\n> (note that last 2 arguments are always optional)\nb?dl range [start-messageID] [end-messageID] <#channel> <@mention>\nb?dl last [number] <#channel> <@mention>\n\n> finished example command:\nb?dl range 696750376518680708 696753030015746119\nb?dl last 50 @Mimee#1111\n\n> You can assign the scripts a custom header by adding text after | at the end of command:\nb?dl last 50 @Mimee#1111 | Megumin & Aqua dump```"

module.exports = {
	name: "dl",
	event: "MESSAGE_CREATE",
	desc: "Generates  custom download script",
	run: async (bot, message, guilds, stats) => {
		
		//return // disable for now
		
		let reply
		let channel
		
		try {
			
			//if (!message.member.permission.has("administrator")) return
			
			let channel = null
			
			if (message.channelMentions.length == 1) {
				channel = message.channel.guild.channels.get(message.channelMentions[0])
			} else {
				channel = message.channel
			}
			
			if (!channel) return // shit happened, it shouldnt, but it did.
			
			if (!Betty.realtimeChannels.includes(channel.id)){
				if (Betty.progressMap[channel.id] > 0){
					await message.channel.createMessage(`This channel in the middle of caching (${Betty.progressMap[channel.id]}%)`)
				} else {
					await message.channel.createMessage("This channel wasn't cached yet - use ``b?fetch``")
				}
				return
			}
			
			let words = message.content.split("|")[0].trim().split(" ")
			
			if ( words.length < 3 ) {
				await bot.createMessage( message.channel.id, usageEx )
				return
			}
			
			let stmtBuilder = ""
			
			let startURL = null
			let endURL = null
			
			let startID = words[2]
			let endID = words[3] || message.id
				
			let optionalUser = getUserFromMsg(bot, words[words.length-1]) || getUserFromMsg(bot, words[words.length-2])
				
			if ( words[1].toLowerCase() == "range" ){
				
				//let startID = words[2]
				//let endID = words[3] || message.id
				
				if ( (startID != startID.replace(/([^0-9_]+)/gi, '')) ||
					 (endID   != endID.replace(/([^0-9_]+)/gi, ''))   ){
					
					await bot.createMessage( message.channel.id, usageEx )
					return
				}
				
				startURL = `https://discordapp.com/channels/${channel.guild.id}/${channel.id}/${startID}`
				endURL = `https://discordapp.com/channels/${channel.guild.id}/${channel.id}/${endID}`
				
				
				stmtBuilder = `SELECT * FROM "${channel.id}" WHERE id BETWEEN "${startID}" AND "${endID}"`
				if (optionalUser) stmtBuilder += ` AND author = "${optionalUser.id}"`
				
				
			} else if ( words[1].toLowerCase() == "last" ){
				
				let num = words[2]
				if (num != num.replace(/([^0-9_]+)/gi, '')){
					await bot.createMessage( message.channel.id, usageEx )
					return
				}
				
				
				stmtBuilder = `SELECT * FROM "${channel.id}"`
				if (optionalUser) stmtBuilder += ` WHERE author = "${optionalUser.id}"`
				stmtBuilder += ` ORDER BY id DESC LIMIT ${num}`
			}
			
			reply = await bot.createMessage( message.channel.id, {
				content: "<@" + message.author.id + ">",
				embed: {
					color: 0xffb216,
					author: {
						icon_url: "https://cdn.discordapp.com/emojis/610648407832395787.png", 
						name: `Generating download scripts...`
					},
				}
			})
			
			const stmt = Betty.db.prepare(stmtBuilder)
			const filteredMessages = stmt.all()
			
			if (filteredMessages.length == 0){
				await reply.edit({
					content: "<@" + message.author.id + ">",
					embed: {
						color: 0xff0000,
						author: {
							icon_url: "https://cdn.discordapp.com/emojis/610648407832395787.png", 
							name: `I couldn't find any files for that query`
						},
					}
				})
				return
			}
			
			let newFilename = channel.name.replace(/([^a-z0-9_]+)/gi, '') || "images"
			
			let storageChannel = require('../config.json').storageChannel
			
			let txtFile = buildTxtFile(filteredMessages)
			let txtUpload = await bot.getChannel(storageChannel).createMessage( "", { name: `${newFilename}-dl.txt`, file: txtFile })
			let txtDownload = txtUpload.attachments[0].url
			
			let psScript = buildPSScript(filteredMessages, channel.id, newFilename)
			let psUpload = await bot.getChannel(storageChannel).createMessage( "", { name: `${newFilename}-dl.ps1`, file: psScript })
			let psDownload = psUpload.attachments[0].url
			
			let batchScript = buildBatchScript(filteredMessages, newFilename)
			let batchUpload = await bot.getChannel(storageChannel).createMessage( "", { name: `${newFilename}-dl.bat`, file: batchScript })
			let batchDownload = batchUpload.attachments[0].url
		
			let today = new Date()
			//let todaySplit = today.toString().split(" ")
			
			let embedColor = 0xffb216
			
			
			let embedDesc = null
			let customHeader = null
			let messageSplit = message.content.split("|")
			
			if (messageSplit.length > 1){
				customHeader = messageSplit[1].trim() == "" ? `#${channel.name} dump` : messageSplit[1].trim()
			} else {
				customHeader = optionalUser ? `${optionalUser.username}'s ` : ""
				customHeader += `#${channel.name} dump`
			}
			
			let byWhomst = optionalUser ? `by ${optionalUser.username} ` : ""
			
			if (startURL){
				embedDesc = `This download script includes all files uploaded ${byWhomst}between those two messages: [(1)](${startURL}) and [(2)](${endURL}).`
			} else {
				embedDesc = `This script includes last ${filteredMessages.length} uploaded files ${byWhomst}`
			}
			
			await reply.edit({
				content: "<@" + message.author.id + ">",
				embed: {
					color: embedColor, // 0xffb216
					thumbnail: { url: filteredMessages[0].url }, // filteredMessages[filteredMessages.length-1].url
					author: {
						icon_url: "https://cdn.discordapp.com/emojis/610648407832395787.png", 
						name: customHeader //`#${channel.name} dump - ${todaySplit[2]} ${todaySplit[1]} ${todaySplit[3]}`
					},
					description: embedDesc,
					fields: [{
						name: "Channel", value: `<#${channel.id}>`, inline: true
					},{
						name: "Files", value: filteredMessages.length, inline: true
					},{
						name: "​User filter", value: optionalUser ? optionalUser.username : "---", inline: true // ${(psUpload.attachments[0].size/1024).toFixed(2)} KB
					},{
						name: ".txt file", value: `[${newFilename}-dl.txt](${txtDownload})`, inline: true
					},{
						name: "PowerShell (fast)", value: `[${newFilename}-dl.ps1](${psDownload})`, inline: true
					},{
						name: "Batch (slower)", value: `[${newFilename}-dl.bat](${batchDownload})`, inline: true
					}],
					footer: { text: "Scripts generated" },
					timestamp: today
				}
			})
			
			//await reply.addReaction("❓")
			
		
		} catch (e) {
			
			console.log("[b?dl] Something went wrong:", e)
			
		}

	}
}

function getUserFromMsg(bot, text){

	let userID = text.replace(/([^0-9_]+)/gi, '')
	let user = bot.users.get(userID)
	
	if (!user) return null
	
	return user
	
}

function buildTxtFile(items){
	
	let head = ""

	//for (let i = 0; i < items.length; i++) head +=	`url="${items[i].url}"\n`
	for (let i = 0; i < items.length; i++) head +=	`${items[i].url}\n`

	return head
	
}

function buildBatchScript(items, name){
	
	let head = "@echo off\nSETLOCAL EnableDelayedExpansion\n"
	
	for (let i = 0; i < items.length; i++){
		
		head +=	`\nset url_list[${i}]=${items[i].url}\nset filenames[${i}]=${items[i].filename}\n`
		
	}
	
	return (head + batchTail.toString().replace("CHANNEL_NAME", name).replace("FILES_COUNT", items.length))
	
}

function buildPSScript(items, id, name){
	let head = "$data = @("

	for (let i = 0; i < items.length; i++){
		
		head +=	`\n  [PSCustomObject]@{\n    Url = "${items[i].url}"\n    Filename = "${items[i].filename}"\n  }`
		
		if (i != (items.length - 1)) head += ","
		
	}

	head += "\n)\n\n"

	return (head + psTail.toString().replace("CHANNEL_ID", id).replace("CHANNEL_NAME", name))
}


/*
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacement);
}

Array.prototype.delayedRemove = function(item, delay) {
    var target = this;
    
    setTimeout(() => {
        let index = target.indexOf(item);
        target.splice(index, 1);
    }, delay)
}
*/