//NO, this has nothing to do with *that* shadow dom
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	NODE_CODE = require('../../utils/node_code');

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

var ShadowDOM = function(options) {
	this.options = _.extend({
		tree: false,
		state: false,
		childMapFunction: function(child) {
			var shadow = new ShadowDOM({
				tree: child,
				state: this._getState()
			});
			return shadow;
		},
		childFilterFunction: function(child) {
			var node = child._getNode(),
				nodeName = node.nodeName,
				nodeType = node.nodeType;
			if(/*nodeName === 'STYLE' || */nodeName === 'SCRIPT' ||
				nodeName === '#comment'/* || nodeName === 'LINK'*/ ||
				nodeName === 'BASE' || nodeType === NODE_CODE.DOCUMENT_TYPE_NODE) {
				return false;
			} else {
				return true;
			}
		}
	}, options);

	if(!this.options.tree) {
		throw new Error('No Tree');
	}

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
					this.children.splice(i+1, 0, toAdd);
					addedAtIndex = i+1;
					break;
				}
				i++;
			}
		} else {
			this.children.unshift(toAdd);
			addedAtIndex = 0;
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
		var tree = this.getTree();
		var node = tree._getNode();
		return node;
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
			attributes: this._attributes,
			namespace: this._namespace
		};
	};

	proto._initialize = function() {
		var tree = this.getTree(),
			node = this.getNode();

		this._type = tree.getNodeType();
		this._id = tree.getId();
		this._name = tree.getNodeName();
		this._value = tree.getNodeValue();

		this.$_childAdded = _.bind(this._childAdded, this);
		this.$_childRemoved = _.bind(this._childRemoved, this);
		this.$_childrenChanged = _.bind(this._childrenChanged, this);

		this.$_updateAttributes = _.bind(this._updateAttributes, this);
		this.$_nodeValueChanged = _.bind(this._nodeValueChanged, this);
		this.$_inlineStyleChanged = _.bind(this._inlineStyleChanged, this);


		tree._self_initialized.then(_.bind(function() {
			this._value = tree.getNodeValue();

			this._namespace = tree.getNamespace();
			//console.log(tree.getNamespace(), tree.getNodeName());
			this._attributes = tree.getAttributesMap();
			this._inlineCSS = tree.getInlineStyle();
			//this._updateAttributes(tree.getAttributesMap());
			var state = this._getState();
			if(tree.getNodeType() === 1) {
				state.attributesChanged(this, {
					attributes: this._attributes,
					inlineStyle: this._inlineCSS
				});
			}

			tree.on('childAdded', this.$_childAdded);
			tree.on('childRemoved', this.$_childRemoved);
			tree.on('childrenChanged', this.$_childrenChanged);

			tree.on('attributesChanged', this.$_updateAttributes);
			tree.on('nodeValueChanged', this.$_nodeValueChanged);
			tree.on('inlineStyleChanged', this.$_inlineStyleChanged);
		}, this)).catch(function(err) {
			console.log(err);
		});
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
		tree.removeListener('inlineStyleChanged', this.$_inlineStyleChanged);
	};

	proto.getId = function() {
		return this._id;
	};

	proto._updateAttributes = function(attributesMap) {
		this._attributes = attributesMap;
		var state = this._getState();

		state.attributesChanged(this, {
			attributes: this._attributes,
			inlineStyle: this._inlineCSS
		});
	};

	proto._inlineStyleChanged = function(event) {
		var inlineStyle = event.inlineStyle;

		this._inlineCSS = inlineStyle;

		var state = this._getState();

		state.attributesChanged(this, {
			attributes: this._attributes,
			inlineStyle: this._inlineCSS
		});
	};

}(ShadowDOM));

module.exports = {
	ShadowDOM: ShadowDOM
};