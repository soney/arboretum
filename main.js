var repl = require('repl'),
	child_process = require('child_process'),
	_ = require('underscore'),
	//reload = require('require-reload')(require),
	exec = child_process.exec,
	log = require('./utils/logging'),
	replServer;

//log.setLevel('trace');

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
	return startChrome().then(function(chromePort) {
		return startServer(chromePort);
	}).then(function(info) {
		return wait(0, info);
	}).then(function(info) {
		serverInfo = info;
		return Promise.all([startChrome({
			appName: 'Google Chrome Canary',
			url: 'http://localhost:' + info.clientPort
		}), startChrome({
			appName: 'Google Chrome',
			url: 'http://localhost:' + info.clientPort + '/o'
		})]);
	}).then(function() {
		return serverInfo;
	});
}

function killAllChromes() {
	var chromiumQuitter = killChrome({appName: 'Chromium' }),
		canaryQuitter = killChrome({appName: 'Google Chrome Canary'}),
		chromeQuitter = killChrome({appName: 'Google Chrome'});
	return Promise.all([chromiumQuitter, canaryQuitter, chromeQuitter]);
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
				resolve(options.port);
			}
		});
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