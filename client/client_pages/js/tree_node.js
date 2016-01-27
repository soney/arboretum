$.widget('nrax.tree_node', {
	options: {
		node: false,
		socket: false,
		root: false
	},
	_create: function() {
		var socket = this.option('socket');
		this.$_treeUpdated = _.bind(this._treeUpdated, this);
		if(this.option('root')) {
			socket.on('treeUpdated', this.$_treeUpdated);
		}

		this._update();
	},
	_treeUpdated: function(node) {
		this.option('node', node);
		this._update();
	},
	_update: function() {
		var node = this.option('node');
		this.element.html('');

		_.each(node.children, function(child) {
			var childType = child.type;
			if(childType === 1 || childType === 9) {
				var childElem = $('<'+child.name+'/>').appendTo(this.element);
				childElem.tree_node({
					node: child,
					socket: this.option('socket')
				});
			} else if(childType === 3) {
				var childElem = $(document.createTextNode(child.value)).appendTo(this.element);
			} else {
			}
		}, this);

		var attributes = node.attributes;
		_.each(node.attributes, function(value, key) {
			this.element.attr(key, value);
		}, this);

		if(node.inlineStyle) {
			this.element.attr('style', node.inlineStyle);
		} else {
			this.element.removeAttr('style');
		}
	},
	_destroy: function() {
		if(this.option('root')) {
			socket.off('treeUpdated', this.$_treeUpdated);
		}
	}
});