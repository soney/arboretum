import * as _ from 'underscore';
import {platform} from 'os';
import {app, BrowserWindow, ipcMain} from 'electron';
interface ArbBrowserOptions {
    'remote-debugging-port'?:number,
    width?:number,
    height?:number,
    icon?:string,
    titleBarStyle?:'hidden'|'visible',
    frame?:boolean,
    title?:string,
    minWidth?:number,
    minHeight?:number
}
interface ArbBrowserValue {
    mainWindow:BrowserWindow,
    options:ArbBrowserOptions
}

export default function(options:ArbBrowserOptions):Promise<ArbBrowserValue> {
    options = _.extend({
        'remote-debugging-port': 9222,
        width: 800,
        height: 600
    }, options);

    const isMac:boolean = /^dar/.test(platform());
    let frame:boolean = isMac ? false : true;
    app.commandLine.appendSwitch('remote-debugging-port', `${options['remote-debugging-port']}`);

    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    let mainWindow = null;
    let newWindow = null;

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform != 'darwin') {
            app.quit();
        }
    });
    ipcMain.on('New-Window', (event, arg) => {
         newWindow = new BrowserWindow({ // TODO: use shared set of options with on'ready' below
                width: options.width,
                height: options.height,
                icon: `${__dirname}/resources/logo/icon.png`,
                titleBarStyle: 'hidden', // hides title bar
				frame: false,            // removes default frame
				title: 'Arboretum',
				minWidth: 350,
				minHeight: 250
            });
            newWindow.loadURL(`file://${__dirname}/index.html`);
            newWindow.on('closed', function() {
                // Dereference the window object, usually you would store windows
                // in an array if your app supports multi windows, this is the time
                // when you should delete the corresponding element.
                newWindow = null;
            });
    });

    return new Promise<ArbBrowserValue>((resolve, reject) => {
        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        app.on('ready', () => {
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
            mainWindow.loadURL(`file://${__dirname}/index.html`);

            // Open the DevTools.
            // mainWindow.webContents.openDevTools();

            // Emitted when the window is closed.
            mainWindow.on('closed', function() {
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
};
