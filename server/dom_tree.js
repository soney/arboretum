var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	url = require('url'),
	path = require('path'),
	log = require('loglevel'),
	urlTransform = require('./url_transform').urlTransform,
	ResourceTracker = require('./resource_tracker').ResourceTracker;

log.setLevel('trace');

var DOMState = function(chrome) {
	this.chrome = chrome;

	this._styleSheets = {};
	this._nodeMap = {};

	this._resourceTracker = new ResourceTracker(this._getChrome());

/*
	chrome.Page.loadEventFired(_.bind(function() {
		log.debug('Load event fired');
		//this.getRoot();
		this.refreshRoot();
	}, this));
	*/
	this._queuedEvents = [];

	this.refreshRoot();
	this._addListeners();

	//this._addStyleSheetListeners();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

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
						var event;
						delete this._refreshingRoot;
						while(event = this._queuedEvents.unshift()) {
							this._handleEvent(event);
						}
					}
				}, this));
	};

	proto.summarize = function() {
		this.getRoot().then(function(root) {
			console.log(root.summarize());
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
			console.error(err);
		});
	};

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
	proto.highlight = function(nodeId) {
		var chrome = this._getChrome();

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
				console.error(value);
			}
		});
	};

	proto.removeHighlight = function(nodeId) {
		var chrome = this._getChrome();

		chrome.DOM.hideHighlight({
			nodeId: nodeId
		}, function(err, value) {
			if(err) {
				console.error(value);
			}
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
			this._queuedEvents.push(event);
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);

			log.debug('Character Data Modified ' + event.nodeId);

			node._setCharacterData(event.characterData);
		}
	};
	proto._onChildNodeRemoved = function(event) {
		if(this._refreshingRoot) {
			this._queuedEvents.push(event);
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
			this._queuedEvents.push(event);
		} else {
			var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId),
				previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
				wrappedNode = this._getWrappedDOMNode(event.node);

			log.debug('Child Node Inserted ' + event.node.nodeId + ' (parent: ' + event.parentNodeId + ' / previous: ' + event.previousNodeId + ')');
			if(!parentNode) {
				this.summarize();
			}

			this._setChildrenRecursive(wrappedNode, event.node.children);
			parentNode._insertChild(wrappedNode, previousNode);
		}
	};
	proto._onAttributeModified = function(event) {
		if(this._refreshingRoot) {
			this._queuedEvents.push(event);
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			node._setAttribute(event.name, event.value);
		}
	};
	proto._onAttributeRemoved = function(event) {
		if(this._refreshingRoot) {
			this._queuedEvents.push(event);
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			node._removeAttribute(event.name);
		}
	};
	proto._onChildNodeCountUpdated = function(event) {
		if(this._refreshingRoot) {
			this._queuedEvents.push(event);
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

	var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes' ];

	proto._handleEvent = function(event) {
		var eventType = event.type;
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
				console.error(err);
			});
		}

		return this._rootPromise;
	};

	proto._getChrome = function() {
		return this.chrome;
	};
}(DOMState));

var WrappedDOMNode = function(options) {
	this.node = options.node;
	this.chrome = options.chrome;
	this.state = options.state;

	this._attributes = {};
	this._inlineStyle = '';
	this._initialized = this.initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._getState = function() {
		return this.state;
	};

	proto._initializeAttributesMap = function() {
		var node = this._getNode(),
			attributes = node.attributes,
			attrPromise,
			attrPromises = [];
		if(attributes) {
			var len = attributes.length,
				i = 0;
			while(i < len) {
				var name = attributes[i],
					val = attributes[i+1];

				attrPromise = this._transformAttribute(val, name).then(_.bind(function(attrVal) {
					this._attributes[name] = attrVal;
				}, this)).catch(function(err) {
					console.error(err);
				});

				i+=2;
			}
		}
		return Promise.all(attrPromises);
	};

	proto._transformAttribute = function(val, name) {
		return new Promise(_.bind(function(resolve, reject) {
			var tagName = this._getTagName(),
				tagTransform = urlTransform[tagName.toLowerCase()]

			if(tagTransform) {
				var attributeTransform = tagTransform[name.toLowerCase()];
				if(attributeTransform) {
					this._getBaseURL().then(_.bind(function(url) {
						resolve(attributeTransform.transform(val, url));
					}, this)).catch(function(err) {
						console.error(err);
					});
					return;
				}
			}
			resolve(val);
		}, this));
	};

	proto._getBaseURL = function() {
		var state = this._getState();
		return state.getRoot().then(function(root) {
			var node = root._getNode();
			return node.baseURL;
		});
	};

	proto._getTagName = function() {
		var node = this._getNode();
		return node.nodeName;
	};

	proto.getAttributesMap = function() {
		return this._attributes;
	};

	proto.initialize = function() {
		return this._initializeAttributesMap();
	};
	proto.destroy = function() {
		_.each(this.children, function(child) {
			child.destroy();
		});
		this.emit('destroyed');
		this.removeAllListeners();
	};

	proto.getId = function() {
		var node = this._getNode();
		return node.nodeId;
	};

	proto._setChildren = function(children) {
		_.each(this.children, function(child) {
			if(children.indexOf(child) < 0) {
				child.destroy();
			}
		});

		this.children = children;
		this.emit('childrenChanged', {
			children: children
		});
		return this;
	};

	proto._getNode = function() {
		return this.node;
	};

	proto._removeChild = function(child) {
		var index = _.indexOf(this.getChildren(), child);
		if(index >= 0) {
			this.children.splice(index, 1);
			this.emit('childRemoved', {
				child: child
			});
			child.destroy();
		}
		return this;
	};

	proto._insertChild = function(child, previousNode) {
		if(previousNode) {
			var index = _.indexOf(this.getChildren(), previousNode);
			this.children.splice(index, 0, child);
		} else {
			this.children.unshift(child);
		}

		this.emit('childAdded', {
			child: child,
			previousNode: previousNode
		});
	};

	proto._setAttribute = function(name, value) {
		var node = this._getNode();
		node.attributes.push(name, value);

		this._transformAttribute(value, name).then(_.bind(function(attrVal) {
			this._attributes[name] = atrVal;
			this._notifyAttributeChange();
		}, this)).catch(function(err) {
			console.error(err);
		});
	};

	proto._removeAttribute = function(name) {
		var node = this._getNode();
		var attributeIndex = _.indexOf(node.attributes, name);
		if(attributeIndex >= 0) {
			node.attributes.splice(attributeIndex, 2);
			delete this._attributes[name];
			this._notifyAttributeChange();
		}
	};

	proto._notifyAttributeChange = function() {
		this.emit('attributesChanged', this.getAttributesMap());
	};

	proto.getAttributes = function() {
		var node = this._getNode();
		return node.attributes;
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto.getChildren = function() {
		return this.children;
	};

	proto._setCharacterData = function(characterData) {
		var node = this._getNode();
		node.nodeValue = characterData;
		this.emit('nodeValueChanged', {
			value: characterData
		});
	};

	proto._childCountUpdated = function(count) {
		var node = this._getNode();
	};

	proto._getMatchedStyles = function() {
		var id = this.getId(),
			chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.CSS.getMatchedStylesForNode({
				nodeId: id
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto._getCSSAnimations = function() {
		var id = this.getId(),
			chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.CSS.getCSSAnimationsForNode({
				nodeId: id
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto.getInlineStyles = function() {
		var id = this.getId(),
			chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.CSS.getInlineStylesForNode({
				nodeId: id
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value.inlineStyle);
				}
			});
		});
	};

	proto._stringifySelf = function() {
		var MAX_TEXT_LENGTH = 50;
		var node = this._getNode(),
			type = node.nodeType,
			id = node.nodeId;
		if(type === 9) {
			return '(' + id + ') ' + node.nodeName;
		} else if(type === 3) {
			var text = node.nodeValue.replace(/(\n|\t)/gi, '');
			if(text.length > MAX_TEXT_LENGTH) {
				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
			}
			return '(' + id + ') text: ' + text;
		} else if(type === 10) {
			return '(' + id + ') <' + node.nodeName + '>';
		} else if(type === 1) {
			var text = '(' + id + ') <' + node.nodeName;
			_.each(this.getAttributesMap(), function(val, name) {
				text += ' ' + name +  ' = "' + val + '"';
			});
			//for(var i = 0; i<node.attributes.length; i+=2) {
				//text += ' ' + node.attributes[i] +  ' = "' + node.attributes[i+1] + '"';
			//}
			text += '>';
			return text;
		} else if(type === 8) {
			var text = '(' + id + ') <!-- ';
			text += node.nodeValue.replace(/(\n|\t)/gi, '');
			if(text.length > MAX_TEXT_LENGTH) {
				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
			}
			text +=  ' -->';
			return text;
		} else {
			console.log(node);
		}
		return 'node';
	};

	proto.print = function(level) {
		var str = '';
		if(!level) { level = 0; }
		for(var i = 0; i<level; i++) {
			str += '  ';
		}
		str += this._stringifySelf();
		console.log(str);
		_.each(this.getChildren(), function(child) {
			child.print(level+1);
		});

		return this;
	};

	proto.summarize = function() {
		var children = this.getChildren();
		if(children.length > 0) {
			return this.getId() + ':[' + _.map(children, function(child) { return child.summarize(); }).join(', ') + ']';
		} else {
			return this.getId();
		}
	};
}(WrappedDOMNode));

module.exports = {
	DOMState: DOMState
};