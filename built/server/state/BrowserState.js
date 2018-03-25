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
const _ = require("underscore");
const fileUrl = require("file-url");
const path = require("path");
const TabState_1 = require("./TabState");
const WebSocketJSONStream = require("websocket-json-stream");
const ColoredLogger_1 = require("../../utils/ColoredLogger");
const ShareDBDoc_1 = require("../../utils/ShareDBDoc");
const ArboretumChat_1 = require("../../utils/ArboretumChat");
const timers = require("timers");
const ShareDBSharedState_1 = require("../../utils/ShareDBSharedState");
const guid_1 = require("../../utils/guid");
const css_parser_1 = require("../css_parser");
const TypedEventEmitter_1 = require("../../utils/TypedEventEmitter");
const fileFunctions_1 = require("../../utils/fileFunctions");
const log = ColoredLogger_1.getColoredLogger('red');
;
const projectFileURLPath = fileUrl(path.join(path.resolve(__dirname, '..', '..'), 'browser'));
class BrowserState extends ShareDBSharedState_1.ShareDBSharedState {
    constructor(sdb, extraOptions) {
        super();
        this.sdb = sdb;
        this.actionPerformed = new TypedEventEmitter_1.RegisteredEvent();
        this.tabs = new Map();
        this.options = { savedStatesDir: 'savedStates', host: 'localhost', port: 9222 };
        this.sessionID = guid_1.guid();
        this.performedActions = [];
        _.extend(this.options, extraOptions);
        this.initialized = this.initialize();
    }
    ;
    getSessionID() { return this.sessionID; }
    ;
    getShareDBDoc() { return this.doc; }
    ;
    getAbsoluteShareDBPath() { return []; }
    ;
    onAttachedToShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () { log.debug(`Browser added to ShareDB doc`); });
    }
    ;
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sdb = new ShareDBDoc_1.SDB(false);
            this.doc = this.sdb.get('arboretum', 'browser');
            yield this.doc.createIfEmpty({
                tabs: {},
                selectedTab: null
            });
            this.markAttachedToShareDBDoc();
            this.chat = new ArboretumChat_1.ArboretumChat(this.sdb, this);
            this.intervalID = timers.setInterval(_.bind(this.refreshTabs, this), 2000);
            log.debug('=== CREATED BROWSER ===');
        });
    }
    ;
    getNode(nodeID) {
        for (let tabID in this.tabs) {
            const tab = this.tabs.get(tabID);
            if (tab.hasDOMStateWithID(nodeID)) {
                return tab.getDOMStateWithID(nodeID);
            }
        }
    }
    ;
    performAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tabID, data } = action;
            const tab = this.getTab(tabID);
            if (tab) {
                const performed = yield tab.performAction(action, data);
                const tabData = yield tab.getData();
                this.performedActions.push({ action, tabData });
                const filename = `${this.getSessionID()}.json`;
                const outFile = path.join(this.options.savedStatesDir, filename);
                yield fileFunctions_1.makeDirectoryRecursive(this.options.savedStatesDir);
                yield fileFunctions_1.writeFileContents(outFile, JSON.stringify(this.performedActions));
                return performed;
            }
            else {
                return false;
            }
        });
    }
    ;
    forEachPreviousAction(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const { savedStatesDir } = this.options;
            if (yield fileFunctions_1.isDirectory(savedStatesDir)) {
                const files = yield fileFunctions_1.readDirectory(savedStatesDir);
                for (let i = 0; i < files.length; i++) {
                    const data = JSON.parse(yield fileFunctions_1.readFileContents(path.join(savedStatesDir, files[i])));
                    for (let j = 0; j < data.length; j++) {
                        yield callback(data[j]);
                    }
                }
            }
        });
    }
    ;
    filterPreviousActions(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const rv = [];
            yield this.forEachPreviousAction((ap) => __awaiter(this, void 0, void 0, function* () {
                if (yield callback(ap)) {
                    rv.push(ap);
                }
            }));
            return rv;
        });
    }
    ;
    getActionsForURL(url) {
        return this.filterPreviousActions((pa) => __awaiter(this, void 0, void 0, function* () {
            return pa.tabData.url === url;
        }));
    }
    ;
    rejectAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tabID, data } = action;
            const tab = this.getTab(tabID);
            if (tab) {
                return yield tab.rejectAction(action, data);
            }
            else {
                return false;
            }
        });
    }
    ;
    focusAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tabID, data } = action;
            const tab = this.getTab(tabID);
            if (tab) {
                return yield tab.focusAction(action, data);
            }
            else {
                return false;
            }
        });
    }
    ;
    shareDBListen(ws) {
        const stream = new WebSocketJSONStream(ws);
        this.sdb.listen(stream);
    }
    ;
    getSDB() { return this.sdb; }
    ;
    refreshTabs() {
        return __awaiter(this, void 0, void 0, function* () {
            const tabInfos = yield this.getTabs();
            const existingTabs = new Set(this.tabs.keys());
            const createPromises = tabInfos.map((tabInfo) => __awaiter(this, void 0, void 0, function* () {
                const { id } = tabInfo;
                let tab;
                if (existingTabs.has(id)) {
                    // log.trace(`Updating info for tab ${id}`);
                    tab = this.tabs.get(id);
                    existingTabs.delete(id);
                    tab.updateInfo(tabInfo);
                }
                else {
                    log.trace(`Creating tab ${id}`);
                    tab = new TabState_1.TabState(this, tabInfo);
                    this.tabs.set(id, tab);
                    yield tab.initialized;
                    yield this.getShareDBDoc().submitObjectInsertOp(['tabs', id], tabInfo);
                    yield this.getShareDBDoc().submitObjectReplaceOp(['selectedTab'], id);
                }
            }));
            yield Promise.all(createPromises);
            const destroyPromises = Array.from(existingTabs).map((id) => __awaiter(this, void 0, void 0, function* () {
                log.trace(`Destroying tab ${id}`);
                this.destroyTab(id);
                const doc = this.getShareDBDoc();
                yield doc.submitObjectDeleteOp(this.p('tabs', id));
            }));
            yield Promise.all(destroyPromises);
        });
    }
    ;
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            timers.clearInterval(this.intervalID);
            this.tabs.forEach((tabState, tabId) => {
                tabState.destroy();
            });
            yield this.sdb.close();
        });
    }
    ;
    destroyTab(id) {
        if (this.tabs.has(id)) {
            const tab = this.getTab(id);
            tab.destroy();
            this.tabs.delete(id);
        }
    }
    ;
    tabIsInspectable(tab) {
        return tab.type === 'page' && tab.title !== 'arboretumInternal' && tab.url !== 'http://localhost:3000/o' && tab.url !== 'http://localhost:3000' && tab.url.indexOf('chrome-devtools://') !== 0 && tab.url.indexOf(projectFileURLPath) !== 0;
    }
    getTabs() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                cri.listTabs(this.options, (err, tabs) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(_.filter(tabs, (tab) => this.tabIsInspectable(tab)));
                    }
                });
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    printTabSummaries() {
        this.tabs.forEach((tabState) => {
            tabState.printSummary();
        });
    }
    ;
    printListeners() {
        console.log('Listeners');
        this.tabs.forEach((tabState) => {
            tabState.printListeners();
        });
    }
    ;
    requestResource(url, frameID, tabID) {
        return __awaiter(this, void 0, void 0, function* () {
            const tabState = this.tabs.get(tabID);
            const resource = yield tabState.getResource(url);
            const resourceContent = yield tabState.getResourceContent(frameID, url);
            if (resource) {
                const { mimeType } = resource;
                if (mimeType === 'text/css') {
                    resourceContent.content = css_parser_1.processCSSURLs(resourceContent.content, url, frameID, tabID);
                }
            }
            return [resource, resourceContent];
        });
    }
    ;
    getTab(id) {
        return this.tabs.get(id);
    }
    ;
    print() {
        this.tabs.forEach((tabState) => {
            tabState.print();
        });
    }
    ;
    openURL(url, tabId = this.getActiveTabId()) {
        const tabState = this.getTab(tabId);
        tabState.navigate(url);
    }
    ;
    getTabIds() {
        return Array.from(this.tabs.keys());
    }
    ;
    getActiveTabId() {
        return this.getTabIds()[0];
    }
    ;
    printNetworkSummary() {
        this.tabs.forEach((tabState) => {
            tabState.printNetworkSummary();
        });
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
    stringifyAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return JSON.stringify({
                browser: yield this.getData(),
                chat: yield this.chat.getData(),
                tabs: yield Promise.all(Array.from(this.tabs.values()).map((t) => t.getData()))
            });
        });
    }
    ;
}
exports.BrowserState = BrowserState;
;
