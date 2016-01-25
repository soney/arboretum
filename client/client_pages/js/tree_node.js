$.widget('nrax.tree_node', {
	options: {
		node: false,
		socket: false
	},
	_create: function() {
		var node = this.option('node');

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
	}
});