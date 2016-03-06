$.widget('arboretum.menu', {
	options: {
		state: false,
	},
	_create: function() {
		this.menu_element = $('<img />', {
			src: 'images/icon.png'
		}).css({
			height: '30px',
			right: '5px',
			top: '5px',
			position: 'fixed',
			cursor: 'pointer',
			opacity: 0.3
		}).appendTo(this.element)
		.on('mouseover', $.proxy(this._onMenuMouseover, this))
		.on('mouseout', $.proxy(this._onMenuMouseout, this))
		.on('click', $.proxy(this._onMenuClick, this));

		this._expanded = false;
	},
	_updateOpacity: function() {
		this.menu_element.css({
			opacity: this._isExpanded() ? 1 : (this._isHovering() ? 0.5 : 0.3)
		});
	},
	_onMenuMouseover: function() {
		this._hovering = true;
		this._updateOpacity();
	},
	_onMenuMouseout: function() {
		this._hovering = false;
		this._updateOpacity();
	},
	_onMenuClick: function() {
		if(this._isExpanded()) {
			this._collapse();
		} else {
			this._expand();
		}
		this._updateOpacity();
	},
	_isExpanded: function() {
		return this._expanded;
	},
	_expand: function() {
		this._expanded = true;
	},
	_collapse: function() {
		this._expanded = false;
	},
	_destroy: function() {
	}
});