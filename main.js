var repl = require('repl'),
	child_process = require('child_process'),
	_ = require('underscore'),
	//reload = require('require-reload')(require),
	exec = child_process.exec,
	log = require('./utils/logging'),
	startChromium = require('./browser/index'),
	replServer;

log.setLevel('error');

return startChromium().then(function(options) {
    var rdp = options['remote-debugging-port'];
    return startServer(rdp);
});
function startServer(chromePort) {
	var BrowserState = require('./server/state/browser_state'),
		webServer = require('./client/client_web_server');

	var chrome, doc, port;

	var browserState = new BrowserState({
		port: chromePort
	});
	return webServer.createWebServer(browserState).then(function(port) {
		return {
			clientPort: port,
			browser: browserState
		};
	}).catch(function(err) {
		console.error(err.stack);
	});
}
/*
		return startChrome({
			appName: isWindows() ? WINDOWS_CHROMIUM_PATH : 'Chromium'
		}).then(function(chromePort) {
			return startServer(chromePort);
		}).then(function(info) {
			serverInfo = info;
			return wait(0, info);
		}).then(function(info) {
			serverInfo = info;
			return Promise.all([startChrome({
				appName: isWindows() ? WINDOWS_CANARY_PATH : 'Google Chrome Canary',
				url: 'http://localhost:' + info.clientPort
			}), startChrome({
				appName: isWindows() ? WINDOWS_CHROME_PATH : 'Google Chrome',
				url: 'http://localhost:' + info.clientPort + '/o'
			})]);
		}).then(function() {
			return serverInfo;
		});
        */

/*
var repl = require('repl'),
	child_process = require('child_process'),
	_ = require('underscore'),
	//reload = require('require-reload')(require),
	exec = child_process.exec,
	log = require('./utils/logging'),
	replServer;

var WINDOWS_CANARY_PATH = 'C:\\Users\\Croma Lab\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe',
	WINDOWS_CHROME_PATH = 'C:\\Users\\Croma Lab\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
	WINDOWS_CHROMIUM_PATH = 'C:\\Users\\Croma Lab\\AppData\\Local\\Chromium\\Application\\chrome.exe';

log.setLevel('trace');

startAll().then(function(info) {
	var browser = info.browser;

	replServer = repl.start('> ');
	replServer.defineCommand('print', {
		help: 'Print the current state of the DOM tree',
		action: function(name) {
			browser.print().then(_.bind(function() {
				this.displayPrompt();
			}, this));
		}
	});

	replServer.defineCommand('summarize', {
		help: 'Summarize the current state of the DOM tree',
		action: function(name) {
			doc.summarize();
			this.displayPrompt();
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
	if(isWindows()) {
		return startChrome({
			appName: WINDOWS_CHROMIUM_PATH
		}).then(function(chromePort) {
			return wait(3000, chromePort);
		}).then(function(chromePort) {
			return startServer(chromePort);
		}).then(function(info) {
			return wait(500, info);
		}).then(function(info) {
			serverInfo = info;
			return startChrome({
				appName: WINDOWS_CANARY_PATH,
				url: 'http://localhost:' + info.clientPort
			});
		}).then(function(info) {
			console.log('open localhost:'+serverInfo.clientPort + ' or localhost:'+serverInfo.clientPort+'/o')
			return serverInfo;
		});
	} else {
		return startChrome({
			appName: isWindows() ? WINDOWS_CHROMIUM_PATH : 'Chromium'
		}).then(function(chromePort) {
			return startServer(chromePort);
		}).then(function(info) {
			serverInfo = info;
			return wait(0, info);
		}).then(function(info) {
			serverInfo = info;
			return Promise.all([startChrome({
				appName: isWindows() ? WINDOWS_CANARY_PATH : 'Google Chrome Canary',
				url: 'http://localhost:' + info.clientPort
			}), startChrome({
				appName: isWindows() ? WINDOWS_CHROME_PATH : 'Google Chrome',
				url: 'http://localhost:' + info.clientPort + '/o'
			})]);
		}).then(function() {
			return serverInfo;
		});
	}

}

function killAllChromes() {
	var chromiumQuitter = killChrome({appName: 'Chromium' });
	var canaryQuitter = killChrome({appName: 'Google Chrome Canary'});
	//var chromeQuitter = killChrome({appName: 'Google Chrome'});
	//return Promise.all([chromiumQuitter, canaryQuitter, chromeQuitter]);
	return Promise.all([chromiumQuitter, canaryQuitter]);
}

function startServer(chromePort) {
	var BrowserState = require('./server/state/browser_state'),
		clientDriver = require('./client/client_driver');

	var chrome, doc, port;

	var browserState = new BrowserState({
		port: chromePort
	});

	return clientDriver.createClient(browserState).then(function(port) {
		return {
			clientPort: port,
			browser: browserState
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
		if(isWindows()) {
			exec('taskkill /IM '+options.appName+'', function(err, stdout, stderr) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		} else {
			exec('osascript -e \'quit app "'+options.appName+'"\'', function(err, stdout, stderr) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		}
	});
}

function isWindows() {
	return /^win/.test(process.platform);
}

function startChrome(options) {
	options = _.extend({
		port: 9222,
		appName: 'Chromium',
		url: ''
	}, options);


	return new Promise(function(resolve, reject) {
		if(isWindows()) {
			exec('"' + options.appName + '" ' + options.url + ' --remote-debugging-port=' + options.port, function(err, stout, stderr) {
				if(err) {
					reject(err);
				} else {
					resolve(options.port);
				}
			});
			resolve(options.port);
		} else {
			exec('open -a "' + options.appName + '" --args ' + options.url + ' --remote-debugging-port=' + options.port, function(err, stout, stderr) {
				if(err) {
					reject(err);
				} else {
					resolve(options.port);
				}
			});
		}
	}).then(function(port) {
		return wait(500, port);
	});
}

function wait(ms, val) {
	return new Promise(function(resolve) {
		setTimeout(function() {
			resolve(val);
		}, ms);
	});
}

*/