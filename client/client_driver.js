var webServer = require('./client_web_server');

module.exports = {
	createClient: function(domTree) {
		webServer.createWebServer(domTree);
	}
};