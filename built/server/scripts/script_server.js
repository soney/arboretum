var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var log = require('../../utils/logging').getColoredLogger('white', 'bgBlack');

var ScriptServer = function(options) {
	this.options = options;
    this.$_onDeviceEvent = _.bind(this.onDeviceEvent, this);
    this.$_onNavigate = _.bind(this.onNavigate, this);
    this.$_getElements = _.bind(this.getElements, this);
    this.$_handoff = _.bind(this.handoff, this);

    this._addSocketListeners();
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
    proto._addSocketListeners = function() {
        var socket = this._getSocket();
        socket.on('deviceEvent', this.$_onDeviceEvent);
        socket.on('navigate', this.$_onNavigate);
        socket.on('getElements', this.$_getElements);
        socket.on('handoff', this.$_handoff);
    };
    proto._removeSocketListeners = function() {
        var socket = this._getSocket();
        socket.removeListener('deviceEvent', this.$_onDeviceEvent);
        socket.removeListener('navigate', this.$_onNavigate);
        socket.removeListener('getElements', this.$_getElements);
        socket.removeListener('handoff', this.$_handoff);
    };
    proto.onDeviceEvent = function(event) {
        var browserState = this._getBrowserState();
        var socket = this._getSocket();
		var framePromise;
		if(event.frameId) {
			framePromise = browserState.findFrame(event.frameId);
		} else {
			var tabId = browserState.getActiveTabId();
			framePromise = browserState.getTabState(tabId).then(function(tabState) {
				var mainFrame = tabState.getMainFrame();
				return mainFrame;
			});
		}
		framePromise.then(function(frame) {
			frame.onDeviceEvent(event);
			socket.emit('eventHappened');
		});
    };
    proto.onNavigate = function(url) {
        var socket = this._getSocket();
        var browserState = this._getBrowserState();
		browserState.openURL(url).then(function() {
			socket.emit('navigated', url);
		}).catch(function(err) {
			console.error(err);
		});
    };
    proto.getElements = function(info) {
        var socket = this._getSocket();
		var selector = info.selector;
        var browserState = this._getBrowserState();
		var tabId = browserState.getActiveTabId();

		browserState.getTabState(tabId).then(function(tabState) {
			var mainFrame = tabState.getMainFrame();
			var framePromise = new Promise(function(resolve, reject) {
				resolve(mainFrame);
			});
			if(info.frameStack) {
				_.each(info.frameStack, function(frameSelector) {
					if(frameSelector) {
						framePromise = framePromise.then(function(frame) {
							var root = frame.getRoot();
							return Promise.all([root.querySelectorAll(frameSelector), frame]);
						}).then(function(vals) {
							var nodeIds = vals[0].nodeIds,
								frame = vals[1];

							var node = frame._getWrappedDOMNodeWithID(nodeIds[0]);
							return node.getChildFrame();
						});
					}
				});
			}
			framePromise.then(function(frame) {
				var root = frame.getRoot();
				return Promise.all([root.querySelectorAll(selector), frame]);
			}).then(function(vals) {
				var elements = vals[0],
					frame = vals[1];

				var serializedNodes = _.map(elements.nodeIds, function(nodeId) {
					var node = frame._getWrappedDOMNodeWithID(nodeId);
					return node._getNode();
				});
				socket.emit('elements', {
					selector: info.selector,
					frameStack: info.frameStack,
					value: {
						nodes: serializedNodes,
						frameId: frame.getFrameId()
					}
				});
			}).catch(function(err) {
				socket.emit('elements', {
					selector: info.selector,
					frameStack: info.frameStack,
					value: false
				});
				console.error(err);
			});
		});
    };
	proto.handoff = function(info) {
		var elements = info.elements;
		var browserState = this._getBrowserState();
		var task = this.getTask();
        var socket = this._getSocket();
		var nodesPromises = _.map(info.elements, function(nodeInfos) {
			if(nodeInfos.nodes) {
				var nodeInfo = nodeInfos.nodes[0];

				if(nodeInfo) {
					return browserState.findFrame(nodeInfos.frameId).then(function(frame) {
						return frame.findNode(nodeInfo.nodeId);
					});
				}
			}
		});

		return Promise.all(nodesPromises).then(function(wrappedNodes) {
			return _.compact(wrappedNodes);
		}).then(function(wrappedNodes) {
			task.exposeNodes(wrappedNodes);
		}).then(function() {
			socket.emit('handed');
		}).catch(function(err) {
			console.error(err);
			console.error(err.stack);
		});
		/*
		var frame;
		var task = this.getTask();
		var scriptRecorder = this.getScriptRecorder();

		var browserState = this.getBrowserState();
		browserState.findFrame(frameId).then(function(f) {
			frame = f;
			var wrappedNodePromises = _.map(info.nodeIds, function(nodeId) {
				return frame.findNode(nodeId);
			});
			return Promise.all(wrappedNodePromises);
		}).then(function(wrappedNodes) {
			return _.compact(wrappedNodes);
		}).then(function(wrappedNodes) {
			task.exposeNodes(frame, wrappedNodes);
			scriptRecorder.onNodeReply(frame, wrappedNodes);
		}).catch(function(err) {
			console.error(err);
		});
		*/
	};
    proto.destroy = function() {
        this._removeSocketListeners();
    };
    proto._getSocket = function() {
        return this.options.socket;
    };
    proto._getBrowserState = function() {
        return this.options.browserState;
    };
    proto.getTask = function() {
        return this.options.task;
    };
}(ScriptServer));

module.exports = {
	ScriptServer: ScriptServer
};
/*
socket.once('scriptReady', function() {
	socket.on('getElements', function(info) {
	});
			});
            */