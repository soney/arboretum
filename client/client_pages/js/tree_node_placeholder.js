$.widget('arboretum.tree_node_placeholder', {
	options: {
		id: false,
		name: '',
		type: false,
		attributes: {},
		inlineStyle: '',
		children: [],
		state: false,
		socket: false
	},
	_create: function() {
		var state = this.option('state');
		state.registerNode(this.option('id'), this);
		return;

		this.$_nodeInitialized = _.bind(this._nodeInitialized, this);

		var socket = this.option('socket');
		socket.on('nodeInitialized', this.$_nodeInitialized);
	},
	_destroy: function() {
		return;
		var socket = this.option('socket');
		socket.off('nodeInitialized', this.$_nodeInitialized);
	},
	_nodeInitialized: function(info) {
		if(info.id === this.option('id')) {
			var event = $.Event('initialized');
			event.id = info.id;
			this.element.trigger(event);
		}
	}
});