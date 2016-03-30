$.widget('arboretum.node_selection', {
	options: {
		socket: false,
		background: 'rgba(0, 55, 118, 0.4)',
		border: '1px solid rgba(0, 55, 118, 1)'
	},
	_create: function() {
		this._selectionRectangle = $('<span />').css({
			'background-color': this.option('background'),
			border: this.option('border'),
			position: 'absolute',
			'z-index': 9999,
			'pointer-events': 'none'
		}).hide().appendTo(this.element);

		this._addDeviceListeners();
	},
	_destroy: function() {
		this._removeDeviceListeners();
	},
	_onContextMenu: function(event) {
		event.preventDefault();
		this._showContextMenu(event);
	},
	_onMouseDown: function(event) {
		if(event.button === 2) {
			this._anchor = this._getCoordinates(event);

			this._selectionRectangle.css({
				left: this._anchor.x+'px',
				top: this._anchor.y+'px',
				width: '0px',
				height: '0px'
			}).show();
		}
		$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
									.css('border', '');
	},
	_onMouseMove: function(event) {
		if(this._anchor) {
			var coordinates = this._getCoordinates(event),
				width = Math.abs(this._anchor.x - coordinates.x),
				height = Math.abs(this._anchor.y - coordinates.y);

			var rect = {
				width: width,
				height: height,
				left: Math.min(coordinates.x, this._anchor.x),
				top: Math.min(coordinates.y, this._anchor.y),
			};
			rect.bottom = rect.top + rect.height;
			rect.right = rect.left + rect.width;

			this._selectionRectangle.css({
				width: rect.width + 'px',
				height: rect.height + 'px',
				left: rect.left+'px',
				top: rect.top+'px'
			});
		}
	},
	_onMouseUp: function(event) {
		if(event.button === 2) {
			var coordinates = this._getCoordinates(event),
				width = Math.abs(this._anchor.x - coordinates.x),
				height = Math.abs(this._anchor.y - coordinates.y);

			var rect = {
				width: width,
				height: height,
				left: Math.min(coordinates.x, this._anchor.x),
				top: Math.min(coordinates.y, this._anchor.y),
			};
			rect.bottom = rect.top + rect.height;
			rect.right = rect.left + rect.width;

			this._anchor = false;
			this._selectionRectangle.hide();
			$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
										.css('border', '');

			var highlightedElements = getHighlightedElements(rect);
			if(highlightedElements.length > 0) {
				$(highlightedElements)	.not(this._selectionRectangle)
										.not('.arboretum_highlighted')
										.addClass('arboretum_highlighted')
										.effect({
											effect: 'highlight',
											duration: 5000,
											times: 300
										});
				var nodeElements = $(highlightedElements).filter(function() {
					return $(this).data('arboretum-tree_node');
				}).map(function() {
					return $(this).tree_node('option', 'id');
				});
				if(nodeElements.length > 0) {
					var idArray = _.toArray(nodeElements);
					var socket = this.option('socket');
					socket.emit('nodeReply', {
						nodeIds: idArray
					});
				}
				console.log(nodeElements);
			}
		}
	},
	_getCoordinates: function(event) {
		var x, y;
		if(event.pageX || event.pageY) {
			x = event.pageX;
			y = event.pageY;
		} else if(event.clientX || event.clientY) {
			x = event.clientX + document.body.scrollLeft +
					docuemnt.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop +
					document.documentElement.scrollTop;
		}
		return { x: x, y: y };
	},
	_showContextMenu: function(event) {
		this.nav = $('<nav />').appendTo(document.body);
		var items = [{
				text: 'Request Intermediate Input',
				callback: function() {
					console.log('send back to client');
				}
			}, {
				text: 'client',
				callback: function() {
					console.log('send back to client');
				}
			}];

	},
	_hideContextMenu: function() {

	},
	_addDeviceListeners: function() {
		this.$_onContextMenu = $.proxy(this._onContextMenu, this);
		this.$_onMouseDown = $.proxy(this._onMouseDown, this);
		this.$_onMouseMove = $.proxy(this._onMouseMove, this);
		this.$_onMouseUp = $.proxy(this._onMouseUp, this);

		this.element.on('mousedown', this.$_onMouseDown);
		this.element.on('mousemove', this.$_onMouseMove);
		this.element.on('mouseup', this.$_onMouseUp);
		this.element.on('contextmenu', this.$_onContextMenu);
	},
	_removeDeviceListeners: function() {
		this.element.off('mousedown', this.$_onMouseDown);
		this.element.off('mousemove', this.$_onMouseMove);
		this.element.off('mouseup', this.$_onMouseUp);
		this.element.off('contextmenu', this.$_onContextMenu);
	}
});

function getHighlightedElements(rect) {
	var result = [];
	recurseGetHighlightedElements(rect, [document.documentElement], result);
	return result;
	/*

			$('*').filter(function() {
				var boundingRect = this.getBoundingClientRect();
				boundingRect.left += boundingRect.width/3;
				boundingRect.right -= boundingRect.width/3;
				boundingRect.top += boundingRect.height/3;
				boundingRect.bottom -= boundingRect.height/3;
				return inside(boundingRect, rect);
			});
			*/
}

function recurseGetHighlightedElements(rect, children, result) {
	var length = children.length,
		i = 0,
		child,
		boundingRect,
		smallerRect;

	while(i < length) {
		child = children[i];
		if(child.nodeType === Node.ELEMENT_NODE) {
			boundingRect = child.getBoundingClientRect();

			if(true || collide(rect, boundingRect)) {
				smallerRect = {
					left: boundingRect.left + boundingRect.width/4,
					right: boundingRect.right - boundingRect.width/4,
					top: boundingRect.top + boundingRect.height/4,
					bottom: boundingRect.bottom - boundingRect.height/4,
				};
				if(inside(smallerRect, rect)) {
					result.push(child);
				} else {
					recurseGetHighlightedElements(rect, child.childNodes, result);
				}
			}
		}

		i++;
	}
}

function collide(rect1, rect2) {
	return !(
		rect1.top > rect2.bottom ||
		rect1.right < rect2.left ||
		rect1.bottom < rect2.top ||
		rect1.left > rect2.right
	);
}

function inside(rect1, rect2) {
	return (
		((rect2.top <= rect1.top) && (rect1.top <= rect2.bottom)) &&
		((rect2.top <= rect1.bottom) && (rect1.bottom <= rect2.bottom)) &&
		((rect2.left <= rect1.left) && (rect1.left <= rect2.right)) &&
		((rect2.left <= rect1.right) && (rect1.right <= rect2.right))
	);
}