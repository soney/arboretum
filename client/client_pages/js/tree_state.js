$.widget('arboretum.tree_state', {
	options: {
		tabId: false,
		frameId: false,
		mouseEventTypes: ['mousemove', 'mousedown', 'mouseup'],
		keyEventTypes: ['keydown', 'keyup'],
		touchEventTypes: ['touchstart', 'touchmove', 'touchend']
	},

	_create: function() {
		this.nodeMap = {};
		this._queuedInitializations = {};
		var socket = this.socket = io.connect();
		socket.emit('clientReady', {
			frameId: this.option('frameId'),
			tabId: this.option('tabId')
		});
		socket.on('serverReady', _.bind(this._serverReady, this));

		socket.on('frameChanged', _.bind(this._frameChanged, this));
		//socket.on('styleSheetsUpdated', _.bind(this._stylesheetsUpdated, this));
		this._addListeners();
		//this._addDeviceListeners();
		$(window).on('unload', _.bind(function() {
			this.element.tree_state('destroy');
		}, this));
	},
	_destroy: function() {
		this._removeNodeAndMenu();
		this._removeListeners();
		this.socket.disconnect();
	},
	_removeNodeAndMenu: function() {
		if(this.element.data('arboretum-tree_node')) {
			this.element.tree_node('destroy');
		}
		if(this.element.data('arboretum-tree_node_placeholder')) {
			this.element.tree_node_placeholder('destroy');
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
			if(child.initialized) {
				this.element.tree_node(_.extend({
					state: this,
					socket: this.socket
				}, child));
			} else {
				this.element.tree_node_placeholder(_.extend({
					parent: this,
					state: this,
					socket: this.socket
				}, child));
			}
		} else {
			var body = $('<body />').appendTo(this.element);
			if(child.initialized) {
				var div = $('<div />').appendTo(body).tree_node(_.extend({
					state: this,
					socket: this.socket
				}, data));
			} else {
				var div = $('<div />').appendTo(body).tree_node_placeholder(_.extend({
					state: this,
					socket: this.socket,
					parent: this
				}, data));
			}
		}

		if(!this.option('frameId')) { // top-level
			this.element.menu({
				state: this,
				socket: this.socket
			});
		}
		/*
		var selectedChild = data;
		console.log(selectedChild);
		/*

		this.element.tree_node(_.extend({
			state: this
		}, selectedChild));
		*/
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
		this.$_nodeInitialized = _.bind(this._nodeInitialized, this);

		socket.on('nodeInitialized', this.$_nodeInitialized);
		socket.on('childAdded', this.$_childAdded);
		socket.on('childRemoved', this.$_childRemoved);
		socket.on('childrenChanged', this.$_childrenChanged);
		socket.on('valueChanged', this.$_valueChanged);
		socket.on('attributesChanged', this.$_attributesChanged);
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
	_nodeInitialized: function(info) {
		var element = this.nodeMap[info.id];
		if(element) {
			var parent = element.option('parent');
			console.log(info.id + ' initialized');
			if(parent === this) {
				this._removeNodeAndMenu();
				this.element.tree_node_placeholder('destroy');
				this.element.tree_node(_.extend({
					state: this,
					socket: this.socket
				}, info));
			} else if(parent) {
				parent.childInitialized(info);
			} else {
				throw new Error('No parent for node initialized');
			}
		} else {
			throw new Error('Got node initialized before server ready');
		}
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

		if(node && node.setAttributes) {
			node.setAttributes(attributes, inlineStyle);
		} else {
			throw new Error('Could not find node');
		}
	},

	deviceEvent: function(eventInfo) {
		this.socket.emit('deviceEvent', eventInfo);
	},
	/*
	_onMouseEvent: function(event) {
		var socket = this.socket;
		var type, button='none', modifiers=0;
		if(event.type === 'mousemove') {
			type = 'mouseMoved';
		} else if(event.type === 'mousedown') {
			type = 'mousePressed';
		} else if(event.type === 'mouseup') {
			type = 'mouseReleased';
		}

		if(event.altKey)	{ modifiers = modifiers|1; }
		if(event.ctrlKey)	{ modifiers = modifiers|2; }
		if(event.metaKey)	{ modifiers = modifiers|4; }
		if(event.shiftKey)	{ modifiers = modifiers|8; }

		if(event.button === 0) {
			button = 'left'
		} else if(event.button === 1) {
			button = 'middle'
		} else if(event.button === 2) {
			button = 'right'
		}

		if(event.type === 'mouseup') {
			console.log(event);
		}

		socket.emit('mouseEvent', {
			x: event.pageX,
			y: event.pageY,
			timestamp: event.timestamp,
			type: type,
			clickCount: 1,
			//event.type==='mouseup'? 1 : 0,
			modifiers: modifiers,
			button: button
		});
	},
	_onKeyEvent: function(event) {
		var socket = this.socket;
	},
	_onTouchEvent: function(event) {
		var socket = this.socket;
	},
	_addDeviceListeners: function() {
		_.each(this.option('mouseEventTypes'), function(eventType) {
			this.element.on(eventType, _.bind(this._onMouseEvent, this));
		}, this);
		_.each(this.option('keyEventTypes'), function(eventType) {
			this.element.on(eventType, this._onKeyEvent);
		}, this);
		_.each(this.option('touchEventTypes'), function(eventType) {
			this.element.on(eventType, this._onTouchEvent);
		}, this);
	},
	*/
});
