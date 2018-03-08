import * as $ from 'jquery';
import * as _ from 'underscore';

export interface NodeSelectorOptions {
    background?: string,
    border?:string,
    'border-width': number
}
enum SelectionState { idle, selecting };
interface Point { x:number, y: number};
interface Rectangle { left:number, top:number, right:number, bottom:number};

export class NodeSelector {
    private anchor:Point;
    private selectionRectangle:JQuery<HTMLSpanElement>;
    private initializationEvent:MouseEvent;
    private state:SelectionState = SelectionState.idle;
    private rect:Rectangle;
    constructor(private options:NodeSelectorOptions = {
        background: 'rgba(0, 55, 118, 0.4)',
        border: '1px solid rgba(0, 55, 118, 1)',
        'border-width': 2
    }) {
        this.addEventListeners();
    };
    private addEventListeners():void {
        document.documentElement.addEventListener('mousedown',   this.onMouseDown);
        document.documentElement.addEventListener('mousemove',   this.onMouseMove);
        document.documentElement.addEventListener('mouseup',     this.onMouseUp);
        document.documentElement.addEventListener('contextmenu', this.onContextMenu);
    };
    private addSelectionRectangle():void {
        this.selectionRectangle = $('<span />').css({
            'background-color': this.options.background,
            border: this.options.border,
            position: 'absolute',
            'z-index': 9999999999
        });
        $(document.body).append(this.selectionRectangle);
    };
    private removeSelectionRectangle():void {
        this.selectionRectangle.remove();
    };
    private onMouseDown = (event:MouseEvent) => {
        if(this.state === SelectionState.idle) {
            if(event.button === 2 || event.ctrlKey) {
                this.initializationEvent = event;
                this.anchor = NodeSelector.getCoordinates(event);
                this.addSelectionRectangle();
                this.state = SelectionState.selecting;
                this.updateSelectionRectangle(this.anchor);
                event.preventDefault();
                event.stopPropagation();
            }
        }
    };
    private onMouseMove = (event:MouseEvent) => {
        if(this.state === SelectionState.selecting) {
            this.updateSelectionRectangle(NodeSelector.getCoordinates(event));
            event.preventDefault();
            event.stopPropagation();
        }
    };
    private onMouseUp = (event:MouseEvent) => {
        if(this.state === SelectionState.selecting) {
            const {button} = event;
            if((button===2 && this.initializationEvent.button ===2) || (this.initializationEvent.button === button && this.initializationEvent.ctrlKey)) {
                console.log(this.rect);
                console.log(this.getHighlightedElements());
                this.removeSelectionRectangle();
                this.state = SelectionState.idle;
                this.anchor = this.selectionRectangle = this.rect = null;
                event.preventDefault();
                event.stopPropagation();
            }
        }
    };
    private onContextMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    private updateSelectionRectangle(mouseLocation:Point):void {
        const width:number = Math.abs(this.anchor.x - mouseLocation.x);
        const height:number = Math.abs(this.anchor.y - mouseLocation.y);
        const left:number = Math.min(this.anchor.x, mouseLocation.x);
        const top:number = Math.min(this.anchor.y, mouseLocation.y);
        const right:number = left+width;
        const bottom:number = top+height;
        const borderWidth = this.options['border-width']*2;
        this.rect = {
            left, top, right, bottom
        };
        this.selectionRectangle.css({
            left:  this.rect.left+'px', width:  (this.rect.right-this.rect.left)+'px',
            top:   this.rect.top+'px',  height: (this.rect.bottom-this.rect.top)+'px'
        });
    };
    private static getCoordinates(event:MouseEvent):Point {
        if(event.pageX || event.pageY) {
            return {x:event.pageX, y:event.pageY};
        } else if(event.clientX || event.clientY) {
            return {
                x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
                y: event.clientY + document.body.scrollTop  + document.documentElement.scrollTop
            };
        }
    };
    private getHighlightedElements():Array<HTMLElement> {
        const result:Array<HTMLElement> = [];
        this.recurseGetHighlightedElements([document.documentElement], [document.documentElement], result);
        return _.unique(result);
    };
    private recurseGetHighlightedElements(children:Array<HTMLElement>, lineage:Array<HTMLElement>, result:Array<HTMLElement>):void {
        const length:number = children.length;

        for(let i=0; i<length; i++) {
            let child:HTMLElement = children[i];
            const boundingRect = child.getBoundingClientRect();
            if(NodeSelector.collide(this.rect, boundingRect)) {
                const boundingWidth:number = boundingRect.right - boundingRect.left;
                const boundingHeight:number = boundingRect.bottom - boundingRect.top;
                const factor:number = 4;
                const smallerRect:Rectangle = {
                    left:   boundingRect.left   + boundingWidth/factor,
                    right:  boundingRect.right  - boundingWidth/factor,
                    top:    boundingRect.top    + boundingHeight/factor,
                    bottom: boundingRect.bottom - boundingHeight/factor
                };
                console.log(smallerRect);
                if(NodeSelector.inside(smallerRect, this.rect)) {
                    result.push(child);
                } else {
                    lineage.push(child);
                    this.recurseGetHighlightedElements(nodeListToArray(child.childNodes), lineage, result);
                }
            }
        }
    };
    private static collide(rect1:Rectangle, rect2:Rectangle):boolean {
        return !(
            rect1.top > rect2.bottom ||
            rect1.right < rect2.left ||
            rect1.bottom < rect2.top ||
            rect1.left > rect2.right
        );
    };
    private static inside(rect1:Rectangle, rect2:Rectangle):boolean {
        return (
            ((rect2.top <= rect1.top) && (rect1.top <= rect2.bottom)) &&
            ((rect2.top <= rect1.bottom) && (rect1.bottom <= rect2.bottom)) &&
            ((rect2.left <= rect1.left) && (rect1.left <= rect2.right)) &&
            ((rect2.left <= rect1.right) && (rect1.right <= rect2.right))
        );
    };
};
function nodeListToArray(nodeList:NodeList):Array<HTMLElement> {
    const array:Array<HTMLElement> = [];
    for(let i=0; i<nodeList.length; i++) {
        const itemI:Node = nodeList.item(i);
        if(itemI.nodeType === Node.ELEMENT_NODE) {
            array.push(itemI as HTMLElement);
        }
    }
    return array;
}
// 		$(document.documentElement) .on('mousedown', this.$_onMouseDown)
// 									.on('mousemove', this.$_onMouseMove)
// 									.on('mouseup', this.$_onMouseUp)
// 									.on('contextmenu', this.$_onContextMenu);
// $.widget('arboretum.node_selection', {
// 	options: {
// 		socket: false,
// 		background: 'rgba(0, 55, 118, 0.4)',
// 		border: '1px solid rgba(0, 55, 118, 1)'
// 	},
// 	_create: function() {
// 		this._selectionRectangle = $('<span />').css({
// 			'background-color': this.option('background'),
// 			border: this.option('border'),
// 			position: 'absolute',
// 			'z-index': 9999999999,
// 			//'pointer-events': 'none'
// 		}).hide().appendTo(this.element);
//
// 		this._addDeviceListeners();
// 	},
// 	_destroy: function() {
// 		this._removeDeviceListeners();
// 		this._selectionRectangle.remove();
// 	},
// 	_onContextMenu: function(event) {
// 		event.preventDefault();
// 		//this._showContextMenu(event);
// 		this._replyNodes([event.target]);
// 	},
// 	_replyNodes: function(nodes) {
// 		$(nodes).not('.arboretum_highlighted')
// 				.find('*')
// 				.add(nodes)
// 				.not(this._selectionRectangle)
// 				.each(function() {
// 					var jqThis = $(this);
// 					jqThis.css('background-color', 'yellow');
// 					setTimeout(function() {
// 						jqThis.css('background-color', jqThis.data('old_bg_color'));
// 					}, 500)
// 				})
// 				/*
// 				.effect({
// 					effect: 'highlight',
// 					duration: 700,
// 				});
// 				*/
// 		var nodeElements = $(nodes).map(function() {
// 			return $(this).data('arboretum-id');
// 		});
// 		var idArray = _.chain(nodeElements)
// 						.toArray()
// 						.compact()
// 						.value();
// 		if(idArray.length > 0) {
// 			var socket = this.option('socket');
// 			socket.emit('nodeReply', {
// 				nodeIds: idArray
// 			});
// 		}
// 	},
// 	_onMouseDown: function(event) {
// 		if(event.button === 2 || event.ctrlKey) {
// 			this._anchor = this._getCoordinates(event);
// 			this._selectionRectangle.show();
// 			this._updateSelectionRectangle(this._anchor, this._getCoordinates(event));
// 		}
// 		$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
// 									.each(function() {
// 										$(this).css('background-color', $(this).data('old_bg_color'));
// 									});
// 	},
// 	_updateSelectionRectangle: function(anchor, coordinates) {
// 		var width = Math.abs(anchor.x - coordinates.x) + 4,
// 			height = Math.abs(anchor.y - coordinates.y) + 4;
//
// 		var rect = {
// 			width: width,
// 			height: height,
// 			left: Math.min(coordinates.x, anchor.x)-2,
// 			top: Math.min(coordinates.y, anchor.y)-2,
// 		};
//
// 		this._selectionRectangle.css({
// 			width: rect.width + 'px',
// 			height: rect.height + 'px',
// 			left: rect.left+'px',
// 			top: rect.top+'px'
// 		});
// 		$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
// 									.each(function() {
// 										$(this).css('background-color', $(this).data('old_bg_color'));
// 									});
//
// 		var newRect = this._selectionRectangle[0].getBoundingClientRect();
// 		var nodes = $(getHighlightedElements(newRect)).not(this._selectionRectangle);
//
// 		$(nodes).not('.arboretum_highlighted')
// 				.find('*')
// 				.add(nodes)
// 				.each(function() {
// 					$(this).data('old_bg_color', $(this).css('background-color'));
// 				})
// 				.addClass('arboretum_highlighted')
// 				.css('background-color', this.option('background'));
// 		return nodes;
// 	},
// 	_onMouseMove: function(event) {
// 		if(this._anchor) {
// 			this._updateSelectionRectangle(this._anchor, this._getCoordinates(event));
// 		}
// 	},
// 	_onMouseUp: function(event) {
// 		if((event.button === 2||event.ctrlKey) && this._anchor) {
// 			var highlightedElements = this._updateSelectionRectangle(this._anchor, this._getCoordinates(event));
// 			this._anchor = false;
// 			this._selectionRectangle.hide();
// 			$('.arboretum_highlighted')	.removeClass('arboretum_highlighted')
// 										.each(function() {
// 											$(this).css('background-color', $(this).data('old_bg_color'));
// 										});
//
// 			//var highlightedElements = getHighlightedElements(rect);
// 			this._replyNodes(_.toArray(highlightedElements));
// 		}
// 	},
// 	_getCoordinates: function(event) {
// 		var x, y;
// 		if(event.pageX || event.pageY) {
// 			x = event.pageX;
// 			y = event.pageY;
// 		} else if(event.clientX || event.clientY) {
// 			x = event.clientX + document.body.scrollLeft +
// 					docuemnt.documentElement.scrollLeft;
// 			y = event.clientY + document.body.scrollTop +
// 					document.documentElement.scrollTop;
// 		}
// 		return { x: x, y: y };
// 	},
// 	_showContextMenu: function(event) {
// 		this.nav = $('<nav />').appendTo(document.body);
// 		var items = [{
// 				text: 'Request Intermediate Input',
// 				callback: function() {
// 					console.log('send back to client');
// 				}
// 			}, {
// 				text: 'client',
// 				callback: function() {
// 					console.log('send back to client');
// 				}
// 			}];
// 	},
// 	_hideContextMenu: function() {
//
// 	},
// 	_addDeviceListeners: function() {
// 		this.$_onContextMenu = $.proxy(this._onContextMenu, this);
// 		this.$_onMouseDown = $.proxy(this._onMouseDown, this);
// 		this.$_onMouseMove = $.proxy(this._onMouseMove, this);
// 		this.$_onMouseUp = $.proxy(this._onMouseUp, this);
//
// 		$(document.documentElement) .on('mousedown', this.$_onMouseDown)
// 									.on('mousemove', this.$_onMouseMove)
// 									.on('mouseup', this.$_onMouseUp)
// 									.on('contextmenu', this.$_onContextMenu);
// 	},
// 	_removeDeviceListeners: function() {
// 		$(document.documentElement) .off('mousedown', this.$_onMouseDown)
// 									.off('mousemove', this.$_onMouseMove)
// 									.off('mouseup', this.$_onMouseUp)
// 									.off('contextmenu', this.$_onContextMenu);
// 	}
// });
//
// function getHighlightedElements(rect) {
// 	var result = [];
// 	recurseGetHighlightedElements(rect, [document.documentElement], [document.documentElement], result);
// 	return _.unique(result);
// }
//
// function recurseGetHighlightedElements(rect, children, lineage, result) {
// 	var length = children.length,
// 		i = 0,
// 		child,
// 		boundingRect,
// 		smallerRect;
//
// 	while(i < length) {
// 		child = children[i];
// 		if(child.nodeType === Node.ELEMENT_NODE) {
// 			boundingRect = child.getBoundingClientRect();
//
// 			if(true || collide(rect, boundingRect)) {
// 				smallerRect = {
// 					left: boundingRect.left + boundingRect.width/4,
// 					right: boundingRect.right - boundingRect.width/4,
// 					top: boundingRect.top + boundingRect.height/4,
// 					bottom: boundingRect.bottom - boundingRect.height/4,
// 				};
// 				if(inside(smallerRect, rect)) {
// 					result.push(child);
// 					//result.push.apply(result, lineage);
// 				} else {
// 					lineage.push(child);
// 					recurseGetHighlightedElements(rect, child.childNodes, lineage, result);
// 					lineage.pop();
// 				}
// 			}
// 		}
//
// 		i++;
// 	}
// }
//
// function collide(rect1, rect2) {
// 	return !(
// 		rect1.top > rect2.bottom ||
// 		rect1.right < rect2.left ||
// 		rect1.bottom < rect2.top ||
// 		rect1.left > rect2.right
// 	);
// }
//
// function inside(rect1, rect2) {
// 	return (
// 		((rect2.top <= rect1.top) && (rect1.top <= rect2.bottom)) &&
// 		((rect2.top <= rect1.bottom) && (rect1.bottom <= rect2.bottom)) &&
// 		((rect2.left <= rect1.left) && (rect1.left <= rect2.right)) &&
// 		((rect2.left <= rect1.right) && (rect1.right <= rect2.right))
// 	);
// }
