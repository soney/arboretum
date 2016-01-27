var express = require('express'),
	socket = require('socket.io'),
	path = require('path'),
	tree_shadow = require('./tree_shadow'),
	DOMTreeShadow = tree_shadow.DOMTreeShadow,
	ShadowState = tree_shadow.ShadowState;

module.exports = {
	createWebServer: function(domTree) {
		var app = express();

		app.use(express.static(path.join(__dirname, 'client_pages')));

		var server = app.listen(3000, function () {
			console.log('NRAX listening on port 3000!');
		});
		var io = socket(server);

		io.on('connection', function (socket) {
			var shadow = new ShadowState(domTree, socket);
			socket.on('disconnect', function() {
				shadow.destroy();
			});
		});
	}
};
