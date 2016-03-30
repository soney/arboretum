var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	URL = require('url'),
	ShadowFrame = require('./frame_shadow').ShadowFrame;

var log = require('../../utils/logging').getColoredLogger('yellow', 'bgBlack');

var ShadowTab = function(options) {
	this.options = options;
	this.frameId = options.frameId;
	this._frames = {};
	this.isMainFrame = !this.frameId;

	log.debug('::: CREATED TAB SHADOW ' + this._getTab().getTabId() + ' :::');

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
		return this.options.tab;
	};
	proto.mainFrameChanged = function() {
		var tab = this._getTab(),
			mainFrame = tab.getMainFrame();
		this.setFrame(mainFrame.getFrameId());
	};
	proto._getSocket = function() {
		return this.options.socket;
	};
	proto.setFrame = function(frameId) {
		var socket = this._getSocket();

		if(this.shadowFrame) {
			this.shadowFrame.destroy();
		}
		var frame = this._getTab().getFrame(frameId);
		this.shadowFrame = new ShadowFrame(_.extend({}, this.options, {
			frame: frame,
			socket: socket
		}));
		log.debug('Frame changed ' + frameId);
		socket.emit('frameChanged');
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
		this._getTab().navigate(url);
	};

	proto.destroy = function() {
		if(this.isMainFrame) {
			this._removeFrameListener();
			if(this.shadowFrame) {
				this.shadowFrame.destroy();
			}
		}
		log.debug('::: DESTROYED TAB SHADOW ' + this._getTab().getTabId() + ' :::');
	};
}(ShadowTab));

module.exports = {
	ShadowTab: ShadowTab
};