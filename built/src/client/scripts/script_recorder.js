var _ = require('underscore'), util = require('util'), EventEmitter = require('events');
function ScriptRecorder(options) {
    this.options = options;
    this.actions = [];
}
(function (My) {
    util.inherits(My, EventEmitter);
    var proto = My.prototype;
    proto.getTask = function () {
        return this.options.task;
    };
    proto.addAction = function (action) {
        this.actions.push(action);
    };
    proto.onNavigate = function (url) {
        this.addAction({
            type: 'navigate',
            target: url
        });
    };
    proto.onDeviceEvent = function (frame, event) {
        if (event && event.id) {
            var node = frame._getWrappedDOMNodeWithID(event.id);
            var elSelector;
            node.getUniqueSelector().then(function (selector) {
                elSelector = selector;
                var stack = node.getFrameStack();
                var selPromises = _.map(stack, function (x) {
                    var parent = x.getDOMParent();
                    if (parent) {
                        return parent.getUniqueSelector();
                    }
                    else {
                        return false;
                    }
                }, this);
                return Promise.all(selPromises);
            }).then(function (frameSelectors) {
                return {
                    type: 'deviceEvent',
                    frameSelectors: frameSelectors,
                    selector: elSelector,
                    event: event
                };
            }).then(_.bind(function (action) {
                this.addAction(action);
            }, this)).catch(function (err) {
                console.error(err);
                console.error(err.stack);
            });
        }
    };
    proto.onNodeReply = function (frame, wrappedNodes) {
        var nodeSelectors = Promise.all(_.map(wrappedNodes, function (wrappedNode) {
            return wrappedNode.getUniqueSelector();
        }));
        var frameStackSelectorPromise = Promise.all(_.map(frame.getFrameStack(), function (x) {
            var parent = x.getDOMParent();
            if (parent) {
                return parent.getUniqueSelector();
            }
            else {
                return false;
            }
        }));
        var selectors;
        nodeSelectors.then(function (s) {
            selectors = s;
            return frameStackSelectorPromise;
        }).then(function (frameSelectors) {
            return {
                type: 'nodeReply',
                selectors: selectors,
                frameSelectors: frameSelectors
            };
        }).then(_.bind(function (action) {
            this.addAction(action);
        }, this)).catch(function (err) {
            console.error(err);
            console.error(err.stack);
        });
    };
    proto.consolidate = function () {
        var lastInput = false;
        var newScript = [];
        _.each(this.actions, function (action) {
            if (action.type === 'deviceEvent' && action.event.type === 'input') {
                if (action.selector === lastInput.selector && _.isEqual(action.frameSelectors, lastInput.frameSelectors)) {
                    lastInput.event.value = action.event.value;
                }
                else {
                    lastInput = action;
                    newScript.push(action);
                }
            }
            else {
                lastInput = false;
                newScript.push(action);
            }
        });
        return newScript;
    };
    proto.getRecordedScript = function () {
        var consolidatedActions = this.consolidate();
        var lines = [
            '// Generated ArborScript',
            'const HOST = "http://localhost:3000";',
            '',
            'var ArborScript = require("./arborscript");',
            '',
            'module.exports = function(options) {',
            '\tvar script = new ArborScript(HOST, { handoffTimeout: 5000 });',
            ''
        ];
        var promiseLines = [];
        _.each(consolidatedActions, function (action) {
            var type = action.type;
            var line;
            if (type === 'navigate') {
                line = 'script.open("' + action.target + '")';
            }
            else if (type === 'deviceEvent') {
                var event = action.event;
                var eventType = event.type;
                var selector = action.selector;
                var frameSelectorsString;
                if (_.isEqual(action.frameSelectors, [false])) {
                    frameSelectorsString = false;
                }
                else {
                    frameSelectorsString = _.map(action.frameSelectors, function (fs) {
                        return fs ? '"' + fs + '"' : fs;
                    }).join(', ');
                }
                if (eventType === 'input') {
                    line = 'script.input("' + selector + '", "' + event.value + '"';
                    if (frameSelectorsString) {
                        line += ', [' + frameSelectorsString + '])';
                    }
                    else {
                        line += ')';
                    }
                }
                else if (eventType === 'click') {
                    line = 'script.click("' + selector + '"';
                    if (frameSelectorsString) {
                        line += ', [' + frameSelectorsString + '])';
                    }
                    else {
                        line += ')';
                    }
                }
            }
            else if (type === 'nodeReply') {
                var frameSelectorsString;
                var selectorsString = _.map(action.selectors, function (s) {
                    return '"' + s + '"';
                }).join(', ');
                if (_.isEqual(action.frameSelectors, [false])) {
                    frameSelectorsString = false;
                }
                else {
                    frameSelectorsString = _.map(action.frameSelectors, function (fs) {
                        return fs ? '"' + fs + '"' : fs;
                    }).join(', ');
                }
                line = 'script.handoff([' + selectorsString + ']';
                if (frameSelectorsString) {
                    line += ', [' + frameSelectorsString + '])';
                }
                else {
                    line += ')';
                }
            }
            if (line) {
                promiseLines.push(line);
            }
        });
        promiseLines.push('script.exit()');
        var promisedLinesStr;
        var firstLine = _.first(promiseLines);
        if (promiseLines.length > 1) {
            promisedLinesStr = '\treturn ' + firstLine + '.then(function() {\n';
            var len = promiseLines.length;
            for (var i = 1; i < len; i++) {
                var line = promiseLines[i];
                promisedLinesStr += '\t\treturn ' + line + ';\n';
                if (i === len - 1) {
                    promisedLinesStr += '\t});';
                }
                else {
                    promisedLinesStr += '\t}).then(function() {\n';
                }
            }
        }
        else {
            promisedLinesStr = '\treturn ' + firstLine + ';';
        }
        lines.push(promisedLinesStr);
        lines.push('};');
        return lines.join('\n');
    };
}(ScriptRecorder));
module.exports = {
    ScriptRecorder: ScriptRecorder
};
