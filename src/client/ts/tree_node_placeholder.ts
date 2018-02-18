import * as $ from 'jquery';
$.widget('arboretum.tree_node_placeholder', {
	options: {
		id: false,
		state: false
	},
	_create: function() {
		var state = this.option('state');
		state.registerNode(this.option('id'), this);
	},
	_destroy: function() {
		var state = this.option('state');
		state.unregisterNode(this.option('id'), this);
	},
});
