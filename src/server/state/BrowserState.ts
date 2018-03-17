import * as cri from 'chrome-remote-interface';
import * as _ from 'underscore'
import * as fileUrl from 'file-url';
import { join, resolve } from 'path';
import { TabState } from './TabState';
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
import {BrowserDoc} from '../../utils/state_interfaces';
import * as timers from 'timers';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';
import { processCSSURLs } from '../css_parser';

const log = getColoredLogger('red');

const projectFileURLPath: string = fileUrl(join(resolve(__dirname, '..', '..'), 'browser'));
export class BrowserState extends ShareDBSharedState<BrowserDoc> {
    private tabs: Map<CRI.TabID, TabState> = new Map<CRI.TabID, TabState>();
    private options = { host: 'localhost', port: 9222 };
    private intervalID: NodeJS.Timer;
    private sdb:SDB;
    private doc:SDBDoc<BrowserDoc>;
    private chat:ArboretumChat;
    constructor(private state: any, extraOptions?) {
        super();
        _.extend(this.options, extraOptions);
        this.initialize();
    };
    public getShareDBDoc():SDBDoc<BrowserDoc> { return this.doc; };
    public getAbsoluteShareDBPath():Array<string|number> { return []; };
    protected async onAttachedToShareDBDoc():Promise<void> { log.debug(`Browser added to ShareDB doc`); };
    private async initialize():Promise<void> {
        this.sdb = new SDB(false);
        this.doc = this.sdb.get<BrowserDoc>('arboretum', 'browser');
        await this.doc.createIfEmpty({
            tabs: {},
            selectedTab:null
        });
        this.markAttachedToShareDBDoc();
        this.chat = new ArboretumChat(this.sdb);
        this.intervalID = timers.setInterval(_.bind(this.refreshTabs, this), 2000);
        log.debug('=== CREATED BROWSER ===');
    };
    public async performAction(pam:PageActionMessage):Promise<boolean> {
        const {tabID, action, data} = pam;
        const tab = this.getTab(tabID);
        if(tab) {
            return await tab.performAction(action, data);
        } else {
            return false;
        }
    };
    public shareDBListen(ws:stream.Duplex):void {
        this.sdb.listen(ws);
    };
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
                tab.updateInfo(tabInfo);
            } else {
                log.trace(`Creating tab ${id}`);
                tab = new TabState(tabInfo, this.sdb);
                this.tabs.set(id, tab);

                await tab.initialized;
                await this.getShareDBDoc().submitObjectInsertOp(['tabs', id], tabInfo);
                await this.getShareDBDoc().submitObjectReplaceOp(['selectedTab'], id);
            }
        });

        await Promise.all(createPromises);

        const destroyPromises = Array.from(existingTabs).map(async (id: CRI.TabID):Promise<void> => {
            log.trace(`Destroying tab ${id}`);
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
            cri.listTabs(this.options, (err, tabs) => {
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
};
