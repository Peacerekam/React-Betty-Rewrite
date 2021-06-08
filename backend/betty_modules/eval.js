return;

const fs = require('fs')

let Betty = module.parent.exports

module.exports = {
	name: "eval",
	event: "MESSAGE_CREATE",
	desc: "eval",
	run: async (bot, message, guilds, stats) => {
		
		if (message.author.id != "153942038138585088") return
		
		let words = message.content.split(" ")
		
		if (!words[1]) return
		
		// !admin eval
		// b?eval eval
		
		if (words[1] == 'eval') {
			let toEval = message.content.slice(11, message.content.length).trim();
			
			try {
				let i = 0;
				let j = 0;
				let x = 0;
				let text = "";
				let msg = "";
				let list = "";

				if (toEval.startsWith("```js\n")){
					toEval = toEval.slice(6);
				}
				
				if (toEval.endsWith("```")){
					toEval = toEval.slice(0,-3);
				}

				msg = eval(toEval);

				if (msg != undefined) {
					setTimeout(() => {
						if (typeof msg === 'object'){
							msg = JSON.stringify(msg).substring(0,1950);
						}
						
						bot.createMessage(message.channel.id, "**Result:**```js\n" + msg + "```");
					}, 200);
				}

			} catch (error) {
				console.log(error);
				bot.createMessage(message.channel.id, "**Error:**```js\n" + error + "```");
			}

		}

		if (words[1] == 'evalx') {

			let toEval = message.content.slice(12, message.content.length).trim();
			
			try {
				let i = 0;
				let j = 0;
				let x = 0;
				let text = "";
				let msg = "";
				let list = "";

				if (toEval.startsWith("```js\n")){
					toEval = toEval.slice(6);
				}
				
				if (toEval.endsWith("```")){
					toEval = toEval.slice(0,-3);
				}

				msg = eval(toEval);

				//if (msg != undefined) {
					setTimeout(() => {
						bot.createMessage(message.channel.id, "**Result:**```js\n" + msg + "```");
					}, 200);
				//}

			} catch (error) {
				console.log(error);
				bot.createMessage(message.channel.id, "**Error:**```js\n" + error + "```");
			}

		}
	}
}
