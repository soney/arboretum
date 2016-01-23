var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var DOMState = function(doc, chrome) {
	this.chrome = chrome;
	this.doc = doc;

	this._nodeMap = {};
	this.root = this._createRoot();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;


	proto._createRoot = function() {
		var chrome = this._getChrome(),
			root = this._getDOMNode(this.getDocument().root);

		function createNodeRecursive(parentNode, children) {
			return parentNode._setChildren(_.map(children, function(child) {
				return createNodeRecursive.call(this, this._getDOMNode(child), child.children);
			}, this));
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
		}).then(_.bind(function(event) {
			return createNodeRecursive.call(this, root, event.nodes);
		}, this)).then(_.bind(function(rootNode) {
			this._addListeners();
			return rootNode;
		}, this)).catch(function(err) {
			console.error(err);
		});
	};

	proto._getDOMNode = function(node) {
		var id = node.nodeId;
		if(this._hasDOMNodeWithID(id)) {
			return this._getDOMNodeWithID(id);
		} else {
			return this._nodeMap[id] = new DOMNode(node, this._getChrome());
		}
	};

	proto._hasDOMNodeWithID = function(id) {
		return this._nodeMap.hasOwnProperty(id);
	};

	proto._getDOMNodeWithID = function(id) {
		return this._nodeMap[id];
	};

	proto._addListeners = function() {
		var chrome = this._getChrome();
		this.getRoot().then(_.bind(function(root) {
			var node = root._getNode();

			var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
								'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
								'documentUpdated', 'setChildNodes' ];

			_.each(eventTypes, function(eventType) {
				chrome.DOM[eventType](_.bind(function(event) {
					if(eventType === 'setChildNodes') {
						var nodes = event.nodes,
							parent = this._getDOMNodeWithID(event.parentId);
						console.log(parent);
					} else {
						console.log(eventType);
					}
					//console.log(node.children);
					//console.log(eventType);
					//console.log(arguments);
				}, this));
			}, this);
		}, this));
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


}(DOMNode));

module.exports = {
	DOMState: DOMState
};