$.widget('arboretum.chat', {
	options: {
		socket: false
	},
	_create: function() {
		this._addListeners();
		this.title = $('<div/>').text('Chat').css({
			'word-wrap': 'break-word',
			'white-space': 'pre-line',
			'max-width': '250px',
			'color': 'white',
			'font-family': 'sans-serif',
			'padding': '3px',
			'font-weight': 'bold'
		}).appendTo(this.element);
		this.participants = $('<div />').appendTo(this.element).css({
			'border-bottom': '1px solid rgba(0,0,0,0.2)',
		});
		this.messages = $('<div />').appendTo(this.element).css({
			'max-height': '300px',
			'overflow-y': 'auto'
		});
		this.chat_form = $('<form />').appendTo(this.element);
		this.text_input = $("<textarea />").appendTo(this.chat_form).css({
			width: '100%',
			padding: '3px',
			'box-sizing': 'border-box',
			'resize': 'vertical',
			'font-family': 'sans-serif',
			'background-color': '#333333',
			'color': '#e4e1df',
			'margin-top': '5px',
			'border': 'none'
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
		this.$_onParticipantsChanged = _.bind(this._onParticipantsChanged, this);

		socket.on('chat-connected', this.$_onConnected);
		socket.on('chat-new-message', this.$_onNewMessage);
		socket.on('chat-title-changed', this.$_onTitleChanged);
		socket.on('chat-var-changed', this.$_onVarChanged);
		socket.on('chat-participants-changed', this.$_onParticipantsChanged);

		socket.emit('chat-client-ready');
	},
	_removeListeners: function() {
		socket.off('chat-connected', this.$_onConnected);
		socket.off('chat-new-message', this.$_onNewMessage);
		socket.off('chat-title-changed', this.$_onTitleChanged);
		socket.off('chat-var-changed', this.$_onVarChanged);
		socket.off('chat-participants-changed', this.$_onParticipantsChanged);
	},

	_onParticipantsChanged: function(event) {
		this._setParticipants(event.participants);
	},

	_onConnected: function(event) {
		var messages = event.messages,
			participants = event.participants,
			title = event.title;

		this._setTitle(title);
		this._setParticipants(participants);
		this.messages.children().remove();
		messages.forEach($.proxy(function(m) {
			this._appendNewMessage(m.message, m.sender);
		}, this));
	},

	_setParticipants: function(participants) {
		var participantElements = _.map(participants, function(p) {
			return $('<span />').participant({
				participant: p
			});
		})
		this.participants.children().remove();
		this.participants.append.apply(this.participants, participantElements);
	},

	_appendNewMessage: function(message, sender) {
        const container = this.messages;
        var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
		$('<div />').appendTo(this.messages).chatLine({
			message: message,
			sender: sender
		}).css({
			'font-family': '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
			'word-wrap': 'break-word',
			'white-space': 'pre-line',
			'max-width': '300px'
		});
        if (at_bottom) {
            container.scrollTop(container.prop('scrollHeight'));
        }
	},

	_onNewMessage: function(event) {
		var menu_icon = $('#arboretum_menu_icon', this.element.parents());
		if(menu_icon.hasClass('arboretum_menu_hidden')) {
			var senderText = event.sender ? event.sender.handle + ': ' : '';
			// menu_icon.notify(senderText + event.message);
		}
		this._appendNewMessage(event.message, event.sender);
	},
	_setTitle: function(title) {
		this.title.text(title || 'Chat');
	},

	_onTitleChanged: function(event) {
		this._setTitle(event.value);
	},

	_onVarChanged: function(event) {
		// console.log(event);
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
	            }).css({
					'padding-left': '3px',
					'padding-right': '3px'
				}).appendTo(this.element);
	        }
			this.senderElement = $('<span />', {text: sender.handle+': '}).css({
				color: '#cfc096'
			}).appendTo(this.element);
		}
		this.messageElement = $('<span />', {html: this.mdify(this.option('message'))}).css({
			color: '#e5e5e5'
		}).appendTo(this.element);
	},
	_destroy: function() {
	},
    mdify: function(message) {
        //  var tmp = document.createElement("DIV");
        //  tmp.innerHTML = message;
        //  var rv = tmp.textContent || tmp.innerText || "";
        var rv = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return rv.replace(/\*\*([^*]+)\*\*/g, "<b>$1<\/b>").replace(/\*([^*]+)\*/g, "<i>$1<\/i>");
    }
});

$.widget('arboretum.participant', {
	options: {
		participant: {handle: ''}
	},
	_create: function() {
		var participant = this.option('participant');
		this.element.html(participant.avatar);
		this.element.css({
			'padding-left': '2px',
			'padding-right': '2px',
			'cursor': 'default'
		});
		this.element.attr('title', participant.handle);
	},
	_destroy: function() {
	}
});