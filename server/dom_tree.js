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

	proto.getRoot = function() {
		return this.root;
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
			chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.DOM.setChildNodes(function() {
				console.log('set child nodes');
				console.log(arguments);
			});
			chrome.DOM.requestChildNodes({
				nodeId: node.nodeId
			});
			/*
			, function(err, childNodes) {
				if(err) {
					reject(err);
				} else {
					resolve(childNodes);
				}
			});
			*/
		}).then(function(children) {
			console.log('children are: ');
			console.log(children);
			return _.map(children, function(child) {
				return new DOMNode(child, chrome);
			});
		});
	};

	proto._getNode = function() {
		return this.node;
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto.getChildren = function() {
		return this.children;
	};

	proto._addListeners = function() {
		var chrome = this._getChrome(),
			node = this._getNode();

		var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes' ];

		_.each(eventTypes, function(eventType) {
			chrome.DOM[eventType](function(event) {
				console.log(node.children);
				console.log(eventType);
				console.log(arguments);
			});
		}, this);
	};

}(DOMNode));

module.exports = {
	DOMState: DOMState
};