var serverDriver = require('./server/chrome_driver');
var chrome;

serverDriver.getInstance().then(function(c) {
	chrome = c;
	return serverDriver.navigate(chrome, 'http://umich.edu');
}).then(function() {
	return serverDriver.getDocument(chrome);
}).then(function() {
	return serverDriver.close(chrome);
}).catch(function(err) {
	console.error(err.stack);
});