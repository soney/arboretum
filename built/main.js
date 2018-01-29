"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const _ = require("underscore");
const os_1 = require("os");
const http_1 = require("http");
const fs_1 = require("fs");
const path_1 = require("path");
const express = require("express");
const browser_state_1 = require("./server/state/browser_state");
// const ChatServer = require('./server/chat');
// const BrowserState = require('./server/state/browser_state');
// process.traceProcessWarnings = true;
const state = { chat: {}, browser: {} };
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
    frame: false,
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
    const newWindow = new electron_1.BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index.html`);
    return newWindow;
}
electron_1.app.on('ready', () => {
    let wn = createBrowserWindow();
});
const browserState = new browser_state_1.BrowserState({
    port: RDB_PORT
});
const expressApp = express();
const server = http_1.createServer(expressApp);
expressApp.all('/', (req, res, next) => {
    setClientOptions({
        userId: getUserID()
    }).then(function (contents) {
        res.send(contents);
    });
})
    .use('/', express.static(path_1.join(__dirname, 'client_pages')))
    .all('/f', function (req, res, next) {
    var frameId = req.query.i, tabId = req.query.t, userId = req.query.u, taskId = req.query.k;
    setClientOptions({
        userId: userId,
        frameId: frameId,
        viewType: 'mirror'
    }).then(function (contents) {
        res.send(contents);
    });
})
    .use('/f', express.static(path_1.join(__dirname, 'client_pages')))
    .all('/a', function (req, res, next) {
    setClientOptions({
        viewType: 'admin'
    }).then(function (contents) {
        res.send(contents);
    });
})
    .use('/a', express.static(path_1.join(__dirname, 'client_pages')))
    .all('/m', function (req, res, next) {
    var messageId = req.query.m;
    setClientOptions({
        viewType: 'message',
        messageId: messageId
    }).then(function (contents) {
        res.send(contents);
    });
})
    .use('/m', express.static(path_1.join(__dirname, 'client_pages')))
    .all('/r', function (req, res, next) {
    var url = req.query.l, tabId = req.query.t, frameId = req.query.f;
    browserState.requestResource(url, frameId, tabId).then(function (resourceInfo) {
        var content = resourceInfo.content;
        res.set('Content-Type', resourceInfo.mimeType);
        if (resourceInfo.base64Encoded) {
            var bodyBuffer = new Buffer(content, 'base64');
            res.send(bodyBuffer);
        }
        else {
            res.send(content);
        }
    }, function (err) {
        req.pipe(req[req.method.toLowerCase().replace('del', 'delete')](url))
            .pipe(res);
    });
});
// process.stdin.setRawMode(true);
process.stdin.on('data', (event) => {
    const key = String(process.stdin.read());
    console.log(key);
});
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
function processFile(filename, onContents) {
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
}
function setClientOptions(options) {
    return processFile(path_1.join(__dirname, 'client_pages', 'index.html'), function (contents) {
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
