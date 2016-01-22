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
		var chrome = this._getChrome(),
			root = new DOMNode(this.getDocument().root, chrome);

		function createNodeRecursive(parentNode, children) {
			return parentNode._setChildren(_.map(children, function(child) {
				return createNodeRecursive(new DOMNode(child, chrome), child.children);
			}));
		}

		return new Promise(function(resolve, reject) {
			chrome.DOM.setChildNodes(function(event) {
				resolve(event);
			});
			chrome.DOM.requestChildNodes({
				nodeId: root.getId(),
				depth: -1
			}, function(err, val) {
				if(err) {
					reject(val);
				}
			});
		}).then(function(event) {
			return createNodeRecursive(root, event.nodes)
		}).catch(function(err) {
			console.error(err);
		});
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
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.getId = function() {
		var node = this._getNode();
		return node.nodeId;
	};

	proto._setChildren = function(children) {
		this.children = children;
		return this;
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

	proto.toString = function() {
		var node = this._getNode();
		var str = '';
		str += node.nodeName;
		_.each(this.getChildren(), function(child) {
			str += child.toString();
		});
		str += '/'+node.nodeName;
		return str;
	};

	proto._addListeners = function() {
		var chrome = this._getChrome(),
			node = this._getNode();

		var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes' ];

		_.each(eventTypes, function(eventType) {
			chrome.DOM[eventType](function(event) {
				//console.log(node.children);
				//console.log(eventType);
				//console.log(arguments);
			});
		}, this);
	};

}(DOMNode));

module.exports = {
	DOMState: DOMState
};