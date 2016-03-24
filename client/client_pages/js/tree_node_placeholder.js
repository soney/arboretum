$.widget('arboretum.tree_node_placeholder', {
	options: {
		id: false,
		name: '',
		type: false,
		attributes: {},
		inlineStyle: '',
		children: [],
		state: false,
	},
	_create: function() {
		var state = this.option('state');
		state.registerNode(this.option('id'), this);
	}
});