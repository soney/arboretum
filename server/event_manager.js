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

	//events come from client/client_pages/js/tree_node.js
	//(state.deviceEvent)
	proto.onDeviceEvent = function(event, frame) {
		var chrome = this._getChrome();
		var type = event.type;
		if(type === 'click') {
			driver.click(chrome, event.id, frame);
		} else if(type === 'input') {
			driver.setElementValue(chrome, event.id, event.value);
		}
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(EventManager));

module.exports = {
	EventManager: EventManager
};