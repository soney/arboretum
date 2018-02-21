"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const _ = require("underscore");
const os_1 = require("os");
const http_1 = require("http");
const fs_1 = require("fs");
const path_1 = require("path");
const express = require("express");
const WebSocket = require("ws");
const WebSocketJSONStream = require("websocket-json-stream");
const browser_state_1 = require("./server/state/browser_state");
const keypress = require("keypress");
const chalk_1 = require("chalk");
const ip = require("ip");
const opn = require("opn");
// const ChatServer = require('./server/chat');
// const BrowserState = require('./server/state/browser_state');
// process.traceProcessWarnings = true;
const state = { chat: {}, browser: {} };
const OPEN_MIRROR = false;
const RDB_PORT = 9222;
const HTTP_PORT = 3000;
const isMac = /^dar/.test(os_1.platform());
const defaultBrowswerWindowOptions = {
    'remote-debugging-port': RDB_PORT,
    width: 800,
    height: 600,
    icon: `${__dirname}/resources/logo/icon.png`,
    minWidth: 350,
    minHeight: 250,
    titleBarStyle: 'hidden',
    // frame: false,            // removes default frame
    title: 'Arboretum',
};
electron_1.app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!isMac) {
        electron_1.app.quit();
    }
});
electron_1.app.commandLine.appendSwitch('remote-debugging-port', `${RDB_PORT}`);
function createBrowserWindow(extraOptions) {
    const options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    let newWindow = new electron_1.BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index.html`);
    newWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        newWindow = null;
    });
    return newWindow;
}
;
electron_1.app.on('ready', () => {
    let wn = createBrowserWindow();
});
// const browserState = null;
const browserState = new browser_state_1.BrowserState({
    port: RDB_PORT
});
const expressApp = express();
const server = http_1.createServer(expressApp);
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, req) => {
    const stream = new WebSocketJSONStream(ws);
    browserState.shareDBListen(stream);
});
expressApp.all('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const contents = yield setClientOptions({
        userId: getUserID()
    });
    res.send(contents);
}))
    .use('/', express.static(path_1.join(__dirname, 'client')))
    .all('/f', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var frameId = req.query.i, tabId = req.query.t, userId = req.query.u, taskId = req.query.k;
    const contents = yield setClientOptions({
        userId: userId,
        frameId: frameId,
        viewType: 'mirror'
    });
    res.send(contents);
}))
    .use('/f', express.static(path_1.join(__dirname, 'client')))
    .all('/a', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const contents = yield setClientOptions({
        viewType: 'admin'
    });
    res.send(contents);
}))
    .use('/a', express.static(path_1.join(__dirname, 'client')))
    .all('/m', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var messageId = req.query.m;
    const contents = yield setClientOptions({
        viewType: 'message',
        messageId: messageId
    });
    res.send(contents);
}))
    .use('/m', express.static(path_1.join(__dirname, 'client')))
    .all('/r', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var url = req.query.l, tabId = req.query.t, frameId = req.query.f;
    try {
        const resourceInfo = yield browserState.requestResource(url, frameId, tabId);
        var content = resourceInfo.content;
        res.set('Content-Type', resourceInfo.mimeType);
        if (resourceInfo.base64Encoded) {
            var bodyBuffer = new Buffer(content, 'base64');
            res.send(bodyBuffer);
        }
        else {
            res.send(content);
        }
    }
    catch (err) {
        req.pipe(req[req.method.toLowerCase().replace('del', 'delete')](url))
            .pipe(res);
    }
}));
function getIPAddress() {
    return ip.address();
}
;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const port = yield new Promise((resolve, reject) => {
            server.listen(() => {
                const addy = server.address();
                const { port } = addy;
                resolve(port);
            });
        });
        const hostname = getIPAddress();
        if (OPEN_MIRROR) {
            opn(`http://${hostname}:${port}`, { app: 'google-chrome' }); // open browser
        }
        return ({ hostname, port });
    });
}
;
function stopServer() {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            server.close(() => {
                resolve();
            });
        });
    });
}
;
if (OPEN_MIRROR) {
    startServer().then((info) => {
        console.log(chalk_1.default.bgWhite.bold.black(`Listening at ${info.hostname} port ${info.port} `));
        // return opn(address, { app: 'google-chrome' }); // open browser
    }).catch((err) => {
        console.error(err);
    });
}
electron_1.ipcMain.on('asynchronous-message', (event, arg) => __awaiter(this, void 0, void 0, function* () {
    if (arg === 'startServer') {
        const info = yield startServer();
        event.sender.send('asynchronous-reply', info);
        console.log(chalk_1.default.bgWhite.bold.black(`Listening at ${info.hostname} port ${info.port}`));
    }
    else if (arg === 'stopServer') {
        yield stopServer();
        event.sender.send('asynchronous-reply', 'ok');
    }
    else {
        event.sender.send('asynchronous-reply', 'not recognized');
    }
}));
keypress(process.stdin);
process.stdin.on('keypress', (ch, key) => {
    const { name, ctrl } = key;
    if (ctrl && name === 'c') {
        process.stdin.pause();
        process.stdin.setRawMode(false);
        process.exit();
    }
    else if (name === 'd') {
        browserState.print();
    }
    else if (name === 't') {
        browserState.printTabSummaries();
    }
    else if (name === 'q') {
        process.stdin.pause();
        process.stdin.setRawMode(false);
        process.exit();
    }
});
process.on('exit', (code) => {
    process.stdin.pause();
    process.stdin.setRawMode(false);
});
process.stdin.setRawMode(true);
process.stdin.resume();
// const stdin = process.openStdin();
// require('tty').setRawMode(true);
// process.stdin.setRawMode(true);
//
// process.stdin.on('keypress', function (chunk, key) {
// 	process.stdout.write('Get Chunk: ' + chunk + '\n');
// 	if (key && key.ctrl && key.name == 'c') process.exit();
// });
// process.stdin.setRawMode(true);
// process.stdin.on('readable', (event) => {
// 	const key:string = String(process.stdin.read());
// 	console.log(key);
// });
// var repl = require('repl'),
// 	child_process = require('child_process'),
// 	_ = require('underscore'),
//     request = require('request'),
// 	ShareDB = require('sharedb'),
// 	//reload = require('require-reload')(require),
// 	exec = child_process.exec,
// 	log = require('./utils/logging').getColoredLogger('white'),
// 	startChromium = require('./browser/index'),
// 	replServer,
//     hitIds = [];
//
//
// const ChatServer = require('./server/chat');
// const BrowserState = require('./server/state/browser_state');
// const webServer = require('./client/client_web_server');
//
// // MTurk set-up
//
// const apiKey = 'XXXXXXX';
// const secret = 'YYYYYYY';
//
// // log.setLevel('debug');
//
// startChromium().then(function(info) {
// 	const {options, mainWindow} = info;
// 	var server, io;
//
// 	mainWindow.on('startServer', function(reply) {
// 	    var rdp = options['remote-debugging-port'];
// 	    startServer(rdp, mainWindow).then(function(info) {
// 			server = info.server;
// 			io = info.io;
// 			log.debug('Started server on port ' + rdp);
// 			reply('started');
// 		}).catch(function(err) {
// 			console.error(err);
// 		});
// 	}).on('stopServer', function(reply) {
// 		if(server) {
// 			stopServer(server, io).then(function() {
// 				log.debug('Stopped server');
// 				reply('stopped');
// 			}).catch(function(err) {
// 				console.error(err);
// 			});
// 		} else {
// 			reply('no server');
// 		}
// 	}).on('postHIT', function(info, reply) {
// 		const {share_url, sandbox} = info;
//         // const sandbox = true;
//
//         request.post({
//             url: 'https://aws.mi2lab.com/mturk/externalQuestion',
//             form: {
// 				amount: 0.10,
//                 apiKey: apiKey,
//                 secret: secret,
//                 sandbox: sandbox ? '1' : '0',
//                 url: 'https://aws.mi2lab.com/mturk/arboretum/?url=' + share_url,
// 				maxAssignments: 1,
// 				title: 'Simple browsing task'
//             }
//         }, function(err, httpResponse, body) {
// 			if(server) {
// 	            if (err) {
// 	                console.log(err);
// 	                return;
// 	            }
//
// 	            const parsedData = JSON.parse(body);
//
// 	            if (parsedData.HIT) {
// 	                console.log("https://" +
// 	                    (sandbox ? "workersandbox" : "www") +
// 	                    ".mturk.com/mturk/preview?groupId=" + parsedData.HIT[0].HITTypeId);
//
// 					hitIds.push(parsedData.HIT[0].HITId);
// 					console.log(hitIds);
// 				}
//
// 				if (parsedData.err) {
// 					console.log(parsedData.err);
// 				}
// 			} else {
// 				reply('no server');
// 			}
// 		});
// 	});
// }).catch(function(err) {
// 	console.error(err);
// });
// // .then(function(options) {
// //     var rdp = options['remote-debugging-port'];
// //     return startServer(rdp);
// // });
// var browserState, chatServer;
// function startServer(chromePort, mainWindow) {
// 	var chrome, doc, port;
//
// 	browserState = new BrowserState({
// 		port: chromePort
// 	});
// 	chatServer = new ChatServer(mainWindow);
// 	return webServer.createWebServer(browserState, chatServer).catch(function(err) {
// 		console.error(err.stack);
// 	});
// }
//
// function stopServer(server, io) {
// 	server.close();
// 	io.close();
// 	chatServer.destroy();
// 	return browserState.destroy();
// }
function processFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            fs_1.readFile(filename, {
                encoding: 'utf8'
            }, function (err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        }).catch((err) => {
            throw (err);
        });
    });
}
function setClientOptions(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let contents = yield processFile(path_1.join(__dirname, 'client', 'index.html'));
        _.each(options, function (val, key) {
            contents = contents.replace(key + ': false', key + ': "' + val + '"');
        });
        return contents;
    });
}
function getUserID() {
    return Math.round(100 * Math.random());
}
;
