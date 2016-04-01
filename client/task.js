var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var log = require('../utils/logging').getColoredLogger('yellow', 'bgBlack');

var Task = function(options) {
    this.options = options;
	this._computedExposedIds = [];
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
			var newIds = [];
			_.each(wrappedNodes, function(wrappedNode) {
				if(wrappedNode) {
					var parent = wrappedNode;
					do {
						newIds.push(parent.getId())
					} while(parent = parent.getParent());

					var deepChildren = wrappedNode.getDeepChildren();
					newIds.push.apply(newIds, _.map(deepChildren, function(child) {
						return child.getId();
					}));

				}
			});
			return _.unique(newIds);
		}).then(_.bind(function(newIds) {
			this._computedExposedIds = newIds;
			this.emit('exposeNodes', newIds);
		}, this)).catch(function(err) {
			console.error(err);
			console.error(err.stack);
		});
    };
	proto.getComputedExposedIds = function() {
		return this._computedExposedIds;
	};
	proto.getBrowserState = function() {
		return this.options.browserState;
	};
}(Task));

module.exports = {
	Task: Task
};