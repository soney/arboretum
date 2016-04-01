var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowDOM = require('./dom_shadow').ShadowDOM;

var log = require('../../utils/logging').getColoredLogger('green', 'bgBlack');

var ShadowFrame = function(options) {
	//domTree, socket) {
	this.options = options;
	this.domTree = options.frame;

	this._sentServerReady = false;
	log.debug('::: CREATED FRAME SHADOW ' + this._getDomTree().getFrameId() + ' :::');

	this._initialize();
};


var crowdInputStack = {};
var workerHistoryStack = {};
var globalHistoryStack = {};
var EV_AGREE_THRESH = 0;

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.sentServerReady = function() {
		return this._sentServerReady;
	};

	proto._onNodeReply = function(info) {
		var browserShadow = this.getBrowserShadow();
		browserShadow.nodeReply(this.getFrameId(), info);
	};

	proto._initialize = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		this.$_updateShadowTree = _.bind(this._updateShadowTree, this);
		this.$_highlightNode = _.bind(this._highlightNode, this);
		this.$_removeHighlight = _.bind(this._removeHighlight, this);
		this.$_onDeviceEvent = _.bind(this._onDeviceEvent, this);
		this.$_onNodeReply = _.bind(this._onNodeReply, this);

		this._addListeners();

		socket	.on('highlightNode', this.$_highlightNode)
				.on('removeHighlight', this.$_removeHighlight)
				.on('deviceEvent', this.$_onDeviceEvent)
				.on('nodeReply', this.$_onNodeReply);

		this._updateShadowTree();

		//this.on('updated', function() {
			//socket.emit('treeUpdated', this._shadowTree.serialize());
		//});
	};
	proto.getShadowTree = function() {
		return this._shadowTree;
	};
	proto._addListeners = function() {
		var domTree = this._getDomTree();
		domTree.on('rootInvalidated', this.$_updateShadowTree);
	};
	proto._onDeviceEvent = function(event) {
		var worker = event.userId;
		var evKey = event.id;

		console.log("EVENT KEY (o  )=^=^=^> ", evKey);
		if (crowdInputStack[evKey] == undefined) {
			crowdInputStack[evKey] = [];
		}
		if (crowdInputStack[evKey].indexOf(worker) < 0) {
			crowdInputStack[evKey].push(worker);
		} else {
			// null
		}

		// WSL-TODO: Condtition this on events fired per unique element (needs work atm), and within a sliding time window
		console.log("INPUT STACK: ", crowdInputStack, crowdInputStack[evKey], " ==> ", crowdInputStack[evKey].length);
		if (crowdInputStack[evKey].length >= EV_AGREE_THRESH) {
			var frameState = this._getDomTree();
			frameState.onDeviceEvent(event);
		}
	};
	proto._getDomTree = function() {
		return this.domTree;
	};
	proto._getSocket = function() {
		return this.options.socket;
	};
	proto.getFrameId = function() {
		return this._getDomTree().getFrameId();
	};
	proto._updateShadowTree = function() {
		this._sentServerReady = false;
		log.debug('Updating shadow tree ' + this.getFrameId());

		var domTree = this._getDomTree(),
			socket = this._getSocket();
		if(this._shadowTree) {
			this._shadowTree.destroy();
		}
		var node = domTree.getRoot();
		if(node) {
			var shadow = this._shadowTree = new ShadowDOM(_.extend({},
				this.options, {
					tree: node,
					state: this,
					parent: false
				}));

			shadow.isInitialized().then(_.bind(function() {
				this._sentServerReady = true;
				//log.debug('Server ready ' + node.getId());
				//socket.emit('serverReady', shadow.serialize());
				//console.log('server ready');

				//socket.emit('nodeInitialized', shadow.serialize());
			}, this));
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
		socket.removeListener('deviceEvent', this.$_onDeviceEvent);
		socket.removeListener('nodeReply', this.$_onNodeReply);

		log.debug('::: DESTROYED FRAME SHADOW ' + this.getFrameId() + ' :::');
	};
	proto._highlightNode = function(info) {
		var nodeId = info.nodeId;
		domTree.highlight(nodeId);
	};
	proto._removeHighlight = function(info) {
		var nodeId = info.nodeId;
		domTree.removeHighlight(nodeId);
	};
	proto.getUserId = function() {
		return this.options.userId;
	};
	proto.getBrowserShadow = function() {
		return this.options.browserShadow;
	};
}(ShadowFrame));

module.exports = {
	ShadowFrame: ShadowFrame
};