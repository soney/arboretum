var express = require('express'),
	socket = require('socket.io'),
	path = require('path'),
	request = require('request'),
	tree_shadow = require('./tree_shadow'),
	_ = require('underscore'),
	DOMTreeShadow = tree_shadow.DOMTreeShadow,
	fs = require('fs'),
	ShadowFrame = tree_shadow.ShadowFrame;

module.exports = {
	createWebServer: function(pageState) {
		var app = express(),
			PORT = 3000;

		return new Promise(function(resolve, reject) {
			var server = app.use(express.static(path.join(__dirname, 'client_pages')))
							.all('/r', function(req, res, next) {
								var url = req.query.l,
									frameId = req.query.f;

								pageState.requestResource(url, frameId).then(function(val) {
									var resourceInfo = val.resourceInfo;
									if(resourceInfo) { res.set('Content-Type', resourceInfo.mimeType); }

									if(val.base64Encoded) {
										var bodyBuffer = new Buffer(val.content, 'base64');
										res.send(bodyBuffer);
									} else {
										res.send(val.content);
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
								var frameId = req.query.i;
								procesFile(path.join(__dirname, 'client_pages', 'index.html'), function(contents) {
									return contents.replace('frameId: false', 'frameId: "'+frameId+'"');
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
				var shadow;
				function onMainFrameChanged() {
					if(shadow) {
						shadow.setFrame(pageState.getMainFrame())
					}
				}


				socket.on('setFrame', function(frameId) {
					var frame;

					if(frameId) {
						frame = pageState.getFrame(frameId);
					} else {
						frame = pageState.getMainFrame();
						pageState.on('mainFrameChanged', onMainFrameChanged);
					}

					shadow = new ShadowFrame(frame, socket);
				});
				socket.on('disconnect', function() {
					pageState.removeListener('mainFrameChanged', onMainFrameChanged);

					if(shadow) {
						shadow.destroy();
					}
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
