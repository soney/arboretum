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
		var elemInfo = node.node;
		this.element.html('');
		this.element.attr('style', node.inlineStyle);

		//var elem = $('<' + elemInfo.localName + '/>').appendTo(this.element);
		//var li = $('<li />').appendTo(this.element);
		//li.text(node.node.localName || node.node.nodeValue);
		_.each(node.children, function(child) {
			var n = child.node,
				nodeType = n.nodeType;
			if(nodeType === 1 || nodeType === 9) {
				var childElem = $('<'+n.localName+'/>').appendTo(this.element);
				childElem.tree_node({
					node: child,
					socket: this.option('socket')
				});
			} else if(nodeType === 3) {
				var childElem = $(document.createTextNode(n.nodeValue)).appendTo(this.element);
			}
		}, this);
		this.element.on('mouseover', function() {
			socket.emit('highlightNode', {nodeId: elemInfo.nodeId});
		}).on('mouseout', function() {
			socket.emit('removeHighlight', {nodeId: elemInfo.nodeId});
		});

		var attributes = elemInfo.attributes;
		if(attributes) {
			for(var i = 0; i<attributes.length; i+=2) {
				var name = attributes[i],
					value = attributes[i+1];
				this.element.attr(name, value);
			}
		}
	},
	_destroy: function() {
		if(this.option('root')) {
			socket.off('treeUpdated', this.$_treeUpdated);
		}
	}
});