var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var ResourceTracker = function(chrome) {
	this.chrome = chrome;
	this._initialize();
};

(function(My) {
	var proto = My.prototype;

	proto._initialize = function() {
		var chrome = this._getChrome();

		chrome.Network.enable();

		this.$_requestWillBeSent = _.bind(this._requestWillBeSent, this);

		chrome.Network.requestWillBeSent(this.$_requestWillBeSent);
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto._requestWillBeSent = function() {
		console.log(arguments);
	};

}(ResourceTracker));

module.exports = {
	ResourceTracker: ResourceTracker
};