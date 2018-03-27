import * as cri from 'chrome-remote-interface';
import * as _ from 'underscore'
import * as fileUrl from 'file-url';
import * as path from 'path';
import { TabState } from './TabState';
import { DOMState } from './DOMState';
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as WebSocketJSONStream from 'websocket-json-stream';
import * as stream from 'stream';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import { EventEmitter } from 'events';
import { ipcMain } from 'electron';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ArboretumChat, PageActionMessage, PageAction} from '../../utils/ArboretumChat';
import * as ShareDB from 'sharedb';
import {BrowserDoc,TabDoc} from '../../utils/state_interfaces';
import * as timers from 'timers';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';
import {guid} from '../../utils/guid';
import { processCSSURLs } from '../css_parser';
import {registerEvent,RegisteredEvent} from '../../utils/TypedEventEmitter';
import {isDirectory, readDirectory,readFileContents,writeFileContents,makeDirectoryRecursive} from '../../utils/fileFunctions';

const log = getColoredLogger('red');
export interface ActionPerformed {
    action:PageAction,
    tabData:TabDoc
};

export interface BrowserOptions {
    savedStatesDir?:string,
    host?:string,
    port?:number,
    priorActions?:boolean,
    suppressErrors?:boolean,
    showDebug?:boolean
}

const projectFileURLPath: string = fileUrl(path.join(path.resolve(__dirname, '..', '..'), 'browser'));
export class BrowserState extends ShareDBSharedState<BrowserDoc> {
    public actionPerformed:RegisteredEvent<ActionPerformed> = new RegisteredEvent<ActionPerformed>();
    private tabs: Map<CRI.TabID, TabState> = new Map<CRI.TabID, TabState>();
    private options:BrowserOptions = {
        host: 'localhost',
        port: 9222,
        savedStatesDir: 'savedStates',
        suppressErrors: true,
        priorActions:true,
        showDebug:false
    };
    private intervalID: NodeJS.Timer;
    private doc:SDBDoc<BrowserDoc>;
    private chat:ArboretumChat;
    private initialized:Promise<void>;
    private sessionID:string = guid();
    private performedActions:Array<ActionPerformed> = [];
    constructor(private sdb:SDB, extraOptions?:BrowserOptions) {
        super();
        _.extend(this.options, extraOptions);
        this.initialized = this.initialize();
    };
    public getSessionID():string { return this.sessionID; };
    public getShareDBDoc():SDBDoc<BrowserDoc> { return this.doc; };
    public getAbsoluteShareDBPath():Array<string|number> { return []; };
    protected async onAttachedToShareDBDoc():Promise<void> {
        if(this.showDebug()) {
            log.debug(`Browser added to ShareDB doc`);
        }
    };
    private async initialize():Promise<void> {
        this.sdb = new SDB(false);
        this.doc = this.sdb.get<BrowserDoc>('arboretum', 'browser');
        await this.doc.createIfEmpty({
            tabs: {},
            selectedTab:null
        });
        this.markAttachedToShareDBDoc();
        this.chat = new ArboretumChat(this.sdb, this);
        this.intervalID = timers.setInterval(_.bind(this.refreshTabs, this), 2000);
        if(this.showDebug()) {
            log.debug('=== CREATED BROWSER ===');
        }
    };
    public showingPriorActions():boolean {
        return this.options.priorActions;
    };
    public getNode(nodeID:CRI.NodeID):DOMState {
        for(let tabID in this.tabs) {
            const tab:TabState = this.tabs.get(tabID);
            if(tab.hasDOMStateWithID(nodeID)) {
                return tab.getDOMStateWithID(nodeID);
            }
        }
    };
    public async performAction(action:PageAction):Promise<boolean> {
        const {tabID, data} = action;
        const tab = this.getTab(tabID);
        if(tab) {
            const performed = await tab.performAction(action, data);
            const tabData = await tab.getData();
            this.performedActions.push({action, tabData});

            const filename:string = `${this.getSessionID()}.json`;
            const outFile:string = path.join(this.options.savedStatesDir, filename);
            await makeDirectoryRecursive(this.options.savedStatesDir);
            await writeFileContents(outFile, JSON.stringify(this.performedActions));

            return performed;
        } else {
            return false;
        }
    };
    public async forEachPreviousAction(callback:(previousAction:ActionPerformed)=>Promise<void>):Promise<void> {
        const {savedStatesDir} = this.options;
        if(await isDirectory(savedStatesDir)) {
            const files = await readDirectory(savedStatesDir);
            for(let i = 0; i<files.length; i++) {
                const data:Array<ActionPerformed> = JSON.parse(await readFileContents(path.join(savedStatesDir, files[i])));
                for(let j = 0; j<data.length; j++) {
                    await callback(data[j]);
                }
            }
        }
    };
    private async filterPreviousActions(callback:(previousAction:ActionPerformed)=>Promise<boolean>):Promise<Array<ActionPerformed>> {
        const rv:Array<ActionPerformed> = [];
        await this.forEachPreviousAction(async (ap) => {
            if(await callback(ap)) {
                rv.push(ap);
            }
        });
        return rv;
    };
    public getActionsForURL(url:string):Promise<ActionPerformed[]> {
        return this.filterPreviousActions(async (pa) => {
            return pa.tabData.url === url;
        });
    };
    public async rejectAction(action:PageAction):Promise<boolean> {
        const {tabID, data} = action;
        const tab = this.getTab(tabID);
        if(tab) {
            return await tab.rejectAction(action, data);
        } else {
            return false;
        }
    };
    public async focusAction(action:PageAction):Promise<boolean> {
        const {tabID, data} = action;
        const tab = this.getTab(tabID);
        if(tab) {
            return await tab.focusAction(action, data);
        } else {
            return false;
        }
    };
    public shareDBListen(ws:WebSocket):void {
        const stream:stream.Duplex = new WebSocketJSONStream(ws);
        this.sdb.listen(stream);
    };
    public getSDB():SDB { return this.sdb; };
    private async refreshTabs():Promise<void> {
        const tabInfos:Array<CRI.TabInfo> = await this.getTabs();
        const existingTabs = new Set<CRI.TabID>(this.tabs.keys());
        const createPromises = tabInfos.map(async (tabInfo):Promise<void> => {
            const { id } = tabInfo;
            let tab: TabState;
            if (existingTabs.has(id)) {
                // log.trace(`Updating info for tab ${id}`);
                tab = this.tabs.get(id);
                existingTabs.delete(id);
                if(tab.updateInfo(tabInfo)) { // something changed
                    await this.getShareDBDoc().submitObjectReplaceOp(['tabs', id], tabInfo);
                }
            } else {
                // log.trace(`Creating tab ${id}`);
                tab = new TabState(this, tabInfo);
                this.tabs.set(id, tab);

                await tab.initialized;
                await this.getShareDBDoc().submitObjectInsertOp(['tabs', id], tabInfo);
                await this.getShareDBDoc().submitObjectReplaceOp(['selectedTab'], id);
            }
        });

        await Promise.all(createPromises);

        const destroyPromises = Array.from(existingTabs).map(async (id: CRI.TabID):Promise<void> => {
            // log.trace(`Destroying tab ${id}`);
            this.destroyTab(id);
            const doc = this.getShareDBDoc();
            await doc.submitObjectDeleteOp(this.p('tabs', id));
        });

        await Promise.all(destroyPromises);
    };
    public async destroy():Promise<void> {
        timers.clearInterval(this.intervalID);
        this.tabs.forEach((tabState: TabState, tabId: CRI.TabID) => {
            tabState.destroy();
        });
        await this.sdb.close();
    };
    private destroyTab(id: CRI.TabID): void {
        if (this.tabs.has(id)) {
            const tab = this.getTab(id);
            tab.destroy();
            this.tabs.delete(id);
        }
    };
    private tabIsInspectable(tab: any): boolean {
        return tab.type === 'page' && tab.title !== 'arboretumInternal' && tab.url !== 'http://localhost:3000/o' && tab.url !== 'http://localhost:3000' && tab.url.indexOf('chrome-devtools://') !== 0 && tab.url.indexOf(projectFileURLPath) !== 0;
    }
    private async getTabs(): Promise<Array<CRI.TabInfo>> {
        return new Promise<Array<CRI.TabInfo>>((resolve, reject) => {
            const {host, port} = this.options;
            cri.listTabs({host, port}, (err, tabs) => {
                if (err) { reject(err); }
                else { resolve(_.filter(tabs, (tab) => this.tabIsInspectable(tab))); }
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    }
    public printTabSummaries():void {
        this.tabs.forEach((tabState:TabState) => {
            tabState.printSummary();
        });
    };
    public printListeners():void {
        console.log('Listeners');
        this.tabs.forEach((tabState:TabState) => {
            tabState.printListeners();
        });
    };
    public async requestResource(url: string, frameID: CRI.FrameID, tabID: CRI.TabID): Promise<[CRI.Page.FrameResource, CRI.GetResourceContentResponse]> {
        const tabState: TabState = this.tabs.get(tabID);

        const resource:CRI.Page.FrameResource = await tabState.getResource(url);
        const resourceContent:CRI.GetResourceContentResponse = await tabState.getResourceContent(frameID, url);
        if(resource) {
            const {mimeType} = resource;
            if(mimeType === 'text/css') {
                resourceContent.content = processCSSURLs(resourceContent.content, url, frameID, tabID);
            }
        }
        return [resource, resourceContent];
    };
    private getTab(id: CRI.TabID): TabState {
        return this.tabs.get(id);
    };
    public print(): void {
        this.tabs.forEach((tabState: TabState) => {
            tabState.print();
        });
    };
    public openURL(url:string, tabId:CRI.TabID=this.getActiveTabId()):void {
        const tabState = this.getTab(tabId);
        tabState.navigate(url);
    };
    public getTabIds():Array<CRI.TabID> {
        return Array.from(this.tabs.keys());
    };
    public getActiveTabId():CRI.TabID {
        return this.getTabIds()[0];
    };
    public printNetworkSummary():void {
        this.tabs.forEach((tabState:TabState) => {
            tabState.printNetworkSummary();
        });
    };
    private async getData():Promise<BrowserDoc> {
        await this.initialized;
        return this.doc.getData();
    };
    public async stringify():Promise<string> {
        return JSON.stringify(await this.getData());
    };
    public async stringifyAll():Promise<string> {
        return JSON.stringify({
            browser: await this.getData(),
            chat: await this.chat.getData(),
            tabs: await Promise.all(Array.from(this.tabs.values()).map((t)=>t.getData()))
        });
    };
    public shouldSuppressErrors():boolean { return this.options.suppressErrors; };
    public shouldShowErrors():boolean { return !this.shouldSuppressErrors(); }
    public showDebug():boolean { return this.options.showDebug; }
    public hideDebug():boolean { return !this.showDebug(); }
};
