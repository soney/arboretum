var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var ShadowState = function() {

};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

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
	proto.destroy = function() {

	};
}(DOMTreePlaceholder));

var DOMTreeShadow = function(options) {
	this.options = _.extend({
		tree: false,
		childMapFunction: function(child) {
			var shadow = new DOMTreeShadow({
				tree: child
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
			toAdd;

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
					break;
				}
				i++;
			}
		} else {
			this.children.push(toAdd);
		}

		if(toAdd instanceof My) {
			this.emit('updated');
		}
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
			wasRemoved.destroy();
			if(wasRemoved instanceof My) {
				this.emit('updated');
			}
		}
	};

	proto._childrenChanged = function(info) {
		var children = info.children;
		this._updateChildren(children);
		this.emit('updated');
	};

	proto._nodeValueChanged = function(info) {
		var value = info.value;
		this._value = value;
		this.emit('updated');
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
			var cssText = styleInfo.cssText;
			this._inlineCSS = cssText;
			this.emit('updated');
		}, this));
	};
}(DOMTreeShadow));

module.exports = {
	DOMTreeShadow: DOMTreeShadow,
	ShadowState: ShadowState 
};