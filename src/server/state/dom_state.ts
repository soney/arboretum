import { ShareDBFrame, FrameState } from './frame_state';
import { TabState, ShareDBTab } from './tab_state';
import { ShadowDOM } from '../shadows/dom_shadow';
import { getCanvasImage, getUniqueSelector, getElementValue } from '../hack_driver/hack_driver';
import { getColoredLogger, level, setLevel } from '../../utils/logging';
import { processCSSURLs } from '../css_parser';
import { EventEmitter } from 'events';
import { NodeCode } from '../../utils/node_code';
import { urlTransform } from '../url_transform';
import {SDB, SDBDoc} from '../../utils/sharedb_wrapper';
import * as _ from 'underscore';
import * as ShareDB from 'sharedb';

const log = getColoredLogger('magenta');

export interface ShareDBDOMNode {
    node: CRI.Node,
    childFrame: ShareDBFrame
};

export class DOMState extends EventEmitter {
    private destroyed: boolean = false;
    private namespace: any = null;
    private inlineStyle: string = '';
    private children: Array<any> = [];
    private updateValueInterval: NodeJS.Timer = null;
    private shareDBNode:ShareDBDOMNode;

    constructor(private node: CRI.Node, private tab:TabState, private contentDocument?:DOMState, private childFrame?:FrameState, private parent?:DOMState) {
        super();
        // this.shareDBNode = {
        //     node: _.clone(node),
        //     childFrame: this.childFrame ? this.childFrame.getShareDBFrame() : null
        // };

        this.getFullString().then((fullNodeValue: string) => {
            this.setNodeValue(fullNodeValue);
        }).catch((err) => {
            if (err.code && err.code === -32000) {
                log.error(`Could not find node ${this.getNodeId()}`)
            }
        });
        // log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
    };
    public getShareDBDoc():SDBDoc<ShareDBTab> { return this.tab.getShareDBDoc(); };
    public getShareDBNode():ShareDBDOMNode { return this.shareDBNode; };
    public async submitOp(...ops:Array<ShareDB.Op>):Promise<void> {
        await this.getShareDBDoc().submitOp(ops);
    };
    public getNode():CRI.Node { return this.node; };
    public getShareDBPath():Array<string|number> {
        if(this.parent) {
            const parentPath:Array<string|number> = this.parent.getShareDBPath();
            const myIndex:number = this.parent.getChildIndex(this);
            return parentPath.concat([myIndex]);
        } else {
            return [];
        }
    };
    private p(...toAdd:Array<string|number>):Array<string|number> {
        return this.getShareDBPath().concat(...toAdd);
    };
    public getChildIndex(child:DOMState) {
        return this.children.indexOf(child);
    };
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
        this.children.forEach((child: DOMState) => {
            child.destroy();
        });
        this.emit('destroyed');
        this.destroyed = true;
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
            this.updateValueInterval = setInterval(() => {
                this.getInputValue().then((data: string) => {
                    this.emit('valueUpdated', 'input', data);
                });
            }, 700);
        } else if (tagName === 'canvas') {

        }
    };
    private removeValueListeners() {
        if (this.updateValueInterval) {
            clearInterval(this.updateValueInterval);
            this.updateValueInterval = null;
        }
    };
    public async updateInlineStyle():Promise<void> {
        const oldInlineStyle: string = this.inlineStyle;
        await this.requestInlineStyle().then((inlineStyle) => {
            this.inlineStyle = inlineStyle.cssText;
            if (this.inlineStyle !== oldInlineStyle) {
                this.emit('inlineStyleChanged', {
                    inlineStyle: this.inlineStyle
                });
            }
        });
    };
    public insertChild(childDomState: DOMState, previousDomState: DOMState = null, node:CRI.Node): void {
        if (previousDomState) {
            const index = this.children.indexOf(previousDomState);
            this.children.splice(index + 1, 0, childDomState);
            this.node.children.splice(index + 1, 0, node);
            const shareDBOp:ShareDB.ListInsertOp = {p: this.p('node', 'children', index+1), li: childDomState.getShareDBNode()};
            this.submitOp(shareDBOp);
        } else {
            this.children.unshift(childDomState);
            this.node.children.unshift(node);
            const shareDBOp:ShareDB.ListInsertOp = {p: this.p('node', 'children', 0), li: childDomState.getShareDBNode()};
            this.submitOp(shareDBOp);
        }
        childDomState.setParent(this);
        this.emit('childAdded', {
            child: childDomState,
            previousNode: previousDomState
        });
    };

    public setCharacterData(characterData: string): void {
        this.node.nodeValue = characterData;
        const previousNodeValue = this.shareDBNode.node.nodeValue;
        const shareDBOp:ShareDB.ObjectReplaceOp = {p: this.p('node', 'nodeValue'), od: previousNodeValue, oi: characterData};
        this.submitOp(shareDBOp);
        this.emit('nodeValueChanged', {
            value: this.getNodeValue()
        });
    };
    private setNodeValue(value: string): void {
        this.node.nodeValue = value;
        const previousNodeValue = this.shareDBNode.node.nodeValue;
        const shareDBOp:ShareDB.ObjectReplaceOp = {p: this.p('node', 'nodeValue'), od: previousNodeValue, oi: value};
        this.submitOp(shareDBOp);
    };
    public getNodeValue(): string {
        return this.node.nodeValue;
    };
    public removeChild(child: DOMState): boolean {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.node.children.splice(index, 1);
            this.children.splice(index, 1);
            const oldValue = this.shareDBNode.node.children[index];
            const shareDBOp:ShareDB.ListDeleteOp = {p: this.p('node', 'nodeValue', index), ld:oldValue};
            this.submitOp(shareDBOp);
            this.emit('childRemoved', { child })
            child.destroy();
            return true;
        } else {
            return false;
        }
    };
    public setAttribute(name: string, value: string): void {
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
                const shareDBOp:ShareDB.ListInsertOp = {p: this.p('node', 'attributes', i+1), li: value};
                this.submitOp(shareDBOp);
                found = true;
                break;
            }
        }
        if (!found) {
            attributes.push(name, value);
            const index = this.shareDBNode.node.attributes.length;
            const shareDBOps:[ShareDB.ListInsertOp,ShareDB.ListInsertOp] = [{p: this.p('node', 'attributes', index), li: name}, {p: this.p('node', 'attributes', index+1), li: value}];
            this.submitOp(...shareDBOps);
        }
        this.notifyAttributeChange();
    };
    public removeAttribute(name: string): boolean {
        const node = this.node;
        const { attributes } = node;
        const attributeIndex = attributes.indexOf(name);
        if (attributeIndex >= 0) {
            attributes.splice(attributeIndex, 2);
            const oldValue = attributes[attributeIndex+1];
            const shareDBOps:[ShareDB.ListDeleteOp,ShareDB.ListDeleteOp] = [{p: this.p('node', 'attributes', attributeIndex+1), ld: oldValue}, {p: this.p('node', 'attributes', attributeIndex), ld: name}];
            this.submitOp(...shareDBOps);
            this.notifyAttributeChange();
            return true;
        } else {
            return false;
        }
    };
    private notifyAttributeChange(): void {
        this.emit('attributesChanged');
    };
    public childCountUpdated(count: number): void {
        this.getTab().requestChildNodes(this.getNodeId())
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
    }
    public setChildren(children: Array<DOMState>): void {
        this.children.forEach((child: DOMState) => {
            if (children.indexOf(child) < 0) {
                child.destroy();
            }
        });
        this.children = children;
        this.children.forEach((child) => {
            child.setParent(this);
        });

        this.node.children = children.map((c) => c.getNode() );
        this.node.childNodeCount = this.node.children.length;

        const previousChildren = this.shareDBNode.node.children;
        const previousChildNodeCount = this.shareDBNode.node.childNodeCount;

        const shareDBOps:[ShareDB.ObjectReplaceOp, ShareDB.ObjectReplaceOp] = [
            {p: this.p('node', 'children'), od: previousChildren, oi: this.children.map((c) => c.getShareDBNode())},
            {p: this.p('node', 'children'), od: previousChildNodeCount, oi: this.node.children.length}];
        this.submitOp(...shareDBOps);


        this.emit('childrenChanged', { children })
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
        let result: string = `${'    '.repeat(level)}${this.stringifySelf()}`;
        if (this.childFrame) {
            result += `(${this.childFrame.getFrameId()})\n`;
        }
        console.log(result);
        if(this.contentDocument) {
            this.contentDocument.print(level+1);
        }

        this.children.forEach((child: DOMState) => {
            child.print(level + 1);
        });
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
