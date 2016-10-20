var _ = require('underscore');
var os = require('os');
module.exports = function(options) {
    options = _.extend({
        'remote-debugging-port': 9222,
        width: 800,
        height: 600
    }, options);

    const electron = require('electron');
    //const ipc = require('ipc');
    //const {app} = electron;
    //const {BrowserWindow} = electron;
    const app = electron.app;  // Module to control application life.
    const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
    const ipcMain = electron.ipcMain;
    var isMac = /^dar/.test(os.platform());
    var frame = true;
    app.commandLine.appendSwitch('remote-debugging-port', options['remote-debugging-port']+'');

    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    var mainWindow = null;
    var newWindow = null;

    // Quit when all windows are closed.
    app.on('window-all-closed', function() {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform != 'darwin') {
            app.quit();
        }
    });
    ipcMain.on('New-Window',function(event,arg){
         newWindow = new BrowserWindow({
                width: options.width,
                height: options.height,
                icon: __dirname + '/resources/logo/icon.png',
                titleBarStyle: 'hidden',
				frame: false,
				title: 'Arboretum',
				minWidth: 350,
				minHeight: 250
            });
            newWindow.loadURL('file://'+__dirname+'/index.html');
            newWindow.on('closed', function() {
                // Dereference the window object, usually you would store windows
                // in an array if your app supports multi windows, this is the time
                // when you should delete the corresponding element.
                newWindow = null;
            });
    });

    return new Promise(function(resolve, reject) {
        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        if (isMac) {
            frame = false;
        }
        app.on('ready', function() {
            // Create the browser window.
            mainWindow = new BrowserWindow({
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
            mainWindow.loadURL('file://'+__dirname+'/index.html');

            // Open the DevTools.
            // mainWindow.webContents.openDevTools();

            // Emitted when the window is closed.
            mainWindow.on('closed', function() {
                // Dereference the window object, usually you would store windows
                // in an array if your app supports multi windows, this is the time
                // when you should delete the corresponding element.
                mainWindow = null;
            });
            resolve(options);
        });
    });
};
