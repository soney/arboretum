var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
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
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.print = function(level) {
		this.getRoot().print(level);
	};

	proto.refreshRoot = function() {
		var page = this.getPage();
		return page._getDocument().then(_.bind(function(doc) {
			var root = doc.root;
			this.setRoot(root);
		}, this));
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
		var resourceTracker = this._resourceTracker;
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
			node._childCountUpdated(event.childNodeCount);
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

		return this._root;
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
		this._resourceTracker.destroy();
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

module.exports = {
	FrameState: FrameState
};