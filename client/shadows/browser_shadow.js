var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowTab = require('./tab_shadow').ShadowTab,
	ShadowFrame = require('./frame_shadow').ShadowFrame,
	ShadowDOM = require('./dom_shadow').ShadowDOM;

var log = require('../../utils/logging').getColoredLogger('red', 'bgBlack');

var ShadowBrowser = function(options) {
	this.options = options;

	this.$_onAddTab = _.bind(this._onAddTab, this);
	this.$_onCloseTab = _.bind(this._onCloseTab, this);
	this.$_onFocusTab = _.bind(this._onFocusTab, this);
	this.$_onOpenURL = _.bind(this._onOpenURL, this);
	this.$_onNodeReply = _.bind(this._onNodeReply, this);
	this.$sendTabs = _.bind(this.sendTabs, this);

	this._clients = {};
	this.setMainClient(false);
	/*

	this.options = {
		childFilterFunction: _.bind(function(child) {
			var node = child._getNode(),
				nodeName = node.nodeName,
				nodeType = node.nodeType;
			if(nodeName === 'SCRIPT' ||
				nodeName === '#comment' ||
				nodeName === 'BASE' || nodeType === NODE_CODE.DOCUMENT_TYPE_NODE) {
				return false;
			} else if(this.isOutput()) {
				if(nodeName === 'STYLE' || nodeName === 'LINK' || nodeName === 'HEAD') {
					return true;
				} else {
					var visibleElements = this._visibleElements;
					return _.indexOf(visibleElements, node.nodeId) >= 0;
				}
			} else {
				return true;
			}
		}, this)
	};

	this._initialize();
	this._visibleElements = true;
	*/
	log.debug('::: CREATED BROWSER SHADOW :::');
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._onNodeReply = function(info) {
		var nodeIds = info.nodeIds,
			activeTabShadow = this.tabShadow,
			nodes = _.map(nodeIds, function(id) {

			}, this);
		this.emit('nodeReply', info);
	};
	proto._onAddTab = function(info) {
		this.getBrowserState().addTab();
	};
	proto._onCloseTab = function(info) {
		this.getBrowserState().closeTab(info.tabId);
	};
	proto._onFocusTab = function(info) {
		this.setTab(info.tabId);
	};
	proto._onOpenURL = function(info) {
		this.tabShadow.openURL(info.url);
	};
	proto.getFrameId = function() {
		return this.tabShadow.getFrameId();
	};
	proto._addBrowserStateListeners = function() {
		var browserState = this.getBrowserState();

		browserState.on('tabCreated', this.$sendTabs);
		browserState.on('tabDestroyed', this.$sendTabs);
		browserState.on('tabUpdated', this.$sendTabs);
	};
	proto._removeBrowserStateListeners = function() {
		var browserState = this.getBrowserState();

		browserState.removeListener('tabCreated', this.$sendTabs);
		browserState.removeListener('tabDestroyed', this.$sendTabs);
		browserState.removeListener('tabUpdated', this.$sendTabs);
	};
	proto.addClient = function(clientOptions) {
		var browserState = this.getBrowserState();

		if(clientOptions.frameId) {
			return browserState.findFrame(clientOptions.frameId).then(_.bind(function(frame) {
				var frameShadow = new ShadowFrame(_.extend({}, clientOptions, {
					frame: frame,
					browserShadow: this
				}));

				this.setClient(clientOptions.frameId, frameShadow);

				return frameShadow;
			}, this));
		} else {
			this._addBrowserStateListeners();
			this._addSocketListeners(clientOptions.socket);

			return browserState.getTabState(browserState.getActiveTabId()).then(_.bind(function(tabState) {
				var tabShadow = new ShadowTab(_.extend({}, clientOptions, {
					tab: tabState,
					socket: clientOptions.socket,
					browserShadow: this
				}));

				this.setMainClient(tabShadow);
				return tabShadow;
			}, this));
		}
	};
	proto.setVisibleElements = function(nodeIds) {
		var browserState = this.getBrowserState();

		this._visibleElements = [];
		var wrappedNodePromises = _.map(nodeIds, function(nodeId) {
			return browserState.findNode(nodeId);
		}, this);
		Promise.all(wrappedNodePromises).then(function(wrappedNodes) {
			var newIds = [];
			_.each(wrappedNodes, function(wrappedNode) {
				if(wrappedNode) {
					var parent = wrappedNode;
					do {
						newIds.push(parent.getId())
					} while(parent = parent.getParent());

					var deepChildren = wrappedNode.getDeepChildren();
					newIds.push.apply(newIds, _.map(deepChildren, function(child) {
						return child.getId();
					}));

				}
			}, this);
			return _.unique(newIds);
		}).then(_.bind(function(newIds) {
			this._visibleElements = newIds;
			this.refreshChildren();
		}, this)).catch(function(err) {
			console.error(err.stack);
		});
	};
	proto.refreshChildren = function() {
		var tabShadow = this.tabShadow;
		if(tabShadow) {
			var frameShadow = tabShadow.shadowFrame;
			if(frameShadow) {
				var domShadow = frameShadow.getShadowTree();
				if(domShadow) {
					domShadow._childrenChanged({});
				}
			}
		}
	};

	proto.isOutput = function() {
		return this._isOutput;
	};

	proto._addSocketListeners = function(socket) {
		socket	.on('addTab', this.$_onAddTab)
				.on('closeTab', this.$_onCloseTab)
				.on('focusTab', this.$_onFocusTab)
				.on('openURL', this.$_onOpenURL)
				.on('getCurrentTabs', this.$sendTabs)
				.on('nodeReply', this.$_onNodeReply);
	};
	proto._removeSocketListeners = function(socket) {
		socket	.removeListener('addTab', this.$_onAddTab)
				.removeListener('closeTab', this.$_onCloseTab)
				.removeListener('focusTab', this.$_onFocusTab)
				.removeListener('openURL', this.$_onOpenURL)
				.removeListener('nodeReply', this.$_onNodeReply);
	};
	proto.sendTabs = function() {
		var mainClient = this.getMainClient();
		if(mainClient) {
			var browserState = this.getBrowserState();
			var tabs = {};
			_.each(browserState.getTabIds(), function(tabId) {
				tabs[tabId] = _.extend({
					active: tabId === this.getActiveTabId()
				}, browserState.summarizeTab(tabId));
			}, this);
			mainClient._getSocket().emit('currentTabs', tabs);
		}
	};

	proto.getActiveTabId = function() {
		return this.activeTabId;
	};

	proto._destroyCurrentTabShadow = function() {
		if(this.tabShadow) {
			this.tabShadow.destroy();
			this.tabShadow = false;
			this.activeTabId = false;
		}
	};

	proto.setTab = function(tabId, frameId) {
		var mainClient = this.getMainClient();
		if(mainClient) {
			this._destroyCurrentTabShadow();
			this.activeTabId = tabId;

			return this.getBrowserState().getTabState(tabId).then(_.bind(function(tabState) {
				this.tabShadow = new ShadowTab(_.extend({}, this.options, {
					tab: tabState,
					frameId: frameId,
					socket: mainClient._getSocket()
				}));
			}, this)).catch(function(err) {
				console.error(err.stack);
			});
		}
	};
	proto.destroy = function() {
		this._destroyCurrentTabShadow();

		this._removeBrowserStateListeners();
		this._removeSocketListeners();
		log.debug('::: DESTROYED BROWSER SHADOW :::');
	};
	proto.getBrowserState = function() {
		return this.options.browserState;
	};
	proto.getMainClient = function() {
		return this._mainClient;
	};
	proto.setMainClient = function(client) {
		this._mainClient = client;
	};
	proto.setClient = function(frameId, client) {
		this._clients[frameId] = client;
	};
	proto.getClient = function(frameId) {
		return this._clients[frameId];
	};
}(ShadowBrowser));

module.exports = {
	ShadowBrowser: ShadowBrowser
};