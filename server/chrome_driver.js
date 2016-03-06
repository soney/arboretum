var cri = require('chrome-remote-interface'),
	_ = require('underscore'),
	BrowserState = require('./browser_state').BrowserState;

var OPTION_DEFAULTS = {
	host: 'localhost',
	port: 9222
};

function getChromeInstance(options) {
	options = _.extend({}, OPTION_DEFAULTS, options);

	return new Promise(function(resolve, reject) {
		var chromeInstance = cri(options);
		chromeInstance.on('connect', function(chrome) {
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

function getTabs(options) {
	options = _.extend({}, OPTION_DEFAULTS, options);

	return new Promise(function(resolve, reject) {
		cri.List(options, function(err, tabs) {
			if(err) {
				reject(tabs);
			} else {
				resolve(_.filter(tabs, function(tab) {
					return tab.type === 'page';
				}));
			}
		});
	});
}

function getDocument(chrome) {
	return new BrowserState(chrome);
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
	getTabs: function(options) {
		return getTabs(options);
	},
	close: function(chrome) {
		return close(chrome);
	}
};