import * as cri from 'chrome-remote-interface';
import { BrowserState, ActionPerformed } from './BrowserState';
import { FrameState } from './FrameState';
import { DOMState } from './DOMState';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import * as _ from 'underscore';
import { EventEmitter } from 'events';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import { parse, format } from 'url';
import * as ShareDB from 'sharedb';
import {TabDoc } from '../../utils/state_interfaces';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';
import {ArboretumChat, PageActionMessage, PageAction, PageActionType, PageActionState} from '../../utils/ArboretumChat';
import {mouseEvent, focus, getElementValue, setElementValue, getNamespace, getUniqueSelector, getCanvasImage} from '../hack_driver/hack_driver';
import {alignTabDocs} from '../../utils/alignTabDocs';

const log = getColoredLogger('yellow');
interface PendingFrameEvent {
    frameId: CRI.FrameID,
    event: CRI.RequestWillBeSentEvent | CRI.ResponseReceivedEvent,
    type: string
};

export class TabState extends ShareDBSharedState<TabDoc> {
    private tabID: CRI.TabID;
    private frames: Map<CRI.FrameID, FrameState> = new Map<CRI.FrameID, FrameState>();
    private pendingFrameEvents: Map<CRI.FrameID, Array<PendingFrameEvent>> = new Map<CRI.FrameID, Array<PendingFrameEvent>>();
    private chrome: CRI.Chrome;
    private chromePromise: Promise<CRI.Chrome>;
    private domRoot:DOMState;
    private nodeMap: Map<CRI.NodeID, DOMState> = new Map<CRI.NodeID, DOMState>();
    private doc:SDBDoc<TabDoc>;
    private requests:Map<CRI.RequestID, CRI.Network.Request> = new Map<CRI.RequestID, CRI.Network.Request>();
    public initialized:Promise<void>
    private sdb:SDB;
    constructor(private browserState:BrowserState, private info: CRI.TabInfo) {
        super();
        this.sdb = this.browserState.getSDB();
        try {
            this.initialized = this.initialize();
        } catch(err) {
            if(this.shouldShowErrors()) {
                console.error(err);
                throw err;
            }
        }
        if(this.showDebug()) {
            log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
        }
    };
    private async initialize():Promise<void> {
        this.doc = await this.sdb.get<TabDoc>('tab', this.getTabId());
        await this.doc.createIfEmpty({
            id:this.getTabId(),
            root:null,
            canGoBack:false,
            canGoForward:false,
            url:this.info.url,
            title:this.info.title,
            isLoading: false,
            suggestedActions: []
        });
        await this.markAttachedToShareDBDoc();

        const chromeEventEmitter = cri({
            chooseTab: this.info
        });
        this.chromePromise = new Promise<CRI.Chrome>((resolve, reject) => {
            chromeEventEmitter.once('connect', (chrome: CRI.Chrome) => {
                resolve(chrome);
            });
        }).catch((err) => {
            if(this.shouldShowErrors()) {
                log.error(err);
                throw (err);
            }
            return null;
        });
        this.chrome = await this.chromePromise;
        //TODO: Convert getResourceTree call to getFrameTree when supported
        const resourceTree:CRI.GetResourceTreeResponse = await this.getResourceTree();
        const { frameTree } = resourceTree;
        const { frame, childFrames, resources } = frameTree;
        this.createFrameState(frame, null, childFrames, resources);
        await this.refreshRoot();

        await this.addFrameListeners();
        // await this.addNetworkListeners();
        await this.addDOMListeners();
        // this.addNetworkListeners();
        await this.addExecutionContextListeners();
        this.updatePriorActions(); // do NOT await (because this waits for initialization)
    };
    public async performAction(action:PageAction, data:any):Promise<boolean> {
        const {type} = action;
        if(type === 'navigate') {
            const {url} = data;
            await this.navigate(url);
        } else if(type === 'mouse_event') {
            const {targetNodeID, type} = data;
            mouseEvent(this.chrome, targetNodeID, type, data);
        } else if(type === 'setLabel') {
            const {nodeIDs, label} = data;
            nodeIDs.forEach(async (nodeID) => {
                if(this.hasDOMStateWithID(nodeID)) {
                    const node:DOMState = this.getDOMStateWithID(nodeID);
                    await node.setLabel(label);
                }
            });
        }
        return true;
    };
    public async rejectAction(action:PageAction, data:any):Promise<boolean> {
        return true;
    };
    public async focusAction(action:PageAction, data:any):Promise<boolean> {
        const {targetNodeID} = data;
        if(this.hasDOMStateWithID(targetNodeID)) {
            const domState:DOMState = this.getDOMStateWithID(targetNodeID);
            await new Promise((resolve, reject) => setTimeout(resolve, 100));
            await domState.focus();
        }
        return true;
    };
    public getSDB():SDB { return this.sdb; };
    public getShareDBDoc():SDBDoc<TabDoc> { return this.doc; };
    public getAbsoluteShareDBPath():Array<string|number> { return []; };
    public getShareDBPathToChild(child:DOMState):Array<string|number> {
        if(child === this.domRoot) {
            return ['root'];
        } else {
            if(this.shouldShowErrors()) {
                throw new Error(`Could not find path to node ${child.getNodeId()} from tab ${this.getTabId()}`);
            }
        }
    };
    public getRootFrame(): FrameState {
        if(this.domRoot) {
            return this.domRoot.getChildFrame();
        } else {
            return null;
        }
    }
    public async evaluate(expression: string, frameId: CRI.FrameID = null): Promise<CRI.EvaluateResult> {
        const frame: FrameState = frameId ? this.getFrame(frameId) : this.getRootFrame();
        const executionContext: CRI.ExecutionContextDescription = frame.getExecutionContext();

        return new Promise<CRI.EvaluateResult>((resolve, reject) => {
            this.chrome.Runtime.evaluate({
                contextId: executionContext.id,
                expression: expression
            }, (err, result) => {
                if (err) { reject(result); }
                else { resolve(result); }
            });
        });
    };
    public getChrome():CRI.Chrome {
        return this.chrome;
    };
    public async onAttachedToShareDBDoc():Promise<void> {
        // log.debug(`Tab State ${this.getTabId()} added to ShareDB doc`);
        if(this.domRoot) {
            this.domRoot.markAttachedToShareDBDoc();
        }
    };
    private async setDocument(root:CRI.Node):Promise<void> {
        if(this.domRoot) {
            this.domRoot.destroy();
        }
        this.domRoot = this.getOrCreateDOMState(root);
        this.domRoot.setChildrenRecursive(root.children, root.shadowRoots);

        if(this.isAttachedToShareDBDoc()) {
            const shareDBDoc = this.getShareDBDoc();
            await shareDBDoc.submitObjectReplaceOp(this.p('root'), this.domRoot.createShareDBNode());
            await this.domRoot.markAttachedToShareDBDoc();
        }
    };
    public getDOMStateWithID(nodeId: CRI.NodeID): DOMState {
        return this.nodeMap.get(nodeId);
    };
    public hasDOMStateWithID(nodeId: CRI.NodeID): boolean {
        return this.nodeMap.has(nodeId);
    };
    public getOrCreateDOMState(node:CRI.Node, contentDocument?:DOMState, childFrame?:FrameState, parent?:DOMState, previousNode?:DOMState): DOMState {
        const { nodeId } = node;
        if (this.hasDOMStateWithID(nodeId)) {
            return this.getDOMStateWithID(nodeId);
        } else {
            const domState = new DOMState(this, node, contentDocument, childFrame, parent);
            this.nodeMap.set(nodeId, domState);
            domState.onDestroyed.addListener(() => {
                this.nodeMap.delete(nodeId);
            });
            return domState;
        }
    };
    private async refreshRoot(): Promise<CRI.Node> {
        const root:CRI.Node = await this.getDocument(-1, true);
        this.setDocument(root);
        return root;
    };
    private createFrameState(info: CRI.Frame, parentFrame: FrameState = null, childFrames: Array<CRI.Page.FrameResourceTree> = [], resources: Array<CRI.Page.FrameResource> = []): FrameState {
        const { id, parentId } = info;
        const frameState: FrameState = new FrameState(this, info, parentFrame, resources);
        this.frames.set(id, frameState);
        childFrames.forEach((childFrame) => {
            const { frame, childFrames, resources } = childFrame;
            this.createFrameState(frame, frameState, childFrames, resources);
        });
        return frameState;
    }
    public getTabId(): string { return this.info.id; }
    private async addFrameListeners():Promise<void> {
        await this.chrome.Page.enable();
        this.chrome.Page.frameAttached(this.onFrameAttached);
        this.chrome.Page.frameDetached(this.onFrameDetached);
        this.chrome.Page.frameNavigated(this.onFrameNavigated);
    }
    private async addExecutionContextListeners():Promise<void> {
        await this.chrome.Runtime.enable();
        this.chrome.Runtime.executionContextCreated(this.executionContextCreated);
    };
    private async addDOMListeners():Promise<void> {
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
    };
    private async addNetworkListeners():Promise<void> {
        await this.chrome.Network.enable();
        this.chrome.Network.requestWillBeSent(this.requestWillBeSent);
        this.chrome.Network.responseReceived(this.responseReceived);
        this.chrome.Network.loadingFinished(this.loadingFinished);
        this.chrome.Network.loadingFailed(this.loadingFailed);
    };
    private addPendingFrameEvent(eventInfo:PendingFrameEvent):void {
        const {frameId} = eventInfo;
        if(this.pendingFrameEvents.has(frameId)) {
            this.pendingFrameEvents.get(frameId).push(eventInfo);
        } else {
            this.pendingFrameEvents.set(frameId, [eventInfo]);
        }
    };
    private updateFrameOnEvents(frameState:FrameState):void {
        const frameID:CRI.FrameID = frameState.getFrameId();
        const pendingFrameEvents = this.pendingFrameEvents.get(frameID);
        if(pendingFrameEvents) {
            pendingFrameEvents.forEach((eventInfo) => {
                const {type, event} = eventInfo;
                if(type === 'responseReceived') {
                    frameState.responseReceived(event as CRI.ResponseReceivedEvent);
                } else if(type === 'requestWillBeSent') {
                    frameState.requestWillBeSent(event as CRI.RequestWillBeSentEvent);
                }
            });
        }
    };
    private loadingFinished = (event:CRI.LoadingFinishedEvent) => {
    };
    private loadingFailed = (event:CRI.LoadingFailedEvent) => {
    };
    private requestWillBeSent = (event: CRI.RequestWillBeSentEvent): void => {
        const { frameId } = event;
        if (this.hasFrame(frameId)) {
            const frame = this.getFrame(frameId);
            frame.requestWillBeSent(event);
        } else {
            this.addPendingFrameEvent({
                frameId: frameId,
                event: event,
                type: 'requestWillBeSent'
            });
        }
    }
    private responseReceived = (event: CRI.ResponseReceivedEvent): void => {
        const { frameId } = event;
        if (this.hasFrame(frameId)) {
            this.getFrame(frameId).responseReceived(event);
        } else {
            this.addPendingFrameEvent({
                frameId: frameId,
                event: event,
                type: 'responseReceived'
            });
        }
    }
    public async requestChildNodes(nodeId: CRI.NodeID, depth: number = 1, pierce=false): Promise<CRI.RequestChildNodesResult> {
        return new Promise<CRI.RequestChildNodesResult>((resolve, reject) => {
            this.chrome.DOM.requestChildNodes({ nodeId, depth, pierce }, (err, val) => {
                if (err) { reject(val); }
                else { resolve(val); }
            });
        }).catch((err) => {
            if(this.shouldShowErrors()) {
                log.error(err);
                throw (err);
            }
            return null;
        });
    };
    public getTitle(): string { return this.info.title; };
    public getURL(): string { return this.info.url; };
    private setTitle(title: string): void {
        this.info.title = title;
    };
    private async setURL(url: string):Promise<void> {
        if(this.info.url !== url) {
            this.info.url = url;
            await this.updatePriorActions();
        }
    };
    private async updatePriorActions():Promise<void> {
        if(this.browserState.showingPriorActions()) {
            const [priorActions, tabDoc] = await Promise.all([
                    this.browserState.getActionsForURL(this.info.url),
                    this.getData()
                ]);
            const remappedPriorActions = priorActions.map((priorAction:ActionPerformed) => {
                const {action, tabData} = priorAction;
                const [priorToCurrent, currentToPrior] = alignTabDocs(tabData, tabDoc);
                return ArboretumChat.retargetPageAction(action, this.getTabId(), priorToCurrent);
            }).filter((a)=>!!a);
            const uniqueRemappedPriorActions = [];
            for(let i:number=0; i<remappedPriorActions.length; i++) {
                let wasFound:boolean = false;
                const remappedPriorAction = remappedPriorActions[i];
                for(let j:number=0; j<uniqueRemappedPriorActions.length; j++) {
                    if(ArboretumChat.pageActionsEqual(remappedPriorAction, uniqueRemappedPriorActions[j])) {
                        wasFound = true;
                        break;
                    }
                }
                if(!wasFound) {
                    uniqueRemappedPriorActions.push(remappedPriorAction);
                }
            }
            this.doc.submitObjectReplaceOp(this.p('suggestedActions'), uniqueRemappedPriorActions);
        }
    };
    public updateInfo(tabInfo) {
        const { title, url } = tabInfo;
        this.setTitle(title);
        this.setURL(url);
    };
    private async describeNode(nodeId:CRI.NodeID, depth:number=-1):Promise<CRI.Node> {
        return new Promise<CRI.Node>((resolve, reject) => {
            this.chrome.DOM.describeNode({
                nodeId, depth
            }, (err, result) => {
                if(err) { reject(result); }
                else { resolve(result.node); }
            });
        }).catch((err) => {
            if(this.shouldShowErrors()) {
                console.error(err);
                throw(err);
            }
            return null;
        });
    };
    public async navigate(url: string): Promise<CRI.FrameID> {
        const parsedURL = parse(url);
        if (!parsedURL.protocol) { parsedURL.protocol = 'http'; }
        url = format(parsedURL);
        return new Promise<CRI.FrameID>((resolve, reject) => {
            this.chrome.Page.navigate({ url }, (err, result: CRI.Page.NavigateResult) => {
                if (err) { throw (err); }
                else { resolve(result.frameId); }
            })
        }).catch((err) => {
            if(this.showDebug()) {
                log.error(err);
                throw (err);
            }
            return null;
        });
    }

    private onFrameAttached = (frameInfo: CRI.FrameAttachedEvent): void => {
        const { frameId, parentFrameId } = frameInfo;
        this.createFrameState({
            id: frameId,
            parentId: parentFrameId
        });
    };
    private onFrameNavigated = (frameInfo: CRI.FrameNavigatedEvent): void => {
        const { frame } = frameInfo;
        const { id, url } = frame;

        let frameState: FrameState;
        if (this.hasFrame(id)) {
            frameState = this.getFrame(id);
        } else {
            frameState = this.createFrameState(frame);
        }
        frameState.updateInfo(frame);
    }
    private onFrameDetached = (frameInfo: CRI.FrameDetachedEvent): void => {
        const { frameId } = frameInfo;
        this.destroyFrame(frameId);
    };
    private executionContextCreated = (event: CRI.ExecutionContextCreatedEvent): void => {
        const { context } = event;
        const { auxData } = context;
        const { frameId } = auxData;
        if (this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.executionContextCreated(context);
        } else {
            if(this.showDebug()) {
                log.error(`Could not find frame ${frameId} for execution context`);
            }
        }
    };
    // private addPendingFrameEvent(eventInfo: PendingFrameEvent): void {
    //     const { frameId } = eventInfo;
    //     if (this.pendingFrameEvents.has(frameId)) {
    //         this.pendingFrameEvents.get(frameId).push(eventInfo);
    //     } else {
    //         this.pendingFrameEvents.set(frameId, [eventInfo])
    //     }
    // }
    public getFrame(id: CRI.FrameID): FrameState { return this.frames.get(id); }
    private hasFrame(id: CRI.FrameID): boolean { return this.frames.has(id); }
    private async getFrameTree(): Promise<CRI.Page.FrameTree> {
        throw new Error("Not supported yet")
        // return new Promise<CRI.FrameTree>((resolve, reject) => {
        //     this.chrome.Page.getFrameTree({}, (err, value:CRI.FrameTree) => {
        //         if(err) { reject(value); }
        //         else { resolve(value); }
        //     });
        // }).catch((err) => {
        //     throw(err);
        // });
    };
    private createIsolatedWorld(frameId:CRI.FrameID, worldName?:string, grantUniversalAccess?:boolean):Promise<CRI.ExecutionContextID> {
        return new Promise<CRI.ExecutionContextID>((resolve, reject) => {
            this.chrome.Page.createIsolatedWorld({frameId, worldName, grantUniversalAccess}, (err, result) => {
                if(err) { reject(result); }
                else { resolve(result.executionContextId); }
            });
        });
    };
    private pluckResourceFromTree(url:string, resourceTree:CRI.Page.FrameResourceTree):CRI.Page.FrameResource {
        const {resources, childFrames} = resourceTree;
        for(let i = 0; i<resources.length; i++) {
            const resource:CRI.Page.FrameResource = resources[i];
            if(resource.url === url) {
                return resource;
            }
        }

        if(childFrames) {
            for(let j = 0; j<childFrames.length; j++) {
                const resource:CRI.Page.FrameResource = this.pluckResourceFromTree(url, childFrames[j]);
                if(resource) {
                    return resource;
                }
            }
        }

        return null;
    };
    private async getResourceFromTree(url:string):Promise<CRI.Page.FrameResource> {
        const resourceTree:CRI.GetResourceTreeResponse = await this.getResourceTree();
        return this.pluckResourceFromTree(url, resourceTree.frameTree);
    };
    public async getResource(url:string):Promise<CRI.Page.FrameResource> {
        const fromTree:CRI.Page.FrameResource = await this.getResourceFromTree(url);
        if(fromTree) {
            return fromTree;
        } else {
            for(let frame in this.frames.values()) {
                // const resource:CRI.Page.FrameResource = await frame.getResource(url);
                // if(resource) {
                    // return resource;
                // }
            }
            return null;
        }
    };
    public async getResourceContent(frameId:CRI.FrameID, url:string):Promise<CRI.GetResourceContentResponse> {
        return new Promise<CRI.GetResourceContentResponse>((resolve, reject) => {
            this.chrome.Page.getResourceContent({frameId, url}, (err, value: CRI.GetResourceContentResponse) => {
                if (err) { reject(value); }
                else { resolve(value); }
            });
        }).catch((err) => {
            if(err.code && err.code === -32000) { // No resource with given url
                throw (err);
            } else {
                log.error(err);
                throw (err);
            }
        });
    };

    private async getResourceTree(): Promise<CRI.GetResourceTreeResponse> {
        return new Promise<CRI.GetResourceTreeResponse>((resolve, reject) => {
            this.chrome.Page.getResourceTree({}, (err, value: CRI.GetResourceTreeResponse) => {
                if (err) { reject(value); }
                else { resolve(value); }
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    };
    public async getDocument(depth=-1, pierce=false): Promise<CRI.Node> {
        return new Promise<CRI.Node>((resolve, reject) => {
            this.chrome.DOM.getDocument({
                depth, pierce
            }, (err, value) => {
                if (err) { reject(value); }
                else { resolve(value.root); }
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    };
    private destroyFrame(frameId: CRI.FrameID) {
        if (this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.destroy();
        }
    }
    public print(): void {
        if(this.domRoot) {
            const doc = this.getShareDBDoc();
            console.log(doc.getData());
            this.domRoot.print();
        } else {
            console.log(`No root frame for ${this.getTabId()}`);
        }
    };
    public async printNetworkSummary():Promise<void> {
        const resourceTree:CRI.GetResourceTreeResponse = await this.getResourceTree();
        const {resources} = resourceTree.frameTree;
        console.log(resources);
    };
    public async printListeners():Promise<void> {
        if(this.domRoot) {
            const listeners = await this.domRoot.getEventListeners(-1);
            console.log(listeners);
        }
    };
    public destroy() {
        this.chrome.close();
        if(this.showDebug()) {
            log.debug(`=== DESTROYED TAB STATE ${this.getTabId()} ====`);
        }
    };
    public getTabTitle():string {
        return this.info.title;
    };
    public printSummary():void {
        console.log(`Tab ${this.getTabId()} (${this.getTabTitle()})`);
    };


    private removeDOMState(domState: DOMState): void {
        const nodeId = domState.getNodeId();
        if (this.hasDOMStateWithID(nodeId)) {
            this.nodeMap.delete(nodeId);
            // this.oldNodeMap.set(nodeId, true);
        }
    };
    private doHandleDocumentUpdated = async (event: CRI.DocumentUpdatedEvent):Promise<void> => {
        if(this.showDebug()) {
            log.debug(`Document Updated`);
        }
        // if(this.domRoot) {
        //     this.domRoot.destroy();
        //     this.domRoot = null;
        // }
        await this.refreshRoot();
    };
    private doHandleCharacterDataModified = async (event: CRI.CharacterDataModifiedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            // log.debug(`Character Data Modified ${nodeId}`)
            try {
                await domState.setCharacterData(event.characterData);
            } catch(err) {
                if(this.shouldShowErrors()) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
        } else {
            // const doc = await this.getDocument(-1, true);
            // console.log(doc);
            // this.chrome.DOM.resolveNode({nodeId}, (err, node) => {
            //     console.log(node);
            // });
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${nodeId} for characterDataModified`);
                throw new Error(`Could not find ${nodeId}`);
            }
        }
    }
    private doHandleSetChildNodes = (event:CRI.SetChildNodesEvent):void => {
        const { parentId } = event;
        const parent = this.getDOMStateWithID(parentId);
        if (parent) {
            try {
                const { nodes } = event;
                parent.setChildrenRecursive(nodes);
                if(this.showDebug()) {
                    log.debug(`Set child nodes ${parentId} -> [${nodes.map((node) => node.nodeId).join(', ')}]`);
                }
            } catch(err) {
                if(this.shouldShowErrors()) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${parentId} for setChildNodes`);
                throw new Error(`Could not find ${parentId}`);
            }
        }
    };
    private doHandleInlineStyleInvalidated = async (event:CRI.InlineStyleInvalidatedEvent):Promise<void> => {
        const { nodeIds } = event;
        const updatedInlineStyles:Array<Promise<boolean>> = nodeIds.map(async (nodeId) => {
            const node = this.getDOMStateWithID(nodeId);
            if (node) {
                try {
                    await node.updateInlineStyle();
                } catch(err) {
                    console.error(err);
                    console.error(err.stack);
                }
                return true;
            } else {
                return false;
            }
        });
        const handled:Array<boolean> = await Promise.all(updatedInlineStyles);
        if(_.every(handled)) {
            if(this.showDebug()) {
                log.debug(`Set inline styles`);
            }
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find nodes for inlineStyleInvalidated`);
                throw new Error(`Could not find nodes for inlineStyleInvalidated`);
            }
        }
    };
    private doHandleChildNodeCountUpdated = async (event:CRI.ChildNodeCountUpdatedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            if(this.showDebug()) {
                log.debug(`Child count updated for ${nodeId}`);
            }
            try {
                await domState.childCountUpdated(event.childNodeCount);
            } catch(err) {
                if(this.shouldShowErrors()) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
        } else {
            if(this.shouldShowErrors()) {
                log.error(`Could not find ${nodeId} for childNodeCouldUpdated`);
                throw new Error(`Could not find ${nodeId}`);
            }
        }
    };
    private doHandleChildNodeInserted = async (event:CRI.ChildNodeInsertedEvent):Promise<void> => {
        const { parentNodeId } = event;
        const parentDomState = this.getDOMStateWithID(parentNodeId);
        if (parentDomState) {
            const { previousNodeId, node } = event;
            const { nodeId } = node;
            const previousDomState: DOMState = previousNodeId > 0 ? this.getDOMStateWithID(previousNodeId) : null;
            const domState = this.getOrCreateDOMState(node, null, null, parentDomState, previousDomState);
            try {
                await parentDomState.insertChild(domState, previousDomState);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }

            if(this.showDebug()) {
                log.debug(`Child node inserted ${nodeId} (parent: ${parentNodeId} / previous: ${previousNodeId})`);
            }
            domState.setChildrenRecursive(node.children, node.shadowRoots);
            this.requestChildNodes(nodeId, -1, true);
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${parentNodeId} for childNodeInserted`);
                throw new Error(`Could not find ${parentNodeId}`);
            }
        }
    };
    private doHandleChildNodeRemoved = async (event:CRI.ChildNodeRemovedEvent):Promise<void> => {
        const { parentNodeId, nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        const parentDomState = this.getDOMStateWithID(parentNodeId);
        if (domState && parentDomState) {
            if(this.showDebug()) {
                log.debug(`Child node removed ${nodeId} (parent: ${parentNodeId})`);
            }
            try {
                await parentDomState.removeChild(domState);
            } catch(err) {
                if(this.shouldShowErrors()) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
        } else {
            if(this.shouldShowErrors()) {
                throw new Error(`Could not find ${parentNodeId} or ${nodeId} for childNodeRemoved event`);
            }
        }
    };
    private doHandleAttributeModified = async (event:CRI.AttributeModifiedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            const { name, value } = event;
            if(this.showDebug()) {
                log.debug(`Attribute modified ${name} to ${value}`);
            }
            try {
                await domState.setAttribute(name, value);
            } catch(err) {
                if(this.shouldShowErrors()) {
                    console.error(err);
                    console.error(err.stack);
                }
            }
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${nodeId} for attributeModified event`);
                throw new Error(`Could not find ${nodeId}`);
            }
        }
    };
    private doHandleAttributeRemoved = async (event:CRI.AttributeRemovedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            const { name } = event;
            if(this.showDebug()) {
                log.debug(`Attribute removed ${name}`);
            }
            try {
                await domState.removeAttribute(name);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${nodeId} for attributeRemoved event`);
                throw new Error(`Could not find ${nodeId}`);
            }
        }
    };
    private doHandleShadowRootPopped = async (event:CRI.ShadowRootPoppedEvent):Promise<void> => {
        const { hostId, rootId } = event;
        const domState = this.getDOMStateWithID(hostId);
        const root = this.getDOMStateWithID(rootId);
        if (domState && root) {
            domState.popShadowRoot(root);
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${hostId} (or possible root ${rootId}) for shadowRootPopped event`);
                throw new Error(`Could not find ${hostId}`);
            }
        }
    };
    private doHandleShadowRootPushed = async (event:CRI.ShadowRootPushedEvent):Promise<void> => {
        const { hostId, root } = event;
        const domState = this.getDOMStateWithID(hostId);
        if (domState) {
            const shadowRoot = this.getOrCreateDOMState(root);
            domState.pushShadowRoot(shadowRoot);
        } else {
            if(this.shouldShowErrors()) {
                console.error(`Could not find ${hostId} for shadowRootPopped event`);
                throw new Error(`Could not find ${hostId} for shadowRootPopped`);
            }
        }
    };
    public async getData():Promise<TabDoc> {
        await this.initialized;
        return this.doc.getData();
    };
    public async stringify():Promise<string> {
        return JSON.stringify(await this.getData());
    };
    public shouldSuppressErrors():boolean { return this.browserState.shouldSuppressErrors(); }
    public shouldShowErrors():boolean { return !this.shouldSuppressErrors(); }
    public showDebug():boolean { return this.browserState.showDebug(); }
    public hideDebug():boolean { return !this.showDebug(); }
};
