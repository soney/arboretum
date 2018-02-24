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
const resource_tracker_1 = require("../resource_tracker");
const logging_1 = require("../../utils/logging");
const log = logging_1.getColoredLogger('green');
;
class FrameState {
    constructor(chrome, info, tab, parentFrame = null, resources = []) {
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
        this.eventManager = new event_manager_1.EventManager(this.chrome, this);
        this.resourceTracker = new resource_tracker_1.ResourceTracker(chrome, this, resources);
        log.debug(`=== CREATED FRAME STATE ${this.getFrameId()} ====`);
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
    getShareDBPath() {
        return [this.getFrameId()];
    }
    ;
    setDOMParent(parent) {
        this.domParent = parent;
    }
    getTab() {
        return this.tab;
    }
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
    // 	proto._getWrappedDOMNodeWithID = function(id) {
    // 		return this._nodeMap[id];
    // 	};
    updateInfo(info) {
        this.info = info;
    }
    ;
    requestWillBeSent(resource) {
    }
    ;
    responseReceived(event) {
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
        this.resourceTracker.destroy();
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
    requestResource(url) {
        return this.resourceTracker.getResource(url);
    }
    ;
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
class ResolvablePromise {
    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    resolve(val) {
        this._resolve(val);
        return this.getPromise();
    }
    reject(val) {
        this._reject(val);
        return this.getPromise();
    }
    getPromise() {
        return this._promise;
    }
}
