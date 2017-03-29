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
			'z-index': 999999999
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
			'width': '175px'
		}).appendTo(this._menu);

		this._addressBar = $('<input />', {
		}).css({
			'background-color': 'rgb(58, 142, 237)',
			'border': '1px solid #333',
			'color': 'white',
			'margin': '5px',
			'width': '130px',
			'font-size': 'inherit'
		}).appendTo(this._addressRow)
		.on('keydown', $.proxy(this._onKeypress, this))
		.on('focus', $.proxy(this._onAddressBarFocus, this))
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

		this._chatRow = $('<div />', { }).appendTo(this._menu).chat({
			socket: this.option('socket')
		});

		this._isExpanded(false);
		this._addTabListeners();
		this._addSocketListeners();
	},
	_addSocketListeners: function() {
		var socket = this.option('socket');
		socket.on('currentTabs', $.proxy(function(summarizedTabs) {
			this._tabs = summarizedTabs;
			if(this._isExpanded) {
				this._updateTabs(this._tabs);
			}
		}, this));
		socket.emit('getCurrentTabs');
	},
	_addTabListeners: function() {
		var socket = this.option('socket');
		this.element.on('addTab.arb', function(event) {
			socket.emit('addTab');
		}).on('closeTab.arb', function(event) {
			socket.emit('closeTab', {
				tabId: event.tabId
			});
		}).on('focusTab.arb', _.bind(function(event) {
			socket.emit('focusTab', {
				tabId: event.tabId
			}, this.option('state').option());
		}, this)).on('openURL.arb', function(event) {
			socket.emit('openURL', {
				url: event.url
			});
		})
	},
	_removeTabListeners: function() {
		this.element.off('addTab.arb')
					.off('closeTab.arb')
					.off('focusTab.arb')
					.off('openURL.arb');
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
	_onAddressBarFocus: function(event) {
		this._addressBar.select();
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
	_updateTabs: function(tabs) {
		this._tabsRow.children().remove();
		_.each(tabs, function(tab) {
			var child = $('<div />').appendTo(this._tabsRow)
									.tab(tab);
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
		this._updateTabs(this._tabs);
		_.each(this._tabs, function(tab) {
			if(tab.active) {
				this._addressBar.val(tab.url);
			}
		}, this);
		this._isExpanded(true);
	},
	_collapse: function() {
		this._isExpanded(false);
	},
	_destroy: function() {
		this._removeTabListeners();
		if(this._chatRow.data('chat')) {
			this._chatRow.chat('destroy');
		}
	}
});

$.widget('arboretum.tab', {
	options: {
	},
	_create: function() {
		this.element.css({
			position: 'relative',
			'background-color': this.option('active') ? 'rgb(58, 142, 237)' : '',
			'border-bottom': '1px solid #444',
			'padding-top': '2px',
			'padding-bottom': '2px',
			'padding-left': '5px',
			'padding-right': '5px'
		}).attr({
			title: this.option('url')
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
			'max-height': '15px',
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