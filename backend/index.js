var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var Betty = require('./betty.js');
var session = require('express-session');
var bodyParser = require('body-parser');
var express = require('express');
var axios = require('axios');
var cors = require('cors');
var app = express();
var _FormData = require('form-data');
var MemoryStore = require('memorystore')(session);
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: true,
    secret: 'kako-chan is a very curious girl',
    saveUninitialized: true,
}));
var clientSecret = require('./config.json').clientSecret;
var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.set('trust proxy', 1); // trust first proxy
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('port', 5050);
app.listen(app.get('port'), function () {
    console.log("[Betty] API port: " + app.get('port'));
});
app.get('/', function (req, res) {
    return res.status(200).json({ message: ":)" });
});
app.get('/api', function (req, res) {
    return res.redirect(301, '/');
});
// gets accessToken (on front save it in localStorage later!!!) or session...
app.get('/api/accessToken', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var code, redirectURL, formData, response, accessToken, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                code = req.query.code;
                if (!code)
                    return [2 /*return*/, res.status(500).json({ error: ':-(' })];
                redirectURL = req.headers.origin + "/servers";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                formData = new _FormData();
                formData.append('client_id', '675458545809883149');
                formData.append('client_secret', clientSecret);
                formData.append('grant_type', 'authorization_code');
                formData.append('code', code);
                formData.append('redirect_uri', redirectURL);
                formData.append('scope', 'identify guilds');
                return [4 /*yield*/, axios.post('https://discordapp.com/api/oauth2/token', formData, {
                        headers: formData.getHeaders()
                    })];
            case 2:
                response = _a.sent();
                accessToken = response.data.access_token;
                req.session.access_token = accessToken;
                return [2 /*return*/, res.status(200).json({ message: 'Discord access token has been granted' })];
            case 3:
                error_1 = _a.sent();
                console.log(error_1);
                return [2 /*return*/, res.status(500).json({ error: "Couldn't authenticate" })];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get('/api/getGuilds', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var accessToken, headers, requests, _a, user, guilds, sharedGuilds, stmt, dbTables, _loop_1, i, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                accessToken = req.session.access_token;
                if (!accessToken)
                    return [2 /*return*/, res.status(500).json({ error: "Couldn't authenticate" })];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                headers = { headers: { authorization: "Bearer " + accessToken } };
                requests = [
                    axios.get('https://discordapp.com/api/users/@me', headers),
                    axios.get('https://discordapp.com/api/users/@me/guilds', headers)
                ];
                return [4 /*yield*/, Promise.all(requests)
                    // filter to get only the servers that Betty can see
                ];
            case 2:
                _a = _b.sent(), user = _a[0], guilds = _a[1];
                sharedGuilds = guilds.data.filter(function (g) { return Betty.guildsData.get(g.id); });
                stmt = Betty.db.prepare("SELECT name FROM sqlite_master WHERE type=\"table\" AND name NOT LIKE \"sqlite_%\" AND name NOT LIKE \"permalinks\"");
                dbTables = stmt.all();
                sharedGuilds.forEach(function (g) { return g.availableChannels = []; });
                _loop_1 = function (i) {
                    var ch = Betty.bot.getChannel(dbTables[i].name);
                    if (!ch)
                        return "continue";
                    var lastImageQuery = Betty.db.prepare("SELECT * FROM \"" + dbTables[i].name + "\" ORDER BY id DESC LIMIT 1");
                    var lastImageUrl = optimizeDiscordUrl(lastImageQuery.get().url);
                    var shared = sharedGuilds.find(function (g) { return g.id == ch.guild.id; });
                    shared.availableChannels.push(__assign(__assign({}, ch), { lastImageUrl: lastImageUrl }));
                };
                for (i = 0; i < dbTables.length; i++) {
                    _loop_1(i);
                }
                sharedGuilds.sort(function (a, b) { return (a.count > b.count) ? -1 : 1; });
                // map it again and remove all unneeded stuff!!!! too much data (8mb!! ish)
                return [2 /*return*/, res.status(200).json({
                        user: user.data,
                        guilds: sharedGuilds
                    })];
            case 3:
                error_2 = _b.sent();
                console.log(error_2);
                return [2 /*return*/, res.status(500).json({ error: "Couldn't get any guilds" })];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.get('/api/member/:guildID/:userID/', function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    var guild, user, response, roles, username, nick, id, status_1, _user, color, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                guild = Betty.guildsData.get(req.params.guildID);
                user = guild.members.get(req.params.userID);
                if (user === null || user === void 0 ? void 0 : user.username)
                    console.log('found ', user.username);
                if (user)
                    return [2 /*return*/, res.status(200).json({ user: user })];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, Betty.bot.getRESTGuildMember(req.params.guildID, req.params.userID)];
            case 2:
                response = _a.sent();
                guild.members.add(response);
                console.log('did a rest on...', response);
                roles = response.roles, username = response.username, nick = response.nick, id = response.id, status_1 = response.status, _user = response.user;
                color = getUserColor(guild, roles);
                user = { user: _user, username: username, id: id, nick: nick, status: status_1, color: color };
                return [2 /*return*/, res.status(200).json({ user: user })];
            case 3:
                error_3 = _a.sent();
                return [2 /*return*/, res.status(200).json({
                        user: { id: req.params.userID }
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// shows all messages(images)
app.get('/api/browse/:guildID/:channelID/', function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
    var guild, channel, pageNum, pageSize, queryStarted, msgCountQuery, msgCount, rowID, querySQL, stmt, filteredMessages, queryEnded, duration, unavailableUsers, i, user, matchingChannels, chName;
    return __generator(this, function (_a) {
        guild = Betty.guildsData.get(req.params.guildID);
        channel = null;
        pageNum = isNaN(Number(req.query.p)) ? 0 : Number(req.query.p);
        pageSize = isNaN(Number(req.query.s)) ? 10 : Number(req.query.s);
        pageNum = Math.max(1, pageNum) - 1; // min page number: 1 >> shift indexing by 1
        pageSize = Math.min(100, Math.max(5, pageSize)); // min page size: 5, max page size: 100
        if (!guild) {
            return [2 /*return*/, res.status(500).json({ error: "Could not get the guild" })];
        }
        else {
            channel = guild.channels.get(req.params.channelID);
            if (!channel)
                return [2 /*return*/, res.status(500).json({ error: "Could not get the channel" })
                    //if (!pageNum) return res.status(500).json({ error: "Invalid pagination param" })
                ];
            //if (!pageNum) return res.status(500).json({ error: "Invalid pagination param" })
        }
        queryStarted = new Date().getTime();
        msgCountQuery = Betty.db.prepare("SELECT MAX(_ROWID_) as value FROM \"" + channel.id + "\"");
        msgCount = msgCountQuery.get().value;
        rowID = pageNum * pageSize;
        querySQL = "SELECT * FROM \"" + channel.id + "\" WHERE _ROWID_ <= " + (msgCount - rowID) + " ORDER BY id DESC LIMIT " + pageSize;
        stmt = Betty.db.prepare(querySQL);
        filteredMessages = stmt.all();
        queryEnded = new Date().getTime();
        duration = (queryEnded - queryStarted) / 1000;
        console.log("[SQLite] Query took " + duration + " s to complete");
        unavailableUsers = {};
        for (i = 0; i < filteredMessages.length; i++) {
            if (unavailableUsers[filteredMessages[i].author])
                continue;
            user = guild.members.get(filteredMessages[i].author);
            if (!user) {
                try {
                    //const response = await Betty.bot.getRESTGuildMember(guild.id, msg.author)
                    //guild.members.add(response)
                    //console.log('did a rest on...', response.user.username)
                    // deconstruct response object to get rid of unneeded properties such as guild object
                    //const { roles, nick, id, status, user : _user } = response
                    //user = { id, nick, roles, status, ..._user }
                }
                catch (error) {
                    // user was most likely deleted
                    unavailableUsers[filteredMessages[i].author] = true;
                }
            }
            if (user)
                filteredMessages[i].author = __assign({}, user);
            filteredMessages[i].author.color = getUserColor(guild, filteredMessages[i].author.roles);
            delete filteredMessages[i].author.guild;
            //console.log(filteredMessages[i].author)
            //console.log(msg.author)
        }
        matchingChannels = getChannelsListForGuild(guild);
        chName = channel.name.replace(/([^a-z0-9_]+)/gi, '') || "images";
        return [2 /*return*/, res.status(200).json({
                botUser: Betty.botUser,
                messages: filteredMessages,
                channel: channel,
                channels: matchingChannels,
                //psTail: psTail.replace("CHANNEL_ID", chID).replace("CHANNEL_NAME", chName),
                fixedname: chName,
                msgCount: msgCount
            })];
    });
}); });
function decimalColorToHTMLcolor(num) {
    var r = Math.floor(num / (256 * 256));
    var g = Math.floor(num / 256) % 256;
    var b = num % 256;
    // desired format example:
    // color: rgb(215, 52, 42)
    return "rgb(" + r + ", " + g + ", " + b + ")";
}
function getUserColor(guild, roles) {
    // get their roles, filter out the ones that have no set color, 
    // and then get the one with the highest position
    if (roles === void 0) { roles = []; }
    if (roles.length == 0)
        return "rgb(94, 97, 101)";
    var roleList = [];
    roles.forEach(function (roleID) {
        var r = guild.roles.get(roleID);
        if (r.color)
            roleList.push(r);
    });
    var highestPosition = Math.max.apply(Math, roleList.map(function (o) { return o.position; }));
    var highestRole = guild.roles.find(function (r) { return r.position == highestPosition; });
    return highestRole ? decimalColorToHTMLcolor(highestRole.color) : null;
}
function getChannelsListForGuild(guild) {
    var stmt = Betty.db.prepare("SELECT name FROM sqlite_master WHERE type=\"table\" AND name NOT LIKE \"sqlite_%\" AND name NOT LIKE \"permalinks\"");
    var dbTables = stmt.all();
    var channels = [];
    for (var i = 0; i < dbTables.length; i++) {
        var ch = guild.channels.get(dbTables[i].name);
        if (!ch)
            continue;
        if (ch.guild.id == guild.id) {
            var lastImageQuery = Betty.db.prepare("SELECT * FROM \"" + dbTables[i].name + "\" ORDER BY id DESC LIMIT 1");
            var lastImage = lastImageQuery.get();
            ch.lastImage = optimizeDiscordUrl(lastImage.url);
            channels.push(ch);
        }
    }
    return channels;
}
function optimizeDiscordUrl(url) {
    if (url.includes("media.discordapp.net")) {
        return url.split("?")[0] + "?width=640&height=640";
    }
    else if (url.includes(".discordapp.")) {
        return url.replace("cdn.discordapp.com", "media.discordapp.net") + "?width=128&height=128";
    }
    else {
        return url;
    }
}
