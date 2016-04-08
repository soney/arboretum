var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var log = require('../../utils/logging').getColoredLogger('white', 'bgBlack');

var ScriptServer = function(options) {
	this.options = options;
    this.$_onDeviceEvent = _.bind(this.onDeviceEvent, this);
    this.$_onNavigate = _.bind(this.onNavigate, this);
    this.$_getElements = _.bind(this.getElements, this);

    this._addSocketListeners();
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
    proto._addSocketListeners = function() {
        var socket = this._getSocket();
        socket.on('deviceEvent', this.$_onDeviceEvent);
        socket.on('navigate', this.$_onDeviceEvent);
        socket.on('getElements', this.$_getElements);
    };
    proto._removeSocketListeners = function() {
        var socket = this._getSocket();
        socket.removeListener('deviceEvent', this.$_onDeviceEvent);
        socket.removeListener('navigate', this.$_onDeviceEvent);
        socket.removeListener('getElements', this.$_getElements);
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
					nodes: serializedNodes,
					frameId: frame.getFrameId()
				});
			}).catch(function(err) {
				console.error(err);
			});
		});
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