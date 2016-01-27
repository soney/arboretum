var cri = require('chrome-remote-interface'),
	_ = require('underscore'),
	DOMState = require('./dom_tree').DOMState;

var OPTION_DEFAULTS = {
	host: 'localhost',
	port: 9222
};

function getChromeInstance(options) {
	options = _.extend({}, OPTION_DEFAULTS, options);

	return new Promise(function(resolve, reject) {
		var chromeInstance = cri(options);
		chromeInstance.once('connect', function(chrome) {
			resolve(chrome);
		}).once('error', function(err) {
			reject(err);
		});
	});
}

function navigate(chrome, url) {
	return new Promise(function(resolve, reject) {
		chrome.Page.enable();
		chrome.once('ready', function() {
			chrome.Page.navigate({
				url: url
			});
			resolve(chrome);
		});
	});
}

function getDocument(chrome) {
	return new DOMState(chrome);
}

function close(chrome) {
	chrome.close();
}

module.exports = {
	getInstance: function(options) {
		return getChromeInstance(options);
	},
	navigate: function(chrome, url) {
		return navigate(chrome, url);
	},
	getDocument: function(chrome) {
		return getDocument(chrome);
	},
	close: function(chrome) {
		return close(chrome);
	}
};