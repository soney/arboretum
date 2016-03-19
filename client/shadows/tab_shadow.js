var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	URL = require('url'),
	ShadowFrame = require('./frame_shadow').ShadowFrame;

var ShadowTab = function(tab, frameId, socket) {
	this.socket = socket;
	this.tab = tab;
	this.frameId = frameId;
	this._frames = {};
	this.isMainFrame = !this.frameId;

	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		if(this.isMainFrame) {
			this.$mainFrameChanged = _.bind(this.mainFrameChanged, this);
			this.mainFrameChanged();
			this._addFrameListener();
		} else {
			this.setFrame(this.frameId);
		}
	};

	proto._getTab = function() {
		return this.tab;
	};
	proto.mainFrameChanged = function() {
		var tab = this._getTab(),
			mainFrame = tab.getMainFrame();

		this.setFrame(mainFrame.getFrameId());
	};
	proto.setFrame = function(frameId) {
		if(this.shadowFrame) {
			this.shadowFrame.destroy();
		}

		var frame = this._getTab().getFrame(frameId);
		this.shadowFrame = new ShadowFrame(frame, this.socket);
	};

	proto._addFrameListener = function() {
		var tab = this._getTab();
		if(!this.frameId) {
			tab.on('mainFrameChanged', this.$mainFrameChanged);
		}
	};
	proto._removeFrameListener = function() {
		var tab = this._getTab();
		tab.removeListener('mainFrameChanged', this.$mainFrameChanged);
	};
	proto.getFrameId = function() {
		return this.frameId;
	};
	proto.openURL = function(url) {
		var parsedURL = URL.parse(url);
		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
		var url = URL.format(parsedURL);
		this._getTab().openURL(url);
	};

	proto.destroy = function() {
		if(this.isMainFrame) {
			this._removeFrameListener();
		}
	};
}(ShadowTab));

module.exports = {
	ShadowTab: ShadowTab
};