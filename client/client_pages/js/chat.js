$.widget('arboretum.chat', {
	options: {
		socket: false
	},
	_create: function() {
		this._addListeners();
		this.messages = $('<ul />').appendTo(this.element);
		this.chat_form = $('<form />').appendTo(this.element);
		this.text_input = $("<textarea />").appendTo(this.chat_form);

		this.text_input.on('keydown', $.proxy(function(event) {
            if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)) {
				this.chat_form.submit();
                event.preventDefault();
            }
		}, this));

        this.chat_form.on('submit', $.proxy(function(event) {
            this.sendCurrentTextMessage();
            event.preventDefault();
        }, this));
	},
	sendCurrentTextMessage: function() {
        var message = this.text_input.val();
        this.text_input.val('');
        if (message) {
			var socket = this.option('socket');
			socket.emit('chat-line', {
				message: message
			});
        }
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
		$('<li />').appendTo(this.messages).chatLine({
			message: event.message
		})
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
		this.senderElement = $('<span />', {text: this.option('sender')}).appendTo(this.element);
		this.messageElement = $('<span />', {text: this.option('message')}).css({
			color: 'white'
		}).appendTo(this.element);
	},
	_destroy: function() {
	}
});

