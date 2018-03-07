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
const ColoredLogger_1 = require("../../utils/ColoredLogger");
const ShareDBSharedState_1 = require("../../utils/ShareDBSharedState");
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
        this.executionContext = null;
        this.requests = new Map();
        this.responses = new Map();
        this.resourcePromises = new Map();
        resources.forEach((resource) => this.recordResponse(resource));
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
    recordResponse(response) {
        this.responses.set(response.url, response);
    }
    ;
    requestWillBeSent(event) {
        const { request } = event;
        const { url } = request;
        this.requests.set(url, event);
        log.debug(`Request will be sent ${url}`);
    }
    ;
    responseReceived(event) {
        return this.recordResponse(event.response);
    }
    ;
    getFrameInfo() {
        return this.info;
    }
    ;
    getShareDBDoc() { return this.tab.getShareDBDoc(); }
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
    updateInfo(info) {
        this.info = info;
    }
    ;
    executionContextCreated(context) {
        this.executionContext = context;
    }
    ;
    destroy() {
        const root = this.getRoot();
        if (root) {
            root.destroy();
        }
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
    getResponseBody(requestId) {
        return new Promise((resolve, reject) => {
            this.chrome.Network.getResponseBody({
                requestId
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
    doGetResource(url) {
        return new Promise((resolve, reject) => {
            this.chrome.Page.getResourceContent({
                url, frameId: this.getFrameId()
            }, function (err, val) {
                if (err) {
                    reject(new Error(`Could not find resource '${url}'`));
                }
                else {
                    resolve(val);
                }
            });
        }).catch((err) => {
            throw (err);
        });
    }
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
