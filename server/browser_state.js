var cri = require('chrome-remote-interface'),
	_ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	TabState = require('./tab_state').TabState,
	colors = require('colors/safe');

var OPTION_DEFAULTS = {
	host: 'localhost',
	port: 9222
};

log.setLevel('error');

var BrowserState = function() {
	this._tabs = {};
	this._initialized = this._initialize();

	this._refreshTabs();
	setInterval(_.bind(this._refreshTabs, this), 2000);
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
	proto.addTab = function() {
		return new Promise(function(resolve, reject) {
			cri.New(OPTION_DEFAULTS, function(err, tab) {
				if(err) {
					reject(tab);
				} else {
					resolve(tab);
				}
			});
		});
	};
	proto.closeTab = function(tabId) {
		return new Promise(function(resolve, reject) {
			cri.close({
				id: tabId
			}, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			})
		});
	};
	proto.openURL = function(url, tabId) {
		return new Promise(function(resolve, reject) {
			cri.close({
				id: tabId
			}, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			})
		});
	};
	proto._refreshTabs = function() {
		this._getTabs().then(_.bind(function(tabs) {

		}, this));
	};
	proto._getTabs = function() {
		return new Promise(function(resolve, reject) {
			cri.List(OPTION_DEFAULTS, function(err, tabs) {
				if(err) { reject(tabs); }
				else { resolve(tabs); }
			});
		});
	};
}(BrowserState));

module.exports = {
	BrowserState: BrowserState
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

var browserState = new BrowserState();
module.exports =  new BrowserState();
/*
{
	getBrowserState: function() {
		return browserState;
	}
	/*
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
	*/