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
