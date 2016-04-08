var express = require('express'),
	socket = require('socket.io'),
	path = require('path'),
	request = require('request'),
	ShadowBrowser = require('./shadows/browser_shadow').ShadowBrowser,
	ScriptServer = require('./scripts/script_server').ScriptServer,
	Task = require('./task').Task,
	_ = require('underscore'),
	fs = require('fs');

require('ssl-root-cas').inject();

module.exports = {
	createWebServer: function(browserState) {
		var app = express(),
			PORT = 3000;

		return new Promise(function(resolve, reject) {
			var server = app.all('/', function(req, res, next) {
								setClientOptions({
									userId: getUserID()
								}).then(function(contents) {
									res.send(contents);
								});
							})
							.use('/', express.static(path.join(__dirname, 'client_pages')))
							.all('/f', function(req, res, next) {
								var frameId = req.query.i,
									tabId = req.query.t,
									userId = req.query.u,
									taskId = req.query.k;

								setClientOptions({
									userId: userId,
									frameId: frameId,
									viewType: 'mirror'
								}).then(function(contents) {
									res.send(contents);
								});
							})
							.use('/f', express.static(path.join(__dirname, 'client_pages')))
							.all('/o', function(req, res, next) {
								setClientOptions({
									viewType: 'output'
								}).then(function(contents) {
									res.send(contents);
								});
							})
							.use('/o', express.static(path.join(__dirname, 'client_pages')))
							.all('/r', function(req, res, next) {
								var url = req.query.l,
									tabId = req.query.t,
									frameId = req.query.f;

								browserState.requestResource(url, frameId, tabId).then(function(resourceInfo) {
									var content = resourceInfo.content;
									res.set('Content-Type', resourceInfo.mimeType);

									if(resourceInfo.base64Encoded) {
										var bodyBuffer = new Buffer(content, 'base64');
										res.send(bodyBuffer);
									} else {
										res.send(content);
									}
								}, function(err) {
									req.pipe(request[req.method.toLowerCase().replace('del', 'delete')](url))
										.pipe(res);
									/*
									var baseURL = pageState.getURL();
									var headers = _.extend({}, req.headers, {
										referer: baseURL
									});
									var newRequest = request({
										method: req.method,
										uri: url,
										headers: headers,
										timeout: 5000
									}).on('error', function(err) {
										next();
									}).pipe(res);
									*/
								});
							})
							//.all('favicon.ico', function(req, res, next) {
								//pageState.requestResource('favicon.ico');
							//})
							.listen(PORT, function() {
								resolve(PORT);
							});

			var io = socket(server);
			var shadowBrowsers = {}
			var tasks = {};
			io.on('connection', function (socket) {
				socket.once('scriptReady', function() {
					var scriptServer = new ScriptServer({
						socket: socket,
						browserState: browserState
					});
					socket.once('disconnect', function() {
						scriptServer.destroy();
					});
				});

				socket.once('clientReady', function(clientOptions) {
					var shadowBrowser,
						task;

					var taskId = clientOptions.taskId+'';

					task = tasks[taskId];
					if(!task) {
						tasks[taskId] = task =  new Task({
							browserState: browserState,
							taskId: taskId
						});
					}

					if(clientOptions.frameId) {
						shadowBrowser = shadowBrowsers[clientOptions.userId];
					} else { // is the root
						shadowBrowser = new ShadowBrowser({
											browserState: browserState,
											socket: socket,
											clientOptions: clientOptions,
											task: task
										});
						shadowBrowsers[clientOptions.userId] = shadowBrowser;

						shadowBrowser.on('nodeReply', function(info) {
							var outputBrowsers = _	.chain(shadowBrowsers)
													.values()
													.filter(function(browser) {
														return browser.isOutput()
													})
													.value();
							_.each(outputBrowsers, function(browser) {
								browser.setVisibleElements(info.nodeIds);
							});
						});
					}

					if(shadowBrowser) {
						shadowBrowser.addClient(_.extend({
							socket: socket
						}, clientOptions)).then(function(shadow) {
							socket.once('disconnect', function() {
								shadow.destroy();
							});
						}).catch(function(err) {
							console.error(err);
							console.error(err.stack);
						});
					} else {
						console.error('Seeking browser for non-user');
					}
				});
			});
		});
	}
};

var getUserID = function() {
	return Math.round(100*Math.random());
};

function procesFile(filename, onContents) {
	return new Promise(function(resolve, reject) {
		fs.readFile(filename, {
			encoding: 'utf8'
		}, function(err, data) {
			if(err) { reject(err); }
			else { resolve(data); }
		})
	}).then(function(contents) {
		return onContents(contents);
	});
}

function setClientOptions(options) {
	return procesFile(path.join(__dirname, 'client_pages', 'index.html'), function(contents) {
		_.each(options, function(val, key) {
			contents = contents.replace(key+': false', key+': "' + val + '"');
		});
		return contents;
	});
}