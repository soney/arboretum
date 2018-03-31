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
const FrameState_1 = require("./FrameState");
const DOMState_1 = require("./DOMState");
const ColoredLogger_1 = require("../../utils/ColoredLogger");
const _ = require("underscore");
const url_1 = require("url");
const ShareDBSharedState_1 = require("../../utils/ShareDBSharedState");
const ArboretumChat_1 = require("../../utils/ArboretumChat");
const hack_driver_1 = require("../hack_driver/hack_driver");
const alignTabDocs_1 = require("../../utils/alignTabDocs");
const log = ColoredLogger_1.getColoredLogger('yellow');
;
class TabState extends ShareDBSharedState_1.ShareDBSharedState {
    constructor(browserState, info) {
        super();
        this.browserState = browserState;
        this.info = info;
        this.frames = new Map();
        this.pendingFrameEvents = new Map();
        this.nodeMap = new Map();
        this.requests = new Map();
        this.loadingFinished = (event) => {
        };
        this.loadingFailed = (event) => {
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
        this.executionContextCreated = (event) => {
            const { context } = event;
            const { auxData } = context;
            const { frameId } = auxData;
            if (this.hasFrame(frameId)) {
                const frameState = this.getFrame(frameId);
                frameState.executionContextCreated(context);
            }
            else {
                if (this.showDebug()) {
                    log.error(`Could not find frame ${frameId} for execution context`);
                }
            }
        };
        this.doHandleDocumentUpdated = (event) => __awaiter(this, void 0, void 0, function* () {
            if (this.showDebug()) {
                log.debug(`Document Updated`);
            }
            // if(this.domRoot) {
            //     this.domRoot.destroy();
            //     this.domRoot = null;
            // }
            yield this.refreshRoot();
        });
        this.doHandleCharacterDataModified = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                // log.debug(`Character Data Modified ${nodeId}`)
                try {
                    yield domState.setCharacterData(event.characterData);
                }
                catch (err) {
                    if (this.shouldShowErrors()) {
                        console.error(err);
                        console.error(err.stack);
                    }
                }
            }
            else {
                // const doc = await this.getDocument(-1, true);
                // console.log(doc);
                // this.chrome.DOM.resolveNode({nodeId}, (err, node) => {
                //     console.log(node);
                // });
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${nodeId} for characterDataModified`);
                    throw new Error(`Could not find ${nodeId}`);
                }
            }
        });
        this.doHandleSetChildNodes = (event) => {
            const { parentId } = event;
            const parent = this.getDOMStateWithID(parentId);
            if (parent) {
                try {
                    const { nodes } = event;
                    parent.setChildrenRecursive(nodes);
                    if (this.showDebug()) {
                        log.debug(`Set child nodes ${parentId} -> [${nodes.map((node) => node.nodeId).join(', ')}]`);
                    }
                }
                catch (err) {
                    if (this.shouldShowErrors()) {
                        console.error(err);
                        console.error(err.stack);
                    }
                }
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${parentId} for setChildNodes`);
                    throw new Error(`Could not find ${parentId}`);
                }
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
                if (this.showDebug()) {
                    log.debug(`Set inline styles`);
                }
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find nodes for inlineStyleInvalidated`);
                    throw new Error(`Could not find nodes for inlineStyleInvalidated`);
                }
            }
        });
        this.doHandleChildNodeCountUpdated = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                if (this.showDebug()) {
                    log.debug(`Child count updated for ${nodeId}`);
                }
                try {
                    yield domState.childCountUpdated(event.childNodeCount);
                }
                catch (err) {
                    if (this.shouldShowErrors()) {
                        console.error(err);
                        console.error(err.stack);
                    }
                }
            }
            else {
                if (this.shouldShowErrors()) {
                    log.error(`Could not find ${nodeId} for childNodeCouldUpdated`);
                    throw new Error(`Could not find ${nodeId}`);
                }
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
                if (this.showDebug()) {
                    log.debug(`Child node inserted ${nodeId} (parent: ${parentNodeId} / previous: ${previousNodeId})`);
                }
                domState.setChildrenRecursive(node.children, node.shadowRoots);
                this.requestChildNodes(nodeId, -1, true);
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${parentNodeId} for childNodeInserted`);
                    throw new Error(`Could not find ${parentNodeId}`);
                }
            }
        });
        this.doHandleChildNodeRemoved = (event) => __awaiter(this, void 0, void 0, function* () {
            const { parentNodeId, nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            const parentDomState = this.getDOMStateWithID(parentNodeId);
            if (domState && parentDomState) {
                if (this.showDebug()) {
                    log.debug(`Child node removed ${nodeId} (parent: ${parentNodeId})`);
                }
                try {
                    yield parentDomState.removeChild(domState);
                }
                catch (err) {
                    if (this.shouldShowErrors()) {
                        console.error(err);
                        console.error(err.stack);
                    }
                }
            }
            else {
                if (this.shouldShowErrors()) {
                    throw new Error(`Could not find ${parentNodeId} or ${nodeId} for childNodeRemoved event`);
                }
            }
        });
        this.doHandleAttributeModified = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                const { name, value } = event;
                if (this.showDebug()) {
                    log.debug(`Attribute modified ${name} to ${value}`);
                }
                try {
                    yield domState.setAttribute(name, value);
                }
                catch (err) {
                    if (this.shouldShowErrors()) {
                        console.error(err);
                        console.error(err.stack);
                    }
                }
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${nodeId} for attributeModified event`);
                    throw new Error(`Could not find ${nodeId}`);
                }
            }
        });
        this.doHandleAttributeRemoved = (event) => __awaiter(this, void 0, void 0, function* () {
            const { nodeId } = event;
            const domState = this.getDOMStateWithID(nodeId);
            if (domState) {
                const { name } = event;
                if (this.showDebug()) {
                    log.debug(`Attribute removed ${name}`);
                }
                try {
                    yield domState.removeAttribute(name);
                }
                catch (err) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${nodeId} for attributeRemoved event`);
                    throw new Error(`Could not find ${nodeId}`);
                }
            }
        });
        this.doHandleShadowRootPopped = (event) => __awaiter(this, void 0, void 0, function* () {
            const { hostId, rootId } = event;
            const domState = this.getDOMStateWithID(hostId);
            const root = this.getDOMStateWithID(rootId);
            if (domState && root) {
                domState.popShadowRoot(root);
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${hostId} (or possible root ${rootId}) for shadowRootPopped event`);
                    throw new Error(`Could not find ${hostId}`);
                }
            }
        });
        this.doHandleShadowRootPushed = (event) => __awaiter(this, void 0, void 0, function* () {
            const { hostId, root } = event;
            const domState = this.getDOMStateWithID(hostId);
            if (domState) {
                const shadowRoot = this.getOrCreateDOMState(root);
                domState.pushShadowRoot(shadowRoot);
            }
            else {
                if (this.shouldShowErrors()) {
                    console.error(`Could not find ${hostId} for shadowRootPopped event`);
                    throw new Error(`Could not find ${hostId} for shadowRootPopped`);
                }
            }
        });
        this.sdb = this.browserState.getSDB();
        try {
            this.initialized = this.initialize();
        }
        catch (err) {
            if (this.shouldShowErrors()) {
                console.error(err);
                throw err;
            }
        }
        if (this.showDebug()) {
            log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
        }
    }
    ;
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.doc = yield this.sdb.get('tab', this.getTabId());
            yield this.doc.createIfEmpty({
                id: this.getTabId(),
                root: null,
                canGoBack: false,
                canGoForward: false,
                url: this.info.url,
                title: this.info.title,
                isLoading: false,
                suggestedActions: []
            });
            yield this.markAttachedToShareDBDoc();
            const chromeEventEmitter = cri({
                chooseTab: this.info
            });
            this.chromePromise = new Promise((resolve, reject) => {
                chromeEventEmitter.once('connect', (chrome) => {
                    resolve(chrome);
                });
            }).catch((err) => {
                if (this.shouldShowErrors()) {
                    log.error(err);
                    throw (err);
                }
                return null;
            });
            this.chrome = yield this.chromePromise;
            //TODO: Convert getResourceTree call to getFrameTree when supported
            const resourceTree = yield this.getResourceTree();
            const { frameTree } = resourceTree;
            const { frame, childFrames, resources } = frameTree;
            this.createFrameState(frame, null, childFrames, resources);
            yield this.refreshRoot();
            yield this.addFrameListeners();
            // await this.addNetworkListeners();
            yield this.addDOMListeners();
            // this.addNetworkListeners();
            yield this.addExecutionContextListeners();
            this.updatePriorActions(); // do NOT await (because this waits for initialization)
        });
    }
    ;
    performAction(action, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type } = action;
            if (type === 'navigate') {
                const { url } = data;
                yield this.navigate(url);
            }
            else if (type === 'mouse_event') {
                const { targetNodeID, type } = data;
                hack_driver_1.mouseEvent(this.chrome, targetNodeID, type, data);
            }
            else if (type === 'setLabel') {
                const { nodeIDs, label } = data;
                nodeIDs.forEach((nodeID) => __awaiter(this, void 0, void 0, function* () {
                    if (this.hasDOMStateWithID(nodeID)) {
                        const node = this.getDOMStateWithID(nodeID);
                        yield node.setLabel(label);
                    }
                }));
            }
            return true;
        });
    }
    ;
    rejectAction(action, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    ;
    focusAction(action, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { targetNodeID } = data;
            if (this.hasDOMStateWithID(targetNodeID)) {
                const domState = this.getDOMStateWithID(targetNodeID);
                yield new Promise((resolve, reject) => setTimeout(resolve, 100));
                yield domState.focus();
            }
            return true;
        });
    }
    ;
    getSDB() { return this.sdb; }
    ;
    getShareDBDoc() { return this.doc; }
    ;
    getAbsoluteShareDBPath() { return []; }
    ;
    getShareDBPathToChild(child) {
        if (child === this.domRoot) {
            return ['root'];
        }
        else {
            if (this.shouldShowErrors()) {
                throw new Error(`Could not find path to node ${child.getNodeId()} from tab ${this.getTabId()}`);
            }
        }
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
    onAttachedToShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            // log.debug(`Tab State ${this.getTabId()} added to ShareDB doc`);
            if (this.domRoot) {
                this.domRoot.markAttachedToShareDBDoc();
            }
        });
    }
    ;
    setDocument(root) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.domRoot) {
                this.domRoot.destroy();
            }
            this.domRoot = this.getOrCreateDOMState(root);
            this.domRoot.setChildrenRecursive(root.children, root.shadowRoots);
            if (this.isAttachedToShareDBDoc()) {
                const shareDBDoc = this.getShareDBDoc();
                yield shareDBDoc.submitObjectReplaceOp(this.p('root'), this.domRoot.createShareDBNode());
                yield this.domRoot.markAttachedToShareDBDoc();
            }
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
            const domState = new DOMState_1.DOMState(this, node, contentDocument, childFrame, parent);
            this.nodeMap.set(nodeId, domState);
            domState.onDestroyed.addListener(() => {
                this.nodeMap.delete(nodeId);
            });
            return domState;
        }
    }
    ;
    refreshRoot() {
        return __awaiter(this, void 0, void 0, function* () {
            const root = yield this.getDocument(-1, true);
            this.setDocument(root);
            return root;
        });
    }
    ;
    createFrameState(info, parentFrame = null, childFrames = [], resources = []) {
        const { id, parentId } = info;
        const frameState = new FrameState_1.FrameState(this, info, parentFrame, resources);
        this.frames.set(id, frameState);
        childFrames.forEach((childFrame) => {
            const { frame, childFrames, resources } = childFrame;
            this.createFrameState(frame, frameState, childFrames, resources);
        });
        return frameState;
    }
    getTabId() { return this.info.id; }
    addFrameListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.chrome.Page.enable();
            this.chrome.Page.frameAttached(this.onFrameAttached);
            this.chrome.Page.frameDetached(this.onFrameDetached);
            this.chrome.Page.frameNavigated(this.onFrameNavigated);
        });
    }
    addExecutionContextListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.chrome.Runtime.enable();
            this.chrome.Runtime.executionContextCreated(this.executionContextCreated);
        });
    }
    ;
    addDOMListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            this.chrome.on('DOM.attributeRemoved', this.doHandleAttributeRemoved);
            this.chrome.on('DOM.attributeModified', this.doHandleAttributeModified);
            this.chrome.on('DOM.characterDataModified', this.doHandleCharacterDataModified);
            this.chrome.on('DOM.childNodeInserted', this.doHandleChildNodeInserted);
            this.chrome.on('DOM.childNodeRemoved', this.doHandleChildNodeRemoved);
            this.chrome.on('DOM.setChildNodes', this.doHandleSetChildNodes);
            this.chrome.on('DOM.childNodeCountUpdated', this.doHandleChildNodeCountUpdated);
            this.chrome.on('DOM.inlineStyleInvalidated', this.doHandleInlineStyleInvalidated);
            this.chrome.on('DOM.documentUpdated', this.doHandleDocumentUpdated);
            this.chrome.on('DOM.shadowRootPopped', this.doHandleShadowRootPopped);
            this.chrome.on('DOM.shadowRootPushed', this.doHandleShadowRootPushed);
        });
    }
    ;
    addNetworkListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.chrome.Network.enable();
            this.chrome.Network.requestWillBeSent(this.requestWillBeSent);
            this.chrome.Network.responseReceived(this.responseReceived);
            this.chrome.Network.loadingFinished(this.loadingFinished);
            this.chrome.Network.loadingFailed(this.loadingFailed);
        });
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
    ;
    updateFrameOnEvents(frameState) {
        const frameID = frameState.getFrameId();
        const pendingFrameEvents = this.pendingFrameEvents.get(frameID);
        if (pendingFrameEvents) {
            pendingFrameEvents.forEach((eventInfo) => {
                const { type, event } = eventInfo;
                if (type === 'responseReceived') {
                    frameState.responseReceived(event);
                }
                else if (type === 'requestWillBeSent') {
                    frameState.requestWillBeSent(event);
                }
            });
        }
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
                if (this.shouldShowErrors()) {
                    console.error('Request child nodes');
                    log.error(err);
                    throw (err);
                }
                return null;
            });
        });
    }
    ;
    getTitle() { return this.info.title; }
    ;
    getURL() { return this.info.url; }
    ;
    setTitle(title) {
        if (this.info.title === title) {
            return false;
        }
        else {
            this.info.title = title;
            return true;
        }
    }
    ;
    setURL(url) {
        if (this.info.url === url) {
            return false;
        }
        else {
            this.info.url = url;
            this.updatePriorActions();
        }
    }
    ;
    updatePriorActions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browserState.showingPriorActions()) {
                const [priorActions, tabDoc] = yield Promise.all([
                    this.browserState.getActionsForURL(this.info.url),
                    this.getData()
                ]);
                const remappedPriorActions = priorActions.map((priorAction) => {
                    const { action, tabData } = priorAction;
                    const [priorToCurrent, currentToPrior] = alignTabDocs_1.alignTabDocs(tabData, tabDoc);
                    return ArboretumChat_1.ArboretumChat.retargetPageAction(action, this.getTabId(), priorToCurrent);
                }).filter((a) => !!a);
                const uniqueRemappedPriorActions = [];
                for (let i = 0; i < remappedPriorActions.length; i++) {
                    let wasFound = false;
                    const remappedPriorAction = remappedPriorActions[i];
                    for (let j = 0; j < uniqueRemappedPriorActions.length; j++) {
                        if (ArboretumChat_1.ArboretumChat.pageActionsEqual(remappedPriorAction, uniqueRemappedPriorActions[j])) {
                            wasFound = true;
                            break;
                        }
                    }
                    if (!wasFound) {
                        uniqueRemappedPriorActions.push(remappedPriorAction);
                    }
                }
                this.doc.submitObjectReplaceOp(this.p('suggestedActions'), uniqueRemappedPriorActions);
            }
        });
    }
    ;
    updateInfo(tabInfo) {
        const { title, url } = tabInfo;
        const titleChanged = this.setTitle(title);
        const urlChanged = this.setURL(url);
        return titleChanged || urlChanged;
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
                if (this.shouldShowErrors()) {
                    console.error('Describe node');
                    console.error(err);
                    throw (err);
                }
                return null;
            });
        });
    }
    ;
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
                if (this.showDebug()) {
                    console.error('Navigate');
                    log.error(err);
                    throw (err);
                }
                return null;
            });
        });
    }
    // private addPendingFrameEvent(eventInfo: PendingFrameEvent): void {
    //     const { frameId } = eventInfo;
    //     if (this.pendingFrameEvents.has(frameId)) {
    //         this.pendingFrameEvents.get(frameId).push(eventInfo);
    //     } else {
    //         this.pendingFrameEvents.set(frameId, [eventInfo])
    //     }
    // }
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
    ;
    createIsolatedWorld(frameId, worldName, grantUniversalAccess) {
        return new Promise((resolve, reject) => {
            this.chrome.Page.createIsolatedWorld({ frameId, worldName, grantUniversalAccess }, (err, result) => {
                if (err) {
                    reject(result);
                }
                else {
                    resolve(result.executionContextId);
                }
            });
        });
    }
    ;
    pluckResourceFromTree(url, resourceTree) {
        const { resources, childFrames } = resourceTree;
        for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            if (resource.url === url) {
                return resource;
            }
        }
        if (childFrames) {
            for (let j = 0; j < childFrames.length; j++) {
                const resource = this.pluckResourceFromTree(url, childFrames[j]);
                if (resource) {
                    return resource;
                }
            }
        }
        return null;
    }
    ;
    getResourceFromTree(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const resourceTree = yield this.getResourceTree();
            return this.pluckResourceFromTree(url, resourceTree.frameTree);
        });
    }
    ;
    getResource(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const fromTree = yield this.getResourceFromTree(url);
            if (fromTree) {
                return fromTree;
            }
            else {
                for (let frame in this.frames.values()) {
                    // const resource:CRI.Page.FrameResource = await frame.getResource(url);
                    // if(resource) {
                    // return resource;
                    // }
                }
                return null;
            }
        });
    }
    ;
    getResourceContent(frameId, url) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.chrome.Page.getResourceContent({ frameId, url }, (err, value) => {
                    if (err) {
                        reject(value);
                    }
                    else {
                        resolve(value);
                    }
                });
            }).catch((err) => {
                if (this.showDebug()) {
                    console.error('Get resource content');
                    if (err.code && err.code === -32000) {
                        throw (err);
                    }
                    else {
                        log.error(err);
                        throw (err);
                    }
                }
                return null;
            });
        });
    }
    ;
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
                if (this.showDebug()) {
                    console.error('Get resource content');
                    log.error(err);
                    throw (err);
                }
                return null;
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
            const doc = this.getShareDBDoc();
            console.log(doc.getData());
            this.domRoot.print();
        }
        else {
            console.log(`No root frame for ${this.getTabId()}`);
        }
    }
    ;
    printNetworkSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            const resourceTree = yield this.getResourceTree();
            const { resources } = resourceTree.frameTree;
            console.log(resources);
        });
    }
    ;
    printListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.domRoot) {
                const listeners = yield this.domRoot.getEventListeners(-1);
                console.log(listeners);
            }
        });
    }
    ;
    destroy() {
        this.chrome.close();
        if (this.showDebug()) {
            log.debug(`=== DESTROYED TAB STATE ${this.getTabId()} ====`);
        }
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
    removeDOMState(domState) {
        const nodeId = domState.getNodeId();
        if (this.hasDOMStateWithID(nodeId)) {
            this.nodeMap.delete(nodeId);
            // this.oldNodeMap.set(nodeId, true);
        }
    }
    ;
    getData() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            return this.doc.getData();
        });
    }
    ;
    stringify() {
        return __awaiter(this, void 0, void 0, function* () {
            return JSON.stringify(yield this.getData());
        });
    }
    ;
    shouldSuppressErrors() { return this.browserState.shouldSuppressErrors(); }
    shouldShowErrors() { return !this.shouldSuppressErrors(); }
    showDebug() { return this.browserState.showDebug(); }
    hideDebug() { return !this.showDebug(); }
}
exports.TabState = TabState;
;
