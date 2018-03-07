import { TabState } from './TabState';
import { DOMState } from './DOMState';
import { EventManager } from '../event_manager';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import * as _ from 'underscore';
import * as ShareDB from 'sharedb';
import { TabDoc } from '../../utils/state_interfaces';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';
import {ResolvablePromise} from '../../utils/ResolvablePromise';
import * as mime from 'mime';
import {parseCSS} from '../css_parser';

const log = getColoredLogger('green');

export class FrameState extends ShareDBSharedState<TabDoc> {
    private setMainFrameExecuted: boolean = false;
    private refreshingRoot: boolean = false;
    private root: DOMState;
    private domParent: DOMState = null;
    private executionContext: CRI.ExecutionContextDescription = null;
    private requests:Map<string, CRI.Network.Request> = new Map<string, any>();
    private responses:Map<string, CRI.Network.Response> = new Map<string, CRI.Network.Response>();

	private resourcePromises:Map<string, Promise<CRI.GetResourceContentResponse>> = new Map<string, Promise<CRI.GetResourceContentResponse>>();

    constructor(private chrome, private info: CRI.Frame, private tab: TabState, private parentFrame: FrameState = null, resources: Array<CRI.FrameResource> = []) {
        super();
        resources.forEach((resource) => this.recordResponse(resource));
        log.debug(`=== CREATED FRAME STATE ${this.getFrameId()} ====`);
    };
    protected async onAttachedToShareDBDoc():Promise<void> {
        log.debug(`Frame State ${this.getFrameId()} added to ShareDB doc`);
        if(this.root) {
            await this.root.markAttachedToShareDBDoc();
        }
    };

    private recordResponse(response:CRI.Network.Response):void {
        this.responses.set(response.url, response);
    };
    public requestWillBeSent(event:CRI.RequestWillBeSentEvent):void {
        const {request} = event;
        const {url} = request;
        this.requests.set(url, event);
        log.debug(`Request will be sent ${url}`);
    };
    public responseReceived(event:CRI.ResponseReceivedEvent) {
        return this.recordResponse(event.response);
    };
    public getFrameInfo():CRI.Frame {
        return this.info;
    };
    public getShareDBDoc():SDBDoc<TabDoc> { return this.tab.getShareDBDoc(); };
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
    public updateInfo(info: CRI.Frame) {
        this.info = info;
    };
    public executionContextCreated(context: CRI.ExecutionContextDescription): void {
        this.executionContext = context;
    };

    public destroy(): void {
        const root = this.getRoot();
        if (root) {
            root.destroy();
        }
        this.requests.clear();
        this.responses.clear();
		this.resourcePromises.clear();
        log.debug(`=== DESTROYED FRAME STATE ${this.getFrameId()} ====`);
    };

    public getFrameId(): CRI.FrameID {
        return this.info.id;
    };
    public getRoot(): DOMState { return this.root; };

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

    public getResponseBody(requestId:CRI.RequestID):Promise<CRI.GetResponseBodyResponse> {
        return new Promise<CRI.GetResponseBodyResponse>((resolve, reject) => {
            this.chrome.Network.getResponseBody({
                requestId
            }, function(err, value) {
                if(err) {
                    reject(value);
                } else {
                    resolve(value);
                }
            });
        });
    }

    private doGetResource(url:string):Promise<CRI.GetResourceContentResponse> {
        return new Promise<CRI.GetResourceContentResponse>((resolve, reject) => {
            this.chrome.Page.getResourceContent({
                url, frameId: this.getFrameId()
            }, function(err, val) {
                if(err) {
                    reject(new Error(`Could not find resource '${url}'`));
                } else {
                    resolve(val);
                }
            });
        }).catch((err) => {
            throw(err);
        });
    }

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
