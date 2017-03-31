$.widget('arboretum.chat', {
	options: {
		socket: false
	},
	_create: function() {
		this._addListeners();
		this.messages = $('<ul />').appendTo(this.element).css({
			'max-height': '400px',
			'overflow-y': 'auto'
		});
		this.chat_form = $('<form />').appendTo(this.element);
		this.text_input = $("<textarea />").appendTo(this.chat_form).css({
			width: '100%',
			padding: '3px',
			'box-resize': 'border-box',
			'resize-x': 'none'
		}).attr({
			placeholder: 'Say something'
		});

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
		this.$_onConnected = _.bind(this._onConnected, this);

		socket.on('chat-connected', this.$_onConnected);
		socket.on('chat-new-message', this.$_onNewMessage);
		socket.on('chat-title-changed', this.$_onTitleChanged);
		socket.on('chat-var-changed', this.$_onVarChanged);

		socket.emit('chat-client-ready');
	},
	_removeListeners: function() {
		socket.off('chat-connected', this.$_onConnected);
		socket.off('chat-new-message', this.$_onNewMessage);
		socket.off('chat-title-changed', this.$_onTitleChanged);
		socket.off('chat-var-changed', this.$_onVarChanged);
	},

	_onConnected: function(event) {
		var messages = event.messages,
			participants = event.participants,
			title = event.title;

		messages.forEach($.proxy(function(m) {
			this._appendNewMessage(m.message, m.sender);
		}, this));
	},

	_appendNewMessage: function(message, sender) {
        const container = this.messages;
        var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
		$('<li />').appendTo(this.messages).chatLine({
			message: message,
			sender: sender
		});
        if (at_bottom) {
            container.scrollTop(container.prop('scrollHeight'));
        }
	},

	_onNewMessage: function(event) {
		this._appendNewMessage(event.message, event.sender);
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
		sender: {handle: ''},
		message: ''
	},
	_create: function() {
		var sender = this.option('sender');
		if(sender) {
	        if(sender.avatar) {
	            this.avatarElement = $('<span />', {
	                html: sender.avatar
	            }).appendTo(this.element);
	        }
			this.senderElement = $('<span />', {text: sender.handle+': '}).appendTo(this.element);
		}
		this.messageElement = $('<span />', {text: this.option('message')}).css({
			color: 'white'
		}).appendTo(this.element);
	},
	_destroy: function() {
	}
});

