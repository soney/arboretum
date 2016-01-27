var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var ShadowState = function(domTree, socket) {
	this.domTree = domTree;
	this.socket = socket;
	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		this.$_updateShadowTree = _.bind(this._updateShadowTree, this);
		this.$_updateSheets = _.bind(this._updateSheets, this);
		this.$_highlightNode = _.bind(this._highlightNode, this);
		this.$_removeHighlight = _.bind(this._removeHighlight, this);

		domTree.on('rootInvalidated', this.$_updateShadowTree);
		domTree.on('styleSheetsInvalidated', this.$_updateSheets);
		socket.on('highlightNode', this.$_highlightNode);
		socket.on('removeHighlight', this.$_removeHighlight);

		this._updateShadowTree();
		this._updateSheets();

		this.on('updated', function() {
			socket.emit('treeUpdated', this._shadowTree.serialize());
		});
	};
	proto._getDomTree = function() {
		return this.domTree;
	};
	proto._getSocket = function() {
		return this.socket;
	}
	proto._updateShadowTree = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();
		if(this._shadowTree) {
			this._shadowTree.destroy();
		}
		domTree.getRoot().then(_.bind(function(node) {
			var shadow = this._shadowTree = new DOMTreeShadow({
				tree: node,
				state: this
			});

			socket.emit('treeReady', shadow.serialize());
		}, this)).catch(function(err) {
			console.error(err);
			console.error(err.stack);
		});
	};
	proto._updateSheets = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();
		domTree.getStyleSheets().then(function(sheets) {
			socket.emit('styleSheetsUpdated', {
				sheets: sheets
			});
		});
	};
	proto.destroy = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		if(this._shadowTree) {
			this._shadowTree.destroy();
		}

		domTree.removeListener('rootInvalidated', this.$_updateShadowTree);
		domTree.removeListener('styleSheetsInvalidated', this.$_updateSheets);
		socket.removeListener('highlightNode', this.$_highlightNode);
		socket.removeListener('removeHighlight', this.$_removeHighlight);
	};
	proto._highlightNode = function(info) {
		var nodeId = info.nodeId;
		domTree.highlight(nodeId);
	};
	proto._removeHighlight = function(info) {
		var nodeId = info.nodeId;
		domTree.removeHighlight(nodeId);
	};
	proto.childAdded = function(parent, child, previousChildId) {
		var socket = this._getSocket();
		socket.emit('childAdded', {
			parentId: parent.getId(),
			child: child.serialize(),
			previousChild: previousChildId
		});
	};
	proto.childRemoved = function(parent, child) {
		var socket = this._getSocket();
		socket.emit('childRemoved', {
			parentId: parent.getId(),
			childId: child.getId()
		});
	};
	proto.childrenChanged = function(parent, children) {
		var socket = this._getSocket();
		socket.emit('childrenChanged', {
			parentId: parent.getId(),
			children: children.map(function(child) { return child.serialize(); })
		});
	};
	proto.valueChanged = function(node, value) {
		var socket = this._getSocket();
		socket.emit('valueChanged', {
			id: node.getId(),
			value: value
		});
	};
	proto.attributesChanged = function(node, info) {
		var socket = this._getSocket();
		socket.emit('attributesChanged', {
			id: node.getId(),
			attributes: info.attributes,
			inlineStyle: info.inlineStyle
		});
	};
}(ShadowState));

var DOMTreePlaceholder = function(tree) {
	this.tree = tree;
	this._id = tree.getId();
};
(function(My) {
	var proto = My.prototype;
	proto.getId = function() {
		return this._id;
	};
	proto.destroy = function() { };
}(DOMTreePlaceholder));

var DOMTreeShadow = function(options) {
	this.options = _.extend({
		tree: false,
		state: false,
		childMapFunction: function(child) {
			var shadow = new DOMTreeShadow({
				tree: child,
				state: this._getState()
			});
			return shadow;
		},
		childFilterFunction: function(child) {
			var node = child._getNode(),
				nodeName = node.nodeName;
			if(nodeName === 'STYLE' || nodeName === 'SCRIPT' ||
				nodeName === '#comment' || nodeName === 'LINK') {
				return false;
			} else {
				return true;
			}
		}
	}, options);

	this._attributes = {};
	this._inlineCSS = '';

	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._childAdded = function(info) {
		var child = info.child,
			previousNode = info.previousNode,
			toAdd,
			addedAtIndex;

		if(this.options.childFilterFunction.call(this, child)) {
			toAdd = this.options.childMapFunction.call(this, child);
		} else {
			toAdd = new DOMTreePlaceholder(child);
		}

		if(previousNode) {
			var previousNodeId = previousNode.getId(),
				myChildren = this.children,
				len = myChildren.length,
				i = 0,
				child;

			while(i < len) {
				child = myChildren[i];
				if(child.getId() === previousNodeId) {
					this.children.splice(i, 0, toAdd);
					addedAtIndex = i;
					break;
				}
				i++;
			}
		} else {
			this.children.push(toAdd);
			addedAtIndex = this.children.length-1;
		}

		if(toAdd instanceof My) {
			var state = this._getState(),
				previousNodeId = false,
				node;
			for(var i = addedAtIndex-1; i>=0; i--) {
				node = this.children[i];
				if(node instanceof My) {
					previousNodeId = node.getId();
					break;
				}
			}
			state.childAdded(this, toAdd, previousNodeId);
		}
	};

	proto._getState = function() {
		return this.options.state;
	};

	proto._childRemoved = function(info) {
		var removedChild = info.child,
			removedChildId = removedChild.getId(),
			myChildren = this.children,
			len = myChildren.length,
			i = 0,
			child,
			wasRemoved;

		while(i < len) {
			child = myChildren[i];
			if(child.getId() === removedChildId) {
				wasRemoved = child;
				this.children.splice(i, 1);
				break;
			}
			i++;
		}

		if(wasRemoved) {
			if(wasRemoved instanceof My) {
				var state = this._getState();
				state.childRemoved(this, wasRemoved);
			}
			wasRemoved.destroy();
		}
	};

	proto._childrenChanged = function(info) {
		var children = info.children,
			state = this._getState();
		this._updateChildren(children);
		state.childrenChanged(this, this.getChildren());
	};

	proto._nodeValueChanged = function(info) {
		var value = info.value,
			state = this._getState();
		this._value = value;
		state.valueChanged(this, value);
	};

	proto._updateChildren = function(treeChildren) {
		this.children = _	.chain(treeChildren)
							.map(function(child) {
								var toAdd;
								if(this.options.childFilterFunction.call(this, child)) {
									toAdd = this.options.childMapFunction.call(this, child);
								} else {
									toAdd = new DOMTreePlaceholder(child);
								}
								return toAdd;
							}, this)
							.value();
	};

	proto.getTree = function() {
		return this.options.tree;
	};

	proto.getNode = function() {
		return this.getTree()._getNode();
	};


	proto.getChildren = function() {
		return _.filter(this.children, function(child) {
			return child instanceof My;
		});
	};

	proto.serialize = function() {
		var tree = this.getTree(),
			node = tree._getNode();

		return {
			id: this._id,
			type: this._type,
			name: this._name,
			value: this._value,
			children: _.map(this.getChildren(), function(child) {
				return child.serialize();
			}),
			inlineStyle: this._inlineCSS,
			attributes: this._attributes
		};
	};

	proto._initialize = function() {
		var tree = this.getTree(),
			node = this.getNode();

		this._type = node.nodeType;
		this._id = node.nodeId;
		this._name = node.nodeName;
		this._value = node.nodeValue;

		this.$_childAdded = _.bind(this._childAdded, this);
		this.$_childRemoved = _.bind(this._childRemoved, this);
		this.$_childrenChanged = _.bind(this._childrenChanged, this);

		this.$_updateAttributes = _.bind(this._updateAttributes, this);
		this.$_nodeValueChanged = _.bind(this._nodeValueChanged, this);

		tree.on('childAdded', this.$_childAdded);
		tree.on('childRemoved', this.$_childRemoved);
		tree.on('childrenChanged', this.$_childrenChanged);

		tree.on('attributesChanged', this.$_updateAttributes);
		tree.on('nodeValueChanged', this.$_nodeValueChanged);

		this._updateAttributes(tree.getAttributesMap());
		this._updateChildren(tree.getChildren());
	};

	proto.destroy = function() {
		var tree = this.getTree();
		_.each(this.getChildren(), function(child) {
			child.destroy();
		});

		tree.removeListener('childAdded', this.$_childAdded);
		tree.removeListener('childRemoved', this.$_childRemoved);
		tree.removeListener('childrenChanged', this.$_childrenChanged);

		tree.removeListener('attributesChanged', this.$_updateAttributes);
		tree.removeListener('nodeValueChanged', this.$_nodeValueChanged);
	};

	proto.getId = function() {
		return this._id;
	};

	proto._updateAttributes = function(attributesMap) {
		this._attributes = attributesMap;

		var tree = this.getTree();
		tree.getInlineStyles().then(_.bind(function(styleInfo) {
			var cssText = styleInfo.cssText,
				state = this._getState();

			this._inlineCSS = cssText;
			state.attributesChanged(this, {
				attributes: this._attributes,
				inlineStyle: this._inlineCSS
			});
		}, this));
	};
}(DOMTreeShadow));

module.exports = {
	DOMTreeShadow: DOMTreeShadow,
	ShadowState: ShadowState
};