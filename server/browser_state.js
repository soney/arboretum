var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	PageState = require('./page_state').PageState,
	colors = require('colors/safe');

log.setLevel('error');

var BrowserState = function(chrome) {
	this.chrome = chrome;
	this._tabs = {};
	this._initialized = this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
	proto.addTab = function() {
		var chrome = this._getChrome();
	};
	proto.closeTab = function(tabId) {
		var chrome = this._getChrome();
	};
	proto.focusTab = function(tabId) {
		var chrome = this._getChrome();

	};
	proto.openURL = function(url) {
		var chrome = this._getChrome();
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(BrowserState));

module.exports = {
	BrowserState: BrowserState
};