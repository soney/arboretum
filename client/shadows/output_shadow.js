var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	URL = require('url'),
	ShadowFrame = require('./frame_shadow').ShadowFrame;

var log = require('../../utils/logging').getColoredLogger('yellow', 'bgBlack');

var ShadowOutput = function(options) {
	this.options = options;

	log.debug('::: CREATED OUTPUT SHADOW ' + this.getTask().getTaskId() + ' :::');

	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		var task = this.getTask();

		this.$updateShadowFrame = _.bind(this.updateShadowFrame, this);

		task.on('exposeNodes', this.$updateShadowFrame);
	};

	proto.updateShadowFrame = function() {
		if(this.shadowFrame) {
			this.shadowFrame.destroy();
		}

		this.shadowFrame = new ShadowFrame(_.extend({
			childFilterFunction: _.bind(function(child) {
				var node = child._getNode(),
					nodeName = node.nodeName,
					nodeType = node.nodeType;
				if(nodeName === 'SCRIPT' ||
					nodeName === '#comment' ||
					nodeName === 'BASE' || nodeType === NODE_CODE.DOCUMENT_TYPE_NODE) {
					return false;
				} else {
					if(nodeName === 'STYLE' || nodeName === 'LINK' || nodeName === 'HEAD') {
						return true;
					} else {
						var visibleElements = this.getTask().
						return _.indexOf(visibleElements, node.nodeId) >= 0;
					}
				}
			}, this)
		}, this.options));


	};

	proto.getBrowserShadow = function() {
		return this.options.browserShadow;
	};

	proto.destroy = function() {
		var task = this.getTask();
		task.off('exposeNodes', this.$updateShadowFrame);

		if(this.shadowFrame) {
			this.shadowFrame.destroy();
		}


		log.debug('::: DESTROYED OUTPUT SHADOW ' + this.getTask().getTaskId() + ' :::');
	};
	proto.getTask = function() {
		return this.options.task;
	};

	proto._getSocket = function() {
		return this.options.socket;
	};
}(ShadowOutput));

module.exports = {
	ShadowOutput: ShadowOutput
};