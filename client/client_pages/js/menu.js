$.widget('arboretum.menu', {
	options: {
		state: false,
		background: 'rgb(0, 55, 118)',
		radius: '3px',
		socket: false
	},
	_create: function() {
		this.container = $('<div />').css({
			right: '5px',
			top: '5px',
			position: 'fixed',
		}).appendTo(this.element);

		this.menu_element = $('<img />', {
			src: 'images/icon.png'
		}).css({
			float: 'right',
			height: '25px',
			cursor: 'pointer',
			padding: '3px',
			opacity: 0.3
		}).appendTo(this.container)
		.on('mouseover', $.proxy(this._onMenuMouseover, this))
		.on('mouseout', $.proxy(this._onMenuMouseout, this))
		.on('click', $.proxy(this._onMenuClick, this));

		this._menu = $('<div />', {
		}).css({
			'background-color': this.option('background'),
			'border-radius': this.option('radius'),
			'font-size': '8pt'
		}).appendTo(this.container);

		this._addressRow = $('<div />', {
		}).css({
			'width': '170px'
		}).appendTo(this._menu);

		this._addressBar = $('<input />', {
		}).css({
			'background-color': 'rgb(58, 142, 237)',
			'border': '1px solid #333',
			'color': 'white',
			'margin': '5px',
			'width': '130px'
		}).appendTo(this._addressRow)
		.on('keydown', $.proxy(this._onKeypress, this))
		;

		this._tabsRow = $('<div />', {
		}).css({
		}).appendTo(this._menu);

		this._addTabRow = $('<a />', {
			text: '+ Tab',
			href: 'javascript:void(0)'
		}).css({
			display: 'block',
			color: 'white',
			'text-decoration': 'none',
			'padding-left': '5px',
			'padding-right': '5px',
			'padding-top': '3px',
			'padding-bottom': '3px'
		}).appendTo(this._menu)
		.on('click', $.proxy(this._addTab, this));

		this._isExpanded(false);
		this._updateTabs();
		this._addTabListeners();
	},
	_addTabListeners: function() {
		var socket = this.option('socket');
		this.element.on('addTab', function(event) {
			socket.emit('addTab');
		}).on('closeTab', function(event) {
			socket.emit('closeTab', {
				tabId: event.tabId
			});
		}).on('focusTab', function(event) {
			socket.emit('focusTab', {
				tabId: event.tabId
			});
		}).on('openURL', function(event) {
			socket.emit('openURL', {
				url: event.url
			});
		})
	},
	_updateOpacity: function() {
		this.menu_element.css({
			opacity: this._isExpanded() ? 1 : (this._isHovering() ? 0.5 : 0.3),
			'background-color': this._isExpanded() ? this.option('background') : '',
			'border-top-left-radius': this.option('radius'),
			'border-top-right-radius': this.option('radius')
		});
	},
	_isHovering: function(val) {
		if(val === undefined) {
			return this._hovering;
		} else {
			this._hovering = val;
			this._updateOpacity();
		}
	},
	_onKeypress: function(event) {
		var keyCode = event.keyCode;
		if(keyCode === 27) { // esc
			this._collapse();
		} else if(keyCode === 13) { // enter
			this._goToURL(this._addressBar.val());
		}
	},
	_goToURL: function(url) {
		var event = jQuery.Event('openURL');
		event.url = url;
		this.element.trigger(event);
	},
	_addTab: function() {
		var event = jQuery.Event('addTab');
		this.element.trigger(event);
	},
	_updateTabs: function() {
		var tabs = [{
			title: 'tab 1',
			url: 'http://tab1',
			active: false,
			id: '1'
		}, {
			title: 'tab 2',
			url: 'http://tab2',
			active: true,
			id: '2'
		}, {
			title: 'tab 3',
			url: 'http://tab3',
			active: false,
			id: '3'
		}, {
			title: 'tab 4',
			url: 'http://tab4',
			active: false,
			id: '4'
		}];
		this._tabsRow.children().remove();
		_.each(tabs, function(tab) {
			var child = $('<div />').appendTo(this._tabsRow)
									.tab(tab)
									;
		}, this);
	},
	_onMenuMouseover: function() {
		this._isHovering(true);
	},
	_onMenuMouseout: function() {
		this._isHovering(false);
	},
	_onMenuClick: function() {
		if(this._isExpanded()) {
			this._collapse();
		} else {
			this._expand();
		}
	},
	_updateMenu: function() {
		if(this._isExpanded()) {
			this._menu.show();
			this._addressBar.select().focus();
		} else {
			this._menu.hide();
		}
	},
	_isExpanded: function(val) {
		if(val === undefined) {
			return this._expanded;
		} else {
			this._expanded = val;
			this._updateOpacity();
			this._updateMenu();
		}
	},
	_expand: function() {
		this._isExpanded(true);
	},
	_collapse: function() {
		this._isExpanded(false);
	},
	_destroy: function() {
	}
});

$.widget('arboretum.tab', {
	options: {
		title: 'tab title'
	},
	_create: function() {
		this.element.css({
			position: 'relative',
			'background-color': this.option('active') ? 'rgb(58, 142, 237)' : '',
			'border-bottom': '1px solid #444',
			'padding-top': '2px',
			'padding-bottom': '2px',
			'padding-left': '5px',
			'padding-right': '5px',
		});

		this._closeButton = $('<div />', {
			text: 'x'
		}).css({
			color: 'red',
			cursor: 'pointer',
			position: 'absolute',
			right: '5px'
		}).appendTo(this.element)
		.on('click', $.proxy(this._close, this));

		this._title = $('<div />', {
			text: this.option('title')
		}).css({
			'color': this.option('active') ? 'rgb(0, 55, 118)' : 'rgb(104, 188, 54)',
			'max-width': '150px',
			'overflow': 'hidden',
			'margin-right': '10px',
			cursor: 'pointer'
		}).appendTo(this.element)
		.on('click', $.proxy(this._focus, this));
	},
	_focus: function() {
		var event = jQuery.Event('focusTab');
		event.tabId = this.option('id');
		this.element.trigger(event);
	},
	_close: function() {
		var event = jQuery.Event('closeTab');
		event.tabId = this.option('id');
		this.element.trigger(event);
	},
	_destroy: function() {
	}
});