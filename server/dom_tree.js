var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var DOMState = function(chrome) {
	this.chrome = chrome;

	this._nodeMap = {};
	this._invalidRoot = true;

	this._addListeners();
	this.getRoot();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.highlight = function(nodeId) {
		var chrome = this._getChrome();

		chrome.DOM.highlightNode({
			nodeId: nodeId,
			highlightConfig: {
				borderColor: {
					r: 255,
					g: 0,
					b: 0,
					a: 1
				},
				contentColor: {
					r: 255,
					g: 0,
					b: 0,
					a: 0.5
				},
				showInfo: true
			}
		}, function(err, value) {
			if(err) {
				console.error(value);
			}
		});
	};

	proto.removeHighlight = function(nodeId) {
		var chrome = this._getChrome();

		chrome.DOM.hideHighlight({
			nodeId: nodeId
		}, function(err, value) {
			if(err) {
				console.error(value);
			}
		});
	};

	proto._setChildrenRecursive = function(parentNode, children) {
		return parentNode._setChildren(_.map(children, function(child) {
			return this._setChildrenRecursive(this._getWrappedDOMNode(child), child.children);
		}, this));
	};

	proto._getWrappedDOMNode = function(node) {
		var id = node.nodeId;
		if(this._hasWrappedDOMNodeWithID(id)) {
			return this._getWrappedDOMNodeWithID(id);
		} else {
			return this._nodeMap[id] = new WrappedDOMNode(node, this._getChrome());
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
				if(eventType === 'setChildNodes') {
					var nodes = event.nodes,
						parent = this._getWrappedDOMNodeWithID(event.parentId);

					return this._setChildrenRecursive(parent, nodes);
				} else if(eventType === 'documentUpdated') {
					this._invalidRoot = true;
					this.emit('beginDocumentUpdate');
					this.getRoot();
				} else if(eventType === 'characterDataModified') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					node._setCharacterData(event.characterData);
				} else if(eventType === 'childNodeRemoved') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId),
						parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);
					parentNode._removeChild(node);
				} else if(eventType === 'childNodeInserted') {
					var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId),
						previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
						wrappedNode = this._getWrappedDOMNode(event.node);

					this._setChildrenRecursive(wrappedNode, event.node.children);

					parentNode._insertChild(wrappedNode, previousNode);
				} else if(eventType === 'attributeModified') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					node._setAttribute(event.name, event.value);
				} else if(eventType === 'attributeRemoved') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					node._removeAttribute(event.name);
				} else if(eventType === 'childNodeCountUpdated') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					if(node) {
						node._childCountUpdated(event.childNodeCount);
						this._requestChildNodes(node);
					} else {
						this._requestNode(event.nodeId);
					}
				} else {
					console.log(eventType);
				}
			}, this));
		}, this);
	};

	proto._requestChildNodes = function(wrappedNode) {
		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.DOM.requestChildNodes({
				nodeId: wrappedNode.getId(),
				depth: -1
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(wrappedNode);
				}
			})
		});
	};

	proto._requestNode = function(node_id) {
		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.DOM.resolveNode({
				nodeId: node_id
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(val.object);
				}
			});
		}).then(function(nodeInfo) {
			return new Promise(function(resolve, reject) {
				chrome.DOM.requestNode({
					objectId: nodeInfo.objectId
				}, function(err, val) {
					if(err) {
						reject(val);
					} else {
						resolve(val);
					}
				});
			});
		});
	};

	proto.getRoot = function() {
		var chrome = this._getChrome();
		if(this._rootPromise && !this._invalidRoot) {
			return this._rootPromise;
		} else {
			this._rootPromise = new Promise(function(resolve, reject) {
				chrome.DOM.getDocument(function(err, val) {
					if(err) {
						reject(val);
					} else {
						resolve(val);
					}
				});
			}).then(function(doc) {
				return doc.root;
			}).then(_.bind(function(rootNode) {
				var root = this._getWrappedDOMNode(rootNode);
				this._setChildrenRecursive(root, rootNode.children);
				return root;
			}, this)).then(_.bind(function(root) {
				return this._requestChildNodes(root);
			}, this)).then(_.bind(function(root) {
				this._invalidRoot = false;
				this.emit('documentUpdated');
				return root;
			}, this)).catch(function(err) {
				console.error(err);
			});

			return this._rootPromise;
		}
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
		this.emit('childrenChanged');
		return this;
	};

	proto._getNode = function() {
		return this.node;
	};

	proto._removeChild = function(child) {
		var index = _.indexOf(this.getChildren(), child);
		if(index >= 0) {
			this.children.splice(index, 1);
			this.emit('childrenChanged');
		}
		return this;
	};

	proto._insertChild = function(child, previousNode) {
		if(previousNode) {
			var index = _.indexOf(this.getChildren(), previousNode);
			this.children.splice(index, 0, child);
		} else {
			this._setChildren(([child]).concat(this.getChildren()));
		}

		this.emit('childrenChanged');
	};

	proto._setAttribute = function(name, value) {
		var node = this._getNode();
		node.attributes.push(name, value);
		this.emit('attributesChanged');
	};

	proto._removeAttribute = function(name) {
		var node = this._getNode();
		var attributeIndex = _.indexOf(node.attributes, name);
		if(attributeIndex >= 0) {
			node.attributes.splice(attributeIndex, 2);
			this.emit('attributesChanged');
		}
	};

	proto.getAttributes = function() {
		var node = this._getNode();
		return node.attributes;
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto.getChildren = function() {
		return this.children;
	};

	proto._setCharacterData = function(characterData) {
		var node = this._getNode();
		node.nodeValue = characterData;
		this.emit('nodeValueChanged');
	};

	proto._childCountUpdated = function(count) {
		var node = this._getNode();
	};
}(WrappedDOMNode));

module.exports = {
	DOMState: DOMState
};