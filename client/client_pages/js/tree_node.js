var ELEMENT_NODE = Node.ELEMENT_NODE;
var TEXT_NODE = Node.TEXT_NODE;
var PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE;
var COMMENT_NODE = Node.COMMENT_NODE;
var DOCUMENT_NODE = Node.DOCUMENT_NODE;
var DOCUMENT_TYPE_NODE = Node.DOCUMENT_TYPE_NODE;
var DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE;
var x = 0;

$.widget('arboretum.tree_node', {
	options: {
		id: false,
		name: '',
		type: false,
		attributes: {},
		inlineStyle: '',
		children: [],
		state: false,
		initialized: false,
		socket: false
	},
	_create: function() {
		this.initialChildren = this.element.children();
		this._initialize(this.option('node'));
	},
	_initialize: function(data) {
		var state = this.option('state');
		state.registerNode(this.option('id'), this);

		this._initializeAttributes(this.option('attributes'));
		this._initializeInlineStyle(this.option('inlineStyle'));
		this._initializeChildren(this.option('children'));
		this._addDeviceListeners();
	},
	_setOption: function(key, value) {
		this._super(key, value);
	},
	_initializeAttributes: function(attributes) {
		_.each(attributes, function(value, key) {
			this.element.attr(key, value);
		}, this);
	},
	_initializeInlineStyle: function(style) {
		if(style) {
			this.element.attr('style', style);
		} else {
			this.element.removeAttr('style');
		}
	},
	_getChildElement: function(child) {
		var childType = child.type,
			childElem;

		if(childType === ELEMENT_NODE || childType === DOCUMENT_NODE || childType === DOCUMENT_TYPE_NODE) {
			var name = child.name;

			if(child.namespace && child.namespace !== 'http://www.w3.org/1999/xhtml') {
				childElem = $(document.createElementNS(child.namespace, name));
			} else {
				childElem = $('<'+name+'/>');
			}
			$(childElem).data('arboretum-id', child.id);
		} else if(childType === TEXT_NODE) {
			childElem = document.createTextNode(child.value);

			$(childElem).data('arboretum-id', child.id);
		} else {
			console.log(child);
			childElem = false;
		}
		return childElem;
	},
	_postChildElementAdded: function(child, childElem) {
		var state = this.option('state'),
			childType = child.type;

		if(childType === ELEMENT_NODE || childType === DOCUMENT_NODE) {
			var initialized = child.initialized;
			//if(state.getQueuedInitialization(child.id)) {
				//initialized = true;
				//child = state.getQueuedInitialization(child.id);
			//}

			if(initialized) {
				childElem.tree_node(_.extend({
					state: state,
					parent: this
				}, child));
			} else {
				childElem.tree_node_placeholder(_.extend({
					state: state,
					parent: this
				}, child));
			}
		} else if(childType === TEXT_NODE) {
			state.registerNode(child.id, childElem);
		}
	},
	setImageData: function(imageData) {
		var ctx = this.element[0].getContext('2d');
		ctx.putImageData(imageData, 0, 0);
	},
	setInputValue: function(value) {
		var currentVal = this.element.val();
		if(currentVal !== value) {
			this.element.val(value);
		}
	},
	childInitialized: function(childInfo, placeholderElement) {
		var childElem = this._getChildElement(childInfo);
		placeholderElement.after(childElem);

		if(placeholderElement.data('arboretum-tree_node_placeholder')) {
			placeholderElement.tree_node_placeholder('destroy');
		}
		placeholderElement.remove();

		this._postChildElementAdded(childInfo, childElem);
		/*
		var children = this.option('children'),
			childIndex = -1;

		for(var i = 0; i<children.length; i++) {
			if(children[i].id === child.id) {
				childIndex = i;
				break;
			}
		}

		if(childIndex >= 0) {
			var childElements = this.element.children(),
				childPlaceholder = $(childElements[childIndex]),
				childElem = this._getChildElement(child);

			childPlaceholder.after(childElem);
			childPlaceholder.remove();

			this._postChildElementAdded(child, childElem);
		} else {
			throw new Error('Could not find child ' + child.id);
		}
		*/
	},
	_initializeChildren: function(children) {
		_.each(children, function(child) {
			childElem = this._getChildElement(child);

			if(childElem) {
				this.element.append(childElem);
				this._postChildElementAdded(child, childElem);
			}
		}, this);
	},

	childAdded: function(child, previousChild) {
		var children = this.option('children'),
			childElem = this._getChildElement(child);

		if(childElem) {
			if(previousChild) {
				var childElements = this.element.children(),
					toAdddIndex = -1,
					toAddAfter;
				$.each(childElements, function(i, elem) {
					var tree_node = $(elem).data('arboretum-tree_node');
					if(tree_node === previousChild) {
						toAdddIndex = i;
						toAddAfter = $(elem);
					}
				});
				if(toAdddIndex >= 0) {
					toAddAfter.after(childElem);
				} else {
					throw new Error('Could not find node');
				}
			} else if(this.initialChildren.length > 0) {
				this.initialChildren.last().after(childElem);
			} else {
				children.unshift(child);
				this.element.prepend(childElem);
			}

			this._postChildElementAdded(child, childElem);
		}
		this.option('children', children);
	},
	childRemoved: function(child) {
		if(child.nodeType === TEXT_NODE) {
			var state = this.option('state');
			state.unregisterNode($(child).data('arboretum-id'));
			$(child).remove();
			//this.option('children', _.filter(children, function(c) { return c !== child; }));
		} else {
			var id = child.option('id');
				//children = this.option('children');

			child.element.remove();

			//this.option('children', _.filter(children, function(child) { return child.id !== id; }));
		}
	},
	setChildren: function(children) {
		//var previousChildren = this.option('children');
		//this.option('children', children);

		this._clearChildren();
		this._initializeChildren(children);
	},
	setAttributes: function(attributes, inlineStyle) {
		var previousAttributes = this.option('attributes'),
			previousInlineStyle = this.option('inlineStyle');

		this.option({
			attributes: attributes,
			inlineStyle: inlineStyle
		});

		var oldAttributeKeys = _.keys(previousAttributes);
		_.each(attributes, function(val, key) {
			try {
				this.element.attr(key, val);
			} catch(e) {
				console.error(e);
			}
		}, this);
		_.each(_.keys(previousAttributes), function(key) {
			if(!_.has(attributes, key)) {
				this.element.removeAttr(key);
			}
		}, this);

		if(inlineStyle) {
			this.element.attr('style', inlineStyle);
		} else {
			this.element.removeAttr('style');
		}
	},
	_clearChildren: function() {
		var state = this.option('state');
		this.element.children().each(function() {
			state.unregisterNode($(this).data('arboretum-id'));
		}).remove();
	},
	_destroy: function() {
		var state = this.option('state');
		this._removeDeviceListeners();
		state.unregisterNode(this.option('id'));

		this._clearChildren();
	},
	_getModifiers: function(event) {
		var modifiers = 0;

		if(event.altKey)	{ modifiers = modifiers|1; }
		if(event.ctrlKey)	{ modifiers = modifiers|2; }
		if(event.metaKey)	{ modifiers = modifiers|4; }
		if(event.shiftKey)	{ modifiers = modifiers|8; }

		return modifiers;
	},
	_getButton: function(event) {
		var button='none';
		if(event.button === 0) {
			button = 'left'
		} else if(event.button === 1) {
			button = 'middle'
		} else if(event.button === 2) {
			button = 'right'
		}
		return button;
	},
	_onClick: function(event) {
		if(event.target === this.element[0]) {
			var state = this.option('state');

			console.log("CLICKING EVENT PRE-EMIT :: ", event, state.option('userId'));  // WSL: TEST

			state.deviceEvent({
				id: this.option('id'),
				button: this._getButton(event),
				modifiers: this._getModifiers(event),
				device: 'mouse',
				type: 'click',
				userId: state.option('userId'),
				timestamp: (new Date()).getTime(),
				offsetX: event.offsetX,
				offsetY: event.offsetY
			});
		}
	},
	_onInput: function(event) {
		if(event.target === this.element[0]) {
			var state = this.option('state');

			state.deviceEvent({
				id: this.option('id'),
				device: 'keyboard',
				type: 'input',
				userId: state.option('userId'),
				timestamp: (new Date()).getTime(),
				value: this.element.val()
			});
		}
	},
	_addDeviceListeners: function() {
		this.$_onClick = $.proxy(this._onClick, this);
		this.$_onInput = $.proxy(this._onInput, this);

		this.element.on('click', this.$_onClick);
		this.element.on('input', this.$_onInput);
	},
	_removeDeviceListeners: function() {
		this.element.off('click', this.$_onClick);
		this.element.off('input', this.$_onInput);
	}
});