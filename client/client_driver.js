var webServer = require('./client_web_server');

module.exports = {
	createClient: function(pageState) {
		return webServer.createWebServer(pageState);
	}
};