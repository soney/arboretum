"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cri = require("chrome-remote-interface");
const _ = require("underscore");
const fileUrl = require("file-url");
const path_1 = require("path");
const tab_state_1 = require("./tab_state");
const logging_1 = require("../../utils/logging");
const events_1 = require("events");
const sharedb_wrapper_1 = require("../../utils/sharedb_wrapper");
const chat_doc_1 = require("../../utils/chat_doc");
const log = logging_1.getColoredLogger('red');
const projectFileURLPath = fileUrl(path_1.join(path_1.resolve(__dirname, '..', '..'), 'browser'));
class BrowserState extends events_1.EventEmitter {
    constructor(state, extraOptions) {
        super();
        this.state = state;
        this.tabs = new Map();
        this.options = { host: 'localhost', port: 9222 };
        _.extend(this.options, extraOptions);
        this.initialize();
    }
    ;
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sdb = new sharedb_wrapper_1.SDB(false);
            this.doc = this.sdb.get('arboretum', 'browser');
            yield this.doc.createIfEmpty({
                tabs: []
            });
            this.chat = new chat_doc_1.ArboretumChat(this.sdb);
            this.intervalID = setInterval(_.bind(this.refreshTabs, this), 2000);
            log.debug('=== CREATED BROWSER ===');
        });
    }
    ;
    getShareDBPath() {
        return [];
    }
    ;
    shareDBListen(ws) {
        this.sdb.listen(ws);
    }
    ;
    refreshTabs() {
        return __awaiter(this, void 0, void 0, function* () {
            const tabInfos = yield this.getTabs();
            const existingTabs = new Set(this.tabs.keys());
            _.each(tabInfos, (tabInfo) => __awaiter(this, void 0, void 0, function* () {
                const { id } = tabInfo;
                let tab;
                if (existingTabs.has(id)) {
                    // log.trace(`Updating info for tab ${id}`);
                    tab = this.tabs.get(id);
                    existingTabs.delete(id);
                    tab.updateInfo(tabInfo);
                }
                else {
                    log.trace(`Creating tab ${id}`);
                    tab = new tab_state_1.TabState(tabInfo, this.sdb);
                    this.tabs.set(id, tab);
                    yield tab.initialized;
                    const shareDBOp = { p: ['tabs', id], oi: tab.getTabId() };
                    this.emit('tabCreated', {
                        id: id
                    });
                }
            }));
            existingTabs.forEach((id) => {
                log.trace(`Destroying tab ${id}`);
                this.destroyTab(id);
            });
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.intervalID);
            this.tabs.forEach((tabState, tabId) => {
                tabState.destroy();
            });
            yield this.sdb.close();
        });
    }
    ;
    destroyTab(id) {
        if (this.tabs.has(id)) {
            const tab = this.getTab(id);
            tab.destroy();
            this.tabs.delete(id);
            this.emit('tabDestroyed', { id });
        }
    }
    ;
    tabIsInspectable(tab) {
        return tab.type === 'page' && tab.title !== 'arboretumInternal' && tab.url !== 'http://localhost:3000/o' && tab.url !== 'http://localhost:3000' && tab.url.indexOf('chrome-devtools://') !== 0 && tab.url.indexOf(projectFileURLPath) !== 0;
    }
    getTabs() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                cri.listTabs(this.options, (err, tabs) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(_.filter(tabs, (tab) => this.tabIsInspectable(tab)));
                    }
                });
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    printTabSummaries() {
        this.tabs.forEach((tabState) => {
            tabState.printSummary();
        });
    }
    ;
    requestResource(url, frameID, tabID) {
        return __awaiter(this, void 0, void 0, function* () {
            const tabState = this.tabs.get(tabID);
            return tabState.requestResource(url, frameID);
        });
    }
    ;
    getTab(id) {
        return this.tabs.get(id);
    }
    ;
    print() {
        this.tabs.forEach((tabState) => {
            tabState.print();
        });
    }
    ;
    openURL(url, tabId = this.getActiveTabId()) {
        const tabState = this.getTab(tabId);
        tabState.navigate(url);
    }
    ;
    getTabIds() {
        return Array.from(this.tabs.keys());
    }
    ;
    getActiveTabId() {
        return this.getTabIds()[0];
    }
    ;
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
