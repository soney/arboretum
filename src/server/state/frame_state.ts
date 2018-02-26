import { TabState } from './tab_state';
import { DOMState } from './dom_state';
import { EventManager } from '../event_manager';
import { ResourceTracker } from '../resource_tracker';
import { getColoredLogger, level, setLevel } from '../../utils/logging';
import {SDB, SDBDoc} from '../../utils/sharedb_wrapper';
import * as _ from 'underscore';
import * as ShareDB from 'sharedb';
import {TabDoc, ShareDBFrame } from '../../utils/state_interfaces';

const log = getColoredLogger('green');

interface QueuedEvent<E> {
    event: E,
    promise: ResolvablePromise<E>,
    type: string
}

export class FrameState {
    private setMainFrameExecuted: boolean = false;
    private refreshingRoot: boolean = false;
    private root: DOMState;
    private domParent: DOMState = null;
    private nodeMap: Map<CRI.NodeID, DOMState> = new Map<CRI.NodeID, DOMState>();
    private oldNodeMap: Map<CRI.NodeID, boolean> = new Map<CRI.NodeID, boolean>();
    private queuedEvents: Array<QueuedEvent<any>> = [];
    private executionContext: CRI.ExecutionContextDescription = null;
    private shareDBFrame:ShareDBFrame;

    private eventManager: EventManager;
    public resourceTracker: ResourceTracker;

    constructor(private chrome, private info: CRI.Frame, private tab: TabState, private parentFrame: FrameState = null, resources: Array<CRI.FrameResource> = []) {
        this.eventManager = new EventManager(this.chrome, this);
        this.resourceTracker = new ResourceTracker(chrome, this, resources);
        log.debug(`=== CREATED FRAME STATE ${this.getFrameId()} ====`);
    };
    public getShareDBDoc():SDBDoc<TabDoc> { return this.tab.getShareDBDoc(); };
    public async submitOp(...ops:Array<ShareDB.Op>):Promise<void> {
        await this.getShareDBDoc().submitOp(ops);
    };
    public getShareDBFrame():ShareDBFrame {
        return this.shareDBFrame;
    };
    public getParentFrame(): FrameState {
        return this.parentFrame;
    };
    public getShareDBPath():Array<string|number> {
        return [this.getFrameId()];
    };
    public setDOMParent(parent: DOMState): void {
        this.domParent = parent;
    }
    public getTab(): TabState {
        return this.tab;
    }
    public markSetMainFrameExecuted(val: boolean): void {
        this.setMainFrameExecuted = val;
    };
    public getURL(): string {
        return this.info.url;
    };
    public getTabId(): CRI.TabID {
        return this.tab.getTabId();
    }
    // 	proto._getWrappedDOMNodeWithID = function(id) {
    // 		return this._nodeMap[id];
    // 	};
    public updateInfo(info: CRI.Frame) {
        this.info = info;
    };
    public requestWillBeSent(resource) {

    };
    public responseReceived(event) {

    };
    public executionContextCreated(context: CRI.ExecutionContextDescription): void {
        this.executionContext = context;
    };
    private isRefreshingRoot(): boolean { return this.refreshingRoot; }
    private markRefreshingRoot(r: boolean): void {
        if (r) {
            this.refreshingRoot = true;
        } else {
            this.refreshingRoot = false;

            while (this.queuedEvents.length > 0) {
                var queuedEvent = this.queuedEvents.shift();
                queuedEvent.promise.resolve(queuedEvent.event).catch((err) => {
                    log.error(err);
                });
            }
        }
    };

    public destroy(): void {
        const root = this.getRoot();
        if (root) {
            root.destroy();
        }
        this.resourceTracker.destroy();
        log.debug(`=== DESTROYED FRAME STATE ${this.getFrameId()} ====`);
    };

    public getFrameId(): CRI.FrameID {
        return this.info.id;
    };
    public getRoot(): DOMState { return this.root; };
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

    public getExecutionContext(): CRI.ExecutionContextDescription {
        return this.executionContext;
    };

    public getFrameStack(): Array<FrameState> {
        const rv: Array<FrameState> = [];
        let frameState: FrameState = this;
        while (frameState) {
            rv.unshift(frameState);
            frameState = frameState.getParentFrame();
        }
        return rv;
    };

    public setDOMRoot(domState:DOMState):void { this.root = domState; };
    public hasRoot():boolean { return !!this.getRoot(); };

    public requestResource(url: string): Promise<any> {
        return this.resourceTracker.getResource(url);
    };
    public print(level: number = 0): void {
        const root = this.getRoot();
        if(root) {
            root.print(level);
        } else {
            console.log('NOTHING');
        }
    };
    public async querySelectorAll(selector: string): Promise<Array<CRI.NodeID>> {
        const root = this.getRoot();
        if (root) {
            return root.querySelectorAll(selector)
        } else {
            return new Promise<Array<CRI.NodeID>>(function(resolve, reject) {
                reject(new Error('Could not find root'));
            });
        }
    }
}

class ResolvablePromise<E> {
    private _resolve: (E) => any;
    private _reject: (any) => any;
    private _promise: Promise<E>;
    constructor() {
        this._promise = new Promise<E>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    public resolve(val: E): Promise<E> {
        this._resolve(val);
        return this.getPromise();
    }
    public reject(val: any): Promise<E> {
        this._reject(val);
        return this.getPromise();
    }
    public getPromise(): Promise<E> {
        return this._promise;
    }
}
