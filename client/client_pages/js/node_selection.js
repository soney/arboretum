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
			//'pointer-events': 'none'
		}).hide().appendTo(this.element);

		this._addDeviceListeners();
	},
	_destroy: function() {
		this._removeDeviceListeners();
		this._selectionRectangle.remove();
	},
	_onContextMenu: function(event) {
		event.preventDefault();
		//this._showContextMenu(event);
		this._replyNodes([event.target]);
	},
	_replyNodes: function(nodes) {
		$(nodes).not(this._selectionRectangle)
				.not('.arboretum_highlighted')
				.addClass('arboretum_highlighted')
				.effect({
					effect: 'highlight',
					duration: 700,
				});
		var nodeElements = $(nodes).map(function() {
			return $(this).data('arboretum-id');
		});
		var idArray = _.chain(nodeElements)
						.toArray()
						.compact()
						.value();
		if(idArray.length > 0) {
			var socket = this.option('socket');
			socket.emit('nodeReply', {
				nodeIds: idArray
			});
		}
	},
	_onMouseDown: function(event) {
		if(event.button === 2) {
			this._anchor = this._getCoordinates(event);
			this._selectionRectangle.show();
			this._updateSelectionRectangle(this._anchor, this._getCoordinates(event));
		}
		$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
									.css('border', '');
	},
	_updateSelectionRectangle: function(anchor, coordinates) {
		var width = Math.abs(anchor.x - coordinates.x) + 4,
			height = Math.abs(anchor.y - coordinates.y) + 4;

		var rect = {
			width: width,
			height: height,
			left: Math.min(coordinates.x, anchor.x)-2,
			top: Math.min(coordinates.y, anchor.y)-2,
		};

		rect.bottom = rect.top + rect.height;
		rect.right = rect.left + rect.width;

		this._selectionRectangle.css({
			width: rect.width + 'px',
			height: rect.height + 'px',
			left: rect.left+'px',
			top: rect.top+'px'
		});
		return rect;
	},
	_onMouseMove: function(event) {
		if(this._anchor) {
			this._updateSelectionRectangle(this._anchor, this._getCoordinates(event));
		}
	},
	_onMouseUp: function(event) {
		if(event.button === 2 && this._anchor) {
			var rect = this._updateSelectionRectangle(this._anchor, this._getCoordinates(event));
			this._anchor = false;
			this._selectionRectangle.hide();
			$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
										.css('border', '');

			var highlightedElements = getHighlightedElements(rect);
			this._replyNodes(highlightedElements);
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

		$(document.documentElement) .on('mousedown', this.$_onMouseDown)
									.on('mousemove', this.$_onMouseMove)
									.on('mouseup', this.$_onMouseUp)
									.on('contextmenu', this.$_onContextMenu);
	},
	_removeDeviceListeners: function() {
		$(document.documentElement) .off('mousedown', this.$_onMouseDown)
									.off('mousemove', this.$_onMouseMove)
									.off('mouseup', this.$_onMouseUp)
									.off('contextmenu', this.$_onContextMenu);
	}
});

function getHighlightedElements(rect) {
	var result = [];
	recurseGetHighlightedElements(rect, [document.documentElement], [document.documentElement], result);
	return _.unique(result);
}

function recurseGetHighlightedElements(rect, children, lineage, result) {
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
					//result.push.apply(result, lineage);
				} else {
					lineage.push(child);
					recurseGetHighlightedElements(rect, child.childNodes, lineage, result);
					lineage.pop();
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