import * as cri from 'chrome-remote-interface';
import { FrameState } from './FrameState';
import { DOMState } from './DOMState';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import * as _ from 'underscore';
import { EventEmitter } from 'events';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import { parse, format } from 'url';
import * as ShareDB from 'sharedb';
import {TabDoc, FrameDoc } from '../../utils/state_interfaces';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';

const log = getColoredLogger('yellow');
interface PendingFrameEvent {
    frameId: CRI.FrameID,
    event: any,
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
    public initialized:Promise<void>
    constructor(private info: CRI.TabInfo, private sdb:SDB) {
        super();
        try {
            this.initialized = this.initialize();
        } catch(err) {
            console.error(err);
            throw err;
        }
        log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
    };
    private async initialize():Promise<void> {
        this.doc = await this.sdb.get<TabDoc>('tab', this.getTabId());
        await this.doc.createIfEmpty({
            id:this.getTabId(),
            root:null
        });
        await this.markAttachedToShareDBDoc();

        const chromeEventEmitter = cri({
            chooseTab: this.info
        });
        this.chromePromise = new Promise<CRI.Chrome>((resolve, reject) => {
            chromeEventEmitter.once('connect', (chrome: CRI.Chrome) => {
                this.chrome = chrome;
                resolve(chrome);
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
        await this.chromePromise;
        //TODO: Convert getResourceTree call to getFrameTree when supported
        const resourceTree:CRI.FrameResourceTree = await this.getResourceTree();
        const { frameTree } = resourceTree;
        const { frame, childFrames, resources } = frameTree;
        this.createFrameState(frame, null, childFrames, resources);
        await this.refreshRoot();

        await this.addFrameListeners();
        // await this.addNetworkListeners();
        await this.addDOMListeners();
        // this.addNetworkListeners();
        await this.addExecutionContextListeners();
    };
    public getSDB():SDB { return this.sdb; };
    public getShareDBDoc():SDBDoc<TabDoc> { return this.doc; };
    public getAbsoluteShareDBPath():Array<string|number> { return []; };
    public getShareDBPathToChild(child:DOMState):Array<string|number> {
        if(child === this.domRoot) {
            return ['root'];
        } else {
            throw new Error(`Could not find path to node ${child.getNodeId()} from tab ${this.getTabId()}`);
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
        log.debug(`Tab State ${this.getTabId()} added to ShareDB doc`);
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
    private getDOMStateWithID(nodeId: CRI.NodeID): DOMState {
        return this.nodeMap.get(nodeId);
    };
    private hasDOMStateWithID(nodeId: CRI.NodeID): boolean {
        return this.nodeMap.has(nodeId);
    };
    public getOrCreateDOMState(node:CRI.Node, contentDocument?:DOMState, childFrame?:FrameState, parent?:DOMState, previousNode?:DOMState): DOMState {
        const { nodeId } = node;
        if (this.hasDOMStateWithID(nodeId)) {
            return this.getDOMStateWithID(nodeId);
        } else {
            const domState = new DOMState(node, this, contentDocument, childFrame, parent);
            this.nodeMap.set(nodeId, domState);
            domState.once(domState.onDestroyed, () => {
                this.nodeMap.delete(nodeId);
            });
            return domState;
        }
    };
    private async refreshRoot(): Promise<CRI.Node> {
        return this.getDocument(-1, true).then((root: CRI.Node) => {
            this.setDocument(root);
            return root;
        });
    };
    private createFrameState(info: CRI.Frame, parentFrame: FrameState = null, childFrames: Array<CRI.FrameTree> = [], resources: Array<CRI.FrameResource> = []): FrameState {
        const { id, parentId } = info;
        const frameState: FrameState = new FrameState(this.chrome, info, this, parentFrame, resources);
        this.frames.set(id, frameState);
        // if (!parentId) {
            // this.setRootFrame(frameState);
            // this.refreshRoot();
        // }
        this.updateFrameOnEvents(frameState);
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
    private async addNetworkListeners():Promise<void> {
        await this.chrome.Network.enable();
        this.chrome.Network.requestWillBeSent(this.requestWillBeSent);
        this.chrome.Network.responseReceived(this.responseReceived);
    };
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
    public async requestChildNodes(nodeId: CRI.NodeID, depth: number = 1, pierce=false): Promise<CRI.RequestChildNodesResult> {
        return new Promise<CRI.RequestChildNodesResult>((resolve, reject) => {
            this.chrome.DOM.requestChildNodes({ nodeId, depth, pierce }, (err, val) => {
                if (err) { reject(val); }
                else { resolve(val); }
            });
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    };
    public requestResource(url: string, frameId: CRI.FrameID): Promise<any> {
        const frame = this.getFrame(frameId);
        return frame.requestResource(url);
    };
    public getTitle(): string { return this.info.title; };
    public getURL(): string { return this.info.url; };
    private setTitle(title: string): void {
        this.info.title = title;
    };
    private setURL(url: string): void {
        this.info.url = url;
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
            console.error(err);
            throw(err);
        });
    };
    // private setRootFrame(frame: FrameState):void {
    //     if (this.rootFrame) {
    //         this.frames.forEach((frame: FrameState, id: CRI.FrameID) => {
    //             if (id !== frame.getFrameId()) {
    //                 this.destroyFrame(id);
    //             }
    //         });
    //     }
    //     log.info(`Set main frame to ${frame.getFrameId()}`);
    //     this.rootFrame = frame;
    //     frame.markSetMainFrameExecuted(true);
    //     this.emit('mainFrameChanged');
    //     /*
    //     return this.getDocument().then((root: CRI.Node) => {
    //         this.rootFrame.setRoot(root);
    //         this.emit('mainFrameChanged');
    //     }).catch((err) => {
    //         log.error(err);
    //         throw (err);
    //     });
    //     */
    // }
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
            log.error(err);
            throw (err);
        });
    }

    private updateFrameOnEvents(frameState: FrameState): void {
        const frameId = frameState.getFrameId();
        const pendingFrameEvents = this.pendingFrameEvents.get(frameId);

        if (pendingFrameEvents) {
            // const resourceTracker = frameState.resourceTracker;
            pendingFrameEvents.forEach((eventInfo) => {
                const { type, event } = eventInfo;
                if (type === 'responseReceived') {
                    frameState.responseReceived(event);
                } else if (type === 'requestWillBeSent') {
                    frameState.requestWillBeSent(event);
                }
            });
            this.pendingFrameEvents.delete(frameId);
        }
    };
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
    private executionContextCreated = (event: CRI.ExecutionContextCreatedEvent): void => {
        const { context } = event;
        const { auxData } = context;
        const { frameId } = auxData;
        if (this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.executionContextCreated(context);
        } else {
            log.error(`Could not find frame ${frameId} for execution context`);
        }
    };
    private addPendingFrameEvent(eventInfo: PendingFrameEvent): void {
        const { frameId } = eventInfo;
        if (this.pendingFrameEvents.has(frameId)) {
            this.pendingFrameEvents.get(frameId).push(eventInfo);
        } else {
            this.pendingFrameEvents.set(frameId, [eventInfo])
        }
    }
    public getFrame(id: CRI.FrameID): FrameState { return this.frames.get(id); }
    private hasFrame(id: CRI.FrameID): boolean { return this.frames.has(id); }
    private async getFrameTree(): Promise<CRI.FrameTree> {
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
    public async getResource(url:string):Promise<CRI.FrameResource> {
        const resourceTree:CRI.FrameResourceTree = await this.getResourceTree();
        const {frameTree} = resourceTree;
        const {resources} = frameTree;
        for(let i = 0; i<resources.length; i++) {
            const resource = resources[i];
            if(resource.url === url) {
                return resource;
            }
        }
        return null;
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

    private async getResourceTree(): Promise<CRI.FrameResourceTree> {
        return new Promise<CRI.FrameResourceTree>((resolve, reject) => {
            this.chrome.Page.getResourceTree({}, (err, value: CRI.FrameResourceTree) => {
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
        const resourceTree:CRI.FrameResourceTree = await this.getResourceTree();
        const {frameTree} = resourceTree;
        const {resources} = frameTree;
        console.log(resources);
    };
    public destroy() {
        this.chrome.close();
        log.debug(`=== DESTROYED TAB STATE ${this.getTabId()} ====`);
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
        log.debug(`Document Updated`);
    };
    private doHandleCharacterDataModified = async (event: CRI.CharacterDataModifiedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            log.debug(`Character Data Modified ${nodeId}`)
            try {
                await domState.setCharacterData(event.characterData);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            // const doc = await this.getDocument(-1, true);
            // console.log(doc);
            // this.chrome.DOM.resolveNode({nodeId}, (err, node) => {
            //     console.log(node);
            // });
            console.error(`Could not find ${nodeId} for characterDataModified`);
            // throw new Error(`Could not find ${nodeId}`);
        }
    }
    private doHandleSetChildNodes = (event:CRI.SetChildNodesEvent):void => {
        const { parentId } = event;
        const parent = this.getDOMStateWithID(parentId);
        if (parent) {
            try {
                const { nodes } = event;
                log.debug(`Set child nodes ${parentId} -> [${nodes.map((node) => node.nodeId).join(', ')}]`);
                parent.setChildrenRecursive(nodes);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            console.error(`Could not find ${parentId} for setChildNodes`);
            // throw new Error(`Could not find ${parentId}`);
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
            log.debug(`Set inline styles`);
        } else {
            console.error(`Could not find nodes for inlineStyleInvalidated`);
            // throw new Error(`Could not find nodes for inlineStyleInvalidated`);
        }
    };
    private doHandleChildNodeCountUpdated = async (event:CRI.ChildNodeCountUpdatedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            log.debug(`Child count updated for ${nodeId}`);
            try {
                await domState.childCountUpdated(event.childNodeCount);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            log.error(`Could not find ${nodeId} for childNodeCouldUpdated`);
            // throw new Error(`Could not find ${nodeId}`);
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

            log.debug(`Child node inserted ${nodeId} (parent: ${parentNodeId} / previous: ${previousNodeId})`);
            domState.setChildrenRecursive(node.children, node.shadowRoots);
            this.requestChildNodes(nodeId, -1, true);
        } else {
            console.error(`Could not find ${parentNodeId} for childNodeInserted`);
            // throw new Error(`Could not find ${parentNodeId}`);
        }
    };
    private doHandleChildNodeRemoved = async (event:CRI.ChildNodeRemovedEvent):Promise<void> => {
        const { parentNodeId, nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        const parentDomState = this.getDOMStateWithID(parentNodeId);
        if (domState && parentDomState) {
            log.debug(`Child node removed ${nodeId} (parent: ${parentNodeId})`);
            try {
                await parentDomState.removeChild(domState);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            throw new Error(`Could not find ${parentNodeId} or ${nodeId} for childNodeRemoved event`);
        }
    };
    private doHandleAttributeModified = async (event:CRI.AttributeModifiedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            const { name, value } = event;
            log.debug(`Attribute modified ${name} to ${value}`);
            try {
                await domState.setAttribute(name, value);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            console.error(`Could not find ${nodeId} for attributeModified event`);
            // throw new Error(`Could not find ${nodeId}`);
        }
    };
    private doHandleAttributeRemoved = async (event:CRI.AttributeRemovedEvent):Promise<void> => {
        const { nodeId } = event;
        const domState = this.getDOMStateWithID(nodeId);
        if (domState) {
            const { name } = event;
            log.debug(`Attribute removed ${name}`);
            try {
                await domState.removeAttribute(name);
            } catch(err) {
                console.error(err);
                console.error(err.stack);
            }
        } else {
            console.error(`Could not find ${nodeId} for attributeRemoved event`);
            // throw new Error(`Could not find ${nodeId}`);
        }
    };
    private doHandleShadowRootPopped = async (event:CRI.ShadowRootPoppedEvent):Promise<void> => {
        const { hostId, rootId } = event;
        const domState = this.getDOMStateWithID(hostId);
        const root = this.getDOMStateWithID(rootId);
        if (domState && root) {
            domState.popShadowRoot(root);
        } else {
            console.error(`Could not find ${hostId} (or possible root ${rootId}) for shadowRootPopped event`);
            // throw new Error(`Could not find ${nodeId}`);
        }
    };
    private doHandleShadowRootPushed = async (event:CRI.ShadowRootPushedEvent):Promise<void> => {
        const { hostId, root } = event;
        const domState = this.getDOMStateWithID(hostId);
        if (domState) {
            const shadowRoot = this.getOrCreateDOMState(root);
            domState.pushShadowRoot(shadowRoot);
        } else {
            console.error(`Could not find ${hostId} for shadowRootPopped event`);
            // throw new Error(`Could not find ${nodeId}`);
        }
    };
};
