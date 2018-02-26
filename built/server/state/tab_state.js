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
    constructor(info, sdb) {
        super();
        this.info = info;
        this.sdb = sdb;
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
        this.doHandleDocumentUpdated = (event) => __awaiter(this, void 0, void 0, function* () {
            log.debug(`Document Updated`);
        });
        this.doHandleCharacterDataModified = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                log.debug(`Character Data Modified ${nodeId}`);
                try {
                    yield domState.setCharacterData(event.characterData);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                console.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        });
        this.doHandleSetChildNodes = (event) => {
            const { parentId } = event;
            const parent = this.getDOMStateWithID(parentId);
            if (parent) {
                try {
                    const { nodes } = event;
                    log.debug(`Set child nodes ${parentId} -> [${nodes.map((node) => node.nodeId).join(', ')}]`);
                    this.setChildrenRecursive(parent, nodes);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                console.error(`Could not find ${parentId}`);
                // throw new Error(`Could not find ${parentId}`);
            }
        };
        this.doHandleInlineStyleInvalidated = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeIds } = event;
            const updatedInlineStyles = nodeIds.map((nodeId) => __awaiter(this, void 0, void 0, function* () {
                const node = this.getDOMStateWithID(nodeId);
                if (node) {
                    try {
                        yield node.updateInlineStyle();
                    }
                    catch (err) {
                        console.error(err);
                        console.error(err.stack);
                    }
                    return true;
                }
                else {
                    return false;
                }
            }));
            const handled = yield Promise.all(updatedInlineStyles);
            if (_.every(handled)) {
                log.debug(`Set inline styles`);
            }
            else {
                console.error(`Could not find nodes for inlineStyleInvalidated`);
                // throw new Error(`Could not find nodes for inlineStyleInvalidated`);
            }
        });
        this.doHandleChildNodeCountUpdated = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                log.debug(`Child count updated for ${nodeId}`);
                try {
                    yield domState.childCountUpdated(event.childNodeCount);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                log.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        });
        this.doHandleChildNodeInserted = (event) => __awaiter(this, void 0, void 0, function* () {
            const { parentNodeId } = event;
            const parentDomState = this.getDOMStateWithID(parentNodeId);
            if (parentDomState) {
                const { previousNodeId, node } = event;
                const { nodeId } = node;
                const previousDomState = previousNodeId > 0 ? this.getDOMStateWithID(previousNodeId) : null;
                const domState = this.getOrCreateDOMState(node, null, null, parentDomState, previousDomState);
                try {
                    yield parentDomState.insertChild(domState, previousDomState);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
                log.debug(`Child node inserted ${nodeId} (parent: ${parentNodeId} / previous: ${previousNodeId})`);
                this.setChildrenRecursive(domState, node.children);
                this.requestChildNodes(nodeId, -1, true);
            }
            else {
                console.error(`Could not find ${parentNodeId}`);
                // throw new Error(`Could not find ${parentNodeId}`);
            }
        });
        this.doHandleChildNodeRemoved = (event) => __awaiter(this, void 0, void 0, function* () {
            const { parentNodeId, nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            const parentDomState = this.getDOMStateWithID(parentNodeId);
            if (domState && parentDomState) {
                log.debug(`Child node removed ${nodeId} (parent: ${parentNodeId})`);
                try {
                    yield parentDomState.removeChild(domState);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                throw new Error(`Could not find ${parentNodeId} or ${nodeId}`);
            }
        });
        this.doHandleAttributeModified = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                const { name, value } = event;
                log.debug(`Attribute modified ${name} to ${value}`);
                try {
                    yield domState.setAttribute(name, value);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                console.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        });
        this.doHandleAttributeRemoved = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                const { name } = event;
                log.debug(`Attribute removed ${name}`);
                try {
                    yield domState.removeAttribute(name);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                console.error(`Could not find ${nodeId}`);
                // throw new Error(`Could not find ${nodeId}`);
            }
        });
        try {
            this.initialized = this.initialize();
        }
        catch (err) {
            console.error(err);
            throw err;
        }
        log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
    }
    ;
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.doc = yield this.sdb.get('tab', this.getTabId());
            yield this.doc.createIfEmpty({
                id: this.getTabId(),
                root: null
            });
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
            yield this.chromePromise;
            //TODO: Convert getResourceTree call to getFrameTree when supported
            const resourceTree = yield this.getResourceTree();
            const { frameTree } = resourceTree;
            const { frame, childFrames, resources } = frameTree;
            this.createFrameState(frame, null, childFrames, resources);
            this.refreshRoot();
            this.addFrameListeners();
            this.addDOMListeners();
            this.addNetworkListeners();
            this.addExecutionContextListeners();
        });
    }
    ;
    submitOp(...ops) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getShareDBDoc().submitOp(ops);
        });
    }
    ;
    getShareDBDoc() { return this.doc; }
    ;
    getShareDBPath() {
        return [this.getTabId()];
    }
    ;
    getRootFrame() {
        if (this.domRoot) {
            return this.domRoot.getChildFrame();
        }
        else {
            return null;
        }
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
    p(...toAdd) {
        return this.getShareDBPath().concat(...toAdd);
    }
    ;
    setDocument(root) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.domRoot) {
                this.domRoot.destroy();
            }
            this.domRoot = this.getOrCreateDOMState(root);
            this.setChildrenRecursive(this.domRoot, root.children);
            const data = this.getShareDBDoc().getData();
            const oldRoot = data.root;
            const shareDBOp = { p: this.p('root'), oi: this.domRoot.getShareDBNode(), od: oldRoot };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    getDOMStateWithID(nodeId) {
        return this.nodeMap.get(nodeId);
    }
    ;
    hasDOMStateWithID(nodeId) {
        return this.nodeMap.has(nodeId);
    }
    ;
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
            return domState;
        }
    }
    ;
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
            // this.setRootFrame(frameState);
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
    // private setRootFrame(frame: FrameState):void {
    //     if (this.rootFrame) {
    //         this.frames.forEach((frame: FrameState, id: CRI.FrameID) => {
    //             if (id !== frame.getFrameId()) {
    //                 this.destroyFrame(id);
    //             }
    //         });
    //     }
    //     log.info(`Set main frame to ${frame.getFrameId()}`);
    //     this.rootFrame = frame;
    //     frame.markSetMainFrameExecuted(true);
    //     this.emit('mainFrameChanged');
    //     /*
    //     return this.getDocument().then((root: CRI.Node) => {
    //         this.rootFrame.setRoot(root);
    //         this.emit('mainFrameChanged');
    //     }).catch((err) => {
    //         log.error(err);
    //         throw (err);
    //     });
    //     */
    // }
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
            const childDOMStates = children.map((child) => {
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
            });
            parentState.setChildren(childDOMStates);
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
