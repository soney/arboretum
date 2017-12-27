"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var _ = require("underscore");
var os = require("os");
var RDB_PORT = 9222;
var isMac = /^dar/.test(os.platform());
var defaultBrowswerWindowOptions = {
    'remote-debugging-port': RDB_PORT,
    width: 800,
    height: 600,
    icon: __dirname + "/resources/logo/icon.png",
    minWidth: 350,
    minHeight: 250,
    // titleBarStyle: 'hidden', // hides title bar
    // frame: false,            // removes default frame
    title: 'Arboretum'
};
electron_1.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!isMac) {
        electron_1.app.quit();
    }
});
electron_1.app.commandLine.appendSwitch('remote-debugging-port', "" + RDB_PORT);
function createBrowserWindow(extraOptions) {
    var options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    var newWindow = new electron_1.BrowserWindow(options);
    newWindow.loadURL("file://" + __dirname + "/index.html");
    return newWindow;
}
electron_1.app.on('ready', function () {
    var wn = createBrowserWindow();
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
