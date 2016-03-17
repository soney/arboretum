var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowTab = require('./frame_shadow').ShadowFrame;

var ShadowTab = function(tab, socket) {
	this.tab = tab;
	this._frames = {};
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._getTab = function() {
		return this.tab;
	};
}(ShadowTab));

module.exports = {
	ShadowTab: ShadowTab
};