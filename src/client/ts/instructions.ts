import * as $ from 'jquery';
$.widget('arboretum.instructions', {
	options: {
		socket: false
	},
	_create: function() {
		this.element.css({
			color: 'white',
			position: 'relative',
			'font-family': 'sans-serif',
			'margin-top': '10px'
		});
		this.closeButton = $('<span />').css({
			position: 'absolute',
			right: '0px',
			top: '0px',
			cursor: 'pointer',
			color: '#999'
		}).text('(close instructions)').appendTo(this.element).on('click', _.bind(function() {
			this.element.remove();
		}, this));

		this.title = $('<div />').css({
			'font-size': '1.0em',
			'font-weight': 'bold'
		}).text('INSTRUCTIONS').appendTo(this.element);

		this.instructionsText = $('<div />').appendTo(this.element).text('The title of the chat window contains the task we want you to perform. To send a page element BACK to the user, hold CTRL and drag to select the page element you want to send back. If you need any clarification, feel free to say something in this chat window.').css({
			'word-break': 'break-word',
			'white-space': 'pre-wrap'
		});
		setTimeout(_.bind(function() {
			this.instructionsText.effect({
						effect: 'highlight',
						duration: 700,
					});
		}, this), 2000);
		this.goalText = $('<div />').appendTo(this.element).text('');

	},
	_destroy: function() {
	}
});
