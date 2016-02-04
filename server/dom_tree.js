var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	url = require('url'),
	path = require('path'),
	ResourceTracker = require('./resource_tracker').ResourceTracker;

var DOMState = function(chrome) {
	this.chrome = chrome;

	this._styleSheets = {};
	this._nodeMap = {};

	this._resourceTracker = new ResourceTracker(this._getChrome());

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
			var node = new WrappedDOMNode(node, this._getChrome());
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
		var id = node._getId();
		if(this._hasWrappedDOMNodeWithID(id)) {
			//var wrappedNode = this._getWrappedDOMNodeWithID(id);
			//wrappedNode.destroy();
			delete this._nodeMap[id];
		}
	};

	proto._addListeners = function() {
		var chrome = this._getChrome(),
			eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
							'documentUpdated', 'setChildNodes' ];

		chrome.Page.loadEventFired(_.bind(function() {
			//this.getRoot();
			this._invalidateRoot();
		}, this));

		_.each(eventTypes, function(eventType) {
			chrome.DOM[eventType](_.bind(function(event) {
				if(eventType === 'setChildNodes') {
					var nodes = event.nodes,
						parent = this._getWrappedDOMNodeWithID(event.parentId);

					return this._setChildrenRecursive(parent, nodes);
				} else if(eventType === 'documentUpdated') {
					this._invalidateRoot();
				} else if(eventType === 'characterDataModified') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					node._setCharacterData(event.characterData);
				} else if(eventType === 'childNodeRemoved') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId),
						parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);
					parentNode._removeChild(node);
					node.destroy();
				} else if(eventType === 'childNodeInserted') {
					var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId),
						previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
						wrappedNode = this._getWrappedDOMNode(event.node);

					this._setChildrenRecursive(wrappedNode, event.node.children);

					parentNode._insertChild(wrappedNode, previousNode);
				} else if(eventType === 'attributeModified') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					node._setAttribute(event.name, event.value);
				} else if(eventType === 'attributeRemoved') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					node._removeAttribute(event.name);
				} else if(eventType === 'childNodeCountUpdated') {
					var node = this._getWrappedDOMNodeWithID(event.nodeId);
					if(node) {
						node._childCountUpdated(event.childNodeCount);
						this._requestChildNodes(node);
					} else {
						this._requestNode(event.nodeId);
					}
				} else {
					throw new Error('Unknown event type ' + eventType);
				}
			}, this));
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

var WrappedDOMNode = function(node, chrome) {
	this.node = node;
	this.chrome = chrome;
	this._attributes = {};
	this._inlineStyle = '';
	this.initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initializeAttributesMap = function() {
		var node = this._getNode(),
			attributes = node.attributes;
		if(attributes) {
			var len = attributes.length,
				i = 0;
			while(i < len) {
				var name = attributes[i],
					val = attributes[i+1];
				this._attributes[name] = val;
				i+=2;
			}
		}
	};

	proto.getAttributesMap = function() {
		return this._attributes;
	};

	proto.initialize = function() {
		this._initializeAttributesMap();
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
		this._attributes[name] = value;
		this._notifyAttributeChange();
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
			for(var i = 0; i<node.attributes.length; i+=2) {
				text += ' ' + node.attributes[i] +  ' = "' + node.attributes[i+1] + '"';
			}
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
}(WrappedDOMNode));

module.exports = {
	DOMState: DOMState
};