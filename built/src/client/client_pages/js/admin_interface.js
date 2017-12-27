$.widget('arboretum.admin_interface', {
    options: {
        socket: false,
        state: false,
        intent: false
    },
    _create: function () {
        this.buttonContainer = $('<div />').appendTo(this.element);
        this.offButton = $('<button />').text('Disable server');
        this.chatContainer = $('<div />').appendTo(this.element).css({
            'height': '100%'
        });
        this.chatContainer.chat({
            socket: this.option('socket'),
            inputStyle: {
                'color': '#333',
                'background-color': 'white',
                'border': '1px solid #AAA',
                'font-size': 'inherit'
            },
            chatLineContentStyle: {
                'color': '#333'
            },
            chatLineSenderStyle: {
                'color': 'navy',
                'font-weight': 'bold'
            }
        });
        this.element.css({
            'height': '100%'
        });
        // 'display': 'flex',
        // 'flex-direction': 'column',
        // this.disp = $('<span />').appendTo(this.container);
        // this.label = $('<span />').text('I want to ').appendTo(this.container).css({
        // 	'font-family': 'Helvetica Neue',
        // 	'font-weight': '100',
        // 	'font-size': '2em',
        // 	'margin': '15px'
        // });
        // this.inp = $('<input />').attr({
        //     placeholder: 'task description'
        // }).appendTo(this.container).on('keydown.checkEnter', _.bind(function(event) {
        //     if(event.keyCode === 13) {
        //         var taskName = this.inp.val();
        //         var socket = this.option('socket');
        //         this.option('intent', taskName);
        //
        //         socket.emit('setTaskDescription', taskName);
        //         this.inp.off('keydown.checkEnter');
        //
        //         this._updateInputVisibility();
        //     }
        // }, this)).css({
        // 	'font-family': 'Helvetica Neue',
        // 	'font-size': '2em',
        // 	'font-weight': '200',
        // 	'margin': '15px'
        // });
        // this.doneButton = $('<button />')	.text('Done')
        // 									.appendTo(this.container)
        // 									.on('click', _.bind(function() {
        // 										var socket = this.option('socket');
        // 										socket.emit('markAsDone');
        // 									}, this));
        // this._updateInputVisibility();
        // var socket = this.option('socket');
        // socket.on('taskScript', _.bind(function(script) {
        // 	$('.arborscript').remove();
        // 	var scriptContainer = $('<div />').appendTo(this.container)
        // 										.addClass('arborscript')
        // 										.text(script)
        // 										.css({
        // 											width: '800px',
        // 											height: '500px',
        // 											border: '1px solid #EEE'
        // 										});
        //
        // 	getScript('bower_components/ace/build/src-min/ace.js').then(function() {
        // 		return getScript('bower_components/ace/build/src-min/theme-clouds.js');
        // 	}).then(function() {
        // 		return getScript('bower_components/ace/build/src-min/mode-javascript.js');
        // 	}).then(_.bind(function() {
        // 		var JavaScriptMode = ace.require("ace/mode/javascript").Mode;
        // 		var editor = ace.edit(scriptContainer[0]);
        //
        // 		editor.setTheme('ace/theme/clouds');
        // 		editor.session.setMode(new JavaScriptMode());
        // 	}, this)).catch(function(err) {
        // 		console.error(err);
        // 	});
        //
        // }, this));
    },
    _destroy: function () {
    },
    _updateInputVisibility: function () {
        if (this.option('intent')) {
            this.container.css({
                'text-align': 'left'
            });
            this.disp.text(this.option('intent')).show();
            this.inp.hide();
            this.label.hide();
            this.doneButton.show();
        }
        else {
            this.container.css({
                'text-align': 'left'
            });
            this.inp.show().focus().select();
            this.disp.hide();
            this.label.show();
            this.doneButton.hide();
        }
    }
});
function getScript(src) {
    return new Promise(function (resolve, reject) {
        $.getScript(src, function () {
            resolve();
        });
        setTimeout(resolve, 1000);
    });
}
