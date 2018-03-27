import { FrameState } from './FrameState';
import { TabState } from './TabState';
import { getCanvasImage, getUniqueSelector, getElementValue } from '../hack_driver/hack_driver';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import { processCSSURLs } from '../css_parser';
import { EventEmitter } from 'events';
import { NodeCode } from '../../utils/NodeCode';
import { urlTransform } from '../url_transform';
import {SDB, SDBDoc, SDBArray} from '../../utils/ShareDBDoc';
import * as _ from 'underscore';
import * as ShareDB from 'sharedb';
import * as timers from 'timers';
import {ShareDBDOMNode, TabDoc, CanvasImage} from '../../utils/state_interfaces';
import {ShareDBSharedState} from '../../utils/ShareDBSharedState';

const log = getColoredLogger('magenta');

export interface DestroyedEvent {
};
export type SubNodeType = 'children' | 'pseudoElements' | 'shadowRoots';

export class DOMState extends ShareDBSharedState<TabDoc> {
    private destroyed: boolean = false;
    private namespace: any = null;
    private inlineStyle: string = '';
    private subNodes:Map<SubNodeType, Array<DOMState>> = new Map<SubNodeType, Array<DOMState>>();
    private updateValueInterval: NodeJS.Timer = null;
    private updateListenersInterval: NodeJS.Timer = null;
    private shareDBNode:ShareDBDOMNode;
    private inputValue:string = '';
    private userLabel:string = null;
    private listenedEvents:Array<string> = [];

    private static attributesToIgnore: Array<string> = ['onload', 'onclick', 'onmouseover', 'onmouseout', 'onmouseenter', 'onmouseleave', 'action', 'oncontextmenu', 'onfocus'];
    private static shouldIncludeChild(child:DOMState):boolean {
        const node:CRI.Node = child.getNode();
        const {nodeName, nodeType} = node;
        if(nodeName === 'SCRIPT' || nodeName === '#comment' || nodeName === 'BASE' || nodeType === NodeCode.DOCUMENT_TYPE_NODE) {
            return false;
        } else {
            return true;
        }
    };
    private static shouldIncludeAttribute(node:CRI.Node, attributeName: string): boolean {
        const {nodeName, nodeType} = node;
        const lowercaseAttributeName = attributeName.toLowerCase();
        if(DOMState.attributesToIgnore.indexOf(lowercaseAttributeName) >= 0) {
            return false;
        } else {
            if(nodeName === 'IFRAME') {
                if(['src'].indexOf(lowercaseAttributeName)>=0) {
                    return false;
                }
            }
        }
        return true;
    };

    public onDestroyed = this.registerEvent<void>();
    constructor(private tab:TabState, private node: CRI.Node, private contentDocument?:DOMState, private childFrame?:FrameState, private parent?:DOMState) {
        super();
        if(this.contentDocument) { this.contentDocument.setParent(this); }
        if(this.showDebug()) {
            log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
        }
    };
    private getSubNodes(type:SubNodeType):Array<DOMState> {
        if(this.subNodes.has(type)) {
            return this.subNodes.get(type);
        } else { // Set array to correctly handle mutations
            const sn:Array<DOMState> = [];
            this.subNodes.set(type, sn);
            return sn;
        }
    };
    public getChildren():Array<DOMState> { return this.getSubNodes('children'); };
    public getShadowRoots():Array<DOMState> { return this.getSubNodes('shadowRoots'); };
    public getPseudoElements():Array<DOMState> { return this.getSubNodes('pseudoElements'); };
    protected async onAttachedToShareDBDoc():Promise<void> {
        if(this.showDebug()) {
            log.debug(`DOM State ${this.getNodeId()} added to ShareDB doc`);
        }

        await this.updateNodeValue();

        this.getChildren().forEach((child:DOMState) => {
            if(DOMState.shouldIncludeChild(child)) {
                child.markAttachedToShareDBDoc();
            }
        });
        // if(this.childFrame) {
        //     this.childFrame.markAttachedToShareDBDoc();
        // }
        if(this.contentDocument) {
            this.contentDocument.markAttachedToShareDBDoc();
        }
        this.addListenersInterval();
        this.addValueListeners();
    };
    private processNodeValue(nodeValue:string):string {
        const parent = this.getParent();
        if(parent && parent.getTagName().toLowerCase() === 'style') {
            return processCSSURLs(nodeValue, this.getBaseURL(), this.getFrameId(), this.getTabId());
        } else {
            return nodeValue;
        }
    };

    private async updateNodeValue():Promise<void> {
        try {
            const fullNodeValue:string = await this.getFullString();
            await this.setNodeValue(fullNodeValue);
        } catch(err) {
            if (err.code && err.code === -32000) {
                log.error(`Could not find node ${this.getNodeId()}`)
            }
        }
    };
    public getContentDocument():DOMState { return this.contentDocument; };
    public getShareDBDoc():SDBDoc<TabDoc> {
        return this.tab.getShareDBDoc();
    };
    public createShareDBNode():ShareDBDOMNode {
        const filteredChildren:Array<DOMState> = this.getChildren().filter((c) => DOMState.shouldIncludeChild(c));
        const children:Array<ShareDBDOMNode> = filteredChildren.map((c) => c.createShareDBNode());
        const {nodeId, nodeType, nodeName, nodeValue, attributes, isSVG} = this.getNode();
        return {
            nodeId, nodeType, nodeName, children, isSVG,
            canvasData: null,
            nodeValue: this.processNodeValue(nodeValue),
            attributes: this.computeGroupedAttributes(attributes),
            contentDocument: this.contentDocument ? this.contentDocument.createShareDBNode() : null,
            childFrame: this.childFrame ? this.childFrame.getFrameInfo() : null,
            inlineStyle: this.inlineStyle,
            inputValue: this.inputValue,
            listenedEvents: this.listenedEvents,
            userLabel:this.userLabel
        };
    };
    public async setLabel(label:string):Promise<void> {
        this.userLabel = label;
        if(this.isAttachedToShareDBDoc()) {
            const doc = this.getShareDBDoc();
            await doc.submitObjectReplaceOp(this.p('userLabel'), this.userLabel);
        }
    };
    private computeGroupedAttributes(attributes:Array<string>):Array<[string, string]> {
        if(!attributes) {
            return null;
        }
        const tagName = this.getTagName();
        const tagTransform = urlTransform[tagName.toLowerCase()];
        const rv:Array<[string,string]> = [];
        const len: number = attributes.length;
        let i: number = 0;
        while (i < len) {
            const [attributeName, attributeValue] = [attributes[i], attributes[i + 1]];
            if (DOMState.shouldIncludeAttribute(this.getNode(), attributeName)) {
                const newValue: string = this.transformAttributeValue(attributeName, attributeValue);
                rv.push([attributeName, newValue]);
            }
            i += 2;
        }
        return rv;
    };
    public getComputedShareDBNode():ShareDBDOMNode {
        const doc = this.getShareDBDoc();
        return doc.traverse(this.getAbsoluteShareDBPath());
    };
    public getNode():CRI.Node { return this.node; };
    public getAbsoluteShareDBPath():Array<string|number> {
        if(this.parent) {
            const parentAbsolutePath:Array<string|number> = this.parent.getAbsoluteShareDBPath();
            const parentToMe:Array<string|number> = this.parent.getShareDBPathToChild(this);
            return parentAbsolutePath.concat(parentToMe);
        } else {
            const tabAbsolutePath:Array<string|number> = this.tab.getAbsoluteShareDBPath();
            const tabToMe:Array<string|number> = this.tab.getShareDBPathToChild(this);
            return this.tab.getAbsoluteShareDBPath().concat(tabToMe);
        }
    };
    public getShareDBPathToChild(child:DOMState):Array<string|number> {
        const filteredChildren = this.getChildren().filter(DOMState.shouldIncludeChild);
        const fcIndex:number = filteredChildren.indexOf(child);
        if(fcIndex >= 0) {
            return ['children', fcIndex];
        }
        if(child === this.contentDocument) {
            return ['contentDocument'];
        }
        // const shadowRootIndex:number = this.getShadowRoots().indexOf(child);
        // if(shadowRootIndex >= 0) {
        //     return ['shadowRoots', shadowRootIndex];
        // }
        throw new Error(`Could not find path to node ${child.getNodeId()} from node ${this.getNodeId()}`);
    };
    // public getChildIndex(child:DOMState) {
    //     return this.children.indexOf(child);
    // };
    public getChildFrame():FrameState {
        return this.childFrame;
    };
    private getFrame():FrameState {
        let domState:DOMState = this;
        while(domState) {
            const frame = domState.getChildFrame();
            if(frame) {
                return frame;
            } else {
                domState = domState.getParent();
            }
        }
        return null;
    };
    public getFrameId():CRI.FrameID {
        return this.getFrame().getFrameId();
    };
    public destroy(): void {
        this.removeValueListeners();
        this.removeListenersInterval();
        this.getChildren().forEach((child: DOMState) => {
            child.destroy();
        });
        this.getShadowRoots().forEach((sr:DOMState) => {
            sr.destroy();
        });
        if(this.contentDocument) {
            this.contentDocument.destroy();
        }
        this.destroyed = true;
        this.onDestroyed.emit();

        if(this.showDebug()) {
            log.debug(`=== DESTROYED DOM STATE ${this.getNodeId()} ====`);
        }
    }
    public getTab(): TabState { return this.tab; };
    public getNodeId(): CRI.NodeID { return this.node.nodeId; };
    public getTagName(): string { return this.node.nodeName; };
    public getNodeAttributes(): Array<string> { return this.node.attributes; };
    // public getFrame(): FrameState { return this.frame; };
    // public getFrameId(): CRI.FrameID { return this.getFrame().getFrameId(); };
    public getTabId(): CRI.TabID { return this.getTab().getTabId(); };
    public getParent(): DOMState { return this.parent; };
    public setParent(parent: DOMState): void { this.parent = parent; }
    public getNodeType(): number { return this.node.nodeType; }
    private getChrome():CRI.Chrome { return this.getTab().getChrome(); };
    public async getCanvasImage(): Promise<any> { return getCanvasImage(this.getChrome(), this.getNodeId()); };
    public async getUniqueSelector(): Promise<string> {
        return getUniqueSelector(this.getChrome(), this.getNodeId());
    };
    public async getInputValue(): Promise<string> {
        return getElementValue(this.getChrome(), this.getNodeId());
    };
    private async getFullString(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const nodeType = this.getNodeType();
            const nodeValue = this.getNodeValue();

            if (nodeType === NodeCode.TEXT_NODE && nodeValue && nodeValue.endsWith('…')) {
                this.getChrome().DOM.getOuterHTML({
                    nodeId: this.getNodeId()
                }, (err, value) => {
                    if (err) {
                        reject(value['message']);
                    } else {
                        resolve(value.outerHTML);
                    }
                });
            } else {
                resolve(nodeValue);
            }
        }).catch((err) => {
            if(this.shouldShowErrors()) {
                log.error(err);
                throw (err);
            }
            return null;
        });
    };
    private addListenersInterval():void {
        this.updateListenersInterval = timers.setInterval(async () => {
            await this.updateListenedEvents();
        }, 20000);
    };
    private removeListenersInterval():void {
        if(this.updateListenersInterval) {
            timers.clearInterval(this.updateListenersInterval);
        }
    };
    private addValueListeners():void {
        const tagName: string = this.getTagName().toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
            this.updateValueInterval = timers.setInterval(async () => {
                const oldInputValue = this.inputValue;
                this.inputValue = await this.getInputValue();

                if(oldInputValue !== this.inputValue && this.isAttachedToShareDBDoc()) {
                    const doc = this.getShareDBDoc();
                    await doc.submitObjectReplaceOp(this.p('inputValue'), this.inputValue);
                }
            }, 700);
        } else if (tagName === 'canvas') {
            this.updateValueInterval = timers.setInterval(async () => {
                if(this.isAttachedToShareDBDoc()) {
                    const canvasImageData = await this.getCanvasImage();
                    const doc = this.getShareDBDoc();
                    await doc.submitObjectReplaceOp(this.p('canvasData'), canvasImageData);
                }
            }, 10000);
        }
    };
    private removeValueListeners():void {
        if (this.updateValueInterval) {
            timers.clearInterval(this.updateValueInterval);
            this.updateValueInterval = null;
        }
    };
    public async updateInlineStyle():Promise<void> {
        const oldInlineStyle: string = this.inlineStyle;
        const inlineStyle = await this.requestInlineStyle();
        const {cssText} = inlineStyle;

        this.inlineStyle = cssText;
        if(this.isAttachedToShareDBDoc()) {
            const doc = this.getShareDBDoc();
            await doc.submitObjectReplaceOp(this.p('inlineStyle'), cssText);
        }
    };

    public async pushShadowRoot(root:DOMState):Promise<void> {
        const rootNode = root.getNode();
        const shadowRoots = this.getShadowRoots();

        this.node.shadowRoots.push(rootNode);

        shadowRoots.push(root);

        if(this.isAttachedToShareDBDoc()) {
            const p = this.p('shadowRoots');
            const doc = this.getShareDBDoc();
            doc.submitListPushOp(p, root);
        }
    };
    public async popShadowRoot(root:DOMState):Promise<void> {
        const shadowRoots = this.getShadowRoots();
        const rootIndex = shadowRoots.indexOf(root);
        if(rootIndex >= 0) {
            this.node.shadowRoots.splice(rootIndex, 1);

            shadowRoots.splice(rootIndex, 1);

            if(this.isAttachedToShareDBDoc()) {
                const p = this.p('shadowRoots', rootIndex);
                const doc = this.getShareDBDoc();
                doc.submitListDeleteOp(p);
            }
        } else {
            if(this.shouldShowErrors()) {
                throw new Error(`Chould not find shadow root ${root.getNodeId()} in ${this.getNodeId()}`);
            }
        }
    };

    public async setCharacterData(characterData: string): Promise<void> {
        return this.setNodeValue(characterData);
    };
    private async setNodeValue(value: string): Promise<void> {
        const previousNodeValue = this.node.nodeValue;
        this.node.nodeValue = value;

        if(previousNodeValue !== this.node.nodeValue && this.isAttachedToShareDBDoc()) {
            const p = this.p('nodeValue');
            const doc = this.getShareDBDoc();
            await doc.submitObjectReplaceOp(p, this.processNodeValue(value));
        }
    };
    public getNodeValue(): string {
        return this.node.nodeValue;
    };
    public childCountUpdated(count: number): void {
        this.getTab().requestChildNodes(this.getNodeId())
    };
    public async insertChild(childDomState: DOMState, previousDomState: DOMState): Promise<void> {
        const children = this.getChildren();
        const index:number = previousDomState ? children.indexOf(previousDomState)+1 : 0;
        children.splice(index, 0, childDomState);
        this.node.children.splice(index, 0, childDomState.getNode());
        childDomState.setParent(this);

        if(this.isAttachedToShareDBDoc() && DOMState.shouldIncludeChild(childDomState)) {
            const filteredChildren = children.filter(DOMState.shouldIncludeChild);
            const fcIndex:number = filteredChildren.indexOf(childDomState);
            const doc = this.getShareDBDoc();
            await doc.submitListInsertOp(this.p('children', fcIndex), childDomState.createShareDBNode());
            childDomState.markAttachedToShareDBDoc();
        }
    };
    public async removeChild(child: DOMState): Promise<boolean> {
        const children = this.getChildren();
        const index = children.indexOf(child);
        if (index >= 0) {
            this.node.children.splice(index, 1);
            children.splice(index, 1);

            if(this.isAttachedToShareDBDoc()) {
                const doc = this.getShareDBDoc();
                const sdbChildren:Array<ShareDBDOMNode> = doc.traverse(this.p('children'));
                const nodeId = child.getNodeId();
                for(let i=0; i<sdbChildren.length; i++) {
                    const sdbChild = sdbChildren[i];
                    if(sdbChild.nodeId === nodeId) {
                        await doc.submitListDeleteOp(this.p('children', i));
                        child.markDetachedFromShareDBDoc();
                        break;
                    }
                }
            }

            child.destroy();
            return true;
        } else {
            return false;
        }
    };
    private async setSubNodes(type:SubNodeType, newSubNodes:Array<DOMState>):Promise<void> {
        const subNodes = this.getSubNodes(type);
        subNodes.forEach((subNode: DOMState) => {
            if (newSubNodes.indexOf(subNode) < 0) {
                subNode.destroy();
            }
        });

        subNodes.splice(0, subNodes.length, ...newSubNodes); // completely replace list

        subNodes.forEach((subNode) => {
            subNode.setParent(this);
        });
    };
    public async setAttribute(name: string, value: string):Promise<void> {
        const node = this.node;
        const { attributes } = node;
        if (!attributes) {
            throw new Error('Could not find attributes');
        }
        let found: boolean = false;
        for (let i: number = 0; i < attributes.length; i += 2) {
            const n = attributes[i];
            if (n === name) {
                attributes[i + 1] = value;
                found = true;
                break;
            }
        }
        if (!found) {
            attributes.push(name, value);
        }

        // === TRANSFORMED ATTRIBUTES ===
        if(this.isAttachedToShareDBDoc() && DOMState.shouldIncludeAttribute(this.getNode(), name)) {
            const doc = this.getShareDBDoc();
            const sdbNode = this.getComputedShareDBNode();
            const sdbAttributes = sdbNode.attributes;
            const newValue:string = this.transformAttributeValue(name, value);
            found = false;
            for(let i = 0; i<sdbAttributes.length; i++) {
                const [attributeName, attributeValue] = sdbAttributes[i];
                if(attributeName === name) {
                    await doc.submitListReplaceOp(this.p('attributes', i, 1), newValue);
                    found = true;
                    break;
                }
            }
            if(!found) {
                await doc.submitListPushOp(this.p('attributes'), [name, newValue]);
            }
        }
    };
    private transformAttributeValue(attributeName:string, attributeValue:string):string {
        const lowercaseTagName:string = this.getTagName().toLowerCase();
        const tagTransform = urlTransform[lowercaseTagName];
        const lowercaseAttributeName:string = attributeName.toLowerCase();
        const baseURL:string = this.getBaseURL();
        let newValue: string = attributeValue;
        if (_.has(tagTransform, lowercaseAttributeName)) {
            const attributeTransform = tagTransform[lowercaseAttributeName];
            if (baseURL) {
                newValue = attributeTransform.transform(attributeValue, baseURL, this);
            } else {
                log.debug('No base URL')
            }
        } else if(lowercaseAttributeName === 'style') {
            newValue = processCSSURLs(attributeValue, baseURL, this.getFrameId(), this.getTabId());
        }
        return newValue;
    };
    public async removeAttribute(name: string):Promise<boolean> {
        const node = this.node;
        const { attributes } = node;
        const attributeIndex = attributes.indexOf(name);
        if (attributeIndex >= 0) {
            attributes.splice(attributeIndex, 2);

            if(this.isAttachedToShareDBDoc()) {
                const doc = this.getShareDBDoc();
                const sdbNode = this.getComputedShareDBNode();
                const sdbAttributes = sdbNode.attributes;
                for(let i = 0; i<sdbAttributes.length; i++) {
                    const [attributeName, attributeValue] = sdbAttributes[i];
                    if(attributeName === name) {
                        await doc.submitListDeleteOp(this.p('attributes', i));
                        break;
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    };
    private async requestInlineStyle(): Promise<CRI.CSSStyle> {
        const nodeType = this.getNodeType();
        if (nodeType === NodeCode.ELEMENT_NODE) {
            return new Promise<CRI.CSSStyle>((resolve, reject) => {
                this.getChrome().CSS.getInlineStylesForNode({
                    nodeId: this.getNodeId()
                }, (err, data: CRI.GetInlineStylesResponse) => {
                    if (this.destroyed) {
                        reject(new Error(`Node ${this.getNodeId()} was destroyed`));
                    } else if (err) {
                        reject(err);
                    } else {
                        const { inlineStyle } = data;
                        if (inlineStyle.cssText) {
                            const newCSSText = processCSSURLs(inlineStyle.cssText, this.getBaseURL(), this.getFrameId(), this.getTabId());
                            inlineStyle.cssText = newCSSText;
                        }
                        resolve(inlineStyle);
                    }
                });
            }).catch((err) => {
                if(this.shouldShowErrors()) {
                    log.error(err);
                    throw (err);
                }
                return null;
            });
        };
    };

    private getBaseURL(): string {
        const frame = this.getFrame();
        return frame.getURL();
    };

    private stringifySelf(): string {
        const MAX_TEXT_LENGTH: number = 50;
        const type = this.getNodeType();
        const id = this.getNodeId();
        if (type === NodeCode.DOCUMENT_NODE) {
            return `(${id}) ${this.getTagName()}`
        } else if (type === NodeCode.TEXT_NODE) {
            var text = this.getNodeValue().replace(/(\n|\t)/gi, '');
            if (text.length > MAX_TEXT_LENGTH) {
                text = `${text.substr(0, MAX_TEXT_LENGTH)}...`;
            }
            return `(${id}) text: ${text}`
        } else if (type === NodeCode.DOCUMENT_TYPE_NODE) {
            return `(${id}) <${this.getTagName()}>`;
        } else if (type === NodeCode.ELEMENT_NODE) {
            let text = `(${id}) <${this.getTagName()}`;
            var attributesMap = this.getAttributesMap();
            var style = this.getInlineStyle();
            if (style) {
                attributesMap.set('style', style);
            }
            attributesMap.forEach((val: string, key: string) => {
                text += ` ${key} = '${val}'`;
            });
            if(this.listenedEvents.length>0) {
                text += ` (events: ${this.listenedEvents.join(', ')})`;
            }
            text += '>';
            return text;
        } else if (type === NodeCode.COMMENT_NODE) {
            let text = `(${id}) <!-- `
            text += this.getNodeValue().replace(/(\n|\t)/gi, '');
            if (text.length > MAX_TEXT_LENGTH) {
                text = text.substr(0, MAX_TEXT_LENGTH) + '...';
            }
            text += ' -->';
            return text;
        } else if(type === NodeCode.DOCUMENT_FRAGMENT_NODE) {
            const {shadowRootType, nodeName} = this.getNode();
            return `(${id}) ${nodeName} (type: ${shadowRootType})`;
        } else {
            return 'node';
        }
    };
    private getInlineStyle(): string {
        return this.inlineStyle;
    };
    private getAttributesMap(): Map<string, string> {
        return new Map(this.computeGroupedAttributes(this.getNode().attributes));
    };
    public print(level: number = 0): void {
        const tab:string = '    '.repeat(level);
        const children = this.getChildren();
        let result: string = `${tab}${this.stringifySelf()}`;
        if (this.childFrame) {
            result += `(${this.childFrame.getFrameId()})\n`;
        }
        console.log(result);
        if(this.contentDocument) {
            this.contentDocument.print(level+1);
        }

        children.forEach((child: DOMState) => {
            child.print(level + 1);
        });
        const shadowRoots = this.getShadowRoots();
        if(shadowRoots.length > 0) {
            console.log(`${tab} (shadow):::`)
            shadowRoots.forEach((child: DOMState) => {
                child.print(level + 1);
            });
        }
        // return result;
    };
    public getFrameStack() {
        return this.getFrame().getFrameStack();
    };
    public async querySelectorAll(selector: string): Promise<Array<CRI.NodeID>> {
        return new Promise<Array<CRI.NodeID>>((resolve, reject) => {
            this.getChrome().DOM.querySelectorAll({
                nodeId: this.getNodeId(),
                selector: selector
            }, (err, value) => {
                if (err) { reject(value); }
                else { resolve(value.nodeIds); }
            })
        });
    };
    private async updateListenedEvents():Promise<void> {
        const eventTypes:Set<string> = new Set<string>();
        (await this.getEventListeners()).forEach((el) => {
            eventTypes.add(el.type);
        });
        for(let i = 0; i<this.listenedEvents.length; i++) {
            const le:string = this.listenedEvents[i];
            if(!eventTypes.has(le)) {
                this.listenedEvents.splice(i, 1);
                if(this.isAttachedToShareDBDoc()) {
                    this.getShareDBDoc().submitListDeleteOp(this.p('listenedEvents').concat(i));
                }
                i--;
            }
        }
        eventTypes.forEach((el:string) => {
            if(this.listenedEvents.indexOf(el)<0) {
                this.listenedEvents.push(el);
                if(this.isAttachedToShareDBDoc()) {
                    this.getShareDBDoc().submitListPushOp(this.p('listenedEvents'), el);
                }
            }
        });
    };
    public async getEventListeners(depth:number=1, pierce:boolean=false):Promise<Array<CRI.DOMDebugger.EventListener>> {
        const remoteObject:CRI.Runtime.RemoteObject = await this.resolveNode();
        const {objectId} = remoteObject;
        return new Promise<Array<CRI.DOMDebugger.EventListener>>((resolve, reject) => {
            this.getChrome().DOMDebugger.getEventListeners({objectId, depth, pierce}, (err, value:CRI.GetEventListenersResult) => {
                if(err) { reject(value); }
                else { resolve(value.listeners); }
            });
        });
    };
    private resolveNode():Promise<CRI.Runtime.RemoteObject> {
        return new Promise<CRI.Runtime.RemoteObject>((resolve, reject) => {
            this.getChrome().DOM.resolveNode({nodeId:this.getNodeId()}, (err, value) => {
                if(err) { reject(value['message']); }
                else { resolve(value.object); }
            });
        });
    };
    public focus():Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getChrome().DOM.focus({nodeId:this.getNodeId()}, (err, value) => {
                if(err) { reject(value); }
                else { resolve(null); }
            });
        });
    };
    public async setChildrenRecursive(children: Array<CRI.Node>=[], shadowRoots:Array<CRI.Node>=[]):Promise<void> {
        const childDOMStates:Array<DOMState> = children.map((child: CRI.Node) => {
            const {contentDocument, frameId} = child;
            const contentDocState = contentDocument ? this.tab.getOrCreateDOMState(contentDocument) : null;
            const frame:FrameState = frameId ? this.tab.getFrame(frameId) : null;

            const domState:DOMState = this.tab.getOrCreateDOMState(child, contentDocState, frame, this);
            return domState;
        });

        this.setSubNodes('children', childDOMStates);
        this.node.children = childDOMStates.map((c) => c.getNode() );
        this.node.childNodeCount = this.node.children.length;

        childDOMStates.map((domState:DOMState) => {
            const child:CRI.Node = domState.getNode();
            const {children, shadowRoots} = child;
            domState.setChildrenRecursive(children, shadowRoots);
            return domState;
        });

        const shadowDOMNodes:Array<CRI.Node> = shadowRoots;
        const shadowDOMRoots = shadowDOMNodes.map((r:CRI.Node) => {
            const {contentDocument, frameId} = r;
            const contentDocState = contentDocument ? this.tab.getOrCreateDOMState(contentDocument) : null;
            const frame:FrameState = frameId ? this.tab.getFrame(frameId) : null;

            const domState:DOMState = this.tab.getOrCreateDOMState(r, contentDocState, frame, this);
            return domState;
        });

        this.setSubNodes('shadowRoots', shadowDOMRoots);
        this.node.shadowRoots = shadowDOMRoots.map((c) => c.getNode() );

        shadowDOMRoots.map((domState:DOMState) => {
            const child:CRI.Node = domState.getNode();
            const {children, shadowRoots} = child;
            domState.setChildrenRecursive(children, shadowRoots);
            return domState;
        });

        const contentDocument:DOMState = this.getContentDocument();
        if(contentDocument) {
            const node:CRI.Node = contentDocument.getNode();
            const {children, shadowRoots} = node;
            contentDocument.setChildrenRecursive(children, shadowRoots);
        }

        if(this.isAttachedToShareDBDoc()) {
            const doc = this.getShareDBDoc();
            const filteredChildren:Array<DOMState> = childDOMStates.filter((c) => DOMState.shouldIncludeChild(c));
            const sdbChildren:Array<ShareDBDOMNode> = filteredChildren.map((c) => c.createShareDBNode());
            await doc.submitObjectReplaceOp(this.p('children'), sdbChildren);
            filteredChildren.forEach((c) => c.markAttachedToShareDBDoc());
        }
    };
    public async getTextDescription():Promise<string> {
        return `${this.getNodeValue()}`;
    };
    public shouldSuppressErrors():boolean { return this.tab.shouldSuppressErrors(); }
    public shouldShowErrors():boolean { return !this.shouldSuppressErrors(); }
    public showDebug():boolean { return this.tab.showDebug(); }
    public hideDebug():boolean { return !this.showDebug(); }
}
