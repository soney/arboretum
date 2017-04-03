var repl = require('repl'),
	child_process = require('child_process'),
	_ = require('underscore'),
    request = require('request'),
	//reload = require('require-reload')(require),
	exec = child_process.exec,
	log = require('./utils/logging').getColoredLogger('white'),
	startChromium = require('./browser/index'),
	replServer,
    hitIds = [];

const ChatServer = require('./server/chat');
const BrowserState = require('./server/state/browser_state');
const webServer = require('./client/client_web_server');

// MTurk set-up

const apiKey = 'AKIAI65DVDSHXSVPQK3Q';
const secret = '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';

// log.setLevel('debug');

startChromium().then(function(info) {
	const {options, mainWindow} = info;
	var server, io;

	mainWindow.on('startServer', function(reply) {
	    var rdp = options['remote-debugging-port'];
	    startServer(rdp, mainWindow).then(function(info) {
			server = info.server;
			io = info.io;
			log.debug('Started server on port ' + rdp);
			reply('started');
		}).catch(function(err) {
			console.error(err);
		});
	}).on('stopServer', function(reply) {
		if(server) {
			stopServer(server, io).then(function() {
				log.debug('Stopped server');
				reply('stopped');
			}).catch(function(err) {
				console.error(err);
			});
		} else {
			reply('no server');
		}
	}).on('postHIT', function(info, reply) {
		const {share_url, sandbox} = info;
        // const sandbox = true;

        request.post({
            url: 'https://aws.mi2lab.com/mturk/externalQuestion',
            form: {
                apiKey: apiKey,
                secret: secret,
                sandbox: sandbox ? '1' : '0',
                url: 'https://aws.mi2lab.com/mturk/arboretum/?url=' + share_url,
				maxAssignments: 10,
				title: 'Simple browsing task'
            }
        }, function(err, httpResponse, body) {
			if(server) {
	            if (err) {
	                console.log(err);
	                return;
	            }

	            const parsedData = JSON.parse(body);

	            if (parsedData.HIT) {
	                console.log("https://" +
	                    (sandbox ? "workersandbox" : "www") +
	                    ".mturk.com/mturk/preview?groupId=" + parsedData.HIT[0].HITTypeId);

					hitIds.push(parsedData.HIT[0].HITId);
					console.log(hitIds);
				}

				if (parsedData.err) {
					console.log(parsedData.err);
				}
			} else {
				reply('no server');
			}
		});
	});
}).catch(function(err) {
	console.error(err);
});
// .then(function(options) {
//     var rdp = options['remote-debugging-port'];
//     return startServer(rdp);
// });
var browserState, chatServer;
function startServer(chromePort, mainWindow) {
	var chrome, doc, port;

	browserState = new BrowserState({
		port: chromePort
	});
	chatServer = new ChatServer(mainWindow);
	return webServer.createWebServer(browserState, chatServer).catch(function(err) {
		console.error(err.stack);
	});
}

function stopServer(server, io) {
	server.close();
	io.close();
	chatServer.destroy();
	return browserState.destroy();
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
