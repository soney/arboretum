"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const hack_driver_1 = require("../hack_driver/hack_driver");
const ColoredLogger_1 = require("../../utils/ColoredLogger");
const css_parser_1 = require("../css_parser");
const NodeCode_1 = require("../../utils/NodeCode");
const url_transform_1 = require("../url_transform");
const _ = require("underscore");
const timers = require("timers");
const ShareDBSharedState_1 = require("../../utils/ShareDBSharedState");
const log = ColoredLogger_1.getColoredLogger('magenta');
;
class DOMState extends ShareDBSharedState_1.ShareDBSharedState {
    constructor(node, tab, contentDocument, childFrame, parent) {
        super();
        this.node = node;
        this.tab = tab;
        this.contentDocument = contentDocument;
        this.childFrame = childFrame;
        this.parent = parent;
        this.destroyed = false;
        this.namespace = null;
        this.inlineStyle = '';
        this.subNodes = new Map();
        this.updateValueInterval = null;
        this.inputValue = '';
        this.onDestroyed = this.registerEvent();
        if (this.contentDocument) {
            this.contentDocument.setParent(this);
        }
        log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
    }
    ;
    getSubNodes(type) {
        if (this.subNodes.has(type)) {
            return this.subNodes.get(type);
        }
        else {
            const sn = [];
            this.subNodes.set(type, sn);
            return sn;
        }
    }
    ;
    getChildren() { return this.getSubNodes('children'); }
    ;
    getShadowRoots() { return this.getSubNodes('shadowRoots'); }
    ;
    getPseudoElements() { return this.getSubNodes('pseudoElements'); }
    ;
    onAttachedToShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            // log.debug(`DOM State ${this.getNodeId()} added to ShareDB doc`);
            this.updateNodeValue();
            this.getChildren().map((child) => {
                child.markAttachedToShareDBDoc();
            });
            if (this.childFrame) {
                this.childFrame.markAttachedToShareDBDoc();
            }
            if (this.contentDocument) {
                this.contentDocument.markAttachedToShareDBDoc();
            }
        });
    }
    ;
    updateNodeValue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fullNodeValue = yield this.getFullString();
                this.setNodeValue(fullNodeValue);
            }
            catch (err) {
                if (err.code && err.code === -32000) {
                    log.error(`Could not find node ${this.getNodeId()}`);
                }
            }
        });
    }
    ;
    static stripNode(node) {
        const rv = _.clone(node);
        rv.children = [];
        rv.contentDocument = null;
        rv.attributes = [];
        return rv;
    }
    ;
    getContentDocument() { return this.contentDocument; }
    ;
    getShareDBDoc() { return this.tab.getShareDBDoc(); }
    ;
    createShareDBNode() {
        const node = this.getNode();
        return {
            // node: DOMState.stripNode(this.node),
            nodeType: node.nodeType,
            nodeName: node.nodeName,
            nodeValue: node.nodeValue,
            attributes: this.computeGroupedAttributes(node.attributes),
            shadowRootType: node.shadowRootType,
            shadowRoots: this.getShadowRoots().map((sr) => sr.createShareDBNode()),
            children: this.getChildren().map((child) => child.createShareDBNode()),
            contentDocument: this.contentDocument ? this.contentDocument.createShareDBNode() : null,
            childFrame: this.childFrame ? this.childFrame.getShareDBFrame() : null,
            inlineStyle: this.inlineStyle,
            inputValue: this.inputValue
        };
    }
    ;
    computeGroupedAttributes(attributes) {
        if (!attributes) {
            return null;
        }
        const rv = [];
        for (let i = 0; i < attributes.length; i += 2) {
            rv.push([attributes[i], attributes[i + 1]]);
        }
        return rv;
    }
    ;
    getComputedShareDBNode() {
        const doc = this.getShareDBDoc();
        return doc.traverse(this.getAbsoluteShareDBPath());
    }
    ;
    getNode() { return this.node; }
    ;
    getAbsoluteShareDBPath() {
        if (this.parent) {
            const parentAbsolutePath = this.parent.getAbsoluteShareDBPath();
            const parentToMe = this.parent.getShareDBPathToChild(this);
            return parentAbsolutePath.concat(parentToMe);
        }
        else {
            const tabAbsolutePath = this.tab.getAbsoluteShareDBPath();
            const tabToMe = this.tab.getShareDBPathToChild(this);
            return this.tab.getAbsoluteShareDBPath().concat(tabToMe);
        }
    }
    ;
    getShareDBPathToChild(child) {
        const childIndex = this.getChildren().indexOf(child);
        if (childIndex >= 0) {
            return ['children', childIndex];
        }
        if (child === this.contentDocument) {
            return ['contentDocument'];
        }
        const shadowRootIndex = this.getShadowRoots().indexOf(child);
        if (shadowRootIndex >= 0) {
            return ['shadowRoots', shadowRootIndex];
        }
        throw new Error(`Could not find path to node ${child.getNodeId()} from node ${this.getNodeId()}`);
    }
    ;
    // public getChildIndex(child:DOMState) {
    //     return this.children.indexOf(child);
    // };
    getChildFrame() {
        return this.childFrame;
    }
    ;
    getFrame() {
        let domState = this;
        while (domState) {
            const frame = domState.getChildFrame();
            if (frame) {
                return frame;
            }
            else {
                domState = domState.getParent();
            }
        }
        return null;
    }
    ;
    getFrameId() {
        return this.getFrame().getFrameId();
    }
    ;
    destroy() {
        this.removeValueListeners();
        this.getChildren().forEach((child) => {
            child.destroy();
        });
        this.destroyed = true;
        this.emit(this.onDestroyed, {});
        // log.debug(`=== DESTROYED DOM STATE ${this.getNodeId()} ====`);
    }
    getTab() { return this.tab; }
    ;
    getNodeId() { return this.node.nodeId; }
    ;
    getTagName() { return this.node.nodeName; }
    ;
    getNodeAttributes() { return this.node.attributes; }
    ;
    // public getFrame(): FrameState { return this.frame; };
    // public getFrameId(): CRI.FrameID { return this.getFrame().getFrameId(); };
    getTabId() { return this.getTab().getTabId(); }
    ;
    getParent() { return this.parent; }
    ;
    setParent(parent) { this.parent = parent; }
    getNodeType() { return this.node.nodeType; }
    getChrome() { return this.getTab().getChrome(); }
    ;
    getCanvasImage() {
        return __awaiter(this, void 0, void 0, function* () { return hack_driver_1.getCanvasImage(this.getChrome(), this.getNodeId()); });
    }
    ;
    getUniqueSelector() {
        return __awaiter(this, void 0, void 0, function* () {
            return hack_driver_1.getUniqueSelector(this.getChrome(), this.getNodeId());
        });
    }
    ;
    getInputValue() {
        return __awaiter(this, void 0, void 0, function* () {
            return hack_driver_1.getElementValue(this.getChrome(), this.getNodeId());
        });
    }
    ;
    getFullString() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const nodeType = this.getNodeType();
                const nodeValue = this.getNodeValue();
                if (nodeType === NodeCode_1.NodeCode.TEXT_NODE && nodeValue && nodeValue.endsWith('…')) {
                    this.getChrome().DOM.getOuterHTML({
                        nodeId: this.getNodeId()
                    }, (err, value) => {
                        if (err) {
                            reject(value);
                        }
                        else {
                            resolve(value.outerHTML);
                        }
                    });
                }
                else {
                    resolve(nodeValue);
                }
            }).catch((err) => {
                log.error(err);
                throw (err);
            });
        });
    }
    ;
    addValueListeners() {
        const tagName = this.getTagName().toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
            this.updateValueInterval = timers.setInterval(() => __awaiter(this, void 0, void 0, function* () {
                this.inputValue = yield this.getInputValue();
                const p = this.p('inputValue');
                const doc = this.getShareDBDoc();
                yield doc.submitObjectReplaceOp(p, this.inputValue);
            }), 700);
        }
        else if (tagName === 'canvas') {
        }
    }
    ;
    removeValueListeners() {
        if (this.updateValueInterval) {
            timers.clearInterval(this.updateValueInterval);
            this.updateValueInterval = null;
        }
    }
    ;
    updateInlineStyle() {
        return __awaiter(this, void 0, void 0, function* () {
            const oldInlineStyle = this.inlineStyle;
            const inlineStyle = yield this.requestInlineStyle();
            const { cssText } = inlineStyle;
            this.inlineStyle = cssText;
            const p = this.p('inlineStyle');
            const doc = this.getShareDBDoc();
            yield doc.submitObjectReplaceOp(p, cssText);
        });
    }
    ;
    pushShadowRoot(root) {
        return __awaiter(this, void 0, void 0, function* () {
            const shadowRoots = this.getShadowRoots();
            this.node.shadowRoots.push(root.getNode());
            shadowRoots.push(root);
            const p = this.p('shadowRoots');
            const doc = this.getShareDBDoc();
            doc.submitListPushOp(p, root);
        });
    }
    ;
    popShadowRoot(root) {
        return __awaiter(this, void 0, void 0, function* () {
            const shadowRoots = this.getShadowRoots();
            const rootIndex = shadowRoots.indexOf(root);
            if (rootIndex >= 0) {
                this.node.shadowRoots.splice(rootIndex, 1);
                shadowRoots.splice(rootIndex, 1);
                const p = this.p('shadowRoots', rootIndex);
                const doc = this.getShareDBDoc();
                doc.submitListDeleteOp(p);
            }
            else {
                throw new Error(`Chould not find shadow root ${root.getNodeId()} in ${this.getNodeId()}`);
            }
        });
    }
    ;
    setCharacterData(characterData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.node.nodeValue = characterData;
            const p = this.p('characterData');
            const doc = this.getShareDBDoc();
            yield doc.submitObjectReplaceOp(p, characterData);
        });
    }
    ;
    setNodeValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.node.nodeValue = value;
            const p = this.p('nodeValue');
            const doc = this.getShareDBDoc();
            yield doc.submitObjectReplaceOp(p, value);
        });
    }
    ;
    getNodeValue() {
        return this.node.nodeValue;
    }
    ;
    childCountUpdated(count) {
        this.getTab().requestChildNodes(this.getNodeId());
    }
    ;
    insertChild(childDomState, previousDomState) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = this.getChildren();
            const index = previousDomState ? children.indexOf(previousDomState) + 1 : 0;
            children.splice(index, 0, childDomState);
            this.node.children.splice(index, 0, childDomState.getNode());
            childDomState.setParent(this);
            if (this.isAttachedToShareDBDoc()) {
                childDomState.markAttachedToShareDBDoc();
            }
            const p = this.p('children', index);
            const doc = this.getShareDBDoc();
            yield doc.submitListInsertOp(p, childDomState.createShareDBNode());
        });
    }
    ;
    removeChild(child) {
        return __awaiter(this, void 0, void 0, function* () {
            const children = this.getChildren();
            const index = children.indexOf(child);
            if (index >= 0) {
                this.node.children.splice(index, 1);
                children.splice(index, 1);
                const p = this.p('children', index);
                const doc = this.getShareDBDoc();
                yield doc.submitListDeleteOp(p);
                child.destroy();
                return true;
            }
            else {
                return false;
            }
        });
    }
    ;
    setSubNodes(type, newSubNodes) {
        return __awaiter(this, void 0, void 0, function* () {
            const subNodes = this.getSubNodes(type);
            subNodes.forEach((subNode) => {
                if (newSubNodes.indexOf(subNode) < 0) {
                    subNode.destroy();
                }
            });
            subNodes.splice(0, subNodes.length, ...newSubNodes); // completely replace list
            subNodes.forEach((subNode) => {
                subNode.setParent(this);
            });
            if (this.isAttachedToShareDBDoc()) {
                subNodes.forEach((child) => {
                    child.markAttachedToShareDBDoc();
                });
            }
        });
    }
    ;
    setChildren(newChildren) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setSubNodes('children', newChildren);
            const children = this.getChildren();
            this.node.children = children.map((c) => c.getNode());
            this.node.childNodeCount = this.node.children.length;
            const doc = this.getShareDBDoc();
            yield doc.submitObjectReplaceOp(this.p('children'), children.map((c) => c.createShareDBNode()));
        });
    }
    ;
    setShadowRoots(newChildren) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setSubNodes('shadowRoots', newChildren);
            const children = this.getShadowRoots();
            this.node.shadowRoots = children.map((c) => c.getNode());
            const doc = this.getShareDBDoc();
            yield doc.submitObjectReplaceOp(this.p('shadowRoots'), children.map((c) => c.createShareDBNode()));
        });
    }
    ;
    setAttribute(name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = this.node;
            const { attributes } = node;
            if (!attributes) {
                throw new Error('Could not find attributes');
            }
            let found = false;
            for (let i = 0; i < attributes.length; i += 2) {
                const n = attributes[i];
                if (n === name) {
                    attributes[i + 1] = value;
                    const p = this.p('attributes', i + 1);
                    const doc = this.getShareDBDoc();
                    yield doc.submitListReplaceOp(p, value);
                    found = true;
                    break;
                }
            }
            if (!found) {
                attributes.push(name, value);
                const index = attributes.length;
                const doc = this.getShareDBDoc();
                yield doc.submitListPushOp(this.p('attributes'), name, value);
            }
        });
    }
    ;
    removeAttribute(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = this.node;
            const { attributes } = node;
            const attributeIndex = attributes.indexOf(name);
            if (attributeIndex >= 0) {
                attributes.splice(attributeIndex, 2);
                const oldValue = attributes[attributeIndex + 1];
                const p0 = this.p('attributes', attributeIndex);
                const p1 = this.p('attributes', attributeIndex + 1);
                const doc = this.getShareDBDoc();
                yield Promise.all([doc.submitListDeleteOp(p1), doc.submitListDeleteOp(p0)]);
                return true;
            }
            else {
                return false;
            }
        });
    }
    ;
    requestInlineStyle() {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeType = this.getNodeType();
            if (nodeType === NodeCode_1.NodeCode.ELEMENT_NODE) {
                return new Promise((resolve, reject) => {
                    this.getChrome().CSS.getInlineStylesForNode({
                        nodeId: this.getNodeId()
                    }, (err, data) => {
                        if (this.destroyed) {
                            reject(new Error(`Node ${this.getNodeId()} was destroyed`));
                        }
                        else if (err) {
                            reject(err);
                        }
                        else {
                            const { inlineStyle } = data;
                            if (inlineStyle.cssText) {
                                const newCSSText = css_parser_1.processCSSURLs(inlineStyle.cssText, this.getBaseURL(), this.getFrameId(), this.getTabId());
                                inlineStyle.cssText = newCSSText;
                            }
                            resolve(inlineStyle);
                        }
                    });
                }).catch((err) => {
                    log.error(err);
                    throw (err);
                });
            }
            ;
        });
    }
    ;
    getBaseURL() {
        const frame = this.getFrame();
        return frame.getURL();
    }
    ;
    stringifySelf() {
        const MAX_TEXT_LENGTH = 50;
        const type = this.getNodeType();
        const id = this.getNodeId();
        if (type === NodeCode_1.NodeCode.DOCUMENT_NODE) {
            return `(${id}) ${this.getTagName()}`;
        }
        else if (type === NodeCode_1.NodeCode.TEXT_NODE) {
            var text = this.getNodeValue().replace(/(\n|\t)/gi, '');
            if (text.length > MAX_TEXT_LENGTH) {
                text = `${text.substr(0, MAX_TEXT_LENGTH)}...`;
            }
            return `(${id}) text: ${text}`;
        }
        else if (type === NodeCode_1.NodeCode.DOCUMENT_TYPE_NODE) {
            return `(${id}) <${this.getTagName()}>`;
        }
        else if (type === NodeCode_1.NodeCode.ELEMENT_NODE) {
            let text = `(${id}) <${this.getTagName()}`;
            var attributesMap = this.getAttributesMap();
            var style = this.getInlineStyle();
            if (style) {
                attributesMap.set('style', style);
            }
            attributesMap.forEach((val, key) => {
                text += ` ${key} = '${val}'`;
            });
            text += '>';
            return text;
        }
        else if (type === NodeCode_1.NodeCode.COMMENT_NODE) {
            let text = `(${id}) <!-- `;
            text += this.getNodeValue().replace(/(\n|\t)/gi, '');
            if (text.length > MAX_TEXT_LENGTH) {
                text = text.substr(0, MAX_TEXT_LENGTH) + '...';
            }
            text += ' -->';
            return text;
        }
        else if (type === NodeCode_1.NodeCode.DOCUMENT_FRAGMENT_NODE) {
            const { shadowRootType, nodeName } = this.getNode();
            return `${nodeName} (type: ${shadowRootType})`;
        }
        else {
            return 'node';
        }
    }
    ;
    getInlineStyle() {
        return this.inlineStyle;
    }
    ;
    shouldIncludeAttribute(attributeName) {
        const lowercaseAttributeName = attributeName.toLowerCase();
        return DOMState.attributesToIgnore.indexOf(lowercaseAttributeName) < 0;
    }
    ;
    getAttributesMap(shadow) {
        const tagName = this.getTagName();
        const tagTransform = url_transform_1.urlTransform[tagName.toLowerCase()];
        const attributes = this.getNodeAttributes();
        const rv = new Map();
        const len = attributes.length;
        let i = 0;
        while (i < len) {
            const [attributeName, attributeValue] = [attributes[i], attributes[i + 1]];
            let newValue = attributeValue;
            if (this.shouldIncludeAttribute(attributeName)) {
                if (_.has(tagTransform, attributeName.toLowerCase())) {
                    const attributeTransofrm = tagTransform[attributeName.toLowerCase()];
                    const url = this.getBaseURL();
                    if (url) {
                        newValue = attributeTransofrm.transform(attributeValue, url, this, shadow);
                    }
                    else {
                        log.debug('No base URL');
                    }
                }
            }
            else {
                newValue = '';
            }
            rv.set(attributeName, newValue);
            i += 2;
        }
        return rv;
    }
    ;
    print(level = 0) {
        const tab = '    '.repeat(level);
        const children = this.getChildren();
        let result = `${tab}${this.stringifySelf()}`;
        if (this.childFrame) {
            result += `(${this.childFrame.getFrameId()})\n`;
        }
        console.log(result);
        if (this.contentDocument) {
            this.contentDocument.print(level + 1);
        }
        children.forEach((child) => {
            child.print(level + 1);
        });
        const shadowRoots = this.getShadowRoots();
        if (shadowRoots.length > 0) {
            console.log(`${tab} (shadow):::`);
            shadowRoots.forEach((child) => {
                child.print(level + 1);
            });
        }
        // return result;
    }
    ;
    getFrameStack() {
        return this.getFrame().getFrameStack();
    }
    ;
    querySelectorAll(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.getChrome().DOM.querySelectorAll({
                    nodeId: this.getNodeId(),
                    selector: selector
                }, (err, value) => {
                    if (err) {
                        reject(value);
                    }
                    else {
                        resolve(value.nodeIds);
                    }
                });
            });
        });
    }
    ;
}
DOMState.attributesToIgnore = ['onload', 'onclick', 'onmouseover', 'onmouseout',
    'onmouseenter', 'onmouseleave', 'action', 'oncontextmenu', 'onfocus'];
exports.DOMState = DOMState;
