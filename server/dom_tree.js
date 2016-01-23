var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var DOMState = function(chrome) {
	this.chrome = chrome;

	this._nodeMap = {};

	this._addListeners();
	this.root = this._createRoot();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._setChildrenRecursive = function(parentNode, children) {
		return parentNode._setChildren(_.map(children, function(child) {
			return this._setChildrenRecursive(this._getWrappedDOMNode(child), child.children);
		}, this));
	};

	proto._createRoot = function() {
		var chrome = this._getChrome(),
			rootNode = this.getDocument().root,
			root = this._getWrappedDOMNode(rootNode);

		this._setChildrenRecursive(root, rootNode.children);

		return new Promise(function(resolve, reject) {
			chrome.DOM.requestChildNodes({
				nodeId: root.getId(),
				depth: -1
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(root);
				}
			});
		}).catch(function(err) {
			console.error(err);
		});
	};

	proto._getWrappedDOMNode = function(node) {
		var id = node.nodeId;
		if(this._hasWrappedDOMNodeWithID(id)) {
			return this._getWrappedDOMNodeWithID(id);
		} else {
			return this._nodeMap[id] = new DOMNode(node, this._getChrome());
		}
	};

	proto._hasWrappedDOMNodeWithID = function(id) {
		return this._nodeMap.hasOwnProperty(id);
	};

	proto._getWrappedDOMNodeWithID = function(id) {
		return this._nodeMap[id];
	};

	proto._addListeners = function() {
		var chrome = this._getChrome(),
			eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes' ];

		_.each(eventTypes, function(eventType) {
			chrome.DOM[eventType](_.bind(function(event) {
				console.log(eventType);
				if(eventType === 'setChildNodes') {
					var nodes = event.nodes,
						parent = this._getDOMNodeWithID(event.parentId);

					return this._setChildrenRecursive(parent, nodes);
				} else if(eventType === 'documentUpdated') {
					this._createRoot();
				} else {
					console.log(eventType);
				}
				//console.log(node.children);
				//console.log(eventType);
				//console.log(arguments);
			}, this));
		}, this);
	};

	proto.getRoot = function() {
		return this.root;
	};

	proto.getDocument = function() {
		return this.doc;
	};

	proto._createDocument = function() {
		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.DOM.getDocument(function(err, doc) {
				if(err) {
					reject(err);
				} else {
					resolve(new DOMState(doc, chrome));
				}
			});
		});
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(DOMState));

var WrappedDOMNode = function(node, chrome) {
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


}(WrappedDOMNode));

module.exports = {
	DOMState: DOMState
};