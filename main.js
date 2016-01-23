var chrome;
var serverDriver = require('./server/chrome_driver'),
	clientDriver = require('./client/client_driver');

serverDriver.getInstance().then(function(c) {
	chrome = c;
	return serverDriver.navigate(chrome, 'file:///Users/soney/dev/nrax/test/index.html');
}).then(function() {
	return serverDriver.getDocument(chrome);
}).then(function(doc) {
	clientDriver.createClient(doc);
	//return serverDriver.close(chrome);
}).catch(function(err) {
	console.error(err.stack);
});