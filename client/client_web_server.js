var express = require('express'),
	socket = require('socket.io'),
	path = require('path'),
	request = require('request'),
	ShadowBrowser = require('./shadows/browser_shadow').ShadowBrowser,
	_ = require('underscore'),
	fs = require('fs');

require('ssl-root-cas').inject();

module.exports = {
	createWebServer: function(browserState) {
		var app = express(),
			PORT = 3000;

		return new Promise(function(resolve, reject) {
			var server = app.use(express.static(path.join(__dirname, 'client_pages')))
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
							.all('/f', function(req, res, next) {
								var frameId = req.query.i,
									tabId = req.query.t;
								procesFile(path.join(__dirname, 'client_pages', 'index.html'), function(contents) {
									return contents.replace('frameId: false', 'frameId: "'+frameId+'"')
													.replace('tabId: false', 'tabId: "'+tabId+'"');
								}).then(function(contents) {
									res.send(contents);
								});
							})
							//.all('favicon.ico', function(req, res, next) {
								//pageState.requestResource('favicon.ico');
							//})
							.listen(PORT, function() {
								resolve(PORT);
							});
			var io = socket(server);

			io.on('connection', function (socket) {
				var shadowBrowser = new ShadowBrowser(browserState, socket);

				socket.on('disconnect', function() {
					shadowBrowser.destroy();
				});
				socket.on('clientReady', function(info) {
					shadowBrowser.setFrame(info.frameId, info.tabId);
				});
			});
		});
	}
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
