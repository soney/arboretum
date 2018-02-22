"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cri = require("chrome-remote-interface");
const frame_state_1 = require("./frame_state");
const dom_state_1 = require("./dom_state");
const logging_1 = require("../../utils/logging");
const _ = require("underscore");
const events_1 = require("events");
const url_1 = require("url");
const log = logging_1.getColoredLogger('yellow');
;
class TabState extends events_1.EventEmitter {
    constructor(info) {
        super();
        this.info = info;
        this.frames = new Map();
        this.pendingFrameEvents = new Map();
        this.nodeMap = new Map();
        this.onFrameAttached = (frameInfo) => {
            const { frameId, parentFrameId } = frameInfo;
            this.createFrameState({
                id: frameId,
                parentId: parentFrameId
            });
        };
        this.onFrameNavigated = (frameInfo) => {
            const { frame } = frameInfo;
            const { id, url } = frame;
            let frameState;
            if (this.hasFrame(id)) {
                frameState = this.getFrame(id);
            }
            else {
                frameState = this.createFrameState(frame);
            }
            frameState.updateInfo(frame);
        };
        this.onFrameDetached = (frameInfo) => {
            const { frameId } = frameInfo;
            this.destroyFrame(frameId);
        };
        this.requestWillBeSent = (event) => {
            const { frameId } = event;
            if (this.hasFrame(frameId)) {
                const frame = this.getFrame(frameId);
                frame.requestWillBeSent(event);
            }
            else {
                this.addPendingFrameEvent({
                    frameId: frameId,
                    event: event,
                    type: 'requestWillBeSent'
                });
            }
        };
        this.responseReceived = (event) => {
            const { frameId } = event;
            if (this.hasFrame(frameId)) {
                this.getFrame(frameId).responseReceived(event);
            }
            else {
                this.addPendingFrameEvent({
                    frameId: frameId,
                    event: event,
                    type: 'responseReceived'
                });
            }
        };
        this.executionContextCreated = (event) => {
            const { context } = event;
            const { auxData } = context;
            const { frameId } = auxData;
            if (this.hasFrame(frameId)) {
                const frameState = this.getFrame(frameId);
                frameState.executionContextCreated(context);
            }
            else {
                log.error(`Could not find frame ${frameId} for execution context`);
            }
        };
        this.doHandleDocumentUpdated = (event) => {
            log.debug(`Document Updated`);
        };
        this.doHandleCharacterDataModified = (event) => {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                log.debug(`Character Data Modified ${nodeId}`);
                domState.setCharacterData(event.characterData);
            }
            else {
                console.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        };
        this.doHandleSetChildNodes = (event) => {
            const { parentId } = event;
            const parent = this.getDOMStateWithID(parentId);
            if (parent) {
                const { nodes } = event;
                log.debug(`Set child nodes ${parentId} -> [${nodes.map((node) => node.nodeId).join(', ')}]`);
                this.setChildrenRecursive(parent, nodes);
            }
            else {
                console.error(`Could not find ${parentId}`);
                // throw new Error(`Could not find ${parentId}`);
            }
        };
        this.doHandleInlineStyleInvalidated = (event) => {
            const { nodeIds } = event;
            const updatedInlineStyles = nodeIds.map((nodeId) => {
                const node = this.getDOMStateWithID(nodeId);
                if (node) {
                    node.updateInlineStyle();
                    return true;
                }
                else {
                    return false;
                }
            });
            if (_.any(updatedInlineStyles)) {
                log.debug(`Set inline styles`);
            }
            else {
                console.error(`Could not find nodes for inlineStyleInvalidated`);
                // throw new Error(`Could not find nodes for inlineStyleInvalidated`);
            }
        };
        this.doHandleChildNodeCountUpdated = (event) => {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                log.debug(`Child count updated for ${nodeId}`);
                domState.childCountUpdated(event.childNodeCount);
            }
            else {
                log.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        };
        this.doHandleChildNodeInserted = (event) => {
            const { parentNodeId } = event;
            const parentDomState = this.getDOMStateWithID(parentNodeId);
            if (parentDomState) {
                const { previousNodeId, node } = event;
                const { nodeId } = node;
                const previousDomState = previousNodeId > 0 ? this.getDOMStateWithID(previousNodeId) : null;
                const domState = this.getOrCreateDOMState(node, null, null, parentDomState, previousDomState);
                log.debug(`Child node inserted ${nodeId} (parent: ${parentNodeId} / previous: ${previousNodeId})`);
                this.setChildrenRecursive(domState, node.children);
                this.requestChildNodes(nodeId, -1, true);
            }
            else {
                console.error(`Could not find ${parentNodeId}`);
                // throw new Error(`Could not find ${parentNodeId}`);
            }
        };
        this.doHandleChildNodeRemoved = (event) => {
            const { parentNodeId, nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            const parentDomState = this.getDOMStateWithID(parentNodeId);
            if (domState && parentDomState) {
                log.debug(`Child node removed ${nodeId} (parent: ${parentNodeId})`);
                parentDomState.removeChild(domState);
            }
            else {
                throw new Error(`Could not find ${parentNodeId} or ${nodeId}`);
            }
        };
        this.doHandleAttributeModified = (event) => {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                const { name, value } = event;
                log.debug(`Attribute modified ${name} to ${value}`);
                domState.setAttribute(name, value);
            }
            else {
                console.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        };
        this.doHandleAttributeRemoved = (event) => {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                const { name } = event;
                log.debug(`Attribute removed ${name}`);
                domState.removeAttribute(name);
            }
            else {
                console.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        };
        const chromeEventEmitter = cri({
            chooseTab: this.info
        });
        this.chromePromise = new Promise((resolve, reject) => {
            chromeEventEmitter.once('connect', (chrome) => {
                this.chrome = chrome;
                resolve(chrome);
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
        this.chromePromise.then(() => {
            //TODO: Convert getResourceTree call to getFrameTree when supported
            this.getResourceTree().then((tree) => {
                const { frameTree } = tree;
                const { frame, childFrames, resources } = frameTree;
                this.createFrameState(frame, null, childFrames, resources);
            });
            this.refreshRoot();
            this.addFrameListeners();
            this.addDOMListeners();
            this.addNetworkListeners();
            this.addExecutionContextListeners();
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
        log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
    }
    ;
    getShareDBPath() {
        return [this.getTabId()];
    }
    ;
    getRootFrame() {
        return this.rootFrame;
    }
    evaluate(expression, frameId = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const frame = frameId ? this.getFrame(frameId) : this.getRootFrame();
            const executionContext = frame.getExecutionContext();
            return new Promise((resolve, reject) => {
                this.chrome.Runtime.evaluate({
                    contextId: executionContext.id,
                    expression: expression
                }, (err, result) => {
                    if (err) {
                        reject(result);
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        });
    }
    ;
    getChrome() {
        return this.chrome;
    }
    ;
    setDocument(root) {
        if (this.domRoot) {
            this.domRoot.destroy();
        }
        this.domRoot = this.getOrCreateDOMState(root);
        this.setChildrenRecursive(this.domRoot, root.children);
    }
    ;
    getDOMStateWithID(nodeId) {
        return this.nodeMap.get(nodeId);
    }
    ;
    hasDOMStateWithID(nodeId) {
        return this.nodeMap.has(nodeId);
    }
    getOrCreateDOMState(node, contentDocument, childFrame, parent, previousNode) {
        const { nodeId } = node;
        if (this.hasDOMStateWithID(nodeId)) {
            return this.getDOMStateWithID(nodeId);
        }
        else {
            const domState = new dom_state_1.DOMState(node, this, contentDocument, childFrame, parent);
            domState.once('destroyed', () => {
                this.removeDOMState(domState);
            });
            this.nodeMap.set(nodeId, domState);
            if (parent) {
                parent.insertChild(domState, previousNode, node);
            }
            return domState;
        }
    }
    refreshRoot() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getDocument(-1, true).then((root) => {
                this.setDocument(root);
                return root;
            });
        });
    }
    ;
    createFrameState(info, parentFrame = null, childFrames = [], resources = []) {
        const { id, parentId } = info;
        const frameState = new frame_state_1.FrameState(this.chrome, info, this, parentFrame, resources);
        this.frames.set(id, frameState);
        if (!parentId) {
            this.setRootFrame(frameState);
            this.refreshRoot();
        }
        this.updateFrameOnEvents(frameState);
        childFrames.forEach((childFrame) => {
            const { frame, childFrames, resources } = childFrame;
            this.createFrameState(frame, frameState, childFrames, resources);
        });
        return frameState;
    }
    getTabId() { return this.info.id; }
    addFrameListeners() {
        this.chrome.Page.enable();
        this.chrome.Page.frameAttached(this.onFrameAttached);
        this.chrome.Page.frameDetached(this.onFrameDetached);
        this.chrome.Page.frameNavigated(this.onFrameNavigated);
    }
    addNetworkListeners() {
        this.chrome.Network.enable();
        this.chrome.Network.requestWillBeSent(this.requestWillBeSent);
        this.chrome.Network.responseReceived(this.responseReceived);
    }
    ;
    addExecutionContextListeners() {
        this.chrome.Runtime.enable();
        this.chrome.Runtime.executionContextCreated(this.executionContextCreated);
    }
    ;
    addDOMListeners() {
        this.chrome.on('DOM.attributeRemoved', this.doHandleAttributeRemoved);
        this.chrome.on('DOM.attributeModified', this.doHandleAttributeModified);
        this.chrome.on('DOM.characterDataModified', this.doHandleCharacterDataModified);
        this.chrome.on('DOM.childNodeInserted', this.doHandleChildNodeInserted);
        this.chrome.on('DOM.childNodeRemoved', this.doHandleChildNodeRemoved);
        this.chrome.on('DOM.setChildNodes', this.doHandleSetChildNodes);
        this.chrome.on('DOM.childNodeCountUpdated', this.doHandleChildNodeCountUpdated);
        this.chrome.on('DOM.inlineStyleInvalidated', this.doHandleInlineStyleInvalidated);
        this.chrome.on('DOM.documentUpdated', this.doHandleDocumentUpdated);
    }
    ;
    requestChildNodes(nodeId, depth = 1, pierce = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.chrome.DOM.requestChildNodes({ nodeId, depth, pierce }, (err, val) => {
                    if (err) {
                        reject(val);
                    }
                    else {
                        resolve(val);
                    }
                });
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    ;
    requestResource(url, frameId) {
        const frame = this.getFrame(frameId);
        return frame.requestResource(url);
    }
    ;
    getTitle() { return this.info.title; }
    ;
    getURL() { return this.info.url; }
    ;
    setTitle(title) {
        this.info.title = title;
    }
    ;
    setURL(url) {
        this.info.url = url;
    }
    ;
    updateInfo(tabInfo) {
        const { title, url } = tabInfo;
        this.setTitle(title);
        this.setURL(url);
    }
    ;
    describeNode(nodeId, depth = -1) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.chrome.DOM.describeNode({
                    nodeId, depth
                }, (err, result) => {
                    if (err) {
                        reject(result);
                    }
                    else {
                        resolve(result.node);
                    }
                });
            }).catch((err) => {
                console.error(err);
                throw (err);
            });
        });
    }
    ;
    setRootFrame(frame) {
        if (this.rootFrame) {
            this.frames.forEach((frame, id) => {
                if (id !== frame.getFrameId()) {
                    this.destroyFrame(id);
                }
            });
        }
        log.info(`Set main frame to ${frame.getFrameId()}`);
        this.rootFrame = frame;
        frame.markSetMainFrameExecuted(true);
        this.emit('mainFrameChanged');
        /*
        return this.getDocument().then((root: CRI.Node) => {
            this.rootFrame.setRoot(root);
            this.emit('mainFrameChanged');
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
        */
    }
    navigate(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsedURL = url_1.parse(url);
            if (!parsedURL.protocol) {
                parsedURL.protocol = 'http';
            }
            url = url_1.format(parsedURL);
            return new Promise((resolve, reject) => {
                this.chrome.Page.navigate({ url }, (err, result) => {
                    if (err) {
                        throw (err);
                    }
                    else {
                        resolve(result.frameId);
                    }
                });
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    updateFrameOnEvents(frameState) {
        const frameId = frameState.getFrameId();
        const pendingFrameEvents = this.pendingFrameEvents.get(frameId);
        if (pendingFrameEvents) {
            const resourceTracker = frameState.resourceTracker;
            pendingFrameEvents.forEach((eventInfo) => {
                const { type, event } = eventInfo;
                if (type === 'responseReceived') {
                    resourceTracker.responseReceived(event);
                }
                else if (type === 'requestWillBeSent') {
                    resourceTracker.requestWillBeSent(event);
                }
            });
            this.pendingFrameEvents.delete(frameId);
        }
    }
    ;
    addPendingFrameEvent(eventInfo) {
        const { frameId } = eventInfo;
        if (this.pendingFrameEvents.has(frameId)) {
            this.pendingFrameEvents.get(frameId).push(eventInfo);
        }
        else {
            this.pendingFrameEvents.set(frameId, [eventInfo]);
        }
    }
    getFrame(id) { return this.frames.get(id); }
    hasFrame(id) { return this.frames.has(id); }
    getFrameTree() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not supported yet");
            // return new Promise<CRI.FrameTree>((resolve, reject) => {
            //     this.chrome.Page.getFrameTree({}, (err, value:CRI.FrameTree) => {
            //         if(err) { reject(value); }
            //         else { resolve(value); }
            //     });
            // }).catch((err) => {
            //     throw(err);
            // });
        });
    }
    getResourceTree() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.chrome.Page.getResourceTree({}, (err, value) => {
                    if (err) {
                        reject(value);
                    }
                    else {
                        resolve(value);
                    }
                });
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    ;
    getDocument(depth = -1, pierce = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.chrome.DOM.getDocument({
                    depth, pierce
                }, (err, value) => {
                    if (err) {
                        reject(value);
                    }
                    else {
                        resolve(value.root);
                    }
                });
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    ;
    destroyFrame(frameId) {
        if (this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.destroy();
        }
    }
    print() {
        if (this.domRoot) {
            this.domRoot.print();
        }
        else {
            console.log(`No root frame for ${this.getTabId()}`);
        }
    }
    ;
    destroy() {
        this.chrome.close();
        log.debug(`=== DESTROYED TAB STATE ${this.getTabId()} ====`);
    }
    ;
    getTabTitle() {
        return this.info.title;
    }
    ;
    printSummary() {
        console.log(`Tab ${this.getTabId()} (${this.getTabTitle()})`);
    }
    ;
    setChildrenRecursive(parentState, children) {
        if (children) {
            parentState.setChildren(children.map((child) => {
                const { children, contentDocument, frameId } = child;
                const frame = frameId ? this.getFrame(frameId) : null;
                const contentDocState = contentDocument ? this.getOrCreateDOMState(contentDocument) : null;
                const domState = this.getOrCreateDOMState(child, contentDocState, frame, parentState);
                if (contentDocument) {
                    const contentDocState = this.getOrCreateDOMState(contentDocument);
                    this.setChildrenRecursive(contentDocState, contentDocument.children);
                    frame.setDOMRoot(contentDocState);
                }
                //
                // // } && contentDocument) {
                //     const frame:FrameState = this.getFrame(frameId);
                //     domState = this.getOrCreateDOMState(child, frame, parentState);
                //
                //     const newDocument = this.getOrCreateDOMState(contentDocument);
                //     this.setChildrenRecursive(newDocument, contentDocument.children);
                //
                //     frame.setDOMRoot(newDocument);
                // } else {
                //     domState = this.getOrCreateDOMState(child, null, parentState);
                // }
                //
                this.setChildrenRecursive(domState, children);
                return domState;
            }));
        }
        return parentState;
    }
    ;
    removeDOMState(domState) {
        const nodeId = domState.getNodeId();
        if (this.hasDOMStateWithID(nodeId)) {
            this.nodeMap.delete(nodeId);
            // this.oldNodeMap.set(nodeId, true);
        }
    }
}
exports.TabState = TabState;
// var _ = require('underscore'),
// 	util = require('util'),
// 	URL = require('url'),
// 	EventEmitter = require('events'),
// 	FrameState = require('./frame_state').FrameState;
// var log = require('../../utils/logging').getColoredLogger('yellow');
//
//
// var TabState = function(tabId, chrome) {
// 	this.chrome = chrome;
// 	this._tabId = tabId;
// 	this._rootFrame = false;
// 	this._frames = {};
//
// 	this._pendingFrameEvents = {};
//
// 	this._initialized = this._initialize();
// 	log.debug('=== CREATED TAB STATE', this.getTabId(), ' ====');
// };
//
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
//
//
//
// 	proto.navigate = function(url) {
// 		var parsedURL = URL.parse(url);
// 		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
// 		url = URL.format(parsedURL);
//
// 		var chrome = this._getChrome();
// 		return new Promise(function(resolve, reject) {
// 			chrome.Page.navigate({
// 				url: url
// 			}, function(err, frameId) {
// 				if(err) { reject(frameId); }
// 				else { resolve(frameId); }
// 			})
// 		});
// 	};
// 	proto.getTabId = function() {
// 		return this._tabId;
// 	};
//
// 	proto.evaluate = function(expression, frameId) {
// 		var frame;
//
// 		if(frameId) {
// 			frame = this.getFrame(frameId);
// 		} else {
// 			frame = this.getMainFrame();
// 		}
//
// 		var executionContext = frame.getExecutionContext();
// 		return chromeDriver.evaluate(this._getChrome(), executionContext, {
// 			expression: expression
// 		});
// 		return frame.evaluate(expression);
// 	};
//
// 	proto.getURL = function() {
// 		var mainFrame = this.getMainFrame();
// 		if(mainFrame) {
// 			return mainFrame.getURL();
// 		} else {
// 			return '';
// 		}
// 	};
//
// 	proto.isInitialized = function() {
// 		return this._initialized;
// 	};
//
// 	proto.requestResource = function(url, frameId) {
// 		var frame = this.getFrame(frameId);
// 		return frame.requestResource(url);
// 	};
//
// 	proto.getMainFrame = function() {
// 		return this._rootFrame;
// 	};
//
// 	proto._setMainFrame = function(frame) {
//                 if(this._rootFrame) {
//                   _.each(_.keys(this._frames),_.bind(function(id) {
//                       if (id != frame.getFrameId()) {
//                          this._destroyFrame(id);
//                       }
//                   },this));
//                 }
//                 this._rootFrame = frame;
//                 frame.setSetMainFrameExecuted(true);
//
// 		return this._getDocument().then(_.bind(function(doc) {
// 			var root = doc.root;
// 			this._rootFrame.setRoot(doc.root);
// 			this.emit('mainFrameChanged');
// 		}, this));
// 	};
//
// 	proto._initialize = function() {
// 		var chrome = this._getChrome();
//
// 		return  this._addFrameListeners().then(_.bind(function() {
// 			return this._addDOMListeners();
// 		}, this)).then(_.bind(function() {
// 			return this._addNetworkListeners();
// 		}, this)).then(_.bind(function() {
// 			return this._addExecutionContextListeners();
// 		}, this)).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
//
// 	proto._getResourceTree = function() {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.Page.getResourceTree({}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto._getDocument = function() {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.getDocument({}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto._addNetworkListeners = function() {
// 		var chrome = this._getChrome();
// 		chrome.Network.enable();
//
// 		this.$_requestWillBeSent = _.bind(this._requestWillBeSent, this);
// 		this.$_responseReceived = _.bind(this._responseReceived, this);
//
// 		chrome.Network.requestWillBeSent(this.$_requestWillBeSent);
// 		chrome.Network.responseReceived(this.$_responseReceived);
// 	};
//
// 	proto._requestWillBeSent = function(resource) {
// 		var frameId = resource.frameId;
// 		var frame = this.getFrame(frameId);
// 		if(frame) {
// 			var resourceTracker = frame.getResourceTracker();
// 			resourceTracker._requestWillBeSent(resource);
// 		} else {
// 			var pendingFrameEvents = this._pendingFrameEvents[frameId];
// 			var eventInfo = {
// 				event: resource,
// 				type: 'requestWillBeSent'
// 			};
// 			if(pendingFrameEvents) {
// 				pendingFrameEvents.push(eventInfo);
// 			} else {
// 				this._pendingFrameEvents[frameId] = [eventInfo];
// 			}
// 			//log.error('Could not find frame ' + frameId);
// 		}
// 	};
// 	proto._responseReceived = function(event) {
// 		var frameId = event.frameId;
// 		var frame = this.getFrame(frameId);
// 		if(frame) {
// 			var resourceTracker = frame.getResourceTracker();
// 			resourceTracker._responseReceived(event);
// 		} else {
// 			var pendingFrameEvents = this._pendingFrameEvents[frameId];
// 			var eventInfo = {
// 				event: event,
// 				type: 'responseReceived'
// 			};
// 			if(pendingFrameEvents) {
// 				pendingFrameEvents.push(eventInfo);
// 			} else {
// 				this._pendingFrameEvents[frameId] = [eventInfo];
// 			}
// 			//log.error('Could not find frame ' + frameId);
// 		}
// 	};
//
// 	proto._addFrameListeners = function() {
// 		var chrome = this._getChrome();
// 		this.$_onFrameAttached = _.bind(this._onFrameAttached, this);
// 		this.$_onFrameNavigated = _.bind(this._onFrameNavigated, this);
// 		this.$_onFrameDetached = _.bind(this._onFrameDetached, this);
//
// 		chrome.Page.enable();
// 		return this._getResourceTree().then(_.bind(function(tree){
// 			var frameTree = tree.frameTree;
// 			this._createFrame(frameTree);
//
// 			chrome.Page.frameAttached(this.$_onFrameAttached);
// 			chrome.Page.frameDetached(this.$_onFrameDetached);
// 			chrome.Page.frameNavigated(this.$_onFrameNavigated);
// 		}, this));
// 	};
// 	proto._onFrameAttached = function(frameInfo) {
// 		var frameId = frameInfo.frameId,
// 			parentFrameId = frameInfo.parentFrameId;
//
// 		log.debug('Frame attached  ' + frameId + ' (parent: ' + parentFrameId + ')');
//
// 		this._createEmptyFrame(frameInfo, parentFrameId ? this.getFrame(parentFrameId) : false);
// 	};
// 	proto._onFrameNavigated = function(frameInfo) {
// 		var frame = frameInfo.frame,
// 			frameId = frame.id,
// 			frameUrl = frame.url;
//
// 		log.debug('Frame navigated ' + frameId + ' ' + frameUrl);
//
// 		var frame;
// 		if(this._hasFrame(frameId)) {
// 			frame = this.getFrame(frameId);
// 		} else {
// 			frame = this._createFrame(frameInfo);
// 		}
//
// 		frame.navigated(frameInfo);
// 	};
// 	proto._onFrameDetached = function(frameInfo) {
// 		var frameId = frameInfo.frameId;
//
// 		log.debug('Frame detached ' + frameId);
//
// 		this._destroyFrame(frameId);
// 	};
//
// 	proto._hasFrame = function(frameId) {
// 		return this._frames.hasOwnProperty(frameId);
// 	};
//
// 	proto.getFrame = function(frameId) {
// 		return this._frames[frameId];
// 	};
//
// 	proto._createFrame = function(frameInfo, parent) {
// 		var resources = frameInfo.resources,
// 			childFrames = frameInfo.childFrames,
// 			frame = frameInfo.frame,
// 			frameId = frame.id;
//
// 		log.debug('Frame created ' + frameId);
//
// 		var frameState = this._frames[frameId] = new FrameState(_.extend({
// 			chrome: this._getChrome(),
// 			resources: resources,
// 			page: this,
// 			parentFrame: parent,
//                         frameId: frameId
// 		}, frame));
// 		if(!frame.parentId) {
// 			this._setMainFrame(frameState);
// 		}
//
// 		_.each(childFrames, function(childFrame) {
// 			this._createFrame(childFrame, frameState);
// 		}, this);
//
// 		this._updateFrameOnEvents(frameState);
//
// 		return frameState;
// 	};
//
// 	proto._createEmptyFrame = function(frameInfo) {
// 		var frameId = frameInfo.frameId;
//
// 		var frameState = this._frames[frameId] = new FrameState(_.extend({
// 			chrome: this._getChrome()
// 		}, {
// 			id: frameId,
// 			page: this,
// 			parentId: frameInfo.parentFrameId
// 		}));
//
// 		if(!frameInfo.parentFrameId) {
// 			this._setMainFrame(frameState);
// 		}
// 		this._updateFrameOnEvents(frameState);
//
// 		return frameState;
// 	};
//
// 	proto._updateFrameOnEvents = function(frame) {
// 		var frameId = frame.getFrameId();
// 		var pendingFrameEvents = this._pendingFrameEvents[frameId];
//
// 		if(pendingFrameEvents) {
// 			var resourceTracker = frame.getResourceTracker();
//
// 			_.each(pendingFrameEvents, function(eventInfo) {
// 				var eventType = eventInfo.type,
// 					event = eventInfo.event;
// 				if(eventType === 'responseReceived') {
// 					resourceTracker._responseReceived(event);
// 				} else if(eventType === 'requestWillBeSent') {
// 					resourceTracker._requestWillBeSent(event);
// 				}
// 			});
// 			delete this._pendingFrameEvents[frameId];
// 		}
// 	};
//
// 	proto._destroyFrame = function(frameId) {
// 		if(this._hasFrame(frameId)) {
// 			var frame = this.getFrame(frameId);
// 			frame.destroy();
// 			delete this._frames[frameId];
// 		} else {
// 			throw new Error('Could not find frame with id ' + frameId);
// 		}
// 	};
//
// 	proto.print = function() {
// 		return this._rootFrame.print();
// 	};
// 	proto.serialize = function() {
// 		return this._rootFrame.serialize()
// 	};
// 	proto.stringify = function() {
// 		return JSON.stringify(this.serialize());
// 	};
// 	proto.summarize = function() {
// 		return this._rootFrame.summarize();
// 	};
//
// 	proto.requestChildNodes = function(nodeId, depth) {
// 		if(!depth) { depth = -1; }
//
// 		var chrome = this._getChrome();
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.requestChildNodes({
// 				nodeId: nodeId,
// 				depth: depth
// 			}, function(err, val) {
// 				if(err) {
// 					reject(val);
// 				} else {
// 					resolve(nodeId);
// 				}
// 			})
// 		});
// 	};
//
// 	proto._onDocumentUpdated = function() {
// 		var frame = this.getMainFrame();
// 		frame.documentUpdated();
// 	};
// 	proto.findNode = function(nodeId) {
// 		var result;
// 		_.each(this._frames, function(frame) {
// 			var node = frame.findNode(nodeId);
// 			if(node) {
// 				result = node;
// 			}
// 		}, this);
// 		return result;
// 	};
//
// 	proto._onSetChildNodes = function(event) {
//               //  log.debug('event',event);
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.setChildNodes(event);
// 		});
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for set child nodes event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onCharacterDataModified = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.characterDataModified(event);
// 		});
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for character data modified event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onChildNodeRemoved = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.childNodeRemoved(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for child node removed event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onChildNodeInserted = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.childNodeInserted(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for child node inserted event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
//
// 	proto._onAttributeModified = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.attributeModified(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for attribute modified event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onAttributeRemoved = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.attributeRemoved(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for attribute removed event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onChildNodeCountUpdated = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.childNodeCountUpdated(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for child node count updated event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onInlineStyleInvalidated = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.inlineStyleInvalidated(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for inline style invalidated event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
//
// 	var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
// 							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
// 							'documentUpdated', 'setChildNodes', 'inlineStyleInvalidated' ];
//
// 	proto._addDOMListeners = function() {
// 		var chrome = this._getChrome();
//
// 		return this._getDocument().then(_.bind(function(doc) {
// 			var root = doc.root;
// 			this._rootFrame.setRoot(doc.root);
//
// 			_.each(eventTypes, function(eventType) {
// 				var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
// 				var func = this['$_on'+capitalizedEventType] = _.bind(this['_on' + capitalizedEventType], this);
// 				chrome.on('DOM.' + eventType, func);
// 			}, this);
// 			this.requestChildNodes(root.nodeId, 1);
// 		}, this));
// 	};
//
// 	proto._removeListeners = function() {
// 		var chrome = this._getChrome();
//
// 		_.each(eventTypes, function(eventType) {
// 			var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
// 			var func = this['$_on'+capitalizedEventType];
// 			if(func) {
// 				chrome.removeListener('DOM.' + eventType, func);
// 			}
// 		}, this);
// 	};
//
// 	proto.highlight = function(nodeId) {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.highlightNode({
// 				nodeId: nodeId,
// 				highlightConfig: {
// 					borderColor: {
// 						r: 255,
// 						g: 0,
// 						b: 0,
// 						a: 1
// 					},
// 					contentColor: {
// 						r: 255,
// 						g: 0,
// 						b: 0,
// 						a: 0.5
// 					},
// 					showInfo: true
// 				}
// 			}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto.removeHighlight = function(nodeId) {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.hideHighlight({
// 				nodeId: nodeId
// 			}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto.destroy = function() {
// 		var chrome = this._getChrome();
// 		chrome.close();
// 		log.debug('=== DESTROYED TAB STATE', this.getTabId(), ' ====');
// 	};
//
// 	proto._getChrome = function() {
// 		return this.chrome;
// 	};
// }(TabState));
//
// module.exports = {
// 	TabState: TabState
// };
