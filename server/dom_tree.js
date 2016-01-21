var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var DOMState = function(doc, chrome) {
	this.chrome = chrome;
	this.doc = doc;

	this.root = this._createRoot();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._createRoot = function() {
		return new DOMNode(this.getDocument().root, this._getChrome());
	};

	proto.getDocument = function() {
		return this.doc;
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(DOMState));

var DOMNode = function(node, chrome) {
	this.node = node;
	this.chrome = chrome;

	this.children = this._createChildren();

	this._addListeners();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._createChildren = function() {
		var node = this._getNode(),
			chrome = this._getChrome(),
			childNodes = _.map(node.children, function(child) {
				return new DOMNode(child, chrome);
			});

		return childNodes;
	};

	proto._getNode = function() {
		return this.node;
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto._addListeners = function() {
		var chrome = this._getChrome(),
			node = this._getNode();
		var eventTypes = ['attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes'];

		_.each(eventTypes, function(eventType) {
			return;
			chrome.DOM[eventType]({
				nodeId: node.nodeId
			}, function(event) {
				console.log(event);
			});
		}, this);
	};

}(DOMNode));

module.exports = {
	DOMState: DOMState
};