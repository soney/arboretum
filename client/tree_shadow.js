var _ = require('underscore'),
	util = require('util'),
	URL = require('url'),
	EventEmitter = require('events');

var ShadowBrowser = function(browserState, socket) {
	this.browserState = browserState;
	this.socket = socket;
	this.tabShadow = false;
	this._initialize();
};
(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		/*
		var tabIds = this.browserState.getTabIds();
		if(tabIds.length > 0) {
			this.setTab(tabIds[0]);
		}
		*/
		this._onAddTab = _.bind(function(info) {
			this.browserState.addTab();
		}, this);
		this._onCloseTab = _.bind(function(info) {
			this.browserState.closeTab(info.tabId);
		}, this);
		this._onFocusTab = _.bind(function(info) {
			this.setTab(info.tabId);
		}, this);
		this._onOpenURL = _.bind(function(info) {
			var parsedURL = URL.parse(info.url);
			if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
			var url = URL.format(parsedURL);
			this.browserState.openURL(url);
		}, this);
		this._onDeviceEvent = _.bind(function(event) {
			this.browserState.onDeviceEvent(event, this.getActiveTabId(), this.getFrameId());
		}, this);
		this.$mainFrameChanged = _.bind(this.mainFrameChanged, this);
		this.$sendTabs = _.bind(this.sendTabs, this);

		this._addBrowserStateListeners();
		this._addSocketListeners();
	};
	proto._addBrowserStateListeners = function() {
		this.browserState.on('tabCreated', this.$sendTabs);
		this.browserState.on('tabDestroyed', this.$sendTabs);
		this.browserState.on('tabUpdated', this.$sendTabs);
	};
	proto._removeBrowserStateListeners = function() {
		this.browserState.removeListener('tabCreated', this.$sendTabs);
		this.browserState.removeListener('tabDestroyed', this.$sendTabs);
		this.browserState.removeListener('tabUpdated', this.$sendTabs);
	};
	proto._addSocketListeners = function() {
		this.socket	.on('addTab', this._onAddTab)
					.on('closeTab', this._onCloseTab)
					.on('focusTab', this._onFocusTab)
					.on('openURL', this._onOpenURL)
					.on('deviceEvent', this._onDeviceEvent);
	};
	proto._removeSocketListeners = function() {
		this.socket	.removeListener('addTab', this._onAddTab)
					.removeListener('closeTab', this._onCloseTab)
					.removeListener('focusTab', this._onFocusTab)
					.removeListener('openURL', this._onOpenURL)
					.removeListener('deviceEvent', this._onDeviceEvent);
	};
	proto.mainFrameChanged = function() {
		this.setFrame(this.browserState.getMainFrame().getId(), this.getActiveTabId())
	};
	proto.sendTabs = function() {
		var tabs = {};
		_.each(this.browserState.getTabIds(), function(tabId) {
			tabs[tabId] = _.extend({
				active: tabId === this.getActiveTabId()
			}, this.browserState.summarizeTab(tabId));
		}, this);
		this.socket.emit('currentTabs', tabs);
	};
	proto.getFrameId = function() {
		return this.frameId;
	};
	proto.getActiveTabId = function() {
		return this.activeTabId;
	};
	proto.setFrame = function(frameId, tabId) {
		if(!tabId) {
			tabId = this.browserState.getActiveTabId();
		}
		this.frameId = frameId;

		this.setTab(tabId, frameId).then(_.bind(function() {
			this.sendTabs();
		}, this));
	};
	proto._addFrameListener = function() {
		if(this._tabState) {
			this._tabState.on('mainFrameChanged', this.$mainFrameChanged);
		}
	};
	proto._removeFrameListener = function() {
		if(this._tabState) {
			this._tabState.removeListener('mainFrameChanged', this.$mainFrameChanged);
		}
	};
	proto.setTab = function(tabId, frameId) {
		return this.browserState.getTabState(tabId).then(_.bind(function(tabState) {
			this._removeFrameListener();
			this._tabState = tabState;

			var frame;
			if(frameId) {
				frame = tabState.getFrame(frameId);
			} else {
				frame = tabState.getMainFrame();
				this._addFrameListener();
			}

			if(this.tabShadow) {
				this.tabShadow.destroy();
			}
			this.tabShadow = new ShadowFrame(frame, this.socket);
			this.activeTabId = tabId;
			this.sendTabs();
			return tabState;
		}, this)).catch(function(err) {
			console.error(err.stack);
		});
	};
	proto.destroy = function() {
		if(this.tabShadow) {
			this.tabShadow.destroy();
			this.tabShadow = false;
		}

		this._removeBrowserStateListeners();
		this._removeSocketListeners();
		this._removeFrameListener();
	};
}(ShadowBrowser));

var ShadowFrame = function(domTree, socket) {
	this.domTree = domTree;
	this.socket = socket;
	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._initialize = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		this.$_updateShadowTree = _.bind(this._updateShadowTree, this);
		//this.$_updateSheets = _.bind(this._updateSheets, this);
		this.$_highlightNode = _.bind(this._highlightNode, this);
		this.$_removeHighlight = _.bind(this._removeHighlight, this);

		this.$_mouseEvent = _.bind(this._mouseEvent, this);

		this._addListeners();
		//domTree.on('styleSheetsInvalidated', this.$_updateSheets);
		socket.on('highlightNode', this.$_highlightNode);
		socket.on('removeHighlight', this.$_removeHighlight);
		socket.on('mouseEvent', this.$_mouseEvent);

		this._updateShadowTree();
		//this._updateSheets();

		this.on('updated', function() {
			socket.emit('treeUpdated', this._shadowTree.serialize());
		});
	};
	proto._addListeners = function() {
		var domTree = this._getDomTree();
		domTree.on('rootInvalidated', this.$_updateShadowTree);
	};
	proto._mouseEvent = function(event) {
		this.emit('mouseEvent', event);
	};
	proto.setFrame = function(frame) {
		var socket = this._getSocket();
		socket.emit('frameChanged');
		this._removeListeners();
		this.domTree = frame;
		this._addListeners();
		this._updateShadowTree();
	};
	proto._getDomTree = function() {
		return this.domTree;
	};
	proto._getSocket = function() {
		return this.socket;
	}
	proto._updateShadowTree = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();
		if(this._shadowTree) {
			this._shadowTree.destroy();
		}
		var node = domTree.getRoot();
		if(node) {
			var shadow = this._shadowTree = new DOMTreeShadow({
				tree: node,
				state: this
			});

			socket.emit('treeReady', shadow.serialize());
		}
	};
	/*
	proto._updateSheets = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();
		domTree.getStyleSheets().then(function(sheets) {
			socket.emit('styleSheetsUpdated', {
				sheets: sheets
			});
		});
	};
	*/
	proto._removeListeners = function() {
		var domTree = this._getDomTree();
		domTree.removeListener('rootInvalidated', this.$_updateShadowTree);
	};

	proto.destroy = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		if(this._shadowTree) {
			this._shadowTree.destroy();
		}

		this._removeListeners();

		//domTree.removeListener('styleSheetsInvalidated', this.$_updateSheets);
		socket.removeListener('highlightNode', this.$_highlightNode);
		socket.removeListener('removeHighlight', this.$_removeHighlight);
	};
	proto._highlightNode = function(info) {
		var nodeId = info.nodeId;
		domTree.highlight(nodeId);
	};
	proto._removeHighlight = function(info) {
		var nodeId = info.nodeId;
		domTree.removeHighlight(nodeId);
	};
	proto.childAdded = function(parent, child, previousChildId) {
		var socket = this._getSocket();
		socket.emit('childAdded', {
			parentId: parent.getId(),
			child: child.serialize(),
			previousChild: previousChildId
		});
	};
	proto.childRemoved = function(parent, child) {
		var socket = this._getSocket();
		socket.emit('childRemoved', {
			parentId: parent.getId(),
			childId: child.getId()
		});
	};
	proto.childrenChanged = function(parent, children) {
		var socket = this._getSocket();
		socket.emit('childrenChanged', {
			parentId: parent.getId(),
			children: children.map(function(child) { return child.serialize(); })
		});
	};
	proto.valueChanged = function(node, value) {
		var socket = this._getSocket();
		socket.emit('valueChanged', {
			id: node.getId(),
			value: value
		});
	};
	proto.attributesChanged = function(node, info) {
		var socket = this._getSocket();
		socket.emit('attributesChanged', {
			id: node.getId(),
			attributes: info.attributes,
			inlineStyle: info.inlineStyle
		});
	};
}(ShadowFrame));

var DOMTreePlaceholder = function(tree) {
	this.tree = tree;
	this._id = tree.getId();
};
(function(My) {
	var proto = My.prototype;
	proto.getId = function() {
		return this._id;
	};
	proto.destroy = function() { };
}(DOMTreePlaceholder));

var DOMTreeShadow = function(options) {
	this.options = _.extend({
		tree: false,
		state: false,
		childMapFunction: function(child) {
			var shadow = new DOMTreeShadow({
				tree: child,
				state: this._getState()
			});
			return shadow;
		},
		childFilterFunction: function(child) {
			var node = child._getNode(),
				nodeName = node.nodeName,
				nodeType = node.nodeType;
			if(/*nodeName === 'STYLE' || */nodeName === 'SCRIPT' ||
				nodeName === '#comment'/* || nodeName === 'LINK'*/ ||
				nodeName === 'BASE' || nodeType === 10) {
				return false;
			} else {
				return true;
			}
		}
	}, options);

	if(!this.options.tree) {
		throw new Error('No Tree');
	}

	this._attributes = {};
	this._inlineCSS = '';

	this._initialize();
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._childAdded = function(info) {
		var child = info.child,
			previousNode = info.previousNode,
			toAdd,
			addedAtIndex;

		if(this.options.childFilterFunction.call(this, child)) {
			toAdd = this.options.childMapFunction.call(this, child);
		} else {
			toAdd = new DOMTreePlaceholder(child);
		}

		if(previousNode) {
			var previousNodeId = previousNode.getId(),
				myChildren = this.children,
				len = myChildren.length,
				i = 0,
				child;

			while(i < len) {
				child = myChildren[i];
				if(child.getId() === previousNodeId) {
					this.children.splice(i+1, 0, toAdd);
					addedAtIndex = i+1;
					break;
				}
				i++;
			}
		} else {
			this.children.unshift(toAdd);
			addedAtIndex = 0;
		}

		if(toAdd instanceof My) {
			var state = this._getState(),
				previousNodeId = false,
				node;
			for(var i = addedAtIndex-1; i>=0; i--) {
				node = this.children[i];
				if(node instanceof My) {
					previousNodeId = node.getId();
					break;
				}
			}
			state.childAdded(this, toAdd, previousNodeId);
		}
	};

	proto._getState = function() {
		return this.options.state;
	};

	proto._childRemoved = function(info) {
		var removedChild = info.child,
			removedChildId = removedChild.getId(),
			myChildren = this.children,
			len = myChildren.length,
			i = 0,
			child,
			wasRemoved;

		while(i < len) {
			child = myChildren[i];
			if(child.getId() === removedChildId) {
				wasRemoved = child;
				this.children.splice(i, 1);
				break;
			}
			i++;
		}

		if(wasRemoved) {
			if(wasRemoved instanceof My) {
				var state = this._getState();
				state.childRemoved(this, wasRemoved);
			}
			wasRemoved.destroy();
		}
	};

	proto._childrenChanged = function(info) {
		var children = info.children,
			state = this._getState();
		this._updateChildren(children);
		state.childrenChanged(this, this.getChildren());
	};

	proto._nodeValueChanged = function(info) {
		var value = info.value,
			state = this._getState();
		this._value = value;
		state.valueChanged(this, value);
	};

	proto._updateChildren = function(treeChildren) {
		this.children = _	.chain(treeChildren)
							.map(function(child) {
								var toAdd;
								if(this.options.childFilterFunction.call(this, child)) {
									toAdd = this.options.childMapFunction.call(this, child);
								} else {
									toAdd = new DOMTreePlaceholder(child);
								}
								return toAdd;
							}, this)
							.value();
	};

	proto.getTree = function() {
		return this.options.tree;
	};

	proto.getNode = function() {
		var tree = this.getTree();
		var node = tree._getNode();
		return node;
	};


	proto.getChildren = function() {
		return _.filter(this.children, function(child) {
			return child instanceof My;
		});
	};

	proto.serialize = function() {
		var tree = this.getTree(),
			node = tree._getNode();

		return {
			id: this._id,
			type: this._type,
			name: this._name,
			value: this._value,
			children: _.map(this.getChildren(), function(child) {
				return child.serialize();
			}),
			inlineStyle: this._inlineCSS,
			attributes: this._attributes
		};
	};

	proto._initialize = function() {
		var tree = this.getTree(),
			node = this.getNode();

		this._type = tree.getNodeType();
		this._id = tree.getId();
		this._name = tree.getNodeName();
		this._value = tree.getNodeValue();


		this.$_childAdded = _.bind(this._childAdded, this);
		this.$_childRemoved = _.bind(this._childRemoved, this);
		this.$_childrenChanged = _.bind(this._childrenChanged, this);

		this.$_updateAttributes = _.bind(this._updateAttributes, this);
		this.$_nodeValueChanged = _.bind(this._nodeValueChanged, this);
		this.$_inlineStyleChanged = _.bind(this._inlineStyleChanged, this);


		tree._initialized.then(_.bind(function() {
			this._value = tree.getNodeValue();

			this._attributes = tree.getAttributesMap();
			this._inlineCSS = tree.getInlineStyle();
			//this._updateAttributes(tree.getAttributesMap());
			var state = this._getState();
			if(tree.getNodeType() === 1) {
				state.attributesChanged(this, {
					attributes: this._attributes,
					inlineStyle: this._inlineCSS
				});
			}

			tree.on('childAdded', this.$_childAdded);
			tree.on('childRemoved', this.$_childRemoved);
			tree.on('childrenChanged', this.$_childrenChanged);

			tree.on('attributesChanged', this.$_updateAttributes);
			tree.on('nodeValueChanged', this.$_nodeValueChanged);
			tree.on('inlineStyleChanged', this.$_inlineStyleChanged);
		}, this)).catch(function(err) {
			console.log(err);
		});
		this._updateChildren(tree.getChildren());
	};

	proto.destroy = function() {
		var tree = this.getTree();
		_.each(this.getChildren(), function(child) {
			child.destroy();
		});

		tree.removeListener('childAdded', this.$_childAdded);
		tree.removeListener('childRemoved', this.$_childRemoved);
		tree.removeListener('childrenChanged', this.$_childrenChanged);

		tree.removeListener('attributesChanged', this.$_updateAttributes);
		tree.removeListener('nodeValueChanged', this.$_nodeValueChanged);
		tree.removeListener('inlineStyleChanged', this.$_inlineStyleChanged);
	};

	proto.getId = function() {
		return this._id;
	};

	proto._updateAttributes = function(attributesMap) {
		this._attributes = attributesMap;
		var state = this._getState();

		state.attributesChanged(this, {
			attributes: this._attributes,
			inlineStyle: this._inlineCSS
		});
	};

	proto._inlineStyleChanged = function(event) {
		var inlineStyle = event.inlineStyle;

		this._inlineCSS = inlineStyle;

		var state = this._getState();

		state.attributesChanged(this, {
			attributes: this._attributes,
			inlineStyle: this._inlineCSS
		});
	};

}(DOMTreeShadow));

module.exports = {
	DOMTreeShadow: DOMTreeShadow,
	ShadowFrame: ShadowFrame,
	ShadowBrowser: ShadowBrowser
};