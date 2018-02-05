import * as cri from 'chrome-remote-interface';
import * as _ from 'underscore'
import * as fileUrl from 'file-url';
import { join, resolve } from 'path';
import { TabState } from './tab_state';
import * as ShareDB from 'sharedb';
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as WebSocketJSONStream from 'websocket-json-stream';
import { getColoredLogger, level, setLevel } from '../../utils/logging';
import { EventEmitter } from 'events';

const log = getColoredLogger('red');

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

const projectFileURLPath: string = fileUrl(join(resolve(__dirname, '..', '..'), 'browser'));
export class BrowserState extends EventEmitter {
    private tabs: Map<CRI.TabID, TabState> = new Map<CRI.TabID, TabState>();
    private options = { host: 'localhost', port: 9222 }
    private intervalID: NodeJS.Timer;
    constructor(private state: any, extraOptions?) {
        super();
        _.extend(this.options, extraOptions);
        this.intervalID = setInterval(_.bind(this.refreshTabs, this), 2000);
        log.debug('=== CREATED BROWSER ===');
    }
    private refreshTabs(): void {
        this.getTabs().then((tabInfos: Array<CRI.TabInfo>) => {
            const existingTabs = new Set<CRI.TabID>(this.tabs.keys());
            _.each(tabInfos, (tabInfo) => {
                const { id } = tabInfo;
                let tab: TabState;
                if (existingTabs.has(id)) {
                    // log.trace(`Updating info for tab ${id}`);
                    tab = this.tabs.get(id);
                    existingTabs.delete(id);
                    tab.updateInfo(tabInfo);
                } else {
                    log.trace(`Creating tab ${id}`);
                    tab = new TabState(tabInfo);
                    this.tabs.set(id, tab);
                    this.emit('tabCreated', {
                        id: id
                    });
                }
            });

            existingTabs.forEach((id: CRI.TabID) => {
                log.trace(`Destroying tab ${id}`);
                this.destroyTab(id);
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    }
    public destroy(): void {
        clearInterval(this.intervalID);
        this.tabs.forEach((tabState: TabState, tabId: CRI.TabID) => {
            tabState.destroy();
        });
    };
    private destroyTab(id: CRI.TabID): void {
        if (this.tabs.has(id)) {
            const tab = this.getTab(id);
            tab.destroy();
            this.tabs.delete(id);
            this.emit('tabDestroyed', { id });
        }
    };
    private tabIsInspectable(tab: any): boolean {
        return tab.type === 'page' && tab.title !== 'arboretumInternal' && tab.url !== 'http://localhost:3000/o' && tab.url !== 'http://localhost:3000' && tab.url.indexOf('chrome-devtools://') !== 0 && tab.url.indexOf(projectFileURLPath) !== 0;
    }
    private getTabs(): Promise<Array<CRI.TabInfo>> {
        return new Promise<Array<CRI.TabInfo>>((resolve, reject) => {
            cri.listTabs(this.options, (err, tabs) => {
                if (err) { reject(err); }
                else { resolve(_.filter(tabs, (tab) => this.tabIsInspectable(tab))); }
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    }
    public printTabSummaries():void {
        this.tabs.forEach((tabState:TabState) => {
            tabState.printSummary();
        });
    };
    public requestResource(url: string, frameID: CRI.FrameID, tabID: CRI.TabID): Promise<any> {
        const tabState: TabState = this.tabs.get(tabID);
        return tabState.requestResource(url, frameID);
    };
    private getTab(id: CRI.TabID): TabState {
        return this.tabs.get(id);
    };
    public print(): void {
        this.tabs.forEach((tabState: TabState) => {
            tabState.print();
        });
    };
};

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
