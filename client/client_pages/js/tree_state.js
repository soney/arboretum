$.widget('arboretum.tree_state', {
	options: { },

	_create: function() {
		this.nodeMap = {};
		var socket = this.socket = io.connect();
		socket.on('treeReady', _.bind(this._treeReady, this));
		//socket.on('styleSheetsUpdated', _.bind(this._stylesheetsUpdated, this));
		this._addListeners();
	},
	_destroy: function() {
		this.element.tree_node('destroy');
		this._removeListeners();
	},
	_treeReady: function(data) {
		//var styleElement = $('style');

		if(this.element.data('arboretum-tree_node')) {
			this.element.tree_node('destroy');
		}
		var selectedChild = data;

		this.element.tree_node(_.extend({
			state: this
		}, selectedChild));
	},
	/*
	_stylesheetsUpdated: function(event) {
		var styleElement = $('style');
		styleElement.text(event.sheets.join('\n'));
	},
	*/
	registerNode: function(id, node) {
		this.nodeMap[id] = node;
	},
	unregisterNode: function(id) {
		delete this.nodeMap[id];
	},
	_addListeners: function() {
		var socket = this.socket;
		this.$_childAdded = _.bind(this._childAdded, this);
		this.$_childRemoved = _.bind(this._childRemoved, this);
		this.$_childrenChanged = _.bind(this._childrenChanged, this);
		this.$_valueChanged = _.bind(this._valueChanged, this);
		this.$_attributesChanged = _.bind(this._attributesChanged, this);

		socket.on('childAdded', this.$_childAdded);
		socket.on('childRemoved', this.$_childRemoved);
		socket.on('childrenChanged', this.$_childrenChanged);
		socket.on('valueChanged', this.$_valueChanged);
		socket.on('attributesChanged', this.$_attributesChanged);
	},
	_removeListeners: function() {
		var socket = this.socket;

		socket.off('childAdded', this.$_childAdded);
		socket.off('childRemoved', this.$_childRemoved);
		socket.off('childrenChanged', this.$_childrenChanged);
		socket.off('valueChanged', this.$_valueChanged);
		socket.off('attributesChanged', this.$_attributesChanged);
	},
	_childAdded: function(info) {
		var parentId = info.parentId,
			serializedChild = info.child,
			previousNodeId = info.previousChild,
			previousChild = this.nodeMap[previousNodeId],
			parent = this.nodeMap[parentId];

		if(parent) {
			parent.childAdded(serializedChild, previousChild);
		} else {
			throw new Error('Could not find node');
		}
	},
	_childRemoved: function(info) {
		var parentId = info.parentId,
			childId = info.childId,
			parent = this.nodeMap[parentId],
			child = this.nodeMap[childId];

		if(parent && child) {
			parent.childRemoved(child);
		} else {
			throw new Error('Could not find node');
		}
	},
	_childrenChanged: function(info) {
		var parentId = info.parentId,
			serializedChildren = info.children,
			parent = this.nodeMap[parentId];

		if(parent) {
			parent.setChildren(serializedChildren);
		} else {
			throw new Error('Could not find node');
		}
	},
	_valueChanged: function(info) {
		var nodeId = info.id,
			value = info.value,
			node = this.nodeMap[nodeId];

		if(node) {
			node.nodeValue = value;
		} else {
			throw new Error('Could not find node');
		}
	},
	_attributesChanged: function(info) {
		var nodeId = info.id,
			attributes = info.attributes,
			inlineStyle = info.inlineStyle,
			node = this.nodeMap[nodeId];

		if(node) {
			if(node.setAttributes) {
				node.setAttributes(attributes, inlineStyle);
			}
		} else {
			throw new Error('Could not find node');
		}
	},
});
