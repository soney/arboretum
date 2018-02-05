import {app, BrowserWindow, ipcMain} from 'electron';
import * as _ from 'underscore';
import {platform} from 'os';
import {createServer, Server} from 'http';
import {readFile} from 'fs';
import {join} from 'path';
import * as express from 'express';
import * as ShareDB from 'sharedb';
import * as WebSocket from 'ws';
import * as WebSocketJSONStream from 'websocket-json-stream';
import {BrowserState} from './server/state/browser_state';
import * as keypress from 'keypress';
// const ChatServer = require('./server/chat');
// const BrowserState = require('./server/state/browser_state');
// process.traceProcessWarnings = true;

const state = { chat:{}, browser: { }};

const RDB_PORT:number = 9222;
const HTTP_PORT:number = 3000;
const isMac:boolean = /^dar/.test(platform());
const defaultBrowswerWindowOptions = {
    'remote-debugging-port': RDB_PORT,
    width: 800,
    height: 600,
    icon: `${__dirname}/resources/logo/icon.png`,
    minWidth: 350,
    minHeight: 250,
    titleBarStyle: 'hidden', // hides title bar
    frame: false,            // removes default frame
    title: 'Arboretum',
};

app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if(!isMac) { app.quit(); }
});
app.commandLine.appendSwitch('remote-debugging-port', `${RDB_PORT}`);

function createBrowserWindow(extraOptions?:any):BrowserWindow {
    const options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    const newWindow:BrowserWindow = new BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index.html`);

    return newWindow;
}

app.on('ready', () => {
    let wn:BrowserWindow = createBrowserWindow();
});

const browserState = new BrowserState({
	port: RDB_PORT
});

const expressApp = express();
const server:Server = createServer(expressApp);
expressApp.all('/', (req, res, next) => {
	setClientOptions({
		userId: getUserID()
	}).then(function(contents) {
		res.send(contents);
	});
})
.use('/', express.static(join(__dirname, 'client_pages')))
.all('/f', function(req, res, next) {
	var frameId = req.query.i,
		tabId = req.query.t,
		userId = req.query.u,
		taskId = req.query.k;

	setClientOptions({
		userId: userId,
		frameId: frameId,
		viewType: 'mirror'
	}).then(function(contents) {
		res.send(contents);
	});
})
.use('/f', express.static(join(__dirname, 'client_pages')))
.all('/a', function(req, res, next) {
	setClientOptions({
		viewType: 'admin'
	}).then(function(contents) {
		res.send(contents);
	});
})
.use('/a', express.static(join(__dirname, 'client_pages')))
.all('/m', function(req, res, next) {
	var messageId = req.query.m;

	setClientOptions({
		viewType: 'message',
		messageId: messageId
	}).then(function(contents) {
		res.send(contents);
	});
})
.use('/m', express.static(join(__dirname, 'client_pages')))
.all('/r', function(req, res, next) {
	var url = req.query.l,
		tabId = req.query.t,
		frameId = req.query.f;

	browserState.requestResource(url, frameId, tabId).then(function(resourceInfo) {
		var content = resourceInfo.content;
		res.set('Content-Type', resourceInfo.mimeType);

		if(resourceInfo.base64Encoded) {
			var bodyBuffer = new Buffer(content, 'base64');
			res.send(bodyBuffer);
		} else {
			res.send(content);
		}
	}, function(err) {
		req.pipe(req[req.method.toLowerCase().replace('del', 'delete')](url))
			.pipe(res);
	});
});

keypress(process.stdin);

process.stdin.on('keypress', (ch, key) => {
	const {name, ctrl} = key;
	if (ctrl && name === 'c') {
		process.stdin.pause();
		process.stdin.setRawMode(false);
		process.exit();
	} else if(name === 'd') {
		browserState.print();
	} else if(name === 't') {
		browserState.printTabSummaries();
	} else if(name === 'q') {
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
function processFile(filename:string, onContents):Promise<string> {
	return new Promise<string>(function(resolve, reject) {
		readFile(filename, {
			encoding: 'utf8'
		}, function(err, data) {
			if(err) { reject(err); }
			else { resolve(data); }
		})
	}).catch((err) => {
        throw(err);
    });
}
function setClientOptions(options):Promise<string> {
	return processFile(join(__dirname, 'client_pages', 'index.html'), function(contents) {
		_.each(options, function(val, key) {
			contents = contents.replace(key+': false', key+': "' + val + '"');
		});
		return contents;
	});
}
function getUserID():number {
	return Math.round(100*Math.random());
};
