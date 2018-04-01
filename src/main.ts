import { app, BrowserWindow, ipcMain } from 'electron';
import * as _ from 'underscore';
import { platform } from 'os';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as child from 'child_process';
import * as express from 'express';
import * as ShareDB from 'sharedb';
import * as WebSocket from 'ws';
import { BrowserState, ActionPerformed } from './server/state/BrowserState';
import * as keypress from 'keypress';
import chalk from 'chalk';
import * as ip from 'ip';
import * as opn from 'opn';
import * as request from 'request';
import * as URL from 'url';
import {ArboretumChat, PageActionMessage, PageAction, PAMAction} from './utils/ArboretumChat';
import {TabDoc, BrowserDoc} from './utils/state_interfaces';
import {SDB, SDBDoc} from './utils/ShareDBDoc';
import {readDirectory,readFileContents,writeFileContents,makeDirectoryRecursive} from './utils/fileFunctions';
import {guid} from './utils/guid';

const CONFIG:any = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config.json'), 'utf8'));

const {HTTPS, HTTPS_INFO, DEBUG, HTTP_PORT, READ_PRIOR_ACTIONS, PRIOR_ACTIONS_DIR} = CONFIG;
const {CERTS_DIRECTORY, CERT_FILENAME, PRIVATEKEY_FILENAME} = HTTPS_INFO;
const RDB_PORT: number = 9222;
const OPEN_MIRROR: boolean = false;
const USE_HTTP_PORT:boolean = HTTP_PORT>=0;

if(DEBUG) {
    require('longjohn');
}

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

app.on('window-all-closed', async () => {
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
        if(adminWindow) {
            adminWindow.close();
        }
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

const expressApp = express();
let server:http.Server|https.Server;
if(HTTPS) {
    const certFilename = path.resolve(__dirname, '..', CERTS_DIRECTORY, CERT_FILENAME);
    const pkFilename = path.resolve(__dirname, '..', CERTS_DIRECTORY, PRIVATEKEY_FILENAME);
    let cert:string;
    let key:string;
    try {
        cert = fs.readFileSync(certFilename, 'utf8');
    } catch(e) {
        console.error(`Could not read certificate file ${certFilename}`);
        process.exit(1);
        // throw(e);
    }
    try {
        key = fs.readFileSync(pkFilename, 'utf8');
    } catch(e) {
        console.error(`Could not read certificate file ${pkFilename}`);
        process.exit(1);
        // throw(e);
    }

    server = https.createServer({key, cert}, expressApp);
} else {
    server = http.createServer(expressApp);
}
const wss = new WebSocket.Server({server});
const browserState = new BrowserState(wss, {
    port: RDB_PORT,
    priorActions: READ_PRIOR_ACTIONS,
    showDebug: DEBUG,
    suppressErrors: !DEBUG
});
wss.on('error', (err) => {
    console.error(err);
});
wss.on('connection', (ws:WebSocket, req) => {
    ws['id'] = guid();
    if(DEBUG) {
        console.log(`Websocket ${ws['id']} connected`);
    }
    ws.on('message', (event) => {
        const messageData = JSON.parse(event as string);
        if(!messageData.a) { // is a shareDB message
            const {message, data, messageID} = messageData;
            if(message === 'pageAction') {
                const {a, action} = data;
                const rv = handlePageActionAction(a, action);
                if(rv) {
                    ws.send(JSON.stringify({
                        replyID: messageID,
                        message: 'ok'
                    }));
                } else {
                    ws.send(JSON.stringify({
                        replyID: messageID,
                        message: 'not ok'
                    }));
                }
            }
        }
    });
});
expressApp.all('/', async (req, res, next) => {
        const contents: string = await setClientOptions({ });
        res.send(contents);
    })
    .use('/', express.static(path.join(__dirname, 'client')))
    .all('/a', async (req, res, next) => {
        const clientOptions:any = {isAdmin:true};
        const {query} = req;
        if(query.url) { clientOptions.url = query.url; }
        if(query.username) { clientOptions.username = query.username; }
        const contents:string = await setClientOptions(clientOptions);
        res.send(contents);
    })
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
                    fs.createReadStream(path).pipe(res);
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

let serverState:{protocol:string, running:boolean, hostname:string, port:number} = {
    running: false,
    hostname: '',
    port: -1,
    protocol: null
};
async function startServer(): Promise<{protocol:string, hostname:string,port:number}> {
    if(serverState.running) {
        const { protocol, hostname, port} = serverState;
        return { protocol, hostname, port};
    } else {
        const port = await new Promise<number>((resolve, reject) => {
            const options:any = {};
            if(USE_HTTP_PORT) { options.port = HTTP_PORT; }
            server.listen(options, () => {
                const addy = server.address();
                const { port } = addy;
                resolve(port);
            });
        });
        const hostname = getIPAddress();
        const protocol = HTTPS ? 'https:' : 'http:';
        serverState = {
            running:true,
            protocol, hostname, port
        };
        if (OPEN_MIRROR) {
            opn(`${protocol}//${hostname}:${port}`, { app: 'google-chrome' }); // open browser
        }
        return({ protocol, hostname, port });
    }
};
async function stopServer(): Promise<void> {
    try {
        wss.clients.forEach((ws) => {
            ws.close();
        });

        await new Promise<string>((resolve, reject) => {
            server.close(() => {
                resolve();
            });
        });
    } catch(err) {
        console.error(err);
    }
    if(chromeProcess) {
        chromeProcess.kill();
        chromeProcess = null;
    }
    serverState = {
        running: false,
        hostname: '',
        port: -1,
        protocol: null
    }
};

async function handlePageActionAction(a:PAMAction, action:PageAction):Promise<boolean> {
    if(a === PAMAction.ACCEPT) {
        await browserState.performAction(action);
        return true;
    } else if(a === PAMAction.REJECT) {
        await browserState.rejectAction(action);
        return true;
    } else if(a === PAMAction.FOCUS) {
        if(browserWindow) {
            browserWindow.focus();
        }
        browserWindow.webContents.send("focusWebview");
        await new Promise((resolve, reject) => { setTimeout(resolve, 10) });
        await browserState.focusAction(action);
        return true;
    } else if(a === PAMAction.ADD_LABEL) {
        return true;
    }
    return false;
};

let chromeProcess:child.ChildProcess;
ipcMain.on('asynchronous-message', async (event, messageID:number, arg:{message:string, data:any}) => {
    const {message, data} = arg;
    const replyChannel:string = `reply-${messageID}`;
    if (message === 'startServer') {
        const info = await startServer();
        event.sender.send(replyChannel, info);
        console.log(chalk.bgWhite.bold.black(`Listening at ${info.protocol}//${info.hostname}:${info.port}`));
        if(OPEN_MIRROR) {
            chromeProcess = await opn(`${info.protocol}//${info.hostname}:${info.port}/`, { app: 'google-chrome' }); // open browser
        }
        ipcMain.emit('server-active', {active:true});
    } else if (message === 'stopServer') {
        await stopServer();
        event.sender.send(replyChannel, 'ok');
        ipcMain.emit('server-active', {active:false});
        console.log(chalk.bgWhite.bold.black(`Stopping server`));
    } else if (message === 'pageAction') {
        const {a, action} = data;
        const rv = handlePageActionAction(a, action);
        if(rv) {
            event.sender.send(replyChannel, 'ok');
        } else {
            event.sender.send(replyChannel, 'not ok');
        }
    } else if (message === 'chatCommand') {
        const {command, data:cmdData} = data;
        browserState.handleCommand(command, cmdData);
    } else {
        event.sender.send(replyChannel, 'not recognized');
    }
});


process.on('exit', async (code) => {
    stopServer();
});
if(DEBUG) {
    keypress(process.stdin);
    process.stdin.on('keypress', async (ch, key) => {
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
    process.on('exit', async (code) => {
        process.stdin.pause();
        process.stdin.setRawMode(false);
    });
    process.stdin.setRawMode(true);
    process.stdin.resume();
}

async function setClientOptions(options: {}): Promise<string> {
    let contents: string = await readFileContents(path.join(__dirname, 'client', 'index.html'));
    _.each(options, function(val, key) {
        contents = contents.replace(`${key}: false`, `${key}: ${_.isString(val)?'"'+val+'"' : val}`);
    });
    return contents;
} 