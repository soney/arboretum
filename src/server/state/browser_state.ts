import * as cri from 'chrome-remote-interface';
import * as _ from 'underscore'
import * as fileUrl from 'file-url';
import { join, resolve } from 'path';
import { TabState } from './tab_state';
import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as WebSocketJSONStream from 'websocket-json-stream';
import * as stream from 'stream';
import { getColoredLogger, level, setLevel } from '../../utils/logging';
import { EventEmitter } from 'events';
import { ipcMain } from 'electron';
import {SDB, SDBDoc} from '../../utils/sharedb_wrapper';
import {ArboretumChat} from '../../utils/chat_doc';
import * as ShareDB from 'sharedb';
import {BrowserDoc} from '../../utils/state_interfaces';

const log = getColoredLogger('red');

const projectFileURLPath: string = fileUrl(join(resolve(__dirname, '..', '..'), 'browser'));
export class BrowserState extends EventEmitter {
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
    private async initialize():Promise<void> {
        this.sdb = new SDB(false);
        this.doc = this.sdb.get('arboretum', 'browser');
        await this.doc.createIfEmpty({
            tabs: {}
        });
        this.chat = new ArboretumChat(this.sdb);
        this.intervalID = setInterval(_.bind(this.refreshTabs, this), 2000);
        log.debug('=== CREATED BROWSER ===');
    };
    public getShareDBPath():Array<string|number> {
        return [];
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
                const shareDBOp:ShareDB.ObjectInsertOp = {p: ['tabs', id], oi: id};
                await this.doc.submitOp([shareDBOp]);

                this.emit('tabCreated', {
                    id: id
                });
            }
        });

        await Promise.all(createPromises);

        const destroyPromises = Array.from(existingTabs).map(async (id: CRI.TabID):Promise<void> => {
            log.trace(`Destroying tab ${id}`);
            this.destroyTab(id);
            const shareDBOp:ShareDB.ObjectDeleteOp = {p: ['tabs', id], od: id};
            await this.doc.submitOp([shareDBOp]);
        });

        await Promise.all(destroyPromises);
    };
    public async destroy():Promise<void> {
        clearInterval(this.intervalID);
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
            this.emit('tabDestroyed', { id });
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
    public async requestResource(url: string, frameID: CRI.FrameID, tabID: CRI.TabID): Promise<any> {
        const tabState: TabState = this.tabs.get(tabID);
        return tabState.requestResource(url, frameID);
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
};
