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
			var shadow = new ShadowState(domTree);

			function updateShadow() {
				domTree.getRoot().then(function(node) {
					console.log('got root', node.getId(), socket.id);
					if(shadow) {
						shadow.destroy();
					}
					shadow = new DOMTreeShadow({ tree: node });

					socket.emit('treeReady', shadow.serialize());

					shadow.on('updated', function() {
						socket.emit('treeUpdated', shadow.serialize());
					});
				}).catch(function(err) {
					console.error(err);
					console.error(err.stack);
				});
			}

			function updateSheets() {
				domTree.getStyleSheets().then(function(sheets) {
					socket.emit('styleSheetsUpdated', {
						sheets: sheets
					});
				});
			}

			function highlightNode(info) {
				var nodeId = info.nodeId;
				domTree.highlight(nodeId);
			}

			function removeHighlight(info) {
				var nodeId = info.nodeId;
				domTree.removeHighlight(nodeId);
			}


			updateShadow();
			updateSheets();

			socket.on('highlightNode', highlightNode);
			socket.on('removeHighlight', removeHighlight);
			domTree.on('rootInvalidated', updateShadow);
			domTree.on('styleSheetsInvalidated', updateSheets);

			socket.on('disconnect', function() {
				domTree.removeListener('rootInvalidated', updateShadow);
				domTree.removeListener('styleSheetsInvalidated', updateSheets);
				socket.removeListener('highlightNode', highlightNode);
				socket.removeListener('removeHighlight', removeHighlight);
				if(shadow) {
					shadow.destroy();
				}
			});
		});
	}
};
