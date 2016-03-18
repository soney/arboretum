var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	URL = require('url'),
	ShadowTab = require('./frame_shadow').ShadowFrame;

var ShadowTab = function(tab, socket) {
	this.tab = tab;
	this._frames = {};
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		this.$mainFrameChanged = _.bind(this.mainFrameChanged, this);
	};

	proto._getTab = function() {
		return this.tab;
	};
	proto.mainFrameChanged = function() {
		this.setFrame(this.browserState.getMainFrame().getId(), this.getActiveTabId())
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
	proto.getFrameId = function() {
		return this.frameId;
	};
	proto.openURL = function(url) {
		var parsedURL = URL.parse(info.url);
		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
		var url = URL.format(parsedURL);
		this.getTab().openURL(url);
	};

	proto.destroy = function() {
		this._removeFrameListener();
	};
}(ShadowTab));

module.exports = {
	ShadowTab: ShadowTab
};