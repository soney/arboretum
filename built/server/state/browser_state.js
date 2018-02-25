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
const path_1 = require("path");
const tab_state_1 = require("./tab_state");
const logging_1 = require("../../utils/logging");
const events_1 = require("events");
const sharedb_wrapper_1 = require("../../utils/sharedb_wrapper");
const chat_doc_1 = require("../../utils/chat_doc");
const log = logging_1.getColoredLogger('red');
const projectFileURLPath = fileUrl(path_1.join(path_1.resolve(__dirname, '..', '..'), 'browser'));
class BrowserState extends events_1.EventEmitter {
    constructor(state, extraOptions) {
        super();
        this.state = state;
        this.tabs = new Map();
        this.options = { host: 'localhost', port: 9222 };
        _.extend(this.options, extraOptions);
        this.initialize();
    }
    ;
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sdb = new sharedb_wrapper_1.SDB(false);
            this.doc = this.sdb.get('arboretum', 'browser');
            yield this.doc.createIfEmpty({
                tabs: {}
            });
            this.chat = new chat_doc_1.ArboretumChat(this.sdb);
            this.intervalID = setInterval(_.bind(this.refreshTabs, this), 2000);
            log.debug('=== CREATED BROWSER ===');
        });
    }
    ;
    getShareDBPath() {
        return [];
    }
    ;
    shareDBListen(ws) {
        this.sdb.listen(ws);
    }
    ;
    submitOp(...ops) {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.doc.submitOp(ops);
        });
    }
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
                    tab = new tab_state_1.TabState(tabInfo, this.sdb);
                    this.tabs.set(id, tab);
                    yield tab.initialized;
                    const shareDBOp = { p: ['tabs', id], oi: id };
                    yield this.submitOp(shareDBOp);
                    this.emit('tabCreated', {
                        id: id
                    });
                }
            }));
            yield Promise.all(createPromises);
            const destroyPromises = Array.from(existingTabs).map((id) => __awaiter(this, void 0, void 0, function* () {
                log.trace(`Destroying tab ${id}`);
                this.destroyTab(id);
                const shareDBOp = { p: ['tabs', id], od: id };
                yield this.submitOp(shareDBOp);
            }));
            yield Promise.all(destroyPromises);
        });
    }
    ;
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.intervalID);
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
            this.emit('tabDestroyed', { id });
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
    requestResource(url, frameID, tabID) {
        return __awaiter(this, void 0, void 0, function* () {
            const tabState = this.tabs.get(tabID);
            return tabState.requestResource(url, frameID);
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
}
exports.BrowserState = BrowserState;
;
