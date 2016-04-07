var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

function ScriptRecorder(options) {
    this.options = options;
}

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

    proto.onDeviceEvent = function(event) {
        if(event && event.id) {
            var node = this._getWrappedDOMNodeWithID(event.id);
            node.getUniqueSelector().then(_.bind(function(selector) {
                var stack = node.getFrameStack();
                var selPromises = _.map(stack, function(x) {
                    var parent = x.getDOMParent();
                    if(parent) {
                        return parent.getUniqueSelector();
                    } else {
                        return false;
                    }
                }, this);
                Promise.all(selPromises).then(function(result) {
                    console.log(result);
                }).catch(function(err) {
                    console.error(err);
                });
                this.querySelectorAll(selector).then(function(result) {
                    console.log(event.type, selector);
                    console.log(result);
                }).catch(function(err) {
                    console.error(err);
                    console.error(err.stack);
                });
            }, this)).catch(function(err) {
                console.error(err);
                console.error(err.stack);
            });
        }
    };
}(ScriptRecorder));

module.exports = {
	ScriptRecorder: ScriptRecorder
};
