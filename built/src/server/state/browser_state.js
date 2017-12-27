"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cri = require("chrome-remote-interface");
const _ = require("underscore");
const fileUrl = require("file-url");
const path_1 = require("path");
console.log(cri);
// var cri = require('chrome-remote-interface'),
// 	_ = require('underscore'),
// 	util = require('util'),
// 	EventEmitter = require('events'),
// 	TabState = require('./tab_state').TabState;
// var log = require('../../utils/logging').getColoredLogger('red');
// var fileUrl = require('file-url'),
// 	path = require('path'),
//     electron = require('electron'),
//     ipcMain = electron.ipcMain;
// var OPTION_DEFAULTS = {
// 	host: 'localhost',
// 	port: 9222
// };
//
const projectFileURLPath = fileUrl(path_1.join(path_1.resolve(__dirname, '..', '..'), 'browser'));
class BrowserState {
    constructor(state, extraOptions) {
        this.state = state;
        this.options = { host: 'localhost', port: 9222 };
        _.extend(this.options, extraOptions);
        console.log(this.state);
    }
    // private refreshTabs() {
    // 	return this._getTabs().then(_.bind(function(tabs) {
    // 		var existingTabs = _.keys(this._tabs),
    // 			wasClosed = {};
    //
    // 		_.each(existingTabs, function(tab) {
    // 			wasClosed[tab] = tab;
    // 		});
    // 		_.each(tabs, function(tabInfo) {
    // 			var id = tabInfo.id;
    // 			if(wasClosed[id]) {
    // 				wasClosed[id] = false;
    // 				var storedTabInfo = this._tabs[id].tabInfo;
    // 				if(tabInfo.title !== storedTabInfo.title || tabInfo.url !== storedTabInfo.url) {
    // 					_.extend(storedTabInfo, tabInfo);
    // 					this.emit('tabUpdated', {
    // 						id: id
    // 					});
    // 				}
    // 			} else {
    // 				this._initializeTab(tabInfo);
    // 			}
    // 		}, this);
    // 		_.each(wasClosed, function(tabId) {
    // 			this._destroyTab({id: tabId});
    // 		}, this);
    // 	}, this));
    // }
    tabIsInspectable(tab) {
        return tab.type === 'page' && tab.title !== 'arboretumInternal' && tab.url !== 'http://localhost:3000/o' && tab.url !== 'http://localhost:3000' && tab.url.indexOf('chrome-devtools://') !== 0 && tab.url.indexOf(projectFileURLPath) !== 0;
    }
    getTabs() {
        return new Promise((resolve, reject) => {
            cri.listTabs(this.options, (err, tabs) => {
                if (err) {
                    reject(tabs);
                }
                else {
                    resolve(_.filter(tabs, (tab) => this.tabIsInspectable(tab)));
                }
            });
        });
    }
}
exports.BrowserState = BrowserState;
;
// var BrowserState = function(options) {
// 	this._options = _.extend(OPTION_DEFAULTS, options);
// 	this._tabs = {};
// 	this._initialized = this._initialize().then(function() {
// 		log.debug('=== CREATED BROWSER ===');
// 	});
//         ipcMain.on('asynchronous-message',_.bind(function(event,arg) {
//            this.sender = event.sender;
//         },this));
// };
//
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
// 	proto._initialize = function() {
// 		this._intervalID = setInterval(_.bind(this._refreshTabs, this), 2000);
// 		return this._refreshTabs();
// 	};
// 	proto.destroy = function() {
// 		clearInterval(this._intervalID);
// 		var destroyPromises = _.map(this.getTabIds(), function(tabID) {
// 			var tabState = this.getTabState(tabID);
// 			return tabState.then(function(tabState) {
// 				tabState.destroy();
// 			});
// 		}, this);
// 		return Promise.all(destroyPromises);
// 	};
// 	proto.onDeviceEvent = function(event, tabId, frameId) {
// 		this.getTabState(tabId).then(function(tabState) {
// 			tabState.onDeviceEvent(event, frameId);
// 		});
// 	};
// 	proto.summarizeTab = function(tabId) {
// 		var info = this._tabs[tabId].tabInfo;
// 		return _.extend({
//
// 		}, info);
// 	};
// 	proto.getActiveTabId = function() {
// 		return this.getTabIds()[0];
// 	};
// 	proto.requestResource = function(url, frameId, tabId) {
// 		return this.getTabState(tabId).then(function(tabState) {
// 			return tabState.requestResource(url, frameId);
// 		});
// 	};
// 	proto.getTabIds = function() {
// 		return _.keys(this._tabs);
// 	};
// 	proto.getTabState = function(tabId) {
// 		return this._tabs[tabId].statePromise;
// 	};
// 	proto.addTab = function() {
//                 this.sender.send('asynchronous-reply','remoteTab');
// 		/*var options = this._options;
// 		return new Promise(function(resolve, reject) {
// 			cri.New(options, function(err, tab) {
// 				if(err) {
// 					reject(tab);
// 				} else {
// 					resolve(tab);
// 				}
// 			});
// 		}).then(_.bind(function(tabInfo) {
// 			this._initializeTab(tabInfo);
// 		}, this));*/
// 	};
// 	proto.closeTab = function(tabId) {
//                 this.sender.send('closeTab',tabId);
// 		/*return new Promise(function(resolve, reject) {
// 			cri.Close({
// 				id: tabId
// 			}, function(err) {
// 				if(err) {
// 					reject(err);
// 				} else {
// 					resolve();
// 				}
// 			});
// 		}).then(_.bind(function() {
// 			var tabInfo = this._tabs[tabId].tabInfo;
// 			this._destroyTab(tabInfo);
// 		}, this)).catch(function(err) {
// 			console.log(err.stack);
// 		});*/
// 	};
// 	proto.openURL = function(url, tabId) {
// 		if(!tabId) {
// 			tabId = this.getActiveTabId();
// 		}
// 		return this.getTabState(tabId).then(function(tabState) {
// 			return tabState.navigate(url);
// 		});
// 	};
// 	proto._refreshTabs = function() {
// 	};
// 	proto._destroyTab = function(tabInfo) {
// 		var id = tabInfo.id;
// 		var tab = this._tabs[id];
// 		if(tab) {
// 			tab.statePromise.then(_.bind(function(state) {
// 				state.destroy();
// 				delete this._tabs[id];
// 				this.emit('tabDestroyed', {
// 					id: id
// 				});
// 			}, this));
// 		}
// 	};
// 	proto._initializeTab = function(tabInfo) {
// 		var id = tabInfo.id,
// 			options = this._options;
//                 this.sender.send('TabRefId',id);
//
// 		var statePromise = new Promise(function(resolve, reject) {
// 			var chromeInstance = cri(_.extend({
// 				chooseTab: tabInfo
// 			}, options));
// 			chromeInstance.once('connect', function(chrome) {
// 				resolve(chrome);
// 			}).once('error', function(err) {
// 				reject(err);
// 			});
// 		}).then(function(chrome) {
// 			return new TabState(id, chrome);
// 		});
//
// 		this._tabs[id] = {
// 			id: id,
// 			tabInfo: tabInfo,
// 			statePromise: statePromise
// 		};
//
// 		this.emit('tabCreated', {
// 			id: id
// 		});
// 	};
// 	proto.findFrame = function(frameId) {
// 		var statePromises = _.pluck(this._tabs, 'statePromise');
// 		return Promise.all(statePromises).then(function(tabs) {
// 			var result = false;
//
// 			_.each(tabs, function(tab) {
// 				var frame = tab.getFrame(frameId);
// 				if(frame) {
// 					result = frame;
// 				}
// 			}, this);
// 			return result;
// 		});
// 	};
// 	proto.findNode = function(nodeId) {
// 		var statePromises = _.pluck(this._tabs, 'statePromise');
// 		return Promise.all(statePromises).then(function(tabs) {
// 			_.each(tabs, function(tab) {
// 				var node = tab.findNode(nodeId);
// 				if(node) {
// 					result = node;
// 				}
// 			}, this);
// 			return result;
// 		});
// 	};
// 	proto.print = function() {
// 		return Promise.all(_.map(this._tabs, function(tab) {
// 			return tab.statePromise.then(function(tabState) {
// 				console.log('Tab ' + tab.id);
// 				tabState.print();
// 			});
// 		}, this));
// 	};
// }(BrowserState));
//
// module.exports = {
// 	BrowserState: BrowserState
// };
//
// export default class BrowserState;
