var chrome;
var serverDriver = require('./server/chrome_driver'),
	clientDriver = require('./client/client_driver'),
	repl = require('repl');

serverDriver.getInstance().then(function(c) {
	chrome = c;
	return serverDriver.navigate(chrome, 'http://from.so/arbor/');
	//return serverDriver.navigate(chrome, 'http://umich.edu/');
}).then(function() {
	return serverDriver.getDocument(chrome);
}).then(function(doc) {
	clientDriver.createClient(doc);
	//return serverDriver.close(chrome);
	return doc;
}).then(function(doc) {
	var replServer = repl.start('> ');

	replServer.context.doc = doc;

	replServer.on('exit', function() {
		process.exit();
	});
}).catch(function(err) {
	console.error(err.stack);
});


/*
const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
	  width: 800,
	  height: 600,
	  title: 'Arboretum'
  });

  // and load the index.html of the app.
  mainWindow.loadURL('http://umich.edu/');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}
console.log(app);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
	createWindow();
	}
});
*/