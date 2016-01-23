var express = require('express'),
	socket = require('socket.io'),
	path = require('path');

module.exports = {
	createWebServer: function(domTree) {
		var app = express();
		/*
		domTree.getRoot().then(function(node) {
			//console.log(node.toString());
		}).catch(function(err) {
			console.error(err);
		});
		*/

		app.use(express.static(path.join(__dirname, 'client_pages')));
		/*

		app.get('/', function (req, res) {
			domTree.getRoot().then(function(node) {
				res.send(node.toString());
			}, function(err) {
				console.error(err);
			});
		});
		*/

		var server = app.listen(3000, function () {
			console.log('NRAX listening on port 3000!');
		});
		var io = socket(server);

		io.on('connection', function (socket) {
			socket.on('getDOM', function() {
				domTree.getRoot().then(function(node) {
					socket.emit('fullDOMTree', node.serialize());
				});
			});
		});
	}
};
