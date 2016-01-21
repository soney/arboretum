var express = require('express'),
	socket = require('socket.io');

module.exports = {
	createWebServer: function(domTree) {
		var app = express();
		var root = domTree.getRoot();
		var node = root._getNode();

		app.get('/', function (req, res) {
			res.json(node);
		});

		app.listen(3000, function () {
			console.log('Example app listening on port 3000!');
		});
	}
};
