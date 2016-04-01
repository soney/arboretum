var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var log = require('../utils/logging').getColoredLogger('yellow', 'bgBlack');

var Task = function(options) {
    this.options = options;
	this._computedExposedINodes = [];
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
    proto.getTaskId = function() {
        return this.options.taskId;
    };
    proto.exposeNodes = function(frameId, nodeIds) {
		var browserState = this.getBrowserState();
		browserState.findFrame(frameId).then(function(frame) {
			var wrappedNodePromises = _.map(nodeIds, function(nodeId) {
				return frame.findNode(nodeId);
			});
			return Promise.all(wrappedNodePromises);
		}).then(function(wrappedNodes) {
			var newNodes = [];
			_.each(wrappedNodes, function(wrappedNode) {
				if(wrappedNode) {
					var parent = wrappedNode;
					do {
						newNodes.push(parent);
					} while(parent = parent.getParent());

					var deepChildren = wrappedNode.getDeepChildren();

					newNodes.push.apply(newNodes, _.map(deepChildren, function(child) {
						return child;
					}));
				}
			});
			return _.unique(newNodes);
		}).then(_.bind(function(newNodes) {
			this._computedExposedNodes = newNodes;
			this.emit('exposeNodes');
		}, this)).catch(function(err) {
			console.error(err);
			console.error(err.stack);
		});
    };
	proto.getComputedExposedNodes = function() {
		return this._computedExposedNodes;
	};
	proto.getBrowserState = function() {
		return this.options.browserState;
	};
}(Task));

module.exports = {
	Task: Task
};