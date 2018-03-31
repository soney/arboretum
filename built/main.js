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
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");
const WebSocket = require("ws");
const BrowserState_1 = require("./server/state/BrowserState");
const keypress = require("keypress");
const chalk_1 = require("chalk");
const ip = require("ip");
const opn = require("opn");
const request = require("request");
const URL = require("url");
const ArboretumChat_1 = require("./utils/ArboretumChat");
const fileFunctions_1 = require("./utils/fileFunctions");
const guid_1 = require("./utils/guid");
const CONFIG = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config.json'), 'utf8'));
const { HTTPS, HTTPS_INFO, DEBUG, HTTP_PORT, READ_PRIOR_ACTIONS, PRIOR_ACTIONS_DIR } = CONFIG;
const { CERTS_DIRECTORY, CERT_FILENAME, PRIVATEKEY_FILENAME } = HTTPS_INFO;
const RDB_PORT = 9222;
const OPEN_MIRROR = false;
const USE_HTTP_PORT = HTTP_PORT >= 0;
if (DEBUG) {
    require('longjohn');
}
const isMac = /^dar/.test(os_1.platform());
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
electron_1.app.on('window-all-closed', () => __awaiter(this, void 0, void 0, function* () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (!isMac) {
        electron_1.app.quit();
    }
}));
electron_1.app.commandLine.appendSwitch('remote-debugging-port', `${RDB_PORT}`);
function createBrowserWindow(extraOptions) {
    const options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    let newWindow = new electron_1.BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index_browser.html`);
    newWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        newWindow = null;
        if (adminWindow) {
            adminWindow.close();
        }
    });
    return newWindow;
}
;
function createAdminWindow(extraOptions) {
    const options = _.extend({}, defaultBrowswerWindowOptions, extraOptions);
    let newWindow = new electron_1.BrowserWindow(options);
    newWindow.loadURL(`file://${__dirname}/browser/index_admin.html`);
    newWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        newWindow = null;
    });
    return newWindow;
}
;
let browserWindow;
let adminWindow;
electron_1.app.on('ready', () => {
    browserWindow = createBrowserWindow();
    adminWindow = createAdminWindow();
});
const expressApp = express();
let server;
if (HTTPS) {
    const certFilename = path.resolve(__dirname, '..', CERTS_DIRECTORY, CERT_FILENAME);
    const pkFilename = path.resolve(__dirname, '..', CERTS_DIRECTORY, PRIVATEKEY_FILENAME);
    let cert;
    let key;
    try {
        cert = fs.readFileSync(certFilename, 'utf8');
    }
    catch (e) {
        console.error(`Could not read certificate file ${certFilename}`);
        process.exit(1);
        // throw(e);
    }
    try {
        key = fs.readFileSync(pkFilename, 'utf8');
    }
    catch (e) {
        console.error(`Could not read certificate file ${pkFilename}`);
        process.exit(1);
        // throw(e);
    }
    server = https.createServer({ key, cert }, expressApp);
}
else {
    server = http.createServer(expressApp);
}
const wss = new WebSocket.Server({ server });
const browserState = new BrowserState_1.BrowserState(wss, {
    port: RDB_PORT,
    priorActions: READ_PRIOR_ACTIONS,
    showDebug: DEBUG,
    suppressErrors: !DEBUG
});
wss.on('error', (err) => {
    console.error(err);
});
wss.on('connection', (ws, req) => {
    ws['id'] = guid_1.guid();
    if (DEBUG) {
        console.log(`Websocket ${ws['id']} connected`);
    }
    ws.on('message', (event) => {
        const messageData = JSON.parse(event);
        if (!messageData.a) {
            const { message, data, messageID } = messageData;
            if (message === 'pageAction') {
                const { a, action } = data;
                const rv = handlePageActionAction(a, action);
                if (rv) {
                    ws.send(JSON.stringify({
                        replyID: messageID,
                        message: 'ok'
                    }));
                }
                else {
                    ws.send(JSON.stringify({
                        replyID: messageID,
                        message: 'not ok'
                    }));
                }
            }
        }
    });
});
expressApp.all('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const contents = yield setClientOptions({});
    res.send(contents);
}))
    .use('/', express.static(path.join(__dirname, 'client')))
    .all('/a', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const clientOptions = { isAdmin: true };
    const { query } = req;
    if (query.url) {
        clientOptions.url = query.url;
    }
    if (query.username) {
        clientOptions.username = query.username;
    }
    const contents = yield setClientOptions(clientOptions);
    res.send(contents);
}))
    .all('/r', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var url = req.query.l, tabID = req.query.t, frameID = req.query.f;
    try {
        const [resource, resourceContent] = yield browserState.requestResource(url, frameID, tabID);
        const { content, base64Encoded } = resourceContent;
        if (resource) {
            const { type, mimeType } = resource;
            res.set('Content-Type', mimeType);
        }
        if (base64Encoded) {
            var bodyBuffer = new Buffer(content, 'base64');
            res.send(bodyBuffer);
        }
        else {
            res.send(content);
        }
    }
    catch (err) {
        // console.error(err);
        console.error(`Failed to get ${url}. Trying to pipe`);
        try {
            const { method } = req;
            const uri = URL.parse(url);
            const { protocol, path } = uri;
            if (protocol === 'file:') {
                fs.createReadStream(path).pipe(res);
            }
            else {
                req.pipe(request({ uri, method })).pipe(res);
            }
        }
        catch (err) {
            console.error(err);
        }
    }
}));
function getIPAddress() {
    return ip.address();
}
;
let serverState = {
    running: false,
    hostname: '',
    port: -1,
    protocol: null
};
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (serverState.running) {
            const { protocol, hostname, port } = serverState;
            return { protocol, hostname, port };
        }
        else {
            const port = yield new Promise((resolve, reject) => {
                const options = {};
                if (USE_HTTP_PORT) {
                    options.port = HTTP_PORT;
                }
                server.listen(options, () => {
                    const addy = server.address();
                    const { port } = addy;
                    resolve(port);
                });
            });
            const hostname = getIPAddress();
            const protocol = HTTPS ? 'https:' : 'http:';
            serverState = {
                running: true,
                protocol, hostname, port
            };
            if (OPEN_MIRROR) {
                opn(`${protocol}//${hostname}:${port}`, { app: 'google-chrome' }); // open browser
            }
            return ({ protocol, hostname, port });
        }
    });
}
;
function stopServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            wss.clients.forEach((ws) => {
                ws.close();
            });
            yield new Promise((resolve, reject) => {
                server.close(() => {
                    resolve();
                });
            });
        }
        catch (err) {
            console.error(err);
        }
        if (chromeProcess) {
            chromeProcess.kill();
            chromeProcess = null;
        }
        serverState = {
            running: false,
            hostname: '',
            port: -1,
            protocol: null
        };
    });
}
;
function handlePageActionAction(a, action) {
    return __awaiter(this, void 0, void 0, function* () {
        if (a === ArboretumChat_1.PAMAction.ACCEPT) {
            yield browserState.performAction(action);
            return true;
        }
        else if (a === ArboretumChat_1.PAMAction.REJECT) {
            yield browserState.rejectAction(action);
            return true;
        }
        else if (a === ArboretumChat_1.PAMAction.FOCUS) {
            if (browserWindow) {
                browserWindow.focus();
            }
            browserWindow.webContents.send("focusWebview");
            yield new Promise((resolve, reject) => { setTimeout(resolve, 10); });
            yield browserState.focusAction(action);
            return true;
        }
        else if (a === ArboretumChat_1.PAMAction.ADD_LABEL) {
            return true;
        }
        return false;
    });
}
;
let chromeProcess;
electron_1.ipcMain.on('asynchronous-message', (event, messageID, arg) => __awaiter(this, void 0, void 0, function* () {
    const { message, data } = arg;
    const replyChannel = `reply-${messageID}`;
    if (message === 'startServer') {
        const info = yield startServer();
        event.sender.send(replyChannel, info);
        console.log(chalk_1.default.bgWhite.bold.black(`Listening at ${info.protocol}//${info.hostname}:${info.port}`));
        if (OPEN_MIRROR) {
            chromeProcess = yield opn(`${info.protocol}//${info.hostname}:${info.port}/`, { app: 'google-chrome' }); // open browser
        }
        electron_1.ipcMain.emit('server-active', { active: true });
    }
    else if (message === 'stopServer') {
        yield stopServer();
        event.sender.send(replyChannel, 'ok');
        electron_1.ipcMain.emit('server-active', { active: false });
        console.log(chalk_1.default.bgWhite.bold.black(`Stopping server`));
    }
    else if (message === 'pageAction') {
        const { a, action } = data;
        const rv = handlePageActionAction(a, action);
        if (rv) {
            event.sender.send(replyChannel, 'ok');
        }
        else {
            event.sender.send(replyChannel, 'not ok');
        }
    }
    else if (message === 'chatCommand') {
        const { command, data: cmdData } = data;
        browserState.handleCommand(command, cmdData);
    }
    else {
        event.sender.send(replyChannel, 'not recognized');
    }
}));
process.on('exit', (code) => __awaiter(this, void 0, void 0, function* () {
    stopServer();
}));
if (DEBUG) {
    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => __awaiter(this, void 0, void 0, function* () {
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
        else if (name === 'n') {
            browserState.printNetworkSummary();
        }
        else if (name === 'l') {
            browserState.printListeners();
        }
        else if (name === 'q') {
            if (chromeProcess) {
                chromeProcess.kill();
                chromeProcess = null;
            }
            process.stdin.pause();
            process.stdin.setRawMode(false);
            process.exit();
        }
    }));
    process.on('exit', (code) => __awaiter(this, void 0, void 0, function* () {
        process.stdin.pause();
        process.stdin.setRawMode(false);
    }));
    process.stdin.setRawMode(true);
    process.stdin.resume();
}
function setClientOptions(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let contents = yield fileFunctions_1.readFileContents(path.join(__dirname, 'client', 'index.html'));
        _.each(options, function (val, key) {
            contents = contents.replace(`${key}: false`, `${key}: ${_.isString(val) ? '"' + val + '"' : val}`);
        });
        return contents;
    });
}
