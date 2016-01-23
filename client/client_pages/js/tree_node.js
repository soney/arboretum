$.widget('nrax.tree_node', {
	options: {
		node: false
	},
	_create: function() {
		var node = this.option('node');

		var li = $('<li />').appendTo(this.element);
		li.text(node.node.localName || node.node.nodeValue);
		_.each(node.children, function(child) {
			var ul = $('<ul />').appendTo(this.element);
			ul.tree_node({
				node: child
			});
		}, this);
	}
});