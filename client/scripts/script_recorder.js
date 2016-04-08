var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

function ScriptRecorder(options) {
    this.options = options;
	this.actions = [];
}

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.getTask = function() {
		return this.options.task;
	};

	proto.onNavigate = function(url) {
		this.actions.push({
			type: 'navigate',
			target: url
		});
	};

    proto.onDeviceEvent = function(frame, event) {
        if(event && event.id) {
            var node = frame._getWrappedDOMNodeWithID(event.id);
			var elSelector;
            node.getUniqueSelector().then(function(selector) {
				elSelector = selector;
                var stack = node.getFrameStack();
                var selPromises = _.map(stack, function(x) {
                    var parent = x.getDOMParent();
                    if(parent) {
                        return parent.getUniqueSelector();
                    } else {
                        return false;
                    }
                }, this);
				return Promise.all(selPromises);
            }).then(function(frameSelectors) {
				return {
					type: 'deviceEvent',
					frameSelectors: frameSelectors,
					selector: elSelector,
					event: event
				};
			}).then(_.bind(function(action) {
				this.actions.push(action);
			}, this)).catch(function(err) {
                console.error(err);
                console.error(err.stack);
            });
        }
    };
	proto.consolidate = function() {
	};
	proto.getRecordedScript = function() {
		return 'this is the recorded script';
	};
}(ScriptRecorder));

module.exports = {
	ScriptRecorder: ScriptRecorder
};
