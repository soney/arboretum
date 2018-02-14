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
const _ = require("underscore");
const os_1 = require("os");
const electron_1 = require("electron");
function default_1(options) {
    return __awaiter(this, void 0, void 0, function* () {
        options = _.extend({
            'remote-debugging-port': 9222,
            width: 800,
            height: 600
        }, options);
        const isMac = /^dar/.test(os_1.platform());
        let frame = isMac ? false : true;
        electron_1.app.commandLine.appendSwitch('remote-debugging-port', `${options['remote-debugging-port']}`);
        // Keep a global reference of the window object, if you don't, the window will
        // be closed automatically when the JavaScript object is garbage collected.
        let mainWindow = null;
        let newWindow = null;
        // Quit when all windows are closed.
        electron_1.app.on('window-all-closed', () => {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform != 'darwin') {
                electron_1.app.quit();
            }
        });
        electron_1.ipcMain.on('New-Window', (event, arg) => {
            newWindow = new electron_1.BrowserWindow({
                width: options.width,
                height: options.height,
                icon: `${__dirname}/resources/logo/icon.png`,
                titleBarStyle: 'hidden',
                frame: false,
                title: 'Arboretum',
                minWidth: 350,
                minHeight: 250
            });
            newWindow.loadURL(`file://${__dirname}/index.html`);
            newWindow.on('closed', function () {
                // Dereference the window object, usually you would store windows
                // in an array if your app supports multi windows, this is the time
                // when you should delete the corresponding element.
                newWindow = null;
            });
        });
        return new Promise((resolve, reject) => {
            // This method will be called when Electron has finished
            // initialization and is ready to create browser windows.
            electron_1.app.on('ready', () => {
                // Create the browser window.
                mainWindow = new electron_1.BrowserWindow({
                    width: options.width,
                    height: options.height,
                    icon: __dirname + '/resources/logo/icon.png',
                    titleBarStyle: 'hidden',
                    frame: frame,
                    title: 'Arboretum',
                    minWidth: 350,
                    minHeight: 250
                });
                // and load the index.html of the app.
                mainWindow.loadURL(`file://${__dirname}/index.html`);
                // Open the DevTools.
                // mainWindow.webContents.openDevTools();
                // Emitted when the window is closed.
                mainWindow.on('closed', function () {
                    // Dereference the window object, usually you would store windows
                    // in an array if your app supports multi windows, this is the time
                    // when you should delete the corresponding element.
                    mainWindow = null;
                });
                resolve({
                    mainWindow: mainWindow,
                    options: options
                });
            });
        });
    });
}
exports.default = default_1;
;
