var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowTab = require('./tab_shadow').ShadowTab,
	ShadowFrame = require('./frame_shadow').ShadowFrame,
	ShadowOutput = require('./output_shadow').ShadowOutput,
	ShadowDOM = require('./dom_shadow').ShadowDOM;

var log = require('../../utils/logging').getColoredLogger('red', 'bgBlack');

var ShadowBrowser = function(options) {
	this.options = options;

	this.$_onAddTab = _.bind(this._onAddTab, this);
	this.$_onCloseTab = _.bind(this._onCloseTab, this);
	this.$_onFocusTab = _.bind(this._onFocusTab, this);
	this.$_onOpenURL = _.bind(this._onOpenURL, this);
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

	proto._onAddTab = function(info) {
		this.getBrowserState().addTab();
	};
	proto._onCloseTab = function(info) {
		this.getBrowserState().closeTab(info.tabId);
	};
	proto._onFocusTab = function(info, clientOptions) {
		this.setTab(info.tabId, clientOptions);
	};
	proto._onOpenURL = function(info) {
		var mainClient = this.getMainClient();
		mainClient.openURL(info.url);
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
		} else if(clientOptions.viewType === 'output') {
			return new Promise(_.bind(function(resolve, reject) {
				var outputShadow = new ShadowOutput(_.extend({}, clientOptions, {
					task: this.getTask()
				}));
				this.setMainClient(outputShadow);

				return outputShadow;
			}, this));
		} else {
			this._addBrowserStateListeners();
			this._addSocketListeners(clientOptions.socket);
			return this.setTab(browserState.getActiveTabId(), clientOptions);
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
	};
	proto._removeSocketListeners = function(socket) {
		socket	.removeListener('addTab', this.$_onAddTab)
				.removeListener('closeTab', this.$_onCloseTab)
				.removeListener('focusTab', this.$_onFocusTab)
				.removeListener('openURL', this.$_onOpenURL)
	};
	proto.sendTabs = function() {
		var mainClient = this.getMainClient();
		if(mainClient) {
			var browserState = this.getBrowserState();
			var tabs = {};
			_.each(browserState.getTabIds(), function(tabId) {
				tabs[tabId] = _.extend({
					active: tabId === mainClient.getTabId()
				}, browserState.summarizeTab(tabId));
			}, this);
			mainClient._getSocket().emit('currentTabs', tabs);
		}
	};


	proto._destroyCurrentTabShadow = function() {
		if(this.tabShadow) {
			this.tabShadow.destroy();
			this.tabShadow = false;
		}
	};

	proto.setTab = function(tabId, clientOptions) {
		var browserState = this.getBrowserState();
		var socket;

		this.activeTabId = tabId;

		var mainClient = this.getMainClient();
		if(mainClient) {
			socket = mainClient._getSocket();
			mainClient.destroy();
		} else {
			socket = clientOptions.socket;
		}

		return browserState.getTabState(tabId).then(_.bind(function(tabState) {
			var tabShadow = new ShadowTab(_.extend({}, clientOptions, {
				tab: tabState,
				socket: socket,
				browserShadow: this
			}));

			this.setMainClient(tabShadow);
			return this;
		}, this)).catch(function(err) {
			console.error(err);
			console.error(err.stack);
		});
		/*

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
		*/
	};

	proto.nodeReply = function(frameId, info) {
		var task = this.getTask();
		task.exposeNodes(frameId, info.nodeIds);
	};

	proto.destroy = function() {
		var mainClient = this.getMainClient();
		this._removeBrowserStateListeners();
		this._removeSocketListeners(mainClient._getSocket());

		_.each(this.clients, function(client, key) {
			client.destroy();
			delete this.clients[key];
		}, this);
		mainClient.destroy();
		this.setMainClient(false);

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
	proto.getTask = function() {
		return this.options.task;
	};
}(ShadowBrowser));

module.exports = {
	ShadowBrowser: ShadowBrowser
};