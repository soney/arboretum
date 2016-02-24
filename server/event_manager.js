var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	driver = require('./hack_driver/hack_driver');

log.setLevel('error');

var EventManager = function(chrome) {
	this.chrome = chrome;
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.onDeviceEvent = function(event, frame) {
		var chrome = this._getChrome();
		var type = event.type;
		if(type === 'click') {
			driver.click(chrome, event, frame);
		}
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(EventManager));

module.exports = {
	EventManager: EventManager
};