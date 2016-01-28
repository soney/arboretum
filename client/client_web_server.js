var express = require('express'),
	socket = require('socket.io'),
	path = require('path'),
	tree_shadow = require('./tree_shadow'),
	DOMTreeShadow = tree_shadow.DOMTreeShadow,
	ShadowState = tree_shadow.ShadowState;

module.exports = {
	createWebServer: function(domState) {
		var app = express(),
			PORT = 3000;

		var server = app.use(express.static(path.join(__dirname, 'client_pages')))
						.all('*', function(req, res, next) {
							var url = req.url;
							domState.requestResource(url).then(function(val) {
								var resourceInfo = val.resourceInfo;
								if(resourceInfo) { res.set('Content-Type', resourceInfo.mimeType); }

								if(val.base64Encoded) {
									var bodyBuffer = new Buffer(val.body, 'base64');
									res.send(bodyBuffer);
								} else {
									res.send(val.body);
								}
							}, function(err) {
								next();
							});
						})
						.listen(PORT, function() {
							console.log('arboretum listening on port ' + PORT + '!');
						});
		var io = socket(server);

		io.on('connection', function (socket) {
			var shadow = new ShadowState(domState, socket);
			socket.on('disconnect', function() {
				shadow.destroy();
			});
		});
	}
};
