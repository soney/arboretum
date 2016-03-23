var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowDOM = require('./dom_shadow').ShadowDOM;

var log = require('../../utils/logging').getColoredLogger('green', 'bgBlack');

var ShadowFrame = function(domTree, socket) {
	this.domTree = domTree;
	this.socket = socket;
	log.debug('::: CREATED FRAME SHADOW ' + this.domTree.getFrameId() + ' :::');

	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		this.$_updateShadowTree = _.bind(this._updateShadowTree, this);
		this.$_highlightNode = _.bind(this._highlightNode, this);
		this.$_removeHighlight = _.bind(this._removeHighlight, this);

		this.$_mouseEvent = _.bind(this._mouseEvent, this);

		this._addListeners();

		socket.on('highlightNode', this.$_highlightNode);
		socket.on('removeHighlight', this.$_removeHighlight);
		socket.on('mouseEvent', this.$_mouseEvent);

		this._updateShadowTree();

		this.on('updated', function() {
			socket.emit('treeUpdated', this._shadowTree.serialize());
		});
	};
	proto._addListeners = function() {
		var domTree = this._getDomTree();
		domTree.on('rootInvalidated', this.$_updateShadowTree);
	};
	proto._mouseEvent = function(event) {
		this.emit('mouseEvent', event);
	};
	proto.setFrame = function(frame) {
		var socket = this._getSocket();
		socket.emit('frameChanged');
		this._removeListeners();
		this.domTree = frame;
		this._addListeners();
		this._updateShadowTree();
	};
	proto._getDomTree = function() {
		return this.domTree;
	};
	proto._getSocket = function() {
		return this.socket;
	}
	proto._updateShadowTree = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();
		if(this._shadowTree) {
			this._shadowTree.destroy();
		}
		var node = domTree.getRoot();
		if(node) {
			var shadow = this._shadowTree = new ShadowDOM({
				tree: node,
				state: this
			});

			socket.emit('treeReady', shadow.serialize());
		}
	};

	proto._removeListeners = function() {
		var domTree = this._getDomTree();
		domTree.removeListener('rootInvalidated', this.$_updateShadowTree);
	};

	proto.destroy = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		if(this._shadowTree) {
			this._shadowTree.destroy();
		}

		this._removeListeners();

		socket.removeListener('highlightNode', this.$_highlightNode);
		socket.removeListener('removeHighlight', this.$_removeHighlight);

		log.debug('::: DESTROYED FRAME SHADOW ' + this._getDomTree().getFrameId() + ' :::');
	};
	proto._highlightNode = function(info) {
		var nodeId = info.nodeId;
		domTree.highlight(nodeId);
	};
	proto._removeHighlight = function(info) {
		var nodeId = info.nodeId;
		domTree.removeHighlight(nodeId);
	};
	proto.childAdded = function(parent, child, previousChildId) {
		var socket = this._getSocket();
		socket.emit('childAdded', {
			parentId: parent.getId(),
			child: child.serialize(),
			previousChild: previousChildId
		});
	};
	proto.childRemoved = function(parent, child) {
		var socket = this._getSocket();
		socket.emit('childRemoved', {
			parentId: parent.getId(),
			childId: child.getId()
		});
	};
	proto.childrenChanged = function(parent, children) {
		var socket = this._getSocket();
		log.debug('Children changed ' + parent.getId());
		socket.emit('childrenChanged', {
			parentId: parent.getId(),
			children: children.map(function(child) { return child.serialize(); })
		});
	};
	proto.valueChanged = function(node, value) {
		var socket = this._getSocket();
		socket.emit('valueChanged', {
			id: node.getId(),
			value: value
		});
	};
	proto.attributesChanged = function(node, info) {
		var socket = this._getSocket();
		socket.emit('attributesChanged', {
			id: node.getId(),
			attributes: info.attributes,
			inlineStyle: info.inlineStyle
		});
	};
}(ShadowFrame));

module.exports = {
	ShadowFrame: ShadowFrame
};