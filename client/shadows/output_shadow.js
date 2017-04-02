var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	URL = require('url'),
	ShadowFrame = require('./frame_shadow').ShadowFrame;

var log = require('../../utils/logging').getColoredLogger('yellow', 'bgBlack');

var ShadowOutput = function(options) {
	this.options = options;

	log.debug('::: CREATED OUTPUT SHADOW :::');

	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		// var task = this.getTask();

		this.$updateShadowFrame = _.bind(this.updateShadowFrame, this);
		// this.$taskDescriptionSet = _.bind(this.taskDescriptionSet, this);


		// task.on('exposeNodes', this.$updateShadowFrame);
		// task.on('setDescription', this.$taskDescriptionSet);
		this.updateShadowFrame();
	};

	// proto.taskDescriptionSet = function(description) {
	// 	var task = this.getTask();
	// 	if(task.isDone()) {
	// 		var browserShadow = this.getBrowserShadow();
	// 		browserShadow.markTaskAsDone();
	// 	}
	// };

	proto.updateShadowFrame = function() {
		if(this.shadowFrame) {
			this.shadowFrame.destroy();
		}
		// var task = this.getTask();
		// var computedExposedNodes = task.getComputedExposedNodes();
		var computedExposedNodes = this.options.visibleElements;

		if(computedExposedNodes.length > 0) {
			var firstComputedExposedNode = computedExposedNodes[0];
			var frame = firstComputedExposedNode._getFrame();
			this.shadowFrame = new ShadowFrame(_.extend({
				frame: frame,
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
							return _.indexOf(computedExposedNodes, child) >= 0;
						}
					}
				}, this)
			}, this.options));
		}
	};
	proto.refreshChildren = function() {
		var tabShadow = this.tabShadow;
		if(tabShadow) {
			var frameShadow = tabShadow.shadowFrame;
			if(frameShadow) {
				var domShadow = frameShadow.getShadowTree();
				if(domShadow) {
					domShadow._childrenChanged({});
				}
			}
		}
	};


	proto.getBrowserShadow = function() {
		return this.options.browserShadow;
	};

	proto.destroy = function() {
		// var task = this.getTask();
		// task.off('exposeNodes', this.$updateShadowFrame);
		// task.off('setDescription', this.$taskDescriptionSet);

		if(this.shadowFrame) {
			this.shadowFrame.destroy();
		}


		log.debug('::: DESTROYED OUTPUT SHADOW ' + this.getTask().getTaskId() + ' :::');
	};
	// proto.getTask = function() {
		// return this.options.task;
	// };

	proto._getSocket = function() {
		return this.options.socket;
	};

}(ShadowOutput));

module.exports = {
	ShadowOutput: ShadowOutput
};