$.widget('nrax.tree_node', {
	options: {
		node: false,
		socket: false,
		root: false
	},
	_create: function() {
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
		var li = $('<li />').appendTo(this.element);
		li.text(node.node.localName || node.node.nodeValue);
		_.each(node.children, function(child) {
			var ul = $('<ul />').appendTo(this.element);
			ul.tree_node({
				node: child,
				socket: this.option('socket')
			});
		}, this);
		li.on('mouseover', function() {
			socket.emit('highlightNode', {nodeId: node.node.nodeId});
		}).on('mouseout', function() {
			socket.emit('removeHighlight', {nodeId: node.node.nodeId});
		});
	},
	_destroy: function() {
		if(this.option('root')) {
			socket.off('treeUpdated', this.$_treeUpdated);
		}
	}
});