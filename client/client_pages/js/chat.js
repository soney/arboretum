$.widget('arboretum.chat', {
	options: {
		socket: false
	},
	_create: function() {
		console.log('hello');
		this._addListeners();
	},
	_addListeners: function() {
		var socket = this.option('socket');
		this.$_onNewMessage = _.bind(this._onNewMessage, this);
		this.$_onTitleChanged = _.bind(this._onTitleChanged, this);
		this.$_onVarChanged = _.bind(this._onVarChanged, this);

		socket.on('chat-new-message', this.$_onNewMessage);
		socket.on('chat-title-changed', this.$_onTitleChanged);
		socket.on('chat-var-changed', this.$_onVarChanged);
	},
	_removeListeners: function() {
		socket.off('chat-new-message', this.$_onNewMessage);
		socket.off('chat-title-changed', this.$_onTitleChanged);
		socket.off('chat-var-changed', this.$_onVarChanged);
	},

	_onNewMessage: function(event) {
		var message = event.message;
		$('<span />', {text: message}).appendTo(this.element);
	},
	_onTitleChanged: function(event) {
		console.log(event);
	},
	_onVarChanged: function(event) {
		console.log(event);
	},

	_destroy: function() {
		this._removeListeners();
	}
});

$.widget('arboretum.chatLine', {
	options: {
		sender: false,
		message: ''
	},
	_create: function() {
		console.log('hello');
		this._addListeners();
	},
	_addListeners: function() {
		var socket = this.option('socket');
		this.$_onNewMessage = _.bind(this._onNewMessage, this);
		this.$_onTitleChanged = _.bind(this._onTitleChanged, this);
		this.$_onVarChanged = _.bind(this._onVarChanged, this);

		socket.on('chat-new-message', this.$_onNewMessage);
		socket.on('chat-title-changed', this.$_onTitleChanged);
		socket.on('chat-var-changed', this.$_onVarChanged);
	},
	_removeListeners: function() {
		socket.off('chat-new-message', this.$_onNewMessage);
		socket.off('chat-title-changed', this.$_onTitleChanged);
		socket.off('chat-var-changed', this.$_onVarChanged);
	},

	_onNewMessage: function(event) {
		var message = event.message;
		$('<span />', {text: message}).appendTo(this.element);
	},
	_onTitleChanged: function(event) {
		console.log(event);
	},
	_onVarChanged: function(event) {
		console.log(event);
	},

	_destroy: function() {
		this._removeListeners();
	}
});
