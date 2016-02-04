var webServer = require('./client_web_server');

module.exports = {
	createClient: function(domTree) {
		return webServer.createWebServer(domTree);
	}
};