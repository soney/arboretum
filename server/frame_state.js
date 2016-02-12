var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	ResourceTracker = require('./resource_tracker').ResourceTracker,
	WrappedDOMNode = require('./dom_tree').WrappedDOMNode;

//log.setLevel('trace');

var FrameState = function(options) {
	var chrome = options.chrome;
	this._markRefreshingRoot(true);

	this.chrome = chrome;
	this.options = options;

	this._nodeMap = {};
	this._queuedEvents = [];
	this._root = false;

	this._resourceTracker = new ResourceTracker(chrome, this, options.resources);
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.getResourceTracker = function() {
		return this._resourceTracker;
	};

	proto.print = function(level) {
		this.getRoot().print(level);
	};

	proto.refreshRoot = function() {
		var page = this.getPage();
		this._markRefreshingRoot(true);
		return page._getDocument().then(_.bind(function(doc) {
			var root = doc.root;
			this.setRoot(root);
		}, this));
	};

	proto._handleQueuedEvent = function(eventInfo) {
		var eventType = eventInfo.type,
			event = eventInfo.event,
			promise = eventInfo.promise;

		var val = this[eventType](event);
		promise.doResolve(val);
		return val;
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
		var resourceTracker = this.getResourceTracker();
		return resourceTracker.getResource(url);
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

	proto.setChildNodes = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Character Data Modified');
			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'setChildNodes',
				promise: promise
			});
			return promise;
		} else {
			var parent = this._getWrappedDOMNodeWithID(event.parentId);

			if(parent) {
				var nodes = event.nodes;

				log.debug('Set Child Nodes ' + event.parentId + ' -> ['+_.map(event.nodes, function(node) { return node.nodeId; }).join(', ')+']');

				this._setChildrenRecursive(parent, nodes);
				return true;
			} else {
				return false;
			}
		}
	};
	proto.documentUpdated = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Character Data Modified');
			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'documentUpdated',
				promise: promise
			});
			return promise;
		} else {
			log.debug('Document Updated');
			this.refreshRoot();
			return true;
		}
	};
	proto.characterDataModified = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Character Data Modified');
			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'characterDataModified',
				promise: promise
			});
			return promise;
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			if(node) {
				log.debug('Character Data Modified ' + event.nodeId);
				node._setCharacterData(event.characterData);
				return true;
			} else {
				return false;
			}
		}
	};
	proto.childNodeRemoved = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Child Node Removed');
			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'childNodeRemoved',
				promise: promise
			});
			return promise;
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId),
				parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);

			if(node && parentNode) {
				log.debug('Child Node Removed ' + event.nodeId + ' (parent: ' + event.parentNodeId + ')');

				parentNode._removeChild(node);
				node.destroy();
				return true;
			} else {
				return false;
			}
		}
	};
	proto.childNodeInserted = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Child Node Inserted');
			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'childNodeInserted',
				promise: promise
			});
			return promise;
		} else {
			var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId),
				previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
				wrappedNode = this._getWrappedDOMNode(event.node);

			if(parentNode) {
				log.debug('Child Node Inserted ' + event.node.nodeId + ' (parent: ' + event.parentNodeId + ' / previous: ' + event.previousNodeId + ')');
				if(!parentNode) {
					this.summarize();
				}

				this._setChildrenRecursive(wrappedNode, event.node.children);
				this.getPage().requestChildNodes(wrappedNode.getId()).then(_.bind(function(childNodes) {
				}, this));
				parentNode._insertChild(wrappedNode, previousNode);
				return true;
			} else {
				return false;
			}
		}
	};
	proto.attributeModified = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Attribute Modified');
			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'attributeModified',
				promise: promise
			});
			return promise;
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			if(node) {
				log.debug('Attribute modified');
				node._setAttribute(event.name, event.value);
				return true;
			} else {
				return false;
			}
		}
	};
	proto.attributeRemoved = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Attribute Removed');

			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'attributeRemoved',
				promise: promise
			});
			return promise;
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			if(node) {
				log.debug('Attribute removed');
				node._removeAttribute(event.name);
				return true;
			} else {
				return false;
			}
		}
	};
	proto.childNodeCountUpdated = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Child Count Updated');

			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'childNodeCountUpdated',
				promise: promise
			});
			return promise;
		} else {
			var node = this._getWrappedDOMNodeWithID(event.nodeId);
			if(node) {
				log.debug('Child Count Updated');
				node._childCountUpdated(event.childNodeCount);
				return true;
			} else {
				return false;
			}
		}
	};

	proto.inlineStyleInvalidated = function(event) {
		if(this._isRefreshingRoot()) {
			log.debug('(queue) Inline Style Invalidated');

			var promise = getResolvablePromise();
			this._queuedEvents.push({
				event: event,
				type: 'inlineStyleInvalidated',
				promise: promise
			});
			return promise;
		} else {
			var hasAnyNode = false;
			_.each(event.nodeIds, function(nodeId) {
				var node = this._getWrappedDOMNodeWithID(nodeId);
				if(node) {
					node._updateInlineStyle();
					hasAnyNode = true;
				}
			}, this);

			if(hasAnyNode) {
				log.debug('Inline Style Invalidated');
			}
			return hasAnyNode;
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
			var wrappedNode = this._getWrappedDOMNodeWithID(id);
			wrappedNode.destroy();
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

		this._markRefreshingRoot(false);

		return this._root;
	};

	proto._isRefreshingRoot = function() {
		return this._refreshingRoot;
	};

	proto._markRefreshingRoot = function(val) {
		if(val) {
			this._refreshingRoot = true;
		} else {
			this._refreshingRoot = false;

			while(this._queuedEvents.length > 0) {
				var queuedEvent = this._queuedEvents.shift();
				this._handleQueuedEvent(queuedEvent);
			}
		}
	};


	proto.navigated = function(event) {
		//console.log('new url is', event.frame.url, this.getFrameId());
		_.extend(this.options, event.frame);
	};

	proto.destroy = function() {
		var root = this.getRoot();
		if(root) {
			root.destroy();
		}
		var resourceTracker = this.getResourceTracker();
		resourceTracker.destroy();
	};

	proto._getChrome = function() {
		return this.chrome;
	};
	proto.getFrameId = function() {
		return this.options.id;
	};
	proto.getURL = function() {
		//console.log(this.options.url, this.getFrameId());
		return this.options.url;
	};
	proto.getPage = function() {
		return this.options.page;
	};
}(FrameState));

function getResolvablePromise() {
	var resolv, rejec;
	var promise = new Promise(function(resolve, reject) {
		resolv = resolve;
		rejec = reject;
	});
	promise.doResolve = resolv;
	promise.doReject = rejec;
	return promise;
}

module.exports = {
	FrameState: FrameState
};