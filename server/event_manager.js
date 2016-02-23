var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel');

log.setLevel('error');

var EventManager = function(chrome) {
	this.chrome = chrome;
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.emulateMouseEvent = function(event, frame) {
		var chrome = this._getChrome();
		console.log(event);
		chrome.Input.dispatchMouseEvent(event);
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(EventManager));

module.exports = {
	EventManager: EventManager
};