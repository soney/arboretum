var express = require('express'),
	socket = require('socket.io');

module.exports = {
	createWebServer: function(domTree) {
		var app = express();
		domTree.getRoot().then(function(node) {
			//console.log(node.toString());
		}).catch(function(err) {
			console.error(err);
		});

		app.get('/', function (req, res) {
			domTree.getRoot().then(function(node) {
				res.send(node.toString());
			}, function(err) {
				console.error(err);
			});
		});

		app.listen(3000, function () {
			console.log('Example app listening on port 3000!');
		});
	}
};
