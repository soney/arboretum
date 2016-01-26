var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var DOMTreeShadow = function(options) {
	this.options = _.extend({
		tree: false,
		childMapFunction: function(child) {
			var shadow = new DOMTreeShadow({
				tree: child
			});
			shadow.on('updated', _.bind(function() {
				this.emit('updated');
			}, this));

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

	this._inlineCSS = '';
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

		this.emit('updated');
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
			}),
			inlineStyle: this._inlineCSS
		};
	};

	proto._initialize = function() {
		var tree = this.getTree();
		this.$_updateChildren = _.bind(this._updateChildren, this);
		this.$_updateInlineStyle = _.bind(this._updateInlineStyle, this);
		tree.on('childrenChanged', this.$_updateChildren);
		tree.on('attributesChanged', this.$_updateInlineStyle);

		this._updateInlineStyle();
	};

	proto.destroy = function() {
		var tree = this.getTree();
		_.each(this.getChildren(), function(child) {
			child.destroy();
		});
		tree.removeListener('childrenChanged', this.$_updateChildren);
		tree.removeListener('attributesChanged', this.$_updateInlineStyle);
	};

	proto._updateInlineStyle = function() {
		var tree = this.getTree();
		tree.getInlineStyles().then(_.bind(function(styleInfo) {
			var cssText = styleInfo.cssText;
			this._inlineCSS = cssText;
			this.emit('updated');
		}, this));
	};
}(DOMTreeShadow));

module.exports = {
	DOMTreeShadow: DOMTreeShadow
};