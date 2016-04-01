$.widget('arboretum.tree_state', {
	options: {
		taskId: false,
		userId: false,
		frameId: false,
		viewType: false
	},

	_create: function() {
		this.nodeMap = {};
		this._queuedInitializations = {};

		var socket = this.socket = io.connect();

		socket.on('serverReady', _.bind(this._serverReady, this));
		socket.on('frameChanged', _.bind(this._frameChanged, this));

		socket.emit('clientReady', this.option());

		this._addListeners();
	},
	_destroy: function() {
		this._removeNodeAndMenu();
		this._removeListeners();
		this.socket.disconnect();
	},
	_removeNodeAndMenu: function() {
		if(this.node_container) {
			if(this.node_container.data('arboretum-tree_node')) {
				this.node_container.tree_node('destroy');
			}

			if(this.node_container.data('arboretum-tree_node_placeholder')) {
				this.node_container.tree_node_placeholder('destroy');
			}
		}
		if(this.element.data('arboretum-node_selection')) {
			this.element.node_selection('destroy');
		}
		if(this.element.data('arboretum-menu')) {
			this.element.menu('destroy');
		}
	},
	_frameChanged: function() {
		this._removeNodeAndMenu();
	},
	_serverReady: function(data) {
		this._removeNodeAndMenu();
		//var styleElement = $('style');

		if(data.type === DOCUMENT_NODE && data.children.length === 1 && data.children[0].name === 'HTML') { //document
			this.element.children().remove();
			var child = data.children[0];

			this.node_container = this.element;

			if(child.initialized) {
				this.element.tree_node(_.extend({
					state: this,
					socket: this.socket
				}, child));
			} else {
				this.element.tree_node_placeholder(_.extend({
					state: this
				}, child));
			}
		} else {
			this.node_container = $('<body />').appendTo(this.element).tree_node(_.extend({
				state: this,
				socket: this.socket
			}, data));
		}

		this.element.node_selection({
			state: this,
			socket: this.socket
		});

		if(!this.option('frameId') && this.option('viewType') !== 'output') { // top-level
			this.element.menu({
				state: this,
				socket: this.socket
			});
		}
	},
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
		this.$_nodeInitialized = _.bind(this._nodeInitialized, this);
		this.$_valueUpdated = _.bind(this._valueUpdated, this);

		socket.on('nodeInitialized', this.$_nodeInitialized);
		socket.on('childAdded', this.$_childAdded);
		socket.on('childRemoved', this.$_childRemoved);
		socket.on('childrenChanged', this.$_childrenChanged);
		socket.on('valueChanged', this.$_valueChanged);
		socket.on('attributesChanged', this.$_attributesChanged);
		socket.on('valueUpdated', this.$_valueUpdated);

		$(window).on('unload', _.bind(function() {
			this.element.tree_state('destroy');
		}, this));
	},
	_removeListeners: function() {
		var socket = this.socket;

		socket.off('nodeInitialized', this.$_nodeInitialized);
		socket.off('childAdded', this.$_childAdded);
		socket.off('childRemoved', this.$_childRemoved);
		socket.off('childrenChanged', this.$_childrenChanged);
		socket.off('valueChanged', this.$_valueChanged);
		socket.off('attributesChanged', this.$_attributesChanged);
	},
	_valueUpdated: function(info) {
		var element = this.nodeMap[info.id],
			type = info.type,
			value = info.value;
		if(type === 'canvas') {
			element.setImageData(new ImageData(new Uint8ClampedArray(value.data), value.width, value.height));
		} else if(type === 'input') {
			element.setInputValue(value);
		}
	},
	_nodeInitialized: function(info) {
		var node = this.nodeMap[info.id],
			element = node.element;
		if(this.element.is(element)) { //root
			this.element.tree_node_placeholder('destroy');
			this.element.tree_node(_.extend({
				state: this,
				socket: this.socket
			}, info));
		} else {
			if(!element) { // text node
				element = $(node);
			}
			var parent = element.parent();
			parent.tree_node('childInitialized', info, element);
			/*

			console.log(parent);

			if(node) {
				console.log(node.element.is(this.element));
				console.log(node.element);
				console.log(info);
			}
			*/
		}

		/*
		var parent = this.nodeMap[info.parentId];
		if(parent) {
			parent.childInitialized(info);
		} else {
			this._serverReady(info);
		}
		*/
		/*
		var element = this.nodeMap[info.id];
		console.log(info.id + ' initialized');
		if(element) {
			var parent = element.option('parent');
			if(parent === this || !parent) {
				this._currentData.children[0] = info;
				this._serverReady(this._currentData);
			} else if(parent) {
				parent.childInitialized(info);
			} else {
				throw new Error('No parent for node initialized');
			}
		} else {
			throw new Error('Got node initialized before server ready');
		}
		*/
	},
	getQueuedInitialization: function(id) {
		return this._queuedInitializations[id];
	},
	_childAdded: function(info) {
		var parentId = info.parentId,
			serializedChild = info.child,
			previousNodeId = info.previousChild,
			previousChild = this.nodeMap[previousNodeId],
			parent = this.nodeMap[parentId];

		if(parent) {
			if(parent.childAdded) {
				parent.childAdded(serializedChild, previousChild);
			}
		} else if(info.initialized) {
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

		if(node && node.setAttributes) {
			node.setAttributes(attributes, inlineStyle);
		} else {
			throw new Error('Could not find node');
		}
	},

	deviceEvent: function(eventInfo) {
		this.socket.emit('deviceEvent', eventInfo);
	},
});
