//NO, this has nothing to do with *that* shadow dom
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	NODE_CODE = require('../../utils/node_code');
var log = require('../../utils/logging').getColoredLogger('magenta', 'bgBlack');

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

var ShadowDOM = function(options) {
	this.options = _.extend({
		tree: false,
		state: false,
		socket: false,
		parent: false,
		childMapFunction: function(child) {
			var shadow = new ShadowDOM(_.extend({}, this.options, {
				tree: child,
				parent: this
			}));
			return shadow;
		},
		childFilterFunction: function(child) {
			var node = child._getNode(),
				nodeName = node.nodeName,
				nodeType = node.nodeType;
			if(/*nodeName === 'STYLE' || */nodeName === 'SCRIPT' ||
				nodeName === '#comment'/* || nodeName === 'LINK'*/ ||
				nodeName === 'BASE' || nodeType === NODE_CODE.DOCUMENT_TYPE_NODE) {
				return false;
			} else {
				return true;
			}
		}
	}, options);

	if(!this.options.tree) {
		throw new Error('No Tree');
	}

	this._is_initialized = false;
	this._attributes = {};
	this._inlineCSS = '';
        this._queuedEvents = [];
        this.numChildrenInit = 0;

	this._initialized = this._initialize();
	/*
	if(this.getTree().getNodeType() === NODE_CODE.DOCUMENT_NODE) {
		this._initialized = this._initialized.then(_.bind(function() {
			var children = this.getChildren();
			var childInitializedPromises = _.map(children, function(child) {
				return child.isInitialized();
			});
			return Promise.all(childInitializedPromises);
		}, this));
	}
	*/

	log.debug('::: CREATED DOM SHADOW ' + this.getId() + ' :::');
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.setChildFilter = function(filter_fn) {
		this.options.childFilterFunction = filter_fn;
		this._updateChildren();
	};
	proto.setChildFilterRecursively = function(filter_fn) {
		_.each(this.children, function(child) {
			if(child instanceof My) {
				child.setChildFilterRecursively(filter_fn);
			}
		}, this);
		this.setChildFilter(filter_fn);
	};

	proto.isInitialized = function() {
		return this._initialized;
	};

	proto._childAdded = function(info) {
                if (!this._is_initialized) {
                   // console.log('queueEvent childrenChanged',this.getId());
                    var promise = getResolvablePromise();
                    this._queuedEvents.push({
                         info: info,
                         type: '_childAdded',
                         promise: promise
                    });
                } else {
		    var child = info.child,
			previousNode = info.previousNode,
			toAdd,
			addedAtIndex;

		    var tree = this.getTree();

		    log.debug('children updated ' + this.getId());
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
			var socket = this._getSocket();
			log.debug('Child ' + toAdd.getId() + ' added to ' + this.getId());
			socket.emit('childAdded', {
				parentId: this.getId(),
				child: toAdd.serialize(),
				previousChild: previousNodeId
			});
		  }
              }
	};

	proto._getState = function() {
		return this.options.state;
	};

	proto._childRemoved = function(info) {
                 if (!this._is_initialized) {
                   // console.log('queueEvent childrenChanged',this.getId());
                    var promise = getResolvablePromise();
                    this._queuedEvents.push({
                         info: info,
                         type: '_childRemoved',
                         promise: promise
                    });
                } else {
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
				var socket = this._getSocket();
				log.debug('Child ' + wasRemoved.getId() + ' removed  from ' + this.getId());
				socket.emit('childRemoved', {
					parentId: this.getId(),
					childId: wasRemoved.getId()
				});
			}
			wasRemoved.destroy();
		   }
                }
	};

	proto._childrenChanged = function(info) {
                if (!this._is_initialized) {
                   // console.log('queueEvent childrenChanged',this.getId());
                    var promise = getResolvablePromise();
                    this._queuedEvents.push({
                         info: info,
                         type: '_childrenChanged',
                         promise: promise
                    });
                } else {
		    log.debug('Children changed ' + this.getId());
		    var children = info.children;
		    this._updateChildren(children);

		    var socket = this._getSocket();
		    // console.log('socket emit Children changed ' + this.getId());
		    socket.emit('childrenChanged', {
				parentId: this.getId(),
				children: this.getChildren().map(function(child) { return child.serialize(); })
		    });
        }
	};

	proto._nodeValueChanged = function(info) {
                /* if (!this._is_initialized) {
                   // console.log('queueEvent childrenChanged',this.getId());
                    var promise = getResolvablePromise();
                    this._queuedEvents.push({
                         info: info,
                         type: '_nodeValueChanged',
                         promise: promise
                    });
                } else {*/
		    this._value = info.value;

		    var socket = this._getSocket();

		    log.debug('Value changed ' + this.getId());
		    socket.emit('valueChanged', {
			id: this.getId(),
			value: this._value
		    });
                //}
	};

	proto._updateChildren = function(treeChildren) {
		if(!treeChildren) {
			var tree = this.getTree();
			treeChildren = tree.getChildren();
		}
		this.children = _	.chain(treeChildren)
							.map(function(child) {
								var toAdd;
                                                                log.debug('childemited',child.getId());
								if(this.options.childFilterFunction.call(this, child)) {
									toAdd = this.options.childMapFunction.call(this, child);
								} else {
									toAdd = new DOMTreePlaceholder(child);
								}
								return toAdd;
							}, this)
							.value();
							/*
		var tree = this.getTree();
		return tree._children_initialized.then(_.bind(function() {
			log.debug('Children initialized ' + tree.getId());
		}, this)).catch(function(err) {
			console.error(err);
		});
		*/
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

        proto.ExecuteQueuedEvents = function() {
	        var tmp = [];
	        while(this._queuedEvents.length > 0) {
			    var queuedEvent = this._queuedEvents.shift();
				if ((queuedEvent.type == '_childAdded' || queuedEvent.type == '_childRemoved') && !this.ChildrenInitialized()) {
					// console.log('handleevent',queuedEvent.type,queuedEvent.info.child.getId(),"not executed yet");
					tmp.push (queuedEvent);
				} else {
					this._handleQueuedEvent(queuedEvent);
				}
			}
			while(tmp.length > 0) {
				var tmpEvent = tmp.shift();
				this._queuedEvents.push(tmpEvent);
			}
        };

	proto._handleQueuedEvent = function(eventInfo) {
		var eventType = eventInfo.type,
			info = eventInfo.info;
			promise = eventInfo.promise;
        if (info) {
           var val = this[eventType](info);
        } else {
           var val = this[eventType]();
        }

		promise.doResolve(val);
		return val;
	};

        proto.ChildrenInitialized = function () {
            if (this.numChildrenInit == this.children.length) {
                return true;
            } else {
                return false;
            }
        };

        proto.ChildInitialized = function () {
            if (this.numChildrenInit < this.children.length) {
                this.numChildrenInit++;
            }
            if (this.numChildrenInit == this.children.length) {
                this.ExecuteQueuedEvents();
            }
        };

	proto.serialize = function() {
		var tree = this.getTree(),
			node = tree._getNode(),
			parent = this.getParent(),
			parentId = parent ? parent.getId() : false;

		return {
			parentId: parentId,
			id: this.getId(),
			type: this._type,
			name: this._name,
			value: this._value,
			children: _.map(this.getChildren(), function(child) {
				return child.serialize();
			}),
			inlineStyle: this._inlineCSS,
			attributes: this._attributes,
			namespace: this._namespace,
			initialized: this._is_initialized
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
		this.$_valueUpdated = _.bind(this._valueUpdated, this);

		this._updateChildren();

		tree.on('childAdded', this.$_childAdded);
		tree.on('childRemoved', this.$_childRemoved);
		tree.on('childrenChanged', this.$_childrenChanged);
		var treeInitializedPromise = tree.isInitialized().then(_.bind(function() {
			this._value = tree.getNodeValue();
			this._namespace = tree.getNamespace();
			//console.log(tree.getNamespace(), tree.getNodeName());
			this._attributes = tree.getAttributesMap(this);
			this._inlineCSS = tree.getInlineStyle();
			//this._updateAttributes(tree.getAttributesMap());

			tree.on('attributesChanged', this.$_updateAttributes);
			tree.on('nodeValueChanged', this.$_nodeValueChanged);
			tree.on('inlineStyleChanged', this.$_inlineStyleChanged);
			tree.on('valueUpdated', this.$_valueUpdated);
		}, this)).then(_.bind(function() {
			var parent = this.getParent();
			if(parent) {
				return parent.isInitialized();
			} else {
				return false;
			}
		}, this)).then(_.bind(function(parent) {
			this._is_initialized = true;
			var socket = this._getSocket();
			if(parent) {
				var state = this._getState();
				if(state.sentServerReady()) {
					socket.emit('nodeInitialized', this.serialize());
                                        parent.ChildInitialized();
                                        this.ExecuteQueuedEvents();
				}
			} else {
				socket.emit('serverReady', this.serialize());
                                this.ExecuteQueuedEvents();
			}
			return this;
		}, this)).catch(function(err) {
			console.log(err);
			console.log(err.stack);
		});

		return treeInitializedPromise;
	};

	proto.destroy = function() {
		var tree = this.getTree();
		_.each(this.getChildren(), function(child) {
			child.destroy();
		});
                if (this.getId() === 3 ) {
                   console.log(new Error().stack);
                }
		tree.removeListener('childAdded', this.$_childAdded);
		tree.removeListener('childRemoved', this.$_childRemoved);
		tree.removeListener('childrenChanged', this.$_childrenChanged);

		tree.removeListener('attributesChanged', this.$_updateAttributes);
		tree.removeListener('nodeValueChanged', this.$_nodeValueChanged);
		tree.removeListener('inlineStyleChanged', this.$_inlineStyleChanged);
		tree.removeListener('valueUpdated', this.$_valueUpdated);

		//log.debug('::: DESTROYED DOM SHADOW ' + this.getId() + ' :::');
	};

	proto._valueUpdated = function(type, value) {
                 /*if (!this._is_initialized) {
                   // console.log('queueEvent childrenChanged',this.getId());
                    var promise = getResolvablePromise();
                    var info = {};
                    info['type'] = type;
                    info['value'] = value;
                    this._queuedEvents.push({
                         info: info,
                         type: '_valueUpdated',
                         promise: promise
                    });
                 } else {*/
		var socket = this._getSocket();
	    var tree = this.getTree();
		if(tree.isPasswordInput()) {
		} else {
			socket.emit('valueUpdated', {
				id: this.getId(),
				type: type,
				value: value
			});
		}
		// var type = type['type'],
		// value = type['value'];
                //}
	};

	proto.getId = function() {
		return this._id;
	};

	proto._postNewAttributes = function() {
               /*  if (!this._is_initialized) {
                   // console.log('queueEvent childrenChanged',this.getId());
                    var promise = getResolvablePromise();
                    this._queuedEvents.push({
                         type: '_postNewAttributes',
                         promise: promise
                    });
                } else {*/
		   var socket = this._getSocket();
		   socket.emit('attributesChanged', {
			id: this.getId(),
			attributes: this._attributes,
			inlineStyle: this._inlineCSS
		   });
                //}
	};

	proto._updateAttributes = function(attributesMap) {
		var tree = this.getTree();
		this._attributes = tree.getAttributesMap(this);
		this._postNewAttributes();
	};

	proto._inlineStyleChanged = function(event) {
		this._inlineCSS = event.inlineStyle;
		this._postNewAttributes();
	};

	proto._getSocket = function() {
		return this.options.socket;
	};
	proto.getParent = function() {
		return this.options.parent;
	};
	proto.getUserId = function() {
		var state = this._getState();
		return state.getUserId();
	};

}(ShadowDOM));

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
	ShadowDOM: ShadowDOM
};
