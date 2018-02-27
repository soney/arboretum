import { FrameState } from './frame_state';
import { TabState } from './tab_state';
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
import * as timers from 'timers';
import {ShareDBDOMNode, ShareDBFrame, TabDoc} from '../../utils/state_interfaces';

const log = getColoredLogger('magenta');


export class DOMState extends EventEmitter {
    private destroyed: boolean = false;
    private namespace: any = null;
    private inlineStyle: string = '';
    private children: Array<any> = [];
    private updateValueInterval: NodeJS.Timer = null;
    private shareDBNode:ShareDBDOMNode;

    constructor(private node: CRI.Node, private tab:TabState, private contentDocument?:DOMState, private childFrame?:FrameState, private parent?:DOMState) {
        super();
        this.shareDBNode = {
            node: DOMState.stripNode(this.node),
            attributes: _.clone(this.node.attributes),
            nodeValue: this.node.nodeValue,
            childNodeCount: this.children.length,
            children: this.children.map((child) => child.getShareDBNode()),
            contentDocument: this.contentDocument ? this.contentDocument.getShareDBNode() : null,
            childFrame: this.childFrame ? this.childFrame.getShareDBFrame() : null,
            inlineStyle: this.inlineStyle,
            inputValue: ''
        };

        this.getFullString().then((fullNodeValue: string) => {
            this.setNodeValue(fullNodeValue);
        }).catch((err) => {
            if (err.code && err.code === -32000) {
                log.error(`Could not find node ${this.getNodeId()}`)
            }
        });
        log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
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
    public getShareDBNode():ShareDBDOMNode { return this.shareDBNode; };
    public async submitOp(...ops:Array<ShareDB.Op>):Promise<void> {
        try {
            await this.getShareDBDoc().submitOp(ops);
        } catch(e) {
            console.error(e);
            console.error(e.stack);
        }
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
    private p(...toAdd:Array<string|number>):Array<string|number> {
        return this.getAbsoluteShareDBPath().concat(...toAdd);
    };
    public getShareDBPathToChild(child:DOMState):Array<string|number> {
        const childIndex:number = this.children.indexOf(child);
        if(childIndex >= 0) {
            return ['children', childIndex];
        } else if(child === this.contentDocument) {
            return ['contentDocument'];
        } else {
            throw new Error(`Could not find path to node ${child.getNodeId()} from node ${this.getNodeId()}`);
        }
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
            this.updateValueInterval = timers.setInterval(async () => {
                const inputValue:string = await this.getInputValue();

                const oldData = this.shareDBNode.inputValue;
                const shareDBOp:ShareDB.ObjectReplaceOp = {p: this.p('inputValue'), oi: inputValue, od: oldData};
                await this.submitOp(shareDBOp);
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
        const oldData = this.shareDBNode.inlineStyle;
        const shareDBOp:ShareDB.ObjectReplaceOp = {p: this.p('inlineStyle'), oi: cssText, od: oldData };
        await this.submitOp(shareDBOp);
    };
    public async insertChild(childDomState: DOMState, previousDomState: DOMState): Promise<void> {
        const index:number = previousDomState ? this.children.indexOf(previousDomState)+1 : 0;
        this.children.splice(index, 0, childDomState);
        this.node.children.splice(index, 0, childDomState.getNode());
        childDomState.setParent(this);

        const shareDBOp:ShareDB.ListInsertOp = {p: this.p('children', index), li: childDomState.getShareDBNode().node};
        await this.submitOp(shareDBOp);
    };

    public async setCharacterData(characterData: string): Promise<void> {
        this.node.nodeValue = characterData;
        const previousNodeValue = this.shareDBNode.node.nodeValue;

        const shareDBOp:ShareDB.ObjectReplaceOp = {p: this.p('nodeValue'), od: previousNodeValue, oi: characterData};
        await this.submitOp(shareDBOp);
    };
    private async setNodeValue(value: string): Promise<void> {
        this.node.nodeValue = value;

        const previousNodeValue = this.shareDBNode.node.nodeValue;
        const shareDBOp:ShareDB.ObjectReplaceOp = {p: this.p('nodeValue'), od: previousNodeValue, oi: value};
        await this.submitOp(shareDBOp);
    };
    public getNodeValue(): string {
        return this.node.nodeValue;
    };
    public async removeChild(child: DOMState): Promise<boolean> {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.node.children.splice(index, 1);
            this.children.splice(index, 1);
            child.destroy();

            const oldValue = this.shareDBNode.node.children[index];
            const shareDBOp:ShareDB.ListDeleteOp = {p: this.p('nodeValue', index), ld:oldValue};
            await this.submitOp(shareDBOp);
            return true;
        } else {
            return false;
        }
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
                const shareDBOp:ShareDB.ListInsertOp = {p: this.p('attributes', i+1), li: value};
                await this.submitOp(shareDBOp);
                found = true;
                break;
            }
        }
        if (!found) {
            attributes.push(name, value);
            const index = this.shareDBNode.node.attributes.length;
            const shareDBOps:[ShareDB.ListInsertOp,ShareDB.ListInsertOp] = [{p: this.p('attributes', index), li: name}, {p: this.p('attributes', index+1), li: value}];
            await this.submitOp(...shareDBOps);
        }
    };
    public async removeAttribute(name: string):Promise<boolean> {
        const node = this.node;
        const { attributes } = node;
        const attributeIndex = attributes.indexOf(name);
        if (attributeIndex >= 0) {
            attributes.splice(attributeIndex, 2);
            const oldValue = attributes[attributeIndex+1];
            const shareDBOps:[ShareDB.ListDeleteOp,ShareDB.ListDeleteOp] = [{p: this.p('attributes', attributeIndex+1), ld: oldValue}, {p: this.p('attributes', attributeIndex), ld: name}];
            await this.submitOp(...shareDBOps);
            return true;
        } else {
            return false;
        }
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
    public async setChildren(children: Array<DOMState>):Promise<void> {
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
            {p: this.p('children'), od: previousChildren, oi: this.children.map((c) => c.getShareDBNode().node)},
            {p: this.p('childNodeCount'), od: previousChildNodeCount, oi: this.node.children.length}];

        await this.submitOp(...shareDBOps);
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
