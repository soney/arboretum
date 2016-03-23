var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowTab = require('./tab_shadow').ShadowTab;

var log = require('../../utils/logging').getColoredLogger('red', 'bgBlack');

var ShadowBrowser = function(browserState, socket) {
	this.browserState = browserState;
	this.socket = socket;
	this.tabShadow = false;
	log.debug('::: CREATED BROWSER SHADOW :::');
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
		this.$_onClientReady = _.bind(this._onClientReady, this);

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
		this.tabShadow.openURL(info.url);
	};
	proto._onDeviceEvent = function(event) {
		this.browserState.onDeviceEvent(event, this.getActiveTabId());
	};
	proto.getFrameId = function() {
		return this.tabShadow.getFrameId();
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
	proto._onClientReady = function(info) {
		var tabId = info.tabId,
			frameId = info.frameId;

		if(!info.tabId) {
			tabId = this.browserState.getActiveTabId();
		}

		this.setTab(tabId, frameId);
	};

	proto._addSocketListeners = function() {
		this.socket	.on('addTab', this.$_onAddTab)
					.on('closeTab', this.$_onCloseTab)
					.on('focusTab', this.$_onFocusTab)
					.on('openURL', this.$_onOpenURL)
					.on('deviceEvent', this.$_onDeviceEvent)
					.on('clientReady', this.$_onClientReady)
					.on('getCurrentTabs', this.$sendTabs);
	};
	proto._removeSocketListeners = function() {
		this.socket	.removeListener('addTab', this.$_onAddTab)
					.removeListener('closeTab', this.$_onCloseTab)
					.removeListener('focusTab', this.$_onFocusTab)
					.removeListener('openURL', this.$_onOpenURL)
					.removeListener('deviceEvent', this.$_onDeviceEvent)
					.removeListener('clientReady', this.$_onClientReady);
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
		this._destroyCurrentTabShadow();
		this.activeTabId = tabId;

		return this.browserState.getTabState(tabId).then(_.bind(function(tabState) {
			this.tabShadow = new ShadowTab(tabState, frameId, this.socket);
		}, this)).catch(function(err) {
			console.error(err.stack);
		});
	};
	proto.destroy = function() {
		this._destroyCurrentTabShadow();

		this._removeBrowserStateListeners();
		this._removeSocketListeners();
		log.debug('::: DESTROYED BROWSER SHADOW :::');
	};
}(ShadowBrowser));

module.exports = {
	ShadowBrowser: ShadowBrowser
};
