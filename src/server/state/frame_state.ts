import {TabState} from './tab_state';
import {DOMState} from './dom_state';
import {EventManager} from '../event_manager';
import {ResourceTracker} from '../resource_tracker';
import {getColoredLogger, level, setLevel} from '../../utils/logging';
import * as _ from 'underscore';

const log = getColoredLogger('green');

interface QueuedEvent<E> {
	event:E,
	promise:ResolvablePromise<E>,
	type:string
}

export class FrameState {
	private setMainFrameExecuted:boolean = false;
	private refreshingRoot:boolean = false;
	private root:DOMState;
	private domParent:DOMState = null;
	private nodeMap:Map<CRI.NodeID, DOMState> = new Map<CRI.NodeID, DOMState>();
	private oldNodeMap:Map<CRI.NodeID, boolean> = new Map<CRI.NodeID, boolean>();
	private queuedEvents:Array<QueuedEvent<any>> = [];
	private executionContext:CRI.ExecutionContextDescription = null;

	private eventManager:EventManager;
	public resourceTracker:ResourceTracker;

    constructor(private chrome, private info:CRI.Frame, private tab:TabState, resources:Array<CRI.FrameResource>=[]) {
		this.eventManager = new EventManager(this.chrome, this);
		this.resourceTracker = new ResourceTracker(chrome, this, resources);
		this.refreshRoot();
		log.debug(`=== CREATED FRAME STATE ${this.getFrameId()} ====`);
	};
	public getTab():TabState {
		return this.tab;
	}
	public markSetMainFrameExecuted(val:boolean):void {
		this.setMainFrameExecuted = val;
	};
	private getDOMStateWithID(nodeId:CRI.NodeID):DOMState {
		return this.nodeMap.get(nodeId);
	};
	private hasDOMStateWithID(nodeId:CRI.NodeID):boolean {
		return this.nodeMap.has(nodeId);
	}
	public getURL():string {
		return this.info.url;
	};
	public getTabId():CRI.TabID {
		return this.tab.getTabId();
	}
// 	proto._getWrappedDOMNodeWithID = function(id) {
// 		return this._nodeMap[id];
// 	};
    public updateInfo(info:CRI.Frame) {
		this.info = info;
    };
    public requestWillBeSent(resource) {

    };
    public responseReceived(event) {

    };
    public executionContextCreated(context:CRI.ExecutionContextDescription):void {
		this.executionContext = context;
    };
	private isRefreshingRoot():boolean { return this.refreshingRoot; }
	private markRefreshingRoot(r:boolean):void {
		if(r) {
			this.refreshingRoot = true;
		} else {
			this.refreshingRoot = false;

			while(this.queuedEvents.length > 0) {
				var queuedEvent = this.queuedEvents.shift();
				this.handleQueuedEvent(queuedEvent);
			}
		}
	};
	private handleQueuedEvent(eventInfo:any):void {
		const {type, event, promise} = eventInfo;
		const val = this[type](event);
		promise.doResolve(val);
		// return val;
	};

    public destroy() {
    };
	public getFrameId():CRI.FrameID {
		return this.info.id;
	}
	public getRoot():DOMState {
		return this.root;
	}
	public setRoot(rootNode:CRI.Node):void {
		const oldRoot:DOMState = this.getRoot();
		if(oldRoot) {
			oldRoot.destroy();
		}
		if(rootNode) {
			const rootState =  this.getOrCreateDOMState(rootNode);
			this.root = rootState;
			this.setChildrenRecursive(rootState, rootNode.children);
			this.markRefreshingRoot(false);
		}
	}
	private setChildrenRecursive(parentState:DOMState, children:Array<CRI.Node>):DOMState {
		if(children) {
			parentState.setChildren(children.map((child:CRI.Node) => {
				return this.setChildrenRecursive(this.getOrCreateDOMState(child, parentState), child.children);
			}));
		}
		return parentState;
	}
	private getOrCreateDOMState(node:CRI.Node, parent:DOMState=null, previousNode:DOMState=null):DOMState {
		const {nodeId} = node;
		if(this.hasDOMStateWithID(nodeId)) {
			return this.getDOMStateWithID(nodeId);
		} else {
			const domState = new DOMState(this.chrome, node, this, parent);
			domState.once('destroyed', () => {
				this.removeDOMState(domState);
			})
			this.nodeMap.set(nodeId, domState);
			if(parent) {
				parent.insertChild(domState, previousNode);
			}
			return domState;
		}
	}
	private removeDOMState(domState:DOMState):void {
		const nodeId = domState.getNodeId();
		if(this.hasDOMStateWithID(nodeId)) {
			this.nodeMap.delete(nodeId);
			this.oldNodeMap.set(nodeId, true);
		}
	}
	private refreshRoot():Promise<CRI.Node> {
		this.markRefreshingRoot(true);
		return this.tab.getDocument().then((root:CRI.Node) => {
			this.setRoot(root);
			return root;
		});
	}
	private doHandleDocumentUpdated(event:CRI.DocumentUpdatedEvent):boolean {
		return true;
	};
	private doHandleCharacterDataModified(event:CRI.CharacterDataModifiedEvent):boolean {
		const {nodeId} = event;
		const domState = this.getDOMStateWithID(nodeId);
		if(domState) {
			log.debug(`Character Data Modified ${nodeId}`)
			domState.setCharacterData(event.characterData);
			return true;
		} else {
			return false;
		}
	}
	private doHandleSetChildNodes(event:CRI.SetChildNodesEvent):boolean {
		const {parentId} = event;
		const parent = this.getDOMStateWithID(parentId);
		if(parent) {
			const {nodes} = event;
			log.debug(`Set child nodes ${parentId} -> [${nodes.map((node) => node.nodeId).join(', ')}]`);
			this.setChildrenRecursive(parent, nodes);
			return true;
		} else {
			return false;
		}
	};
	private doHandleInlineStyleInvalidated(event:CRI.InlineStyleInvalidatedEvent):boolean {
		const {nodeIds} = event;
		const updatedInlineStyles:Array<boolean> = nodeIds.map((nodeId) => {
			const node = this.getDOMStateWithID(nodeId);
			if(node) {
				node.updateInlineStyle();
				return true;
			} else {
				return false;
			}
		});
		return _.any(updatedInlineStyles);
	};
	private doHandleChildNodeCountUpdated(event:CRI.ChildNodeCountUpdatedEvent):boolean {
		const {nodeId} = event;
		const domState = this.getDOMStateWithID(nodeId);
		if(domState) {
			log.debug(`Child count updated for ${nodeId}`);
			domState.childCountUpdated(event.childNodeCount);
			return true;
		} else {
			return false;
		}
	}
	private doHandleChildNodeInserted(event:CRI.ChildNodeInsertedEvent):boolean {
		const {parentNodeId} = event;
		const parentDomState = this.getDOMStateWithID(parentNodeId);
		if(parentDomState) {
			const {previousNodeId, node} = event;
			const {nodeId} = node;
			const previousDomState:DOMState = previousNodeId > 0 ? this.getDOMStateWithID(previousNodeId) : null;
			const domState = this.getOrCreateDOMState(node, parentDomState, previousDomState);

			log.debug(`Child node inserted ${nodeId} (parent: ${parentNodeId} / previous: ${previousNodeId})`);
			this.setChildrenRecursive(domState, node.children);
			const tab = this.getTab();
			tab.requestChildNodes(nodeId);
			return true;
		} else {
			return false;
		}
	}
	private doHandleChildNodeRemoved(event:CRI.ChildNodeRemovedEvent):boolean {
		const {parentNodeId, nodeId} = event;
		const domState = this.getDOMStateWithID(nodeId);
		const parentDomState = this.getDOMStateWithID(parentNodeId);
		if(domState && parentDomState) {
			log.debug(`Child node removed ${nodeId} (parent: ${parentNodeId})`);
			parentDomState.removeChild(domState);
			return true;
		} else {
			return false;
		}
	};
	private doHandleAttributeModified(event:CRI.AttributeModifiedEvent) {
		const {nodeId} = event;
		const domState = this.getDOMStateWithID(nodeId);
		if(domState) {
			const {name, value} = event;
			log.debug(`Attribute modified ${name} to ${value}`);
			domState.setAttribute(name, value);
			return true;
		} else {
			return false;
		}
	}
	private doHandleAttributeRemoved(event:CRI.AttributeRemovedEvent) {
		const {nodeId} = event;
		const domState = this.getDOMStateWithID(nodeId);
		if(domState) {
			const {name} = event;
			log.debug(`Attribute removed ${name}`);
			domState.removeAttribute(name);
			return true;
		} else {
			return false;
		}
	}

	public handleFrameEvent(event:any, eventType:string):Promise<boolean> {
		if(this.isRefreshingRoot()) {
			const resolvablePromise = new ResolvablePromise<any>();
			log.debug(`(queue) ${eventType}`);
			this.queuedEvents.push({
				event: event,
				type: eventType,
				promise: resolvablePromise
			});
			return resolvablePromise.getPromise().then(() => {
				switch(eventType) {
					case 'documentUpdated':
						return this.doHandleDocumentUpdated(event as CRI.DocumentUpdatedEvent);
					case 'setChildNodes':
						return this.doHandleSetChildNodes(event as CRI.SetChildNodesEvent);
					case 'inlineStyleInvalidated':
						return this.doHandleInlineStyleInvalidated(event as CRI.InlineStyleInvalidatedEvent);
					case 'childNodeCountUpdated':
						return this.doHandleChildNodeCountUpdated(event as CRI.ChildNodeCountUpdatedEvent);
					case 'childNodeInserted':
						return this.doHandleChildNodeInserted(event as CRI.ChildNodeInsertedEvent);
					case 'childNodeRemoved':
						return this.doHandleChildNodeRemoved(event as CRI.ChildNodeRemovedEvent);
					case 'attributeModified':
						return this.doHandleAttributeModified(event as CRI.AttributeModifiedEvent);
					case 'attributeRemoved':
						return this.doHandleAttributeRemoved(event as CRI.AttributeRemovedEvent);
					case 'characterDataModified':
						return this.doHandleCharacterDataModified(event as CRI.CharacterDataModifiedEvent);
				}
			}).catch((err) => {
				throw(err);
			});
		}
	}
	public requestResource(url:string):Promise<any> {
		return this.resourceTracker.getResource(url);
	}
// 	proto.refreshRoot = function() {
// 		var page = this.getPage();
// 		this._markRefreshingRoot(true);
// 		return page._getDocument().then(_.bind(function(doc) {
// 			var root = doc.root;
// 			this.setRoot(root);
// 		}, this));
// 	};
// 	proto._getWrappedDOMNode = function(node, parent) {
// 		var id = node.nodeId;
// 		if(this._hasWrappedDOMNodeWithID(id)) {
// 			return this._getWrappedDOMNodeWithID(id);
// 		} else {
// 			var node = new DOMState({
// 				parent: parent,
// 				node: node,
// 				chrome: this._getChrome(),
// 				frame: this
// 			});
// 			node.once('destroyed', _.bind(function() {
// 				this._removeWrappedNode(node);
// 			}, this));
// 			return this._nodeMap[id] = node;
// 		}
// 	};
// 	proto.setRoot = function(rootNode){ //smfe goes for set main frame executed
// 		var oldRoot = this.getRoot();
// 		if(oldRoot) {
// 			oldRoot.destroy();
// 		}
// 		if(rootNode) {
// 			var root = this._getWrappedDOMNode(rootNode, false);
// 			var chrome = this._getChrome();
// 			this._root = this._setChildrenRecursive(root, rootNode.children);
//
// 			var page = this.getPage();
// 			page.requestChildNodes(rootNode.nodeId, -1);
//             //console.log('setroot rootnode',new Error().stack);
//             var smfe = this.getSetMainFrameExecuted();
//             this.setSetMainFrameExecuted(false);
//             var destroy;
//             if (smfe) {
// 			  destroy = false;
//             } else {
//               destroy = true;
//             }
//
// 			this.emit('rootInvalidated', destroy);
// 			this._markRefreshingRoot(false);
// 		}
// 		return this._root;
// 	};
}
// var _ = require('underscore'),
// 	util = require('util'),
// 	EventEmitter = require('events'),
// 	EventManager = require('../event_manager').EventManager,
// 	ResourceTracker = require('../resource_tracker').ResourceTracker,
// 	DOMState = require('./dom_state').DOMState;
// var log = require('../../utils/logging').getColoredLogger('green');
//
// var FrameState = function(options) {
// 	var chrome = options.chrome;
// 	this._markRefreshingRoot(true);
//
// 	this.chrome = chrome;
// 	this.options = options;
//         this.setMainFrameExecuted = false;
//
// 	this._domParent = false;
// 	this._nodeMap = {};
// 	this._oldNodeMap = {};
// 	this._queuedEvents = [];
// 	this._executionContext = false;
// 	this._root = false;
// 	this.eventManager = new EventManager(chrome, this);
//
// 	this._resourceTracker = new ResourceTracker(chrome, this, options.resources);
// 	log.debug('=== CREATED FRAME STATE', this.getFrameId(), ' ====');
// };
//
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
//
// 	proto.executionContextCreated = function(context) {
// 		this._executionContext = context;
// 	};
//
//     proto.getSetMainFrameExecuted = function() {
//         return this.setMainFrameExecuted;
//     };
//
//     proto.setSetMainFrameExecuted = function(val) {
// 		this.setMainFrameExecuted = val;
//     };
//
// 	proto.getFrameStack = function() {
// 		var frame = this;
// 		var rv = [];
// 		while(frame) {
// 			rv.unshift(frame);
// 			frame = frame.getParentFrame();
// 		}
// 		return rv;
// 	};
//
// 	proto.setDOMParent = function(parent) {
// 		this._domParent = parent;
// 	};
//
// 	proto.getDOMParent = function() {
// 		return this._domParent;
// 	};
//
// 	proto.onDeviceEvent = function(event) {
// 		return this.eventManager.onDeviceEvent.apply(this.eventManager, arguments);
// 	};
//
// 	proto.getExecutionContext = function() {
// 		return this._executionContext;
// 	};
//
// 	proto.getResourceTracker = function() {
// 		return this._resourceTracker;
// 	};
//
// 	proto.print = function(level) {
// 		this.getRoot().print(level);
// 	};
//
// 	proto.serialize = function() {
// 		return this.getRoot().serialize()
// 	};
//
// 	proto.refreshRoot = function() {
// 		var page = this.getPage();
// 		this._markRefreshingRoot(true);
// 		return page._getDocument().then(_.bind(function(doc) {
// 			var root = doc.root;
// 			this.setRoot(root);
// 		}, this));
// 	};
//
// 	proto._handleQueuedEvent = function(eventInfo) {
// 		var eventType = eventInfo.type,
// 			event = eventInfo.event,
// 			promise = eventInfo.promise;
//
//         if (eventType === 'documentUpdated') {
// 		   var val = this[eventType](event);
//         } else {
//            var val = this[eventType](event);
//         }
// 		promise.doResolve(val);
// 		return val;
// 	};
//
// 	proto.summarize = function() {
// 		this.getRoot().summarize();
// 	};
//
// 	proto.getStyleSheets = function() {
// 		var sheets = _.values(this._styleSheets);
//
// 		return Promise.all(sheets).then(function(texts) {
// 			return texts;
// 		});
// 	};
//
// 	proto.requestResource = function(url) {
// 		var resourceTracker = this.getResourceTracker();
// 		return resourceTracker.getResource(url);
// 	};
//
// 	proto._getResourceTree = function() {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.Page.getResourceTree({}, function(err, val) {
// 				if(err) { reject(val); }
// 				else { resolve(val); }
// 			});
// 		});
// 	};
//
// 	proto.setChildNodes = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Character Data Modified');
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'setChildNodes',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var parent = this._getWrappedDOMNodeWithID(event.parentId);
//
// 			if(parent) {
// 				var nodes = event.nodes;
//
// 				log.debug('Set Child Nodes ' + event.parentId + ' -> ['+_.map(event.nodes, function(node) { return node.nodeId; }).join(', ')+']');
//
// 				this._setChildrenRecursive(parent, nodes);
// 				return true;
// 			} else if(this._oldNodeMap[event.parentId]) {
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
// 	proto.documentUpdated = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Character Data Modified');
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'documentUpdated',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			console.log('Document Updated');
// 			this.refreshRoot();
// 			return true;
// 		}
// 	};
// 	proto.characterDataModified = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Character Data Modified');
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'characterDataModified',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var node = this._getWrappedDOMNodeWithID(event.nodeId);
// 			if(node) {
// 				log.debug('Character Data Modified ' + event.nodeId);
// 				node._setCharacterData(event.characterData);
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
// 	proto.childNodeRemoved = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Child Node Removed');
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'childNodeRemoved',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var node = this._getWrappedDOMNodeWithID(event.nodeId),
// 				parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);
//
// 			if(node && parentNode) {
// 				log.debug('Child Node Removed ' + event.nodeId + ' (parent: ' + event.parentNodeId + ')');
//
// 				parentNode._removeChild(node);
// 				node.destroy();
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
// 	proto.childNodeInserted = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Child Node Inserted');
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'childNodeInserted',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var parentNode = this._getWrappedDOMNodeWithID(event.parentNodeId);
//
// 			if(parentNode) {
// 				var previousNode = event.previousNodeId > 0 ? this._getWrappedDOMNodeWithID(event.previousNodeId) : false,
// 					wrappedNode = this._getWrappedDOMNode(event.node, parentNode);
//
// 				log.debug('Child Node Inserted ' + event.node.nodeId + ' (parent: ' + event.parentNodeId + ' / previous: ' + event.previousNodeId + ')');
// 				if(!parentNode) {
// 					this.summarize();
// 				}
//
// 				this._setChildrenRecursive(wrappedNode, event.node.children);
// 				this.getPage().requestChildNodes(wrappedNode.getId()).then(_.bind(function(childNodes) {
// 				}, this));
// 				parentNode._insertChild(wrappedNode, previousNode);
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
// 	proto.attributeModified = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Attribute Modified');
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'attributeModified',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var node = this._getWrappedDOMNodeWithID(event.nodeId);
// 			if(node) {
// 				log.debug('Attribute modified');
// 				node._setAttribute(event.name, event.value);
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
// 	proto.attributeRemoved = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Attribute Removed');
//
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'attributeRemoved',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var node = this._getWrappedDOMNodeWithID(event.nodeId);
// 			if(node) {
// 				log.debug('Attribute removed');
// 				node._removeAttribute(event.name);
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
// 	proto.childNodeCountUpdated = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Child Count Updated');
//
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'childNodeCountUpdated',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var node = this._getWrappedDOMNodeWithID(event.nodeId);
// 			if(node) {
// 				log.debug('Child Count Updated');
// 				node._childCountUpdated(event.childNodeCount);
// 				return true;
// 			} else {
// 				return false;
// 			}
// 		}
// 	};
//
// 	proto.inlineStyleInvalidated = function(event) {
// 		if(this._isRefreshingRoot()) {
// 			log.debug('(queue) Inline Style Invalidated');
//
// 			var promise = getResolvablePromise();
// 			this._queuedEvents.push({
// 				event: event,
// 				type: 'inlineStyleInvalidated',
// 				promise: promise
// 			});
// 			return promise;
// 		} else {
// 			var hasAnyNode = false;
// 			_.each(event.nodeIds, function(nodeId) {
// 				var node = this._getWrappedDOMNodeWithID(nodeId);
// 				if(node) {
// 					node.updateInlineStyle();
// 					hasAnyNode = true;
// 				}
// 			}, this);
//
// 			if(hasAnyNode) {
// 				//log.debug('Inline Style Invalidated');
// 			}
// 			return hasAnyNode;
// 		}
// 	};
//
// 	proto.getRoot = function() {
// 		return this._root;
// 	};
//
// 	proto.findNode = function(nodeId) {
// 		if(this._hasWrappedDOMNodeWithID(nodeId)) {
// 			return this._getWrappedDOMNodeWithID(nodeId);
// 		}
// 	};
//
// 	proto._getWrappedDOMNode = function(node, parent) {
// 		var id = node.nodeId;
// 		if(this._hasWrappedDOMNodeWithID(id)) {
// 			return this._getWrappedDOMNodeWithID(id);
// 		} else {
// 			var node = new DOMState({
// 				parent: parent,
// 				node: node,
// 				chrome: this._getChrome(),
// 				frame: this
// 			});
// 			node.once('destroyed', _.bind(function() {
// 				this._removeWrappedNode(node);
// 			}, this));
// 			return this._nodeMap[id] = node;
// 		}
// 	};
//
// 	proto._hasWrappedDOMNodeWithID = function(id) {
// 		return this._nodeMap.hasOwnProperty(id);
// 	};
//
// 	proto._getWrappedDOMNodeWithID = function(id) {
// 		return this._nodeMap[id];
// 	};
//
// 	proto._removeWrappedNode = function(node) {
// 		var id = node.getId();
// 		if(this._hasWrappedDOMNodeWithID(id)) {
// 			var wrappedNode = this._getWrappedDOMNodeWithID(id);
// 			delete this._nodeMap[id];
// 			this._oldNodeMap[id] = true;
// 		}
// 	};
//
// 	proto._setChildrenRecursive = function(parentNode, children) {
// 		return parentNode._setChildren(_.map(children, function(child) {
// 			return this._setChildrenRecursive(this._getWrappedDOMNode(child, parentNode), child.children);
// 		}, this));
// 	};
// 	proto.getParentFrame = function() {
// 		return this.options.parentFrame;
// 	};
//
// 	proto.setRoot = function(rootNode){ //smfe goes for set main frame executed
// 		var oldRoot = this.getRoot();
// 		if(oldRoot) {
// 			oldRoot.destroy();
// 		}
// 		if(rootNode) {
// 			var root = this._getWrappedDOMNode(rootNode, false);
// 			var chrome = this._getChrome();
// 			this._root = this._setChildrenRecursive(root, rootNode.children);
//
// 			var page = this.getPage();
// 			page.requestChildNodes(rootNode.nodeId, -1);
//             //console.log('setroot rootnode',new Error().stack);
//             var smfe = this.getSetMainFrameExecuted();
//             this.setSetMainFrameExecuted(false);
//             var destroy;
//             if (smfe) {
// 			  destroy = false;
//             } else {
//               destroy = true;
//             }
//
// 			this.emit('rootInvalidated', destroy);
// 			this._markRefreshingRoot(false);
// 		}
// 		return this._root;
// 	};
//
// 	proto._isRefreshingRoot = function() {
// 		return this._refreshingRoot;
// 	};
//
// 	proto._markRefreshingRoot = function(val) {
//                 // console.log(val,new Error().stack);
// 		if(val) {
// 			this._refreshingRoot = true;
// 		} else {
// 			this._refreshingRoot = false;
//
// 			while(this._queuedEvents.length > 0) {
// 				var queuedEvent = this._queuedEvents.shift();
//                                // console.log('queuedEvent');
// 				this._handleQueuedEvent(queuedEvent);
// 			}
// 		}
// 	};
//
//
// 	proto.navigated = function(event) {
// 		//console.log('new url is', event.frame.url, this.getFrameId());
// 		_.extend(this.options, event.frame);
// 		if(!this.options.url) {
// 			log.error(this.options);
// 		}
// 	};
//
// 	proto.destroy = function() {
// 		var root = this.getRoot();
// 		if(root) {
// 			root.destroy();
// 		}
// 		var resourceTracker = this.getResourceTracker();
// 		resourceTracker.destroy();
// 		log.debug('=== DESTROYED FRAME STATE', this.getFrameId(), ' ====');
// 	};
//
// 	proto._getChrome = function() {
// 		return this.chrome;
// 	};
// 	proto.getFrameId = function() {
// 		return this.options.id;
// 	};
// 	proto.getTabId = function() {
// 		return this.getPage().getTabId();
// 	};
// 	proto.getURL = function() {
// 		//console.log(this.options.url, this.getFrameId());
// 		return this.options.url;
// 	};
// 	proto.getPage = function() {
// 		return this.options.page;
// 	};
// 	proto.querySelectorAll = function() {
// 		var root = this.getRoot();
// 		if(root) {
// 			return root.querySelectorAll.apply(root, arguments);
// 		} else {
// 			return new Promise(function(resolve, reject) {
// 				reject(new Error('Could not find root'));
// 			});
// 		}
//
// 	};
// }(FrameState));
//
// function getResolvablePromise() {
// 	var resolv, rejec;
// 	var promise = new Promise(function(resolve, reject) {
// 		resolv = resolve;
// 		rejec = reject;
// 	});
// 	promise.doResolve = resolv;
// 	promise.doReject = rejec;
// 	return promise;
// }
//
// module.exports = {
// 	FrameState: FrameState
// };
class ResolvablePromise<E> {
	private _resolve:(E)=>any;
	private _reject:(any)=>any;
	private _promise:Promise<E>;
	constructor() {
		this._promise = new Promise<E>((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}
	public resolve(val:E):void {
		this._resolve(val);
	}
	public reject(val:any):void {
		this._reject(val);
	}
	public getPromise():Promise<E> {
		return this._promise;
	}
}
