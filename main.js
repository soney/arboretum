var repl = require('repl'),
	child_process = require('child_process'),
	_ = require('underscore'),
	reload = require('require-reload')(require),
	exec = child_process.exec,
	replServer;

startAll().then(function(info) {
	var doc = info.doc,
		serverDriver = info.serverDriver,
		chrome = info.chrome;

	replServer = repl.start('> ');

	replServer.defineCommand('start', {
		help: 'Start Chrome and the remote debugger',
		action: function(name) {
			var self = this;
			startAll().then(function() {
				self.displayPrompt();
			}).catch(function(err) {
				console.error(err);
			});
		}
	});

	replServer.defineCommand('chrome', {
		help: 'Start Chrome with the correct debugging port',
		action: function(name) {
			var self = this;
			startChrome().then(_.bind(function() {
				console.log('Chromium started');
				self.displayPrompt();
			}, this));
		}
	});

	replServer.defineCommand('server', {
		help: 'Start the remote debugger',
		action: function(name) {
			var self = this;
			startServer().then(function(info) {
				console.log('arboretum listening on port ' + info.clientPort + '!');
				self.displayPrompt();
			});
		}
	});

	replServer.defineCommand('print', {
		help: 'Print the current state of the DOM tree',
		action: function(name) {
			doc.print();
			this.displayPrompt();
		}
	});

	replServer.defineCommand('summarize', {
		help: 'Summarize the current state of the DOM tree',
		action: function(name) {
			doc.summarize();
			this.displayPrompt();
		}
	});

	replServer.defineCommand('print', {
		help: 'Print the current state of the DOM tree',
		action: function(name) {
			var self = this;
			doc.print();
		}
	});

	replServer.defineCommand('go', {
		action: function(addy) {
			serverDriver.navigate(chrome, addy).catch(function(err) {
				console.error(err);
			});
		}
	});

	replServer.on('exit', function() {
		killAllChromes();
		process.exit();
	});
}).catch(function(err) {
	console.error(err.stack);
});

function startAll() {
	var serverInfo;
	return startChrome().then(function(chromePort) {
		console.log('Chromium started');
		return startServer(chromePort);
	}).then(function(info) {
		serverInfo = info;
		return startChrome({
			appName: 'Google Chrome Canary',
			url: 'http://localhost:' + info.clientPort
		});
	}).then(function() {
		return serverInfo;
	});
}

function killAllChromes() {
	var chromiumQuitter = killChrome({appName: 'Chromium' }),
		canaryQuitter = killChrome({appName: 'Google Chrome Canary'});
	return Promise.all([chromiumQuitter, canaryQuitter]);
}

function startServer(chromePort) {
	var serverDriver = reload('./server/chrome_driver'),
		clientDriver = reload('./client/client_driver');

	var chrome, doc, port;

	return serverDriver.getInstance({
		port: chromePort
	}).then(function(c) {
		chrome = c;
		return serverDriver.navigate(chrome, 'http://from.so/arbor/');
	}).then(function() {
		return serverDriver.getDocument(chrome);
	}).then(function(d) {
		doc = d;
		return clientDriver.createClient(doc);
	}).then(function(p) {
		port = p;
		return {
			clientPort: port,
			doc: doc,
			serverDriver: serverDriver,
			chrome: chrome
		};
	}).catch(function(err) {
		console.error(err.stack);
	});
}

function killChrome(options) {
	options = _.extend({
		appName: 'Chromium'
	}, options);

	return new Promise(function(resolve, reject) {
		exec('osascript -e \'quit app "'+options.appName+'"\'', function(err, stdout, stderr) {
			if(err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function startChrome(options) {
	options = _.extend({
		port: 9222,
		appName: 'Chromium',
		url: ''
	}, options);

	return new Promise(function(resolve, reject) {
		exec('open -a "' + options.appName + '" --args ' + options.url + ' --remote-debugging-port=' + options.port, function(err, stout, stderr) {
			if(err) {
				reject(err);
			} else {
				setTimeout(function() {
					resolve(options.port);
				}, 500);
			}
		});
	});
}


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