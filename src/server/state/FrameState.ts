import { TabState } from './TabState';
import { DOMState } from './DOMState';
import { EventManager } from '../event_manager';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import * as _ from 'underscore';
import * as ShareDB from 'sharedb';
import {TabDoc, ShareDBFrame } from '../../utils/state_interfaces';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';
import {ResolvablePromise} from '../../utils/ResolvablePromise';
import * as mime from 'mime';
import {parseCSS} from '../css_parser';

const log = getColoredLogger('green');

interface QueuedEvent<E> {
    event: E,
    promise: ResolvablePromise<E>,
    type: string
}

export class FrameState extends ShareDBSharedState<TabDoc> {
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
    // public resourceTracker: ResourceTracker;
	private requests:Map<any, any> = new Map<any, any>();
	private responses:Map<string, any> = new Map<string, any>();
	private resourcePromises = new Map();

    constructor(private chrome, private info: CRI.Frame, private tab: TabState, private parentFrame: FrameState = null, resources: Array<CRI.FrameResource> = []) {
        super();
        this.shareDBFrame = {
            frame: this.info,
            frameID: this.getFrameId()
        };
        this.eventManager = new EventManager(this.chrome, this);
        resources.forEach((resource) => this.recordResponse(resource));
        // this.resourceTracker = new ResourceTracker(chrome, this, resources);
        log.debug(`=== CREATED FRAME STATE ${this.getFrameId()} ====`);
    };
    protected async onAttachedToShareDBDoc():Promise<void> {
        log.debug(`Frame State ${this.getFrameId()} added to ShareDB doc`);
        if(this.root) {
            await this.root.markAttachedToShareDBDoc();
        }
    };
    public getShareDBDoc():SDBDoc<TabDoc> { return this.tab.getShareDBDoc(); };
    public getShareDBFrame():ShareDBFrame {
        return this.shareDBFrame;
    };
    public getParentFrame(): FrameState {
        return this.parentFrame;
    };
    public getAbsoluteShareDBPath():Array<string|number> {
        return [this.getFrameId()];
    };
    public setDOMParent(parent: DOMState): void {
        this.domParent = parent;
    };
    public getTab(): TabState {
        return this.tab;
    };
    public markSetMainFrameExecuted(val: boolean): void {
        this.setMainFrameExecuted = val;
    };
    public getURL(): string {
        return this.info.url;
    };
    public getTabId(): CRI.TabID {
        return this.tab.getTabId();
    };
    // 	proto._getWrappedDOMNodeWithID = function(id) {
    // 		return this._nodeMap[id];
    // 	};
    public updateInfo(info: CRI.Frame) {
        this.info = info;
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
        // this.resourceTracker.destroy();
		this.requests.clear();
		this.responses.clear();
		this.resourcePromises.clear();
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

	private recordResponse(response):void {
		this.responses.set(response.url, response);
	}
	public requestWillBeSent(resource):void {
		const {url} = resource;
		this.requests.set(url, resource);
		log.debug('request will be sent ' + url);
	}
	public responseReceived(event) {
		return this.recordResponse(event.response);
	}
	public getResponseBody(requestId:CRI.RequestID):Promise<CRI.GetResponseBodyResponse> {
		return new Promise<CRI.GetResponseBodyResponse>((resolve, reject) => {
			this.chrome.Network.getResponseBody({
				requestId: requestId
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	}
	public requestResource(url:string):Promise<any> {
		let promise;
		if(this.resourcePromises.has(url)) {
			promise = this.resourcePromises.get(url);
		} else {
			promise = this.doGetResource(url);
			this.resourcePromises.set(url, promise);
		}
		return promise.then((responseBody) => {
			const resourceInfo = this.responses.get(url);
			const mimeType = resourceInfo ? resourceInfo.mimeType : mime.getType(url);
			let content;
			if(mimeType === 'text/css') {
				content = parseCSS(content, url, this.getFrameId(), this.getTabId());
			} else {
				content = responseBody.content;
			}

			return {
				mimeType: mimeType,
				base64Encoded: responseBody.base64Encoded,
				content: content
			};
		});
	}

	private doGetResource(url:string):Promise<CRI.GetResourceContentResponse> {
		return new Promise<CRI.GetResourceContentResponse>((resolve, reject) => {
			this.chrome.Page.getResourceContent({
				frameId: this.getFrameId(),
				url: url
			}, function(err, val) {
				if(err) {
					reject(new Error('Could not find resource "' + url + '"'));
				} else {
					resolve(val);
				}
			});
		}).catch((err) => {
			throw(err);
		});
	}

    // public requestResource(url: string): Promise<any> {
    //     return this.resourceTracker.getResource(url);
    // };
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
