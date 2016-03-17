var _ = require('underscore'),
	util = require('util'),
	URL = require('url'),
	EventEmitter = require('events'),
	ShadowTab = require('./tab_shadow').ShadowTab;

var ShadowBrowser = function(browserState, socket) {
	this.browserState = browserState;
	this.socket = socket;
	this.tabShadow = false;
	this._initialize();
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		this.$_onAddTab = _.bind(this._onAddTab, this);
		this.$_onCloseTab = _.bind(this._onCloseTab, this);
		this.$_onFocusTab = _.bind(this._onFocusTab, this);
		this.$_onOpenURL = _.bind(this._onOpenURL, this);
		this.$_onDeviceEvent = _.bind(this._onDeviceEvent, this);

		this.$mainFrameChanged = _.bind(this.mainFrameChanged, this);
		this.$sendTabs = _.bind(this.sendTabs, this);

		this._addBrowserStateListeners();
		this._addSocketListeners();
	};
	proto._onAddTab = function(info) {
		this.browserState.addTab();
	};
	proto._onCloseTab = function(info) {
		this.browserState.closeTab(info.tabId);
	};
	proto._onFocusTab = function(info) {
		this.setTab(info.tabId);
	};
	proto._onOpenURL = function(info) {
		var parsedURL = URL.parse(info.url);
		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
		var url = URL.format(parsedURL);
		this.browserState.openURL(url);
	};
	proto._onDeviceEvent = function(event) {
		this.browserState.onDeviceEvent(event, this.getActiveTabId(), this.getFrameId());
	};
	proto._addBrowserStateListeners = function() {
		this.browserState.on('tabCreated', this.$sendTabs);
		this.browserState.on('tabDestroyed', this.$sendTabs);
		this.browserState.on('tabUpdated', this.$sendTabs);
	};
	proto._removeBrowserStateListeners = function() {
		this.browserState.removeListener('tabCreated', this.$sendTabs);
		this.browserState.removeListener('tabDestroyed', this.$sendTabs);
		this.browserState.removeListener('tabUpdated', this.$sendTabs);
	};
	proto._addSocketListeners = function() {
		this.socket	.on('addTab', this.$_onAddTab)
					.on('closeTab', this.$_onCloseTab)
					.on('focusTab', this.$_onFocusTab)
					.on('openURL', this.$_onOpenURL)
					.on('deviceEvent', this.$_onDeviceEvent);
	};
	proto._removeSocketListeners = function() {
		this.socket	.removeListener('addTab', this.$_onAddTab)
					.removeListener('closeTab', this.$_onCloseTab)
					.removeListener('focusTab', this.$_onFocusTab)
					.removeListener('openURL', this.$_onOpenURL)
					.removeListener('deviceEvent', this.$_onDeviceEvent);
	};
	proto.mainFrameChanged = function() {
		this.setFrame(this.browserState.getMainFrame().getId(), this.getActiveTabId())
	};
	proto.sendTabs = function() {
		var tabs = {};
		_.each(this.browserState.getTabIds(), function(tabId) {
			tabs[tabId] = _.extend({
				active: tabId === this.getActiveTabId()
			}, this.browserState.summarizeTab(tabId));
		}, this);
		this.socket.emit('currentTabs', tabs);
	};
	proto.getFrameId = function() {
		return this.frameId;
	};
	proto.getActiveTabId = function() {
		return this.activeTabId;
	};
	proto.setFrame = function(frameId, tabId) {
		if(!tabId) {
			tabId = this.browserState.getActiveTabId();
		}
		this.frameId = frameId;

		this.setTab(tabId, frameId).then(_.bind(function() {
			this.sendTabs();
		}, this));
	};
	proto._addFrameListener = function() {
		if(this._tabState) {
			this._tabState.on('mainFrameChanged', this.$mainFrameChanged);
		}
	};
	proto._removeFrameListener = function() {
		if(this._tabState) {
			this._tabState.removeListener('mainFrameChanged', this.$mainFrameChanged);
		}
	};
	proto.setTab = function(tabId, frameId) {
		return this.browserState.getTabState(tabId).then(_.bind(function(tabState) {
			this._removeFrameListener();
			this.tabShadow = new ShadowTab(tabState, this.socket);
			/*
			this._tabState = tabState;

			var frame;
			if(frameId) {
				frame = tabState.getFrame(frameId);
			} else {
				frame = tabState.getMainFrame();
				this._addFrameListener();
			}

			if(this.tabShadow) {
				this.tabShadow.destroy();
			}
			this.tabShadow = new ShadowTab(frame, this.socket);
			this.activeTabId = tabId;
			this.sendTabs();
			*/
			return tabState;
		}, this)).catch(function(err) {
			console.error(err.stack);
		});
	};
	proto.destroy = function() {
		if(this.tabShadow) {
			this.tabShadow.destroy();
			this.tabShadow = false;
		}

		this._removeBrowserStateListeners();
		this._removeSocketListeners();
		this._removeFrameListener();
	};
}(ShadowBrowser));

module.exports = {
	ShadowBrowser: ShadowBrowser
};
