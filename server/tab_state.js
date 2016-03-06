var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	EventManager = require('./event_manager').EventManager,
	FrameState = require('./frame_state').FrameState,
	colors = require('colors/safe');

log.setLevel('error');

var TabState = function(chrome) {
	this.chrome = chrome;
	this.eventManager = new EventManager(chrome);
	this._rootFrame = false;
	this._frames = {};

	this._pendingFrameEvents = {};

	this._initialized = this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;
	proto.navigate = function() {

	};

	proto.evaluate = function(expression, frameId) {
		var frame;

		if(frameId) {
			frame = this.getFrame(frameId);
		} else {
			frame = this.getMainFrame();
		}

		var executionContext = frame.getExecutionContext();
		return chromeDriver.evaluate(this._getChrome(), executionContext, {
			expression: expression
		});
		return frame.evaluate(expression);
	};

	proto.onDeviceEvent = function() {
		return this.eventManager.onDeviceEvent.apply(this.eventManager, arguments);
	};

	proto.getURL = function() {
		var mainFrame = this.getMainFrame();
		if(mainFrame) {
			return mainFrame.getURL();
		} else {
			return '';
		}
	};

	proto.isInitialized = function() {
		return this._initialized;
	};

	proto.requestResource = function(url, frameId) {
		var frame = this.getFrame(frameId);
		return frame.requestResource(url);
	};

	proto.getMainFrame = function() {
		return this._rootFrame;
	};

	proto._setMainFrame = function(frame) {
		this._rootFrame = frame;
		log.error(colors.red('Set main frame  ' + frame.getFrameId() ));

		return this._getDocument().then(_.bind(function(doc) {
			var root = doc.root;
			this._rootFrame.setRoot(doc.root);
			this.emit('mainFrameChanged');
		}, this));
	};

	proto._initialize = function() {
		var chrome = this._getChrome();

		return  this._addFrameListeners().then(_.bind(function() {
			return this._addDOMListeners();
		}, this)).then(_.bind(function() {
			return this._addNetworkListeners();
		}, this)).then(_.bind(function() {
			return this._addExecutionContextListeners();
		}, this)).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};

	proto._executionContextCreated = function(event) {
		var context = event.context,
			frameId = context.frameId,
			frame = this.getFrame(frameId);

		if(frame) {
			frame.executionContextCreated(context);
		} else {
			log.error('Could not find frame ' + frameId);
		}
	};

	proto._addExecutionContextListeners = function() {
		var chrome = this._getChrome();

		this.$_executionContextCreated = _.bind(this._executionContextCreated, this);

		return new Promise(_.bind(function(resolve, reject) {
			chrome.Runtime.enable();
			chrome.Runtime.executionContextCreated(this.$_executionContextCreated);

			resolve();
		}, this));
	};

	proto._getResourceTree = function() {
		var chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.Page.getResourceTree({}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto._getDocument = function() {
		var chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.DOM.getDocument({}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto._addNetworkListeners = function() {
		var chrome = this._getChrome();
		chrome.Network.enable();

		this.$_requestWillBeSent = _.bind(this._requestWillBeSent, this);
		this.$_responseReceived = _.bind(this._responseReceived, this);

		chrome.Network.requestWillBeSent(this.$_requestWillBeSent);
		chrome.Network.responseReceived(this.$_responseReceived);
	};

	proto._requestWillBeSent = function(resource) {
		var frameId = resource.frameId;
		var frame = this.getFrame(frameId);
		if(frame) {
			var resourceTracker = frame.getResourceTracker();
			resourceTracker._requestWillBeSent(resource);
		} else {
			var pendingFrameEvents = this._pendingFrameEvents[frameId];
			var eventInfo = {
				event: resource,
				type: 'requestWillBeSent'
			};
			if(pendingFrameEvents) {
				pendingFrameEvents.push(eventInfo);
			} else {
				this._pendingFrameEvents[frameId] = [eventInfo];
			}
			//log.error('Could not find frame ' + frameId);
		}
	};
	proto._responseReceived = function(event) {
		var frameId = event.frameId;
		var frame = this.getFrame(frameId);
		if(frame) {
			var resourceTracker = frame.getResourceTracker();
			resourceTracker._responseReceived(event);
		} else {
			var pendingFrameEvents = this._pendingFrameEvents[frameId];
			var eventInfo = {
				event: event,
				type: 'responseReceived'
			};
			if(pendingFrameEvents) {
				pendingFrameEvents.push(eventInfo);
			} else {
				this._pendingFrameEvents[frameId] = [eventInfo];
			}
			//log.error('Could not find frame ' + frameId);
		}
	};

	proto._addFrameListeners = function() {
		var chrome = this._getChrome();
		this.$_onFrameAttached = _.bind(this._onFrameAttached, this);
		this.$_onFrameNavigated = _.bind(this._onFrameNavigated, this);
		this.$_onFrameDetached = _.bind(this._onFrameDetached, this);

		chrome.Page.enable();
		return this._getResourceTree().then(_.bind(function(tree){
			var frameTree = tree.frameTree;
			this._createFrame(frameTree);

			chrome.Page.frameAttached(this.$_onFrameAttached);
			chrome.Page.frameDetached(this.$_onFrameDetached);
			chrome.Page.frameNavigated(this.$_onFrameNavigated);
		}, this));
	};
	proto._onFrameAttached = function(frameInfo) {
		var frameId = frameInfo.frameId,
			parentFrameId = frameInfo.parentFrameId;

		log.error(colors.red('Frame attached  ' + frameId ) + ' (parent: ' + parentFrameId + ')');

		this._createEmptyFrame(frameInfo);
	};
	proto._onFrameNavigated = function(frameInfo) {
		var frame = frameInfo.frame,
			frameId = frame.id,
			frameUrl = frame.url;

		log.error(colors.red('Frame navigated ' + frameId + ' ') + frameUrl);

		var frame;
		if(this._hasFrame(frameId)) {
			frame = this.getFrame(frameId);
		} else {
			frame = this._createFrame(frameInfo);
		}

		frame.navigated(frameInfo);
	};
	proto._onFrameDetached = function(frameInfo) {
		var frameId = frameInfo.frameId;

		log.error(colors.red('Frame detached ') + frameId);

		this._destroyFrame(frameId);
	};

	proto._hasFrame = function(frameId) {
		return this._frames.hasOwnProperty(frameId);
	};

	proto.getFrame = function(frameId) {
		return this._frames[frameId];
	};

	proto._createFrame = function(frameInfo) {
		var resources = frameInfo.resources,
			childFrames = frameInfo.childFrames,
			frame = frameInfo.frame,
			frameId = frame.id;

		log.error(colors.red('Frame created ' + frameId + ' '));

		var frameState = this._frames[frameId] = new FrameState(_.extend({
			chrome: this._getChrome(),
			resources: resources,
			page: this
		}, frame));

		if(!frame.parentId) {
			this._setMainFrame(frameState);
		}

		_.each(childFrames, function(childFrame) {
			this._createFrame(childFrame);
		}, this);

		this._updateFrameOnEvents(frameState);

		return frameState;
	};

	proto._createEmptyFrame = function(frameInfo) {
		var frameId = frameInfo.frameId;

		var frameState = this._frames[frameId] = new FrameState(_.extend({
			chrome: this._getChrome()
		}, {
			id: frameId,
			page: this,
			parentId: frameInfo.parentFrameId
		}));

		if(!frameInfo.parentFrameId) {
			this._setMainFrame(frameState);
		}
		this._updateFrameOnEvents(frameState);

		return frameState;
	};

	proto._updateFrameOnEvents = function(frame) {
		var frameId = frame.getFrameId();
		var pendingFrameEvents = this._pendingFrameEvents[frameId];

		if(pendingFrameEvents) {
			var resourceTracker = frame.getResourceTracker();

			_.each(pendingFrameEvents, function(eventInfo) {
				var eventType = eventInfo.type,
					event = eventInfo.event;
				if(eventType === 'responseReceived') {
					resourceTracker._responseReceived(event);
				} else if(eventType === 'requestWillBeSent') {
					resourceTracker._requestWillBeSent(event);
				}
			});
			delete this._pendingFrameEvents[frameId];
		}
	};

	proto._destroyFrame = function(frameId) {
		if(this._hasFrame(frameId)) {
			var frame = this.getFrame(frameId);
			frame.destroy();
			delete this._frames[frameId];
		} else {
			throw new Error('Could not find frame with id ' + frameId);
		}
	};

	proto.print = function() {
		return this._rootFrame.print();
	};
	proto.summarize = function() {
		return this._rootFrame.summarize();
	};

	proto.requestChildNodes = function(nodeId, depth) {
		if(!depth) { depth = -1; }

		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.DOM.requestChildNodes({
				nodeId: nodeId,
				depth: depth
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(nodeId);
				}
			})
		});
	};

	proto._onDocumentUpdated = function() {
		var frame = this.getMainFrame();
		frame.documentUpdated();
	};

	proto._onSetChildNodes = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.setChildNodes(event);
		});
		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for set child nodes event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};
	proto._onCharacterDataModified = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.characterDataModified(event);
		});
		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for character data modified event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};
	proto._onChildNodeRemoved = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.childNodeRemoved(event);
		});

		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for child node removed event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};
	proto._onChildNodeInserted = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.childNodeInserted(event);
		});

		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for child node inserted event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};

	proto._onAttributeModified = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.attributeModified(event);
		});

		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for attribute modified event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};
	proto._onAttributeRemoved = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.attributeRemoved(event);
		});

		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for attribute removed event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};
	proto._onChildNodeCountUpdated = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.childNodeCountUpdated(event);
		});

		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for child node count updated event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};
	proto._onInlineStyleInvalidated = function(event) {
		var promises = _.map(this._frames, function(frame) {
			return frame.inlineStyleInvalidated(event);
		});

		return Promise.all(promises).then(function(vals) {
			return _.any(vals);
		}).then(function(wasHandled) {
			if(!wasHandled) {
				log.error('No frame found for inline style invalidated event', event);
			}
		}).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};

	var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes', 'inlineStyleInvalidated' ];

	proto._addDOMListeners = function() {
		var chrome = this._getChrome();

		return this._getDocument().then(_.bind(function(doc) {
			var root = doc.root;
			this._rootFrame.setRoot(doc.root);

			_.each(eventTypes, function(eventType) {
				var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
				var func = this['$_on'+capitalizedEventType] = _.bind(this['_on' + capitalizedEventType], this);
				chrome.on('DOM.' + eventType, func);
			}, this);
			this.requestChildNodes(root.nodeId, 1);
		}, this));
	};

	proto._removeListeners = function() {
		var chrome = this._getChrome();

		_.each(eventTypes, function(eventType) {
			var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
			var func = this['$_on'+capitalizedEventType];
			if(func) {
				chrome.removeListener('DOM.' + eventType, func);
			}
		}, this);
	};

	proto.highlight = function(nodeId) {
		var chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.DOM.highlightNode({
				nodeId: nodeId,
				highlightConfig: {
					borderColor: {
						r: 255,
						g: 0,
						b: 0,
						a: 1
					},
					contentColor: {
						r: 255,
						g: 0,
						b: 0,
						a: 0.5
					},
					showInfo: true
				}
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto.removeHighlight = function(nodeId) {
		var chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.DOM.hideHighlight({
				nodeId: nodeId
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto.destroy = function() {

	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(TabState));

module.exports = {
	TabState: TabState
};