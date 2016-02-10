var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	url = require('url'),
	path = require('path'),
	log = require('loglevel'),
	urlTransform = require('./url_transform').urlTransform,
	processCSS = require('./css_parser').parseCSS,
	processCSSURLs = require('./css_parser').processCSSURLs,
	ResourceTracker = require('./resource_tracker').ResourceTracker,
	WrappedDOMNode = require('./dom_tree').WrappedDOMNode;

//log.setLevel('trace');

var FrameState = function(options) {
	var chrome = options.chrome;

	this.chrome = chrome;
	this.options = options;

	this._nodeMap = {};
	this._queuedEvents = [];
	this._root = false;

	this._resourceTracker = new ResourceTracker(chrome, this, options.resources);
	/*

	chrome.Page.loadEventFired(_.bind(function() {
		log.debug('Load event fired');
		//this.getRoot();
		//this.refreshRoot();
	}, this));
	*/


	//this.refreshRoot();
	//this._addListeners();

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
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.print = function(level) {
		this.getRoot().print(level);
		/*
		.then(function(root) {
			root.print();
		});
		*/
	};

	proto.refreshRoot = function() {
		var page = this.getPage();
		return page._getDocument().then(_.bind(function(doc) {
			var root = doc.root;
			this.setRoot(root);
		}, this));
			/*
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
				*/
	};

	proto.summarize = function() {
		this.getRoot().summarize();
	};

	proto.getStyleSheets = function() {
		var sheets = _.values(this._styleSheets);

		return Promise.all(sheets).then(function(texts) {
			return texts;
		});
	};

	proto.requestResource = function(url) {
		/*
		var chrome = this._getChrome();
		return new Promise(_.bind(function(resolve, reject) {
			chrome.Page.getResourceContent({
				frameId: this.getFrameId(),
				url: resourceUrl
			}, function(err, val) {
				if(err) { reject(val); }
				else { resolve(val); }
			});
		}, this));
		*/
		var resourceTracker = this._resourceTracker;
		return resourceTracker.getResource(url);
		/*

		return this._getResourceTree().then(_.bind(function(tree) {
			var frameTree = tree.frameTree,
				mappedResourceUrl = false;

			_.each(frameTree, function(frame) {
				var frameUrl = frame.url,
					candidateUrl;

				if(frameUrl) {
					if(resourceTracker.hasResource(resourceUrl)) {
						mappedResourceUrl = candidateUrl;
					}
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
		*/
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
	/*


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


	proto._onSetChildNodes = function(event) {
		var nodes = event.nodes,
			parent = this._getWrappedDOMNodeWithID(event.parentId);

		log.debug('Set Child Nodes ' + event.parentId + ' -> ['+_.map(event.nodes, function(node) { return node.nodeId; }).join(', ')+']');

		return this._setChildrenRecursive(parent, nodes);
	};
	proto._onDocumentUpdated = function(event) {
		log.debug('Document Updated');
		this.refreshRoot();
	};
	proto._onCharacterDataModified = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Character Data Modified');
			this._queuedEvents.push({
				event: event,
				type: 'characterDataModified'
			});
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);

			log.debug('Character Data Modified ' + event.nodeId);

			node._setCharacterData(event.characterData);
		}
	};
	proto._onChildNodeRemoved = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Child Node Removed');
			this._queuedEvents.push({
				event: event,
				type: 'childNodeRemoved'
			});
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId),
				parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);

			log.debug('Child Node Removed ' + event.nodeId + ' (parent: ' + event.parentNodeId + ')');

			parentNode._removeChild(node);
			node.destroy();
		}
	};
	proto._onChildNodeInserted = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Child Node Inserted');
			this._queuedEvents.push({
				event: event,
				type: 'childNodeInserted'
			});
		} else {
			var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId),
				previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
				wrappedNode = this._getWrappedDOMNode(event.node);

			log.debug('Child Node Inserted ' + event.node.nodeId + ' (parent: ' + event.parentNodeId + ' / previous: ' + event.previousNodeId + ')');
			if(!parentNode) {
				this.summarize();
			}

			this._setChildrenRecursive(wrappedNode, event.node.children);
			this._requestChildNodes(wrappedNode).then(_.bind(function(childNodes) {
			}, this));
			parentNode._insertChild(wrappedNode, previousNode);
		}
	};
	proto._onAttributeModified = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Attribute Modified');
			this._queuedEvents.push({
				event: event,
				type: 'attributeModified'
			});
		} else {
			log.debug('Attribute modified');
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			node._setAttribute(event.name, event.value);
		}
	};
	proto._onAttributeRemoved = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Attribute Removed');
			this._queuedEvents.push({
				event: event,
				type: 'attributeRemoved'
			});
		} else {
			log.debug('Attribute removed');
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			node._removeAttribute(event.name);
		}
	};
	proto._onChildNodeCountUpdated = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Child Count Updated');
			this._queuedEvents.push({
				event: event,
				type: 'childNodeCountUpdated'
			});
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			if(node) {
				node._childCountUpdated(event.childNodeCount);
				this._requestChildNodes(node);
			} else {
				this._requestNode(event.nodeId);
			}
		}
	};

	proto._onInlineStyleInvalidated = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Inline Style Invalidated');
			this._queuedEvents.push({
				event: event,
				type: 'inlineStyleInvalidated'
			});
		} else {
			_.each(event.nodeIds, function(nodeId) {
				var node = this._getWrappedDOMNodeWithID(nodeId);
				node._updateInlineStyle();
			}, this);
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

	proto._addListeners = function() {
		var chrome = this._getChrome();

		_.each(eventTypes, function(eventType) {
			var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
			var func = this['$_on'+capitalizedEventType] = _.bind(this['_on' + capitalizedEventType], this);
			chrome.on('DOM.' + eventType, func);
		}, this);
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




	proto._getURL = function() {
		return this._url;
	};
	*/

	proto.setChildNodes = function(event) {
		var parent = this._getWrappedDOMNodeWithID(event.parentId);

		var nodes = event.nodes;

		log.debug('Set Child Nodes ' + event.parentId + ' -> ['+_.map(event.nodes, function(node) { return node.nodeId; }).join(', ')+']');

		return this._setChildrenRecursive(parent, nodes);
	};
	proto.updateDocument = function(event) {
		log.debug('Document Updated');
		this.refreshRoot();
	};
	proto.modifyCharacterData = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Character Data Modified');
			this._queuedEvents.push({
				event: event,
				type: 'characterDataModified'
			});
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);

			log.debug('Character Data Modified ' + event.nodeId);

			node._setCharacterData(event.characterData);
		}
	};
	proto.removeChildNode = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Child Node Removed');
			this._queuedEvents.push({
				event: event,
				type: 'childNodeRemoved'
			});
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId),
				parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);

			log.debug('Child Node Removed ' + event.nodeId + ' (parent: ' + event.parentNodeId + ')');

			parentNode._removeChild(node);
			node.destroy();
		}
	};
	proto.insertChildNode = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Child Node Inserted');
			this._queuedEvents.push({
				event: event,
				type: 'childNodeInserted'
			});
		} else {
			var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId),
				previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
				wrappedNode = this._getWrappedDOMNode(event.node);

			log.debug('Child Node Inserted ' + event.node.nodeId + ' (parent: ' + event.parentNodeId + ' / previous: ' + event.previousNodeId + ')');
			if(!parentNode) {
				this.summarize();
			}

			this._setChildrenRecursive(wrappedNode, event.node.children);
			this.getPage().requestChildNodes(wrappedNode.getId()).then(_.bind(function(childNodes) {
			}, this));
			parentNode._insertChild(wrappedNode, previousNode);
		}
	};
	proto.modifyAttribute = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Attribute Modified');
			this._queuedEvents.push({
				event: event,
				type: 'attributeModified'
			});
		} else {
			log.debug('Attribute modified');
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			node._setAttribute(event.name, event.value);
		}
	};
	proto.removeAttribute = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Attribute Removed');
			this._queuedEvents.push({
				event: event,
				type: 'attributeRemoved'
			});
		} else {
			log.debug('Attribute removed');
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			node._removeAttribute(event.name);
		}
	};
	proto.updateChildNodeCount = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Child Count Updated');
			this._queuedEvents.push({
				event: event,
				type: 'childNodeCountUpdated'
			});
		} else {
			log.debug('Child Count Updated');
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			if(node) {
				node._childCountUpdated(event.childNodeCount);

				var page = this.getPage();
				page.requestChildNodes(node.getId(), -1);
			} else {
				this._requestNode(event.nodeId);
			}
		}
	};

	proto.invalidateInlineStyle = function(event) {
		if(this._refreshingRoot) {
			log.debug('(queue) Inline Style Invalidated');
			this._queuedEvents.push({
				event: event,
				type: 'inlineStyleInvalidated'
			});
		} else {
			log.debug('Inline Style Invalidated');
			_.each(event.nodeIds, function(nodeId) {
				var node = this._getWrappedDOMNodeWithID(nodeId);
				node._updateInlineStyle();
			}, this);
		}
	};

	proto.getRoot = function() {
		return this._root;
	};

	proto._getWrappedDOMNode = function(node) {
		var id = node.nodeId;
		if(this._hasWrappedDOMNodeWithID(id)) {
			return this._getWrappedDOMNodeWithID(id);
		} else {
			var node = new WrappedDOMNode({
				node: node,
				chrome: this._getChrome(),
				frame: this
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

	proto._setChildrenRecursive = function(parentNode, children) {
		return parentNode._setChildren(_.map(children, function(child) {
			return this._setChildrenRecursive(this._getWrappedDOMNode(child), child.children);
		}, this));
	};

	proto.setRoot = function(rootNode) {
		var oldRoot = this.getRoot();
		if(oldRoot) {
			oldRoot.destroy();
		}
		var root = this._getWrappedDOMNode(rootNode);
		var chrome = this._getChrome();
		this._root = this._setChildrenRecursive(root, rootNode.children);

		var page = this.getPage();
		page.requestChildNodes(rootNode.nodeId, -1);


		this.emit('rootInvalidated', this);

		return this._root;
	};

	proto.navigated = function(event) {
		_.extend(this.options, event.frame);
	};

	proto.destroy = function() {
		var root = this.getRoot();
		if(root) {
			root.destroy();
		}
		this._resourceTracker.destroy();
	};

	proto._getChrome = function() {
		return this.chrome;
	};
	proto.getFrameId = function() {
		return this.options.id;
	};
	proto.getURL = function() {
		return this.options.url;
	};
	proto.getPage = function() {
		return this.options.page;
	};
}(FrameState));

module.exports = {
	FrameState: FrameState
};