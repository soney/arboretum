var cri = require('chrome-remote-interface'),
	_ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	TabState = require('./tab_state').TabState;
var log = require('../../utils/logging').getColoredLogger('red');

var OPTION_DEFAULTS = {
	host: 'localhost',
	port: 9222
};

var BrowserState = function(options) {
	this._options = _.extend(OPTION_DEFAULTS, options);
	this._tabs = {};
	this._initialized = this._initialize().then(function() {
		log.debug('=== CREATED BROWSER ===');
	});
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
	proto._initialize = function() {
		setInterval(_.bind(this._refreshTabs, this), 2000);
		return this._refreshTabs();
	};
	proto.onDeviceEvent = function(event, tabId, frameId) {
		this.getTabState(tabId).then(function(tabState) {
			tabState.onDeviceEvent(event, frameId);
		});
	};
	proto.summarizeTab = function(tabId) {
		var info = this._tabs[tabId].tabInfo;
		return _.extend({

		}, info);
	};
	proto.getActiveTabId = function() {
		return this.getTabIds()[0];
	};
	proto.requestResource = function(url, frameId, tabId) {
		return this.getTabState(tabId).then(function(tabState) {
			return tabState.requestResource(url, frameId);
		});
	};
	proto.getTabIds = function() {
		return _.keys(this._tabs);
	};
	proto.getTabState = function(tabId) {
		return this._tabs[tabId].statePromise;
	};
	proto.addTab = function() {
		var options = this._options;
		return new Promise(function(resolve, reject) {
			cri.New(options, function(err, tab) {
				if(err) {
					reject(tab);
				} else {
					resolve(tab);
				}
			});
		}).then(_.bind(function(tabInfo) {
			this._initializeTab(tabInfo);
		}, this));
	};
	proto.closeTab = function(tabId) {
		return new Promise(function(resolve, reject) {
			cri.Close({
				id: tabId
			}, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		}).then(_.bind(function() {
			var tabInfo = this._tabs[tabId].tabInfo;
			this._destroyTab(tabInfo);
		}, this)).catch(function(err) {
			console.log(err.stack);
		});
	};
	proto.openURL = function(url, tabId) {
		if(!tabId) {
			tabId = this.getActiveTabId();
		}
		return this.getTabState(tabId).then(function(tabState) {
			return tabState.navigate(url);
		});
	};
	proto._refreshTabs = function() {
		return this._getTabs().then(_.bind(function(tabs) {
			var existingTabs = _.keys(this._tabs),
				wasClosed = {};

			_.each(existingTabs, function(tab) {
				wasClosed[tab] = tab;
			});
			_.each(tabs, function(tabInfo) {
				var id = tabInfo.id;
				if(wasClosed[id]) {
					wasClosed[id] = false;
					var storedTabInfo = this._tabs[id].tabInfo;
					if(tabInfo.title !== storedTabInfo.title || tabInfo.url !== storedTabInfo.url) {
						_.extend(storedTabInfo, tabInfo);
						this.emit('tabUpdated', {
							id: id
						});
					}
				} else {
					this._initializeTab(tabInfo);
				}
			}, this);
			_.each(wasClosed, function(tabInfo) {
				if(tabInfo) {
					this._destroyTab(tabInfo);
				}
			}, this);
		}, this));
	};
	proto._destroyTab = function(tabInfo) {
		var id = tabInfo.id;
		var tab = this._tabs[id];
		if(tab) {
			tab.statePromise.then(_.bind(function(state) {
				state.destroy();
				delete this._tabs[id];
				this.emit('tabDestroyed', {
					id: id
				});
			}, this));
		}
	};
	proto._initializeTab = function(tabInfo) {
		var id = tabInfo.id,
			options = this._options;

		var statePromise = new Promise(function(resolve, reject) {
			var chromeInstance = cri(_.extend({
				chooseTab: tabInfo
			}, options));
			chromeInstance.once('connect', function(chrome) {
				resolve(chrome);
			}).once('error', function(err) {
				reject(err);
			});
		}).then(function(chrome) {
			return new TabState(id, chrome);
		});

		this._tabs[id] = {
			id: id,
			tabInfo: tabInfo,
			statePromise: statePromise
		};

		this.emit('tabCreated', {
			id: id
		});
	};
	proto._getTabs = function() {
		var options = this._options;
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
	};
	proto.findFrame = function(frameId) {
		var statePromises = _.pluck(this._tabs, 'statePromise');
		return Promise.all(statePromises).then(function(tabs) {
			var result = false;

			_.each(tabs, function(tab) {
				var frame = tab.getFrame(frameId);
				if(frame) {
					result = frame;
				}
			}, this);
			return result;
		});
	};
	proto.findNode = function(nodeId) {
		var statePromises = _.pluck(this._tabs, 'statePromise');
		return Promise.all(statePromises).then(function(tabs) {
			_.each(tabs, function(tab) {
				var node = tab.findNode(nodeId);
				if(node) {
					result = node;
				}
			}, this);
			return result;
		});
	};
	proto.print = function() {
		return Promise.all(_.map(this._tabs, function(tab) {
			return tab.statePromise.then(function(tabState) {
				console.log('Tab ' + tab.id);
				tabState.print();
			});
		}, this));
	};
}(BrowserState));

module.exports = {
	BrowserState: BrowserState
};

module.exports =  BrowserState;