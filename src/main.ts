import { app, BrowserWindow, ipcMain } from 'electron';
import * as _ from 'underscore';
import { platform } from 'os';
import { createServer, Server } from 'http';
import { readFile, writeFile, createReadStream } from 'fs';
import { join } from 'path';
import * as child from 'child_process';
import * as express from 'express';
import * as ShareDB from 'sharedb';
import * as WebSocket from 'ws';
import { BrowserState } from './server/state/BrowserState';
import * as keypress from 'keypress';
import chalk from 'chalk';
import * as ip from 'ip';
import * as opn from 'opn';
import * as request from 'request';
import * as URL from 'url';
import {ArboretumChat} from './utils/ArboretumChat';
import {SDB, SDBDoc} from './utils/ShareDBDoc';

const OPEN_MIRROR: boolean = false;
const RDB_PORT: number = 9222;
const HTTP_PORT: number = 3000;
const isMac: boolean = /^dar/.test(platform());
const defaultBrowswerWindowOptions = {
    'remote-debugging-port': RDB_PORT,
    width: 800,
    height: 600,
    icon: `${__dirname}/resources/logo/icon.png`,
    minWidth: 350,
    minHeight: 250,
    // titleBarStyle: 'hidden', // hides title bar
    // frame: false,            // removes default frame
    title: 'Arboretum',
};

app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!isMac) { app.quit(); }
});
app.commandLine.appendSwitch('remote-debugging-port', `${RDB_PORT}`);

function createBrowserWindow(extraOptions?: {}): BrowserWindow {
    const options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    let newWindow: BrowserWindow = new BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index_browser.html`);

    newWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        newWindow = null;
    });

    return newWindow;
};
function createAdminWindow(extraOptions?: {}): BrowserWindow {
    const options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    let newWindow: BrowserWindow = new BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index_admin.html`);

    newWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        newWindow = null;
    });

    return newWindow;
};

let browserWindow:BrowserWindow;
let adminWindow:BrowserWindow;
app.on('ready', () => {
    browserWindow = createBrowserWindow();
    adminWindow = createAdminWindow();
});

const sdb:SDB = new SDB(false);
// const browserState = null;
const browserState = new BrowserState(sdb, {
    port: RDB_PORT
});

const expressApp = express();
const server:Server = createServer(expressApp);
const wss = new WebSocket.Server({server});
wss.on('connection', (ws:WebSocket, req) => {
    browserState.shareDBListen(ws);
});
expressApp.all('/', async (req, res, next) => {
        const contents: string = await setClientOptions({
            userID: getUserID()
        });
        res.send(contents);
    })
    .use('/', express.static(join(__dirname, 'client')))
    .all('/r', async (req, res, next) => {
        var url = req.query.l,
            tabID = req.query.t,
            frameID = req.query.f;

        try {
            const [resource, resourceContent] = await browserState.requestResource(url, frameID, tabID);
            const {content, base64Encoded} = resourceContent;
            if(resource) {
                const {type, mimeType} = resource;
                res.set('Content-Type', mimeType);
            }

            if (base64Encoded) {
                var bodyBuffer = new Buffer(content, 'base64');
                res.send(bodyBuffer);
            } else {
                res.send(content);
            }
        } catch (err) {
            // console.error(err);
            console.error(`Failed to get ${url}. Trying to pipe`);
            try {
                const {method} = req;
                const uri = URL.parse(url);
                const {protocol, path} = uri;
                if(protocol === 'file:') {
                    createReadStream(path).pipe(res);
                } else {
                    req.pipe(request({uri, method})).pipe(res);
                }
            } catch (err) {
                console.error(err);
            }
        }
    });

function getIPAddress(): string {
    return ip.address();
};

let serverState:{running:boolean, hostname:string, port:number} = {
    running: false,
    hostname: '',
    port: -1
};
async function startServer(): Promise<{hostname:string,port:number}> {
    if(serverState.running) {
        const {hostname, port} = serverState;
        return {hostname, port};
    } else {
        const port = await new Promise<number>((resolve, reject) => {
            server.listen(() => {
                const addy = server.address();
                const { port } = addy;
                resolve(port);
            });
        });
        const hostname = getIPAddress();
        serverState = {
            running:true,
            hostname: hostname,
            port: port
        };
        if (OPEN_MIRROR) {
            opn(`http://${hostname}:${port}`, { app: 'google-chrome' }); // open browser
        }
        return({ hostname, port });
    }
};
async function stopServer(): Promise<void> {
    await new Promise<string>((resolve, reject) => {
        server.close(() => {
            resolve();
        })
    });
    if(chromeProcess) {
        chromeProcess.kill();
        chromeProcess = null;
    }
    serverState = {
        running: false,
        hostname: '',
        port: -1
    }
};

let chromeProcess:child.ChildProcess;

ipcMain.on('asynchronous-message', async (event, messageID:number, arg:{message:string, data:any}) => {
    const {message, data} = arg;
    const replyChannel:string = `reply-${messageID}`;
    if (message === 'startServer') {
        const info = await startServer();
        event.sender.send(replyChannel, info);
        console.log(chalk.bgWhite.bold.black(`Listening at ${info.hostname} port ${info.port}`));
        if(OPEN_MIRROR) {
            chromeProcess = await opn(`http://${info.hostname}:${info.port}/`, { app: 'google-chrome' }); // open browser
        }
        ipcMain.emit('server-active', {active:true});
    } else if (message === 'stopServer') {
        await stopServer();
        event.sender.send(replyChannel, 'ok');
        ipcMain.emit('server-active', {active:false});
        console.log(chalk.bgWhite.bold.black(`Stopping server`));
    } else if (message === 'performAction') {
        await browserState.performAction(data);
        event.sender.send(replyChannel, 'ok');
    } else if (message === 'rejectAction') {
        await browserState.rejectAction(data);
        event.sender.send(replyChannel, 'ok');
    } else if (message === 'focusAction') {
        if(browserWindow) {
            browserWindow.focus();
        }
        browserWindow.webContents.send("focusWebview");
        await new Promise((resolve, reject) => { setTimeout(resolve, 10) });
        await browserState.focusAction(data);
        event.sender.send(replyChannel, 'ok');
    } else if (message === 'labelAction') {
        event.sender.send(replyChannel, 'ok');
    } else {
        event.sender.send(replyChannel, 'not recognized');
    }
});

keypress(process.stdin);

process.stdin.on('keypress', (ch, key) => {
    const { name, ctrl } = key;
    if (ctrl && name === 'c') {
        process.stdin.pause();
        process.stdin.setRawMode(false);
        process.exit();
    } else if (name === 'd') {
        browserState.print();
    } else if (name === 't') {
        browserState.printTabSummaries();
    } else if (name === 'n') {
        browserState.printNetworkSummary();
    } else if (name === 'l') {
        browserState.printListeners();
    } else if (name === 'q') {
        if(chromeProcess) {
            chromeProcess.kill();
            chromeProcess = null;
        }
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
function processFile(filename:string):Promise<string> {
    return new Promise<string>(function(resolve, reject) {
        readFile(filename, {
            encoding: 'utf8'
        }, function(err, data) {
            if (err) { reject(err); }
            else { resolve(data); }
        })
    }).catch((err) => {
        throw (err);
    });
}
async function writeBrowserState(filename:string):Promise<void> {
    const stringifiedBrowser:string = await browserState.stringifyAll();
    await new Promise((resolve, reject) => {
        writeFile(filename, stringifiedBrowser, (err) => {
            if(err) { reject(err); }
            else { resolve(); }
        });
    });
};
setTimeout(() => writeBrowserState('FILE.json'), 20000)
async function setClientOptions(options: {}): Promise<string> {
    let contents: string = await processFile(join(__dirname, 'client', 'index.html'));
    _.each(options, function(val, key) {
        contents = contents.replace(key + ': false', key + ': "' + val + '"');
    });
    return contents;
}

function getUserID(): number {
    return Math.round(100 * Math.random());
};
