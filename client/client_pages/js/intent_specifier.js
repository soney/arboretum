$.widget('arboretum.intent_specifier', {
	options: {
        socket: false,
        state: false,
        intent: false
	},
	_create: function() {
        this.container = $('<div />').appendTo(this.element).css({
			'text-align': 'center'
		});

        this.disp = $('<span />').appendTo(this.container);
		this.label = $('<span />').text('I want to ').appendTo(this.container).css({
			'font-family': 'Helvetica Neue',
			'font-weight': '100',
			'font-size': '2em'
		});
        this.inp = $('<input />').attr({
            placeholder: 'task description'
        }).appendTo(this.container).on('keydown.checkEnter', _.bind(function(event) {
            if(event.keyCode === 13) {
                var taskName = this.inp.val();
                var socket = this.option('socket');
                this.option('intent', taskName);

                socket.emit('setTaskDescription', taskName);
                this.inp.off('keydown.checkEnter');

                this._updateInputVisibility();
            }
        }, this)).css({
			'font-family': 'Helvetica Neue',
			'font-size': '2em',
			'font-weight': '200'
		});
		this.doneButton = $('<button />')	.text('Done')
											.appendTo(this.container)
											.on('click', _.bind(function() {
												var socket = this.option('socket');
												socket.emit('markAsDone');
											}, this));
        this._updateInputVisibility();
		var socket = this.option('socket');
		socket.on('taskScript', function(script) {
			console.log(script);
		});
	},
	_destroy: function() {
	},
    _updateInputVisibility: function() {
        if(this.option('intent')) {
            this.disp.text(this.option('intent')).show();
            this.inp.hide();
			this.label.hide();
			this.doneButton.show();
        } else {
            this.inp.show().focus().select();
            this.disp.hide();
			this.label.show();
			this.doneButton.hide();
        }
    }
});