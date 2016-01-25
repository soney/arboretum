var express = require('express'),
	socket = require('socket.io'),
	path = require('path'),
	DOMTreeShadow = require('./tree_shadow').DOMTreeShadow;

module.exports = {
	createWebServer: function(domTree) {
		var app = express();

		app.use(express.static(path.join(__dirname, 'client_pages')));

		var server = app.listen(3000, function () {
			console.log('NRAX listening on port 3000!');
		});
		var io = socket(server);

		var shadows = {};


		io.on('connection', function (socket) {
			var id = socket.id,
				shadow;

			domTree.getRoot().then(function(node) {
				shadow = new DOMTreeShadow({ tree: node });
				socket.emit('treeReady', shadow.serialize());
			}).catch(function(err) {
				console.error(err);
				console.error(err.stack);
			});

			socket.on('highlightNode', function(info) {
				var nodeId = info.nodeId;
				domTree.highlight(nodeId);
			});
			socket.on('removeHighlight', function(info) {
				var nodeId = info.nodeId;
				domTree.removeHighlight(nodeId);
			});

			socket.on('disconnect', function() {
				if(shadow) {
					shadow.destroy();
				}
			});
		});
	}
};
