import { FrameState } from './frame_state';
import { TabState } from './tab_state';
import { ShadowDOM } from '../shadows/dom_shadow';
import { getCanvasImage, getUniqueSelector, getElementValue } from '../hack_driver/hack_driver';
import { getColoredLogger, level, setLevel } from '../../utils/ColoredLogger';
import { processCSSURLs } from '../css_parser';
import { EventEmitter } from 'events';
import { NodeCode } from '../../utils/NodeCode';
import { urlTransform } from '../url_transform';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import * as _ from 'underscore';
import * as ShareDB from 'sharedb';
import * as timers from 'timers';
import {ShareDBDOMNode, ShareDBFrame, TabDoc} from '../../utils/state_interfaces';
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
    private shareDBNode:ShareDBDOMNode;
    private inputValue:string = '';

    public onDestroyed = this.registerEvent<(DestroyedEvent)=>void>();
    constructor(private node: CRI.Node, private tab:TabState, private contentDocument?:DOMState, private childFrame?:FrameState, private parent?:DOMState) {
        super();
        if(this.contentDocument) { this.contentDocument.setParent(this); }
        log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
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
        // log.debug(`DOM State ${this.getNodeId()} added to ShareDB doc`);
        this.updateNodeValue();
        this.getChildren().map((child:DOMState) => {
            child.markAttachedToShareDBDoc();
        });
        if(this.childFrame) {
            this.childFrame.markAttachedToShareDBDoc();
        }
        if(this.contentDocument) {
            this.contentDocument.markAttachedToShareDBDoc();
        }
    };

    private async updateNodeValue():Promise<void> {
        try {
            const fullNodeValue:string = await this.getFullString();
            this.setNodeValue(fullNodeValue);
        } catch(err) {
            if (err.code && err.code === -32000) {
                log.error(`Could not find node ${this.getNodeId()}`)
            }
        }
    };
    private static stripNode(node:CRI.Node):CRI.Node {
        const rv:CRI.Node = _.clone(node);
        rv.children = [];
        rv.contentDocument = null;
        rv.attributes = [];
        return rv;
    };
    public getContentDocument():DOMState { return this.contentDocument; };
    public getShareDBDoc():SDBDoc<TabDoc> { return this.tab.getShareDBDoc(); };
    public createShareDBNode():ShareDBDOMNode {
        return {
            node: DOMState.stripNode(this.node),
            attributes: _.clone(this.node.attributes),
            nodeValue: this.node.nodeValue,
            shadowRootType: this.node.shadowRootType,
            shadowRoots: this.getShadowRoots().map((sr) => sr.createShareDBNode()),
            childNodeCount: this.getChildren().length,
            children: this.getChildren().map((child) => child.createShareDBNode()),
            contentDocument: this.contentDocument ? this.contentDocument.createShareDBNode() : null,
            childFrame: this.childFrame ? this.childFrame.getShareDBFrame() : null,
            inlineStyle: this.inlineStyle,
            inputValue: this.inputValue
        };
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
        const childIndex:number = this.getChildren().indexOf(child);
        if(childIndex >= 0) {
            return ['children', childIndex];
        }
        if(child === this.contentDocument) {
            return ['contentDocument'];
        }
        const shadowRootIndex:number = this.getShadowRoots().indexOf(child);
        if(shadowRootIndex >= 0) {
            return ['shadowRoots', shadowRootIndex];
        }
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
        this.getChildren().forEach((child: DOMState) => {
            child.destroy();
        });
        this.destroyed = true;
        this.emit(this.onDestroyed, {});
        // log.debug(`=== DESTROYED DOM STATE ${this.getNodeId()} ====`);
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
                        reject(value);
                    } else {
                        resolve(value.outerHTML);
                    }
                });
            } else {
                resolve(nodeValue);
            }
        }).catch((err) => {
            log.error(err);
            throw (err);
        });
    };
    private addValueListeners() {
        const tagName: string = this.getTagName().toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
            this.updateValueInterval = timers.setInterval(async () => {
                this.inputValue = await this.getInputValue();

                const p = this.p('inputValue');
                const doc = this.getShareDBDoc();
                await doc.submitObjectReplaceOp(p, this.inputValue);
            }, 700);
        } else if (tagName === 'canvas') {

        }
    };
    private removeValueListeners() {
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
        const p = this.p('inlineStyle');
        const doc = this.getShareDBDoc();
        await doc.submitObjectReplaceOp(p, cssText);
    };

    public async pushShadowRoot(root:DOMState):Promise<void> {
        const shadowRoots = this.getShadowRoots();

        this.node.shadowRoots.push(root.getNode());

        shadowRoots.push(root);

        const p = this.p('shadowRoots');
        const doc = this.getShareDBDoc();
        doc.submitListPushOp(p, root);
    };
    public async popShadowRoot(root:DOMState):Promise<void> {
        const shadowRoots = this.getShadowRoots();
        const rootIndex = shadowRoots.indexOf(root);
        if(rootIndex >= 0) {
            this.node.shadowRoots.splice(rootIndex, 1);

            shadowRoots.splice(rootIndex, 1);
            const p = this.p('shadowRoots', rootIndex);
            const doc = this.getShareDBDoc();
            doc.submitListDeleteOp(p);
        } else {
            throw new Error(`Chould not find shadow root ${root.getNodeId()} in ${this.getNodeId()}`);
        }
    };

    public async setCharacterData(characterData: string): Promise<void> {
        this.node.nodeValue = characterData;

        const p = this.p('characterData');
        const doc = this.getShareDBDoc();
        await doc.submitObjectReplaceOp(p, characterData);
    };
    private async setNodeValue(value: string): Promise<void> {
        this.node.nodeValue = value;

        const p = this.p('nodeValue');
        const doc = this.getShareDBDoc();
        await doc.submitObjectReplaceOp(p, value);
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
        if(this.isAttachedToShareDBDoc()) {
            childDomState.markAttachedToShareDBDoc();
        }

        const p = this.p('children', index);
        const doc = this.getShareDBDoc();
        await doc.submitListInsertOp(p, childDomState.createShareDBNode());
    };
    public async removeChild(child: DOMState): Promise<boolean> {
        const children = this.getChildren();
        const index = children.indexOf(child);
        if (index >= 0) {
            this.node.children.splice(index, 1);
            children.splice(index, 1);

            const p = this.p('children', index);
            const doc = this.getShareDBDoc();
            await doc.submitListDeleteOp(p);

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

        if(this.isAttachedToShareDBDoc()) {
            subNodes.forEach((child) => {
                child.markAttachedToShareDBDoc();
            });
        }
    };
    public async setChildren(newChildren: Array<DOMState>):Promise<void> {
        this.setSubNodes('children', newChildren);
        const children = this.getChildren();
        this.node.children = children.map((c) => c.getNode() );
        this.node.childNodeCount = this.node.children.length;

        const doc = this.getShareDBDoc();
        const ops = [doc.submitObjectReplaceOp(this.p('children'), children.map((c) => c.createShareDBNode())),
                    doc.submitObjectReplaceOp(this.p('childNodeCount'), this.node.children.length)];
        await Promise.all(ops);
    };
    public async setShadowRoots(newChildren: Array<DOMState>):Promise<void> {
        this.setSubNodes('shadowRoots', newChildren);
        const children = this.getShadowRoots();
        this.node.shadowRoots = children.map((c) => c.getNode() );

        const doc = this.getShareDBDoc();
        await doc.submitObjectReplaceOp(this.p('shadowRoots'), children.map((c) => c.createShareDBNode()));
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
                const p = this.p('attributes', i+1);
                const doc = this.getShareDBDoc();
                await doc.submitListReplaceOp(p, value);
                found = true;
                break;
            }
        }
        if (!found) {
            attributes.push(name, value);

            const index = attributes.length;
            const doc = this.getShareDBDoc();
            await doc.submitListPushOp(this.p('attributes'), name, value);
        }
    };
    public async removeAttribute(name: string):Promise<boolean> {
        const node = this.node;
        const { attributes } = node;
        const attributeIndex = attributes.indexOf(name);
        if (attributeIndex >= 0) {
            attributes.splice(attributeIndex, 2);
            const oldValue = attributes[attributeIndex+1];
            const p0 = this.p('attributes', attributeIndex);
            const p1 = this.p('attributes', attributeIndex+1);
            const doc = this.getShareDBDoc();
            await Promise.all([doc.submitListDeleteOp(p1), doc.submitListDeleteOp(p0)]);
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
                log.error(err);
                throw (err);
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
            return `${nodeName} (type: ${shadowRootType})`;
        } else {
            return 'node';
        }
    };
    private getInlineStyle(): string {
        return this.inlineStyle;
    };
    private static attributesToIgnore: Array<string> = ['onload', 'onclick', 'onmouseover', 'onmouseout',
        'onmouseenter', 'onmouseleave', 'action', 'oncontextmenu', 'onfocus'];
    private shouldIncludeAttribute(attributeName: string): boolean {
        const lowercaseAttributeName = attributeName.toLowerCase();
        return DOMState.attributesToIgnore.indexOf(lowercaseAttributeName) < 0;
    };
    private getAttributesMap(shadow?:ShadowDOM): Map<string, string> {
        const tagName = this.getTagName();
        const tagTransform = urlTransform[tagName.toLowerCase()];
        const attributes = this.getNodeAttributes();
        const rv = new Map<string, string>();

        const len: number = attributes.length;
        let i: number = 0;
        while (i < len) {
            const [attributeName, attributeValue] = [attributes[i], attributes[i + 1]];
            let newValue: string = attributeValue;
            if (this.shouldIncludeAttribute(attributeName)) {
                if (_.has(tagTransform, attributeName.toLowerCase())) {
                    const attributeTransofrm = tagTransform[attributeName.toLowerCase()];
                    const url = this.getBaseURL();
                    if (url) {
                        newValue = attributeTransofrm.transform(attributeValue, url, this, shadow);
                    } else {
                        log.debug('No base URL')
                    }
                }
            } else {
                newValue = '';
            }
            rv.set(attributeName, newValue);
            i += 2;
        }
        return rv;
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
}
