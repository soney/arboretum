var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	FrameState = require('./frame_state').FrameState
	colors = require('colors/safe');

//log.setLevel('debug');

var PageState = function(chrome) {
	this.chrome = chrome;
	this._rootFrame = false;
	this._frames = {};

	this._initialized = this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

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
		this.emit('mainFrameChanged');
	};

	proto._initialize = function() {
		var chrome = this._getChrome();
		chrome.Network.enable();

		return  this._addFrameListeners().then(_.bind(function() {
			return this._addDOMListeners();
		}, this)).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
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

		return frameState;
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
	proto._onSetChildNodes = function(event) {
		var parentId = event.parentId,
			foundFrame = false;
		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(parentId)) {
				frame.setChildNodes(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for set child nodes event', event);
		}
	};
	proto._onDocumentUpdated = function() {
		var frame = this.getMainFrame();
		frame.updateDocument();
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
	proto._onCharacterDataModified = function(event) {
		var nodeId = event.nodeId,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(nodeId)) {
				frame.modifyCharacterData(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for character data modified event', event);
		}
	};
	proto._onChildNodeRemoved = function(event) {
		var parentId = event.parentNodeId,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(parentId)) {
				frame.removeChildNode(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for child node removed event', event);
		}
	};
	proto._onChildNodeInserted = function(event) {
		var parentId = event.parentNodeId,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(parentId)) {
				frame.insertChildNode(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for child node inserted event', event);
		}
	};

	proto._onAttributeModified = function(event) {
		var nodeId = event.nodeId,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(nodeId)) {
				frame.modifyAttribute(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for attribute modified event', event);
		}
	};
	proto._onAttributeRemoved = function(event) {
		var nodeId = event.nodeId,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(nodeId)) {
				frame.removeAttribute(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for attribute removed event', event);
		}
	};
	proto._onChildNodeCountUpdated = function(event) {
		var nodeId = event.nodeId,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			if(frame._hasWrappedDOMNodeWithID(nodeId)) {
				frame.updateChildNodeCount(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for child node count updated event', event);
		}
	};
	proto._onInlineStyleInvalidated = function(event) {
		var nodeIds = event.nodeIds,
			foundFrame = false;

		_.each(this._frames, function(frame) {
			var hasNodeIds = _.every(nodeIds, function(nodeId) {
				return frame._hasWrappedDOMNodeWithID(nodeId);
			});

			if(hasNodeIds) {
				frame.invalidateInlineStyle(event);
				foundFrame = true;
			}
		});

		if(!foundFrame) {
			log.error('No frame found for inline style invalidated event', event);
		}
	};

	var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes', 'inlineStyleInvalidated' ];

	proto._handleEvent = function(eventInfo) {
		var eventType = eventInfo.type,
			event = eventInfo.event;
		var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);

		return this['_on'+capitalizedEventType](event);
	};

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

	proto._getChrome = function() {
		return this.chrome;
	};
}(PageState));

module.exports = {
	PageState: PageState
};