var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var DOMTreeShadow = function(options) {
	this.options = _.extend({
		tree: false,
		childMapFunction: function(child) {
			return new DOMTreeShadow({
				tree: child
			})
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

	this._updateChildren();
	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._updateChildren = function() {
		var tree = this.getTree(),
			treeChildren = tree.getChildren();

		this.children = _	.chain(treeChildren)
							.filter(this.options.childFilterFunction, this)
							.map(this.options.childMapFunction, this)
							.value();
	};


	proto.getTree = function() {
		return this.options.tree;
	};


	proto.getChildren = function() {
		return this.children;
	};

	proto.serialize = function() {
		var tree = this.getTree();

		return {
			node: tree._getNode(),
			children: _.map(this.getChildren(), function(child) {
				return child.serialize();
			})
		};
	};

	proto._initialize = function() {
		var tree = this.getTree();
		this.$_updateChildren = _.bind(this._updateChildren, this);
		tree.on('childrenChanged', this.$_updateChildren);
	};

	proto.destroy = function() {
		var tree = this.getTree();

		tree.removeListener('childrenChanged', this.$_updateChildren);
	};
}(DOMTreeShadow));

module.exports = {
	DOMTreeShadow: DOMTreeShadow
};