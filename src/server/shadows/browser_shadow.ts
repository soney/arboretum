import { EventEmitter } from 'events';
import { BrowserState } from '../../server/state/browser_state';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import { ShadowTab } from './tab_shadow';

const log = getColoredLogger('red', 'bgBlack');
// var _ = require('underscore'),
// 	util = require('util'),
// 	EventEmitter = require('events'),
// 	ShadowTab = require('./tab_shadow').ShadowTab,
// 	ShadowFrame = require('./frame_shadow').ShadowFrame,
// 	ShadowOutput = require('./output_shadow').ShadowOutput,
// 	ShadowDOM = require('./dom_shadow').ShadowDOM;


export class ShadowBrowser extends EventEmitter {
	private clients:Map<CRI.FrameID, any> = new Map<CRI.FrameID, any>();
	private mainClient;
	constructor(private browserState:BrowserState) {
		super();
	};
	private getBrowserState():BrowserState {
		return this.browserState;
	}
	private onFocusTab = (info, clientOptions):void => {
		this.setTab(info.tabId, clientOptions);
	};
	private onOpenURL = (info):void => {
		var mainClient = this.getMainClient();
		// var scriptRecorder = this.getScriptRecorder();
		mainClient.openURL(info.url);
		// scriptRecorder.onNavigate(info.url);
	};
	private setTab(tabId:CRI.TabID, clientOptions) {
		const browserState = this.getBrowserState();
	}
	public setMainClient(client) {
		this.mainClient = client;
	}
	private getMainClient() {
		return this.mainClient;
	}
	public setClient(frameId:CRI.FrameID, client):void  {
		this.clients.set(frameId, client);
	}
	public getClient(frameId:CRI.FrameID) {
		return this.clients.get(frameId);
	}
}

// var ShadowBrowser = function(options) {
// 	this.options = options;
//
// 	this.$_onAddTab = _.bind(this._onAddTab, this);
// 	this.$_onCloseTab = _.bind(this._onCloseTab, this);
// 	this.$_onFocusTab = _.bind(this._onFocusTab, this);
// 	this.$_onOpenURL = _.bind(this._onOpenURL, this);
// 	this.$sendTabs = _.bind(this.sendTabs, this);
// 	// this.$setTaskDescription = _.bind(this.setTaskDescription, this);
// 	// this.$markTaskAsDone = _.bind(this.markTaskAsDone, this);
//
// 	this._clients = {};
// 	this.setMainClient(false);
// 	/*
//
// 				socket.on('setIntent', function(intent) {
// 					task.setDescription(intent);
// 				});
// 				socket.on('taskDone', function() {
// 					task.markAsDone();
// 				});
//
//
// 	this.options = {
// 		childFilterFunction: _.bind(function(child) {
// 			var node = child._getNode(),
// 				nodeName = node.nodeName,
// 				nodeType = node.nodeType;
// 			if(nodeName === 'SCRIPT' ||
// 				nodeName === '#comment' ||
// 				nodeName === 'BASE' || nodeType === NODE_CODE.DOCUMENT_TYPE_NODE) {
// 				return false;
// 			} else if(this.isOutput()) {
// 				if(nodeName === 'STYLE' || nodeName === 'LINK' || nodeName === 'HEAD') {
// 					return true;
// 				} else {
// 					var visibleElements = this._visibleElements;
// 					return _.indexOf(visibleElements, node.nodeId) >= 0;
// 				}
// 			} else {
// 				return true;
// 			}
// 		}, this)
// 	};
//
// 	this._initialize();
// 	this._visibleElements = true;
// 	*/
// 	log.debug('::: CREATED BROWSER SHADOW :::');
// };
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
//
// 	// proto.setTaskDescription = function(description) {
// 	// 	var task = this.getTask();
// 	// 	task.setDescription(description);
// 	// };
// 	// proto.markTaskAsDone = function() {
// 	// 	var task = this.getTask();
// 	// 	var recordedScript = task.markAsDone();
// 	// 	var mainClient = this.getMainClient();
// 	// 	var socket = mainClient._getSocket();
// 	//
// 	// 	socket.emit('taskScript', recordedScript);
// 	// };
// 	proto._onAddTab = function(info) {
// 		this.getBrowserState().addTab();
// 	};
// 	proto._onCloseTab = function(info) {
// 		this.getBrowserState().closeTab(info.tabId);
// 	};
// 	proto._onFocusTab = function(info, clientOptions) {
// 		this.setTab(info.tabId, clientOptions);
// 	};
// 	// proto.getScriptRecorder = function() {
// 	// 	var task = this.getTask();
// 	// 	return task.getScriptRecorder();
// 	// };
// 	proto._onOpenURL = function(info) {
// 		var mainClient = this.getMainClient();
// 		// var scriptRecorder = this.getScriptRecorder();
// 		mainClient.openURL(info.url);
// 		// scriptRecorder.onNavigate(info.url);
// 	};
// 	proto.getFrameId = function() {
// 		return this.tabShadow.getFrameId();
// 	};
// 	proto._addBrowserStateListeners = function() {
// 		var browserState = this.getBrowserState();
//
// 		browserState.on('tabCreated', this.$sendTabs);
// 		browserState.on('tabDestroyed', this.$sendTabs);
// 		browserState.on('tabUpdated', this.$sendTabs);
// 	};
// 	proto._removeBrowserStateListeners = function() {
// 		var browserState = this.getBrowserState();
//
// 		browserState.removeListener('tabCreated', this.$sendTabs);
// 		browserState.removeListener('tabDestroyed', this.$sendTabs);
// 		browserState.removeListener('tabUpdated', this.$sendTabs);
// 	};
// 	proto.addClient = function(clientOptions) {
// 		var browserState = this.getBrowserState();
//
// 		if(clientOptions.frameId) {
// 			return browserState.findFrame(clientOptions.frameId).then(_.bind(function(frame) {
// 				var frameShadow = new ShadowFrame(_.extend({}, clientOptions, {
// 					frame: frame,
// 					browserShadow: this
// 				}));
//
// 				this.setClient(clientOptions.frameId, frameShadow);
//
// 				return frameShadow;
// 			}, this));
// 		} else if(clientOptions.viewType === 'message') {
// 			this._addSocketListeners(clientOptions.socket);
// 			return new Promise(_.bind(function(resolve, reject) {
// 				// console.log(this.options.visibleElements);
// 				// var visibleNodes = _.map(this.options.visibleElements, function(nodeId) {
//
// 				// }, this);
// 				var outputShadow = new ShadowOutput(_.extend({}, clientOptions, {
// 					// task: this.getTask(),
// 					visibleElements: this.options.visibleElements,
// 					browserShadow: this
// 				}));
// 				this.setMainClient(outputShadow);
//
// 				return outputShadow;
// 			}, this));
// 		} else {
// 			this._addBrowserStateListeners();
// 			this._addSocketListeners(clientOptions.socket);
// 			return this.setTab(browserState.getActiveTabId(), clientOptions);
// 		}
// 	};
// 	proto.isOutput = function() {
// 		return this._isOutput;
// 	};
//
// 	proto._addSocketListeners = function(socket) {
// 		socket	.on('addTab', this.$_onAddTab)
// 				.on('closeTab', this.$_onCloseTab)
// 				.on('focusTab', this.$_onFocusTab)
// 				.on('openURL', this.$_onOpenURL)
// 				.on('getCurrentTabs', this.$sendTabs)
// 				// .on('setTaskDescription', this.$setTaskDescription)
// 				// .on('markAsDone', this.$markTaskAsDone);
// 	};
// 	proto._removeSocketListeners = function(socket) {
// 		socket	.removeListener('addTab', this.$_onAddTab)
// 				.removeListener('closeTab', this.$_onCloseTab)
// 				.removeListener('focusTab', this.$_onFocusTab)
// 				.removeListener('openURL', this.$_onOpenURL)
// 				.removeListener('getCurrentTabs', this.$sendTabs)
// 				// .removeListener('setTaskDescription', this.$setTaskDescription)
// 				// .removeListener('markAsDone', this.$markTaskAsDone);
// 	};
// 	proto.sendTabs = function() {
// 		var mainClient = this.getMainClient();
// 		if(mainClient) {
// 			var browserState = this.getBrowserState();
// 			var tabs = {};
// 			_.each(browserState.getTabIds(), function(tabId) {
// 				tabs[tabId] = _.extend({
// 					active: tabId === mainClient.getTabId()
// 				}, browserState.summarizeTab(tabId));
// 			}, this);
// 			mainClient._getSocket().emit('currentTabs', tabs);
// 		}
// 	};
//
//
// 	proto._destroyCurrentTabShadow = function() {
// 		if(this.tabShadow) {
// 			this.tabShadow.destroy();
// 			this.tabShadow = false;
// 		}
// 	};
//
// 	proto.setTab = function(tabId, clientOptions) {
// 		var browserState = this.getBrowserState();
// 		var socket;
//
// 		this.activeTabId = tabId;
//
// 		var mainClient = this.getMainClient();
// 		if(mainClient) {
// 			socket = mainClient._getSocket();
// 			mainClient.destroy();
// 		} else {
// 			socket = clientOptions.socket;
// 		}
//
// 		return browserState.getTabState(tabId).then(_.bind(function(tabState) {
// 			var tabShadow = new ShadowTab(_.extend({}, clientOptions, {
// 				tab: tabState,
// 				socket: socket,
// 				browserShadow: this
// 			}));
//
// 			this.setMainClient(tabShadow);
// 			return this;
// 		}, this)).catch(function(err) {
// 			console.error(err);
// 			console.error(err.stack);
// 		});
// 		/*
//
// 			this._destroyCurrentTabShadow();
// 			this.activeTabId = tabId;
//
// 			return this.getBrowserState().getTabState(tabId).then(_.bind(function(tabState) {
// 				this.tabShadow = new ShadowTab(_.extend({}, this.options, {
// 					tab: tabState,
// 					frameId: frameId,
// 					socket: mainClient._getSocket()
// 				}));
// 			}, this)).catch(function(err) {
// 				console.error(err.stack);
// 			});
// 		}
// 		*/
// 	};
//
// 	proto.nodeReply = function(frameId, info) {
// 		var frame;
// 		// var task = this.getTask();
// 		// var scriptRecorder = this.getScriptRecorder();
//
// 		var browserState = this.getBrowserState();
// 		browserState.findFrame(frameId).then(function(f) {
// 			frame = f;
// 			var wrappedNodePromises = _.map(info.nodeIds, function(nodeId) {
// 				return frame.findNode(nodeId);
// 			});
// 			return Promise.all(wrappedNodePromises);
// 		}).then(function(wrappedNodes) {
// 			return _.compact(wrappedNodes);
// 		}).then(function(wrappedNodes) {
// 			// task.exposeNodes(wrappedNodes);
// 			// scriptRecorder.onNodeReply(frame, wrappedNodes);
// 			// return wrappedNodes;
// 			var newNodes = [];
// 			_.each(wrappedNodes, function(wrappedNode) {
// 				if(wrappedNode) {
// 					var parent = wrappedNode;
// 					do {
// 						newNodes.push(parent);
// 					} while(parent = parent.getParent());
//
// 					var deepChildren = wrappedNode.getDeepChildren();
//
// 					newNodes.push.apply(newNodes, _.map(deepChildren, function(child) {
// 						return child;
// 					}));
// 				}
// 			});
// 			newNodes = _.unique(newNodes);
// 			return newNodes
// 			// this._computedExposedNodes = newNodes;
// 		}).then(_.bind(function(allNodes) {
// 			this.emit('nodeReply', allNodes);
// 		}, this)).catch(function(err) {
// 			console.error(err);
// 		});
// 	};
//
// 	proto.destroy = function() {
// 		var mainClient = this.getMainClient();
// 		this._removeBrowserStateListeners();
// 		this._removeSocketListeners(mainClient._getSocket());
//
// 		_.each(this.clients, function(client, key) {
// 			client.destroy();
// 			delete this.clients[key];
// 		}, this);
// 		mainClient.destroy();
// 		this.setMainClient(false);
//
// 		log.debug('::: DESTROYED BROWSER SHADOW :::');
// 	};
// 	proto.getBrowserState = function() {
// 		return this.options.browserState;
// 	};
// 	proto.getMainClient = function() {
// 		return this._mainClient;
// 	};
// 	proto.setMainClient = function(client) {
// 		this._mainClient = client;
// 	};
// 	proto.setClient = function(frameId, client) {
// 		this._clients[frameId] = client;
// 	};
// 	proto.getClient = function(frameId) {
// 		return this._clients[frameId];
// 	};
// 	// proto.getTask = function() {
// 	// 	return this.options.task;
// 	// };
// }(ShadowBrowser));
//
// module.exports = {
// 	ShadowBrowser: ShadowBrowser
// };
