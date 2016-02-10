var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	url = require('url'),
	path = require('path'),
	log = require('loglevel'),
	urlTransform = require('./url_transform').urlTransform,
	processCSS = require('./css_parser').parseCSS,
	processCSSURLs = require('./css_parser').processCSSURLs,
	FrameState = require('./frame_state').FrameState
	colors = require('colors/safe');

//log.setLevel('debug');

var PageState = function(chrome) {
	this.chrome = chrome;
	this._rootFrame = false;
	this._frames = {};

	/*

	this._styleSheets = {};
	this._nodeMap = {};

	this._resourceTracker = new ResourceTracker(this._getChrome());

	chrome.Page.loadEventFired(_.bind(function() {
		log.debug('Load event fired');
		//this.getRoot();
		//this.refreshRoot();
	}, this));

	this._queuedEvents = [];

	this.refreshRoot();
	this._addListeners();

	//this._addStyleSheetListeners();
	/*
	chrome.CSS.enable();
	chrome.CSS.styleSheetAdded(function() {
		console.log(arguments);
	});
	chrome.CSS.styleSheetRemoved(function() {
		console.log(arguments);
	});
	chrome.CSS.styleSheetChanged(function() {
		console.log(arguments);
	});
	*/
	this._initialized = this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

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
			this._rootFrame = this._createFrame(frameTree);

			chrome.Page.frameAttached(this.$_onFrameAttached);
			chrome.Page.frameDetached(this.$_onFrameDetached);
			chrome.Page.frameNavigated(this.$_onFrameNavigated);
		}, this));
	};
	proto._onFrameAttached = function(frameInfo) {
		var frameId = frameInfo.frameId,
			parentFrameId = frameInfo.parentFrameId;

		log.debug(colors.red('Frame attached ') + frameId + ' (parent: ' + parentFrameId + ')');

		this._createEmptyFrame(frameInfo);
	};
	proto._onFrameNavigated = function(frameInfo) {
		var frame = frameInfo.frame,
			frameId = frame.id,
			frameUrl = frame.url;

		log.debug(colors.red('Frame navigated ' + frameId + ' ') + frameUrl);

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

		log.debug(colors.red('Frame detached ') + frameId);

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

		var frameState = this._frames[frameId] = new FrameState(_.extend({
			chrome: this._getChrome(),
			resources: resources,
			page: this
		}, frame));

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
	/*

	proto.print = function() {
		this.getRoot().then(function(root) {
			root.print();
		});
	};

	proto.refreshRoot = function() {
		var wasRefreshingRoot = this._refreshingRoot;

		if(!this._refreshingRoot) {
			this._refreshingRoot = true;
		}

		var promise;

		if(this._rootPromise) {
			promise = this._rootPromise.then(_.bind(function(root) {
				root.destroy();
			}, this)).then(_.bind(function() {
				delete this._rootPromise;
				this.emit('rootInvalidated');
			}, this)).then(_.bind(function() {
				return this.getRoot();
			}, this));
		} else {
			promise = this.getRoot();
		}

		return promise.then(_.bind(function() {
					if(!wasRefreshingRoot) {
						var eventInfo;
						var oldLength = this._queuedEvents.length;
						delete this._refreshingRoot;
						while(eventInfo = this._queuedEvents.shift()) {
							this._handleEvent(eventInfo);
						}
						log.debug('Finished ' + oldLength + ' queued events');
					}
				}, this)).catch(function(err) {
					if(err.stack) { console.error(err.stack); }
					else { console.error(err); }
				});
	};


	proto.getStyleSheets = function() {
		var sheets = _.values(this._styleSheets);

		return Promise.all(sheets).then(function(texts) {
			return texts;
		});
	};

	proto._getResourceTree = function() {
		var chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.Page.getResourceTree({}, function(err, val) {
				if(err) { reject(val); }
				else { resolve(val); }
			});
		});
	};

	var urlStrategies = [
		function(frameUrl, resourceUrl) {
			return resourceUrl;
		},
		function(frameUrl, resourceUrl) {
			return url.resolve(frameUrl, resourceUrl);
		},
		function(frameUrl, resourceUrl) {
			var lastSlash = frameUrl.lastIndexOf('/'),
				frameBase = frameUrl.substr(0, lastSlash);

			return frameBase + resourceUrl;
		},
	];

	proto.requestResource = function(resourceUrl) {
		var resourceTracker = this._resourceTracker;

		return this._getResourceTree().then(_.bind(function(tree) {
			var frameTree = tree.frameTree,
				mappedResourceUrl = false;

			_.each(frameTree, function(frame) {
				var frameUrl = frame.url,
					candidateUrl;

				if(frameUrl) {
					_.each(urlStrategies, function(urlStrategy) {
						candidateUrl = urlStrategy(frameUrl, resourceUrl);

						if(resourceTracker.hasResource(candidateUrl)) {
							mappedResourceUrl = candidateUrl;
						}
					});
				}
			});

			if(!mappedResourceUrl) {
				mappedResourceUrl = resourceUrl;
			}

			return resourceTracker.getResource(tree, mappedResourceUrl);
		}, this)).catch(function(err) {
			if(err.stack) { console.error(err.stack); }
			else { console.error(err); }
		});
	};

*/
/*
	proto._addStyleSheetListeners = function() {
		var chrome = this._getChrome();

		var notifyStylesheetInvalidation = _.debounce(_.bind(this._notifyStylesheetInvalidation, this), 500);

		chrome.CSS.styleSheetAdded(_.bind(function(sheets) {
			_.each(sheets, function(stylesheet) {
				var id = stylesheet.styleSheetId;
				this._styleSheets[id] = this._requestStylesheetText(id);
			}, this);
			notifyStylesheetInvalidation();
		}, this));

		chrome.CSS.styleSheetRemoved(_.bind(function(sheetInfo) {
			delete this._styleSheets[sheetInfo.styleSheetId];
			notifyStylesheetInvalidation();
		}, this));

		chrome.CSS.styleSheetChanged(_.bind(function(sheetInfo) {
			var id = sheetInfo.stlyeSheetId;
			this._styleSheets[id] = this._requestStylesheetText(id);
			notifyStylesheetInvalidation();
		}, this));

		chrome.DOM.enable(function(err, val) {
			if(err) { reject(val); }
		});
		chrome.CSS.enable(function(err, val) {
			if(err) { reject(val); }
		});

		setTimeout(_.bind(function() {
			this.getStyleSheets();
		}, this), 2000);
	};

	proto._notifyStylesheetInvalidation = function() {
		this.emit('styleSheetsInvalidated');
	};

	proto.getStyleSheet = function(id) {
		if(_.has(this._styleSheets, id)) {
			return this._styleSheets[id];
		} else {
			return new Promise(function(resolve, reject) {
				reject(new Error('No stylesheet with id ' + id + ' found.'));
			});
		}
	};

	proto._requestStylesheetText = function(id) {
		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.CSS.getStyleSheetText({
				styleSheetId: id
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(val.text);
				}
			});
		});
	};
	/*


	proto._invalidateRoot = function() {
		if(this._rootPromise) {
			this._rootPromise.then(_.bind(function(root) {
				root.destroy();
			}, this)).then(_.bind(function() {
				delete this._rootPromise;
				this.emit('rootInvalidated');
			}, this)).then(_.bind(function() {
				this.getRoot();
			}, this));
		} else {
			this.emit('rootInvalidated');
		}
	};

*/
/*
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

	proto._setChildrenRecursive = function(parentNode, children) {
		return parentNode._setChildren(_.map(children, function(child) {
			return this._setChildrenRecursive(this._getWrappedDOMNode(child), child.children);
		}, this));
	};

	proto._getWrappedDOMNode = function(node) {
		var id = node.nodeId;
		if(this._hasWrappedDOMNodeWithID(id)) {
			return this._getWrappedDOMNodeWithID(id);
		} else {
			var node = new WrappedDOMNode({
				node: node,
				chrome: this._getChrome(),
				state: this
			});
			node.once('destroyed', _.bind(function() {
				this._removeWrappedNode(node);
			}, this));
			return this._nodeMap[id] = node;
		}
	};

	proto._hasWrappedDOMNodeWithID = function(id) {
		return this._nodeMap.hasOwnProperty(id);
	};

	proto._getWrappedDOMNodeWithID = function(id) {
		return this._nodeMap[id];
	};

	proto._removeWrappedNode = function(node) {
		var id = node.getId();
		if(this._hasWrappedDOMNodeWithID(id)) {
			//var wrappedNode = this._getWrappedDOMNodeWithID(id);
			//wrappedNode.destroy();
			delete this._nodeMap[id];
		}
	};


	proto._requestChildNodes = function(wrappedNode) {
		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.DOM.requestChildNodes({
				nodeId: wrappedNode.getId(),
				depth: -1
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(wrappedNode);
				}
			})
		});
	};

	proto._requestNode = function(node_id) {
		var chrome = this._getChrome();
		return new Promise(function(resolve, reject) {
			chrome.DOM.resolveNode({
				nodeId: node_id
			}, function(err, val) {
				if(err) {
					reject(val);
				} else {
					resolve(val.object);
				}
			});
		}).then(function(nodeInfo) {
			return new Promise(function(resolve, reject) {
				chrome.DOM.requestNode({
					objectId: nodeInfo.objectId
				}, function(err, val) {
					if(err) {
						reject(val);
					} else {
						resolve(val);
					}
				});
			});
		});
	};

	*/
	/*
	proto.getRoot = function() {
		var chrome = this._getChrome();

		if(!this._rootPromise) {
			this._rootPromise = new Promise(function(resolve, reject) {
				chrome.DOM.getDocument(function(err, val) {
					if(err) {
						reject(val);
					} else {
						resolve(val);
					}
				});
			}).then(function(doc) {
				return doc.root;
			}).then(_.bind(function(rootNode) {
				var root = this._getWrappedDOMNode(rootNode);
				this._setChildrenRecursive(root, rootNode.children);
				return root;
			}, this)).then(_.bind(function(root) {
				return this._requestChildNodes(root);
			}, this)).then(_.bind(function(root) {
				this.emit('documentUpdated');
				return root;
			}, this)).catch(function(err) {
				if(err.stack) { console.error(err.stack); }
				else { console.error(err); }
			});
		}

		return this._rootPromise;
	};
	*/

	//proto._hasWrappedDOMNodeWithID = function(id) {
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