var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ScriptRecorder = require('./scripts/script_recorder').ScriptRecorder;

var log = require('../utils/logging').getColoredLogger('yellow', 'bgBlack');

var Task = function(options) {
    this.options = options;
	this.scriptRecorder = new ScriptRecorder({
		browserState: this.getBrowserState(),
		task: this
	});
	this.done = false;
	this._computedExposedINodes = [];
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
	proto.getScriptRecorder = function() {
		return this.scriptRecorder;
	};
	proto.setScriptRecorder = function(scriptRecorder) {
		this.scriptRecorder = scriptRecorder;
	};
	proto.setDescription = function(description) {
		var oldDescription = this.getDescription();
		this._description = description;
		this.emit('setDescription', {
			value: this.getDescription(),
			old: oldDescription
		});
	};
	proto.getDescription = function() {
		return this._description;
	};
    proto.getTaskId = function() {
        return this.options.taskId;
    };
	proto.isDone = function() {
		return this.done;
	};
	proto.markAsDone = function() {
		this.done = true;
		return this.getRecordedScript();
	};
	proto.getRecordedScript = function() {
		return this.scriptRecorder.getRecordedScript();
	};
    proto.exposeNodes = function(wrappedNodes) {
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
		newNodes = _.unique(newNodes);
		this._computedExposedNodes = newNodes;
		this.emit('exposeNodes');
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