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
const event_manager_1 = require("../event_manager");
const ColoredLogger_1 = require("../../utils/ColoredLogger");
const ShareDBSharedState_1 = require("../../utils/ShareDBSharedState");
const mime = require("mime");
const css_parser_1 = require("../css_parser");
const log = ColoredLogger_1.getColoredLogger('green');
class FrameState extends ShareDBSharedState_1.ShareDBSharedState {
    constructor(chrome, info, tab, parentFrame = null, resources = []) {
        super();
        this.chrome = chrome;
        this.info = info;
        this.tab = tab;
        this.parentFrame = parentFrame;
        this.setMainFrameExecuted = false;
        this.refreshingRoot = false;
        this.domParent = null;
        this.nodeMap = new Map();
        this.oldNodeMap = new Map();
        this.queuedEvents = [];
        this.executionContext = null;
        // public resourceTracker: ResourceTracker;
        this.requests = new Map();
        this.responses = new Map();
        this.resourcePromises = new Map();
        this.shareDBFrame = {
            frame: this.info,
            frameID: this.getFrameId()
        };
        this.eventManager = new event_manager_1.EventManager(this.chrome, this);
        resources.forEach((resource) => this.recordResponse(resource));
        // this.resourceTracker = new ResourceTracker(chrome, this, resources);
        log.debug(`=== CREATED FRAME STATE ${this.getFrameId()} ====`);
    }
    ;
    onAttachedToShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug(`Frame State ${this.getFrameId()} added to ShareDB doc`);
            if (this.root) {
                yield this.root.markAttachedToShareDBDoc();
            }
        });
    }
    ;
    getShareDBDoc() { return this.tab.getShareDBDoc(); }
    ;
    getShareDBFrame() {
        return this.shareDBFrame;
    }
    ;
    getParentFrame() {
        return this.parentFrame;
    }
    ;
    getAbsoluteShareDBPath() {
        return [this.getFrameId()];
    }
    ;
    setDOMParent(parent) {
        this.domParent = parent;
    }
    ;
    getTab() {
        return this.tab;
    }
    ;
    markSetMainFrameExecuted(val) {
        this.setMainFrameExecuted = val;
    }
    ;
    getURL() {
        return this.info.url;
    }
    ;
    getTabId() {
        return this.tab.getTabId();
    }
    ;
    // 	proto._getWrappedDOMNodeWithID = function(id) {
    // 		return this._nodeMap[id];
    // 	};
    updateInfo(info) {
        this.info = info;
    }
    ;
    executionContextCreated(context) {
        this.executionContext = context;
    }
    ;
    isRefreshingRoot() { return this.refreshingRoot; }
    markRefreshingRoot(r) {
        if (r) {
            this.refreshingRoot = true;
        }
        else {
            this.refreshingRoot = false;
            while (this.queuedEvents.length > 0) {
                var queuedEvent = this.queuedEvents.shift();
                queuedEvent.promise.resolve(queuedEvent.event).catch((err) => {
                    log.error(err);
                });
            }
        }
    }
    ;
    destroy() {
        const root = this.getRoot();
        if (root) {
            root.destroy();
        }
        // this.resourceTracker.destroy();
        this.requests.clear();
        this.responses.clear();
        this.resourcePromises.clear();
        log.debug(`=== DESTROYED FRAME STATE ${this.getFrameId()} ====`);
    }
    ;
    getFrameId() {
        return this.info.id;
    }
    ;
    getRoot() { return this.root; }
    ;
    // public setRoot(rootNode: CRI.Node): void {
    //     const oldRoot: DOMState = this.getRoot();
    //     if (oldRoot) {
    //         oldRoot.destroy();
    //     }
    //     if (rootNode) {
    //         const rootState = this.getOrCreateDOMState(rootNode);
    //         log.info(`Set root of frame ${this.getFrameId()} to ${rootState.getNodeId()}`)
    //         this.root = rootState;
    //         this.setChildrenRecursive(rootState, rootNode.children);
    //         this.markRefreshingRoot(false);
    //     }
    // };
    getExecutionContext() {
        return this.executionContext;
    }
    ;
    getFrameStack() {
        const rv = [];
        let frameState = this;
        while (frameState) {
            rv.unshift(frameState);
            frameState = frameState.getParentFrame();
        }
        return rv;
    }
    ;
    setDOMRoot(domState) { this.root = domState; }
    ;
    hasRoot() { return !!this.getRoot(); }
    ;
    recordResponse(response) {
        this.responses.set(response.url, response);
    }
    requestWillBeSent(resource) {
        const { url } = resource;
        this.requests.set(url, resource);
        log.debug('request will be sent ' + url);
    }
    responseReceived(event) {
        return this.recordResponse(event.response);
    }
    getResponseBody(requestId) {
        return new Promise((resolve, reject) => {
            this.chrome.Network.getResponseBody({
                requestId: requestId
            }, function (err, value) {
                if (err) {
                    reject(value);
                }
                else {
                    resolve(value);
                }
            });
        });
    }
    requestResource(url) {
        let promise;
        if (this.resourcePromises.has(url)) {
            promise = this.resourcePromises.get(url);
        }
        else {
            promise = this.doGetResource(url);
            this.resourcePromises.set(url, promise);
        }
        return promise.then((responseBody) => {
            const resourceInfo = this.responses.get(url);
            const mimeType = resourceInfo ? resourceInfo.mimeType : mime.getType(url);
            let content;
            if (mimeType === 'text/css') {
                content = css_parser_1.parseCSS(content, url, this.getFrameId(), this.getTabId());
            }
            else {
                content = responseBody.content;
            }
            return {
                mimeType: mimeType,
                base64Encoded: responseBody.base64Encoded,
                content: content
            };
        });
    }
    doGetResource(url) {
        return new Promise((resolve, reject) => {
            this.chrome.Page.getResourceContent({
                frameId: this.getFrameId(),
                url: url
            }, function (err, val) {
                if (err) {
                    reject(new Error('Could not find resource "' + url + '"'));
                }
                else {
                    resolve(val);
                }
            });
        }).catch((err) => {
            throw (err);
        });
    }
    // public requestResource(url: string): Promise<any> {
    //     return this.resourceTracker.getResource(url);
    // };
    print(level = 0) {
        const root = this.getRoot();
        if (root) {
            root.print(level);
        }
        else {
            console.log('NOTHING');
        }
    }
    ;
    querySelectorAll(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const root = this.getRoot();
            if (root) {
                return root.querySelectorAll(selector);
            }
            else {
                return new Promise(function (resolve, reject) {
                    reject(new Error('Could not find root'));
                });
            }
        });
    }
}
exports.FrameState = FrameState;
