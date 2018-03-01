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
        this.children = [];
        this.updateValueInterval = null;
        this.inputValue = '';
        this.onDestroyed = this.registerEvent();
        if (this.contentDocument) {
            this.contentDocument.setParent(this);
        }
        log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
    }
    ;
    onAttachedToShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            // log.debug(`DOM State ${this.getNodeId()} added to ShareDB doc`);
            this.updateNodeValue();
            this.children.map((child) => {
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
        return {
            node: DOMState.stripNode(this.node),
            attributes: _.clone(this.node.attributes),
            nodeValue: this.node.nodeValue,
            childNodeCount: this.children.length,
            children: this.children.map((child) => child.getShareDBNode()),
            contentDocument: this.contentDocument ? this.contentDocument.createShareDBNode() : null,
            childFrame: this.childFrame ? this.childFrame.getShareDBFrame() : null,
            inlineStyle: this.inlineStyle,
            inputValue: this.inputValue
        };
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
        const childIndex = this.children.indexOf(child);
        if (childIndex >= 0) {
            return ['children', childIndex];
        }
        else if (child === this.contentDocument) {
            return ['contentDocument'];
        }
        else {
            throw new Error(`Could not find path to node ${child.getNodeId()} from node ${this.getNodeId()}`);
        }
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
        this.children.forEach((child) => {
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
                const shareDBOp = { p, oi: this.inputValue, od: doc.traverse(p) };
                yield this.submitOp(shareDBOp);
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
            const shareDBOp = { p, oi: cssText, od: doc.traverse(p) };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    setCharacterData(characterData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.node.nodeValue = characterData;
            const p = this.p('characterData');
            const doc = this.getShareDBDoc();
            const shareDBOp = { p, od: doc.traverse(p), oi: characterData };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    setNodeValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.node.nodeValue = value;
            const p = this.p('nodeValue');
            const doc = this.getShareDBDoc();
            const shareDBOp = { p, od: doc.traverse(p), oi: value };
            yield this.submitOp(shareDBOp);
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
            const index = previousDomState ? this.children.indexOf(previousDomState) + 1 : 0;
            this.children.splice(index, 0, childDomState);
            this.node.children.splice(index, 0, childDomState.getNode());
            childDomState.setParent(this);
            if (this.isAttachedToShareDBDoc()) {
                childDomState.markAttachedToShareDBDoc();
            }
            const p = this.p('children', index);
            const shareDBOp = { p, li: childDomState.createShareDBNode() };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    removeChild(child) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.children.indexOf(child);
            if (index >= 0) {
                this.node.children.splice(index, 1);
                this.children.splice(index, 1);
                const p = this.p('children', index);
                const doc = this.getShareDBDoc();
                const shareDBOp = { p, ld: doc.traverse(p) };
                yield this.submitOp(shareDBOp);
                child.destroy();
                return true;
            }
            else {
                return false;
            }
        });
    }
    ;
    setChildren(children) {
        return __awaiter(this, void 0, void 0, function* () {
            this.children.forEach((child) => {
                if (children.indexOf(child) < 0) {
                    child.destroy();
                }
            });
            this.children = children;
            this.children.forEach((child) => {
                child.setParent(this);
            });
            if (this.isAttachedToShareDBDoc()) {
                this.children.forEach((child) => {
                    child.markAttachedToShareDBDoc();
                });
            }
            this.node.children = children.map((c) => c.getNode());
            this.node.childNodeCount = this.node.children.length;
            const doc = this.getShareDBDoc();
            const p0 = this.p('children');
            const p1 = this.p('childNodeCount');
            const shareDBOps = [
                { p: p0, od: doc.traverse(p0), oi: this.children.map((c) => c.createShareDBNode()) },
                { p: p1, od: doc.traverse(p1), oi: this.node.children.length }
            ];
            yield this.submitOp(...shareDBOps);
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
                    const shareDBOp = { p, li: value };
                    yield this.submitOp(shareDBOp);
                    found = true;
                    break;
                }
            }
            if (!found) {
                attributes.push(name, value);
                const index = attributes.length;
                const p0 = this.p('attributes', index);
                const p1 = this.p('attributes', index + 1);
                const shareDBOps = [{ p: p0, li: name }, { p: p1, li: value }];
                yield this.submitOp(...shareDBOps);
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
                const shareDBOps = [{ p: p1, ld: doc.traverse(p1) }, { p: p0, ld: doc.traverse(p1) }];
                yield this.submitOp(...shareDBOps);
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
        let result = `${'    '.repeat(level)}${this.stringifySelf()}`;
        if (this.childFrame) {
            result += `(${this.childFrame.getFrameId()})\n`;
        }
        console.log(result);
        if (this.contentDocument) {
            this.contentDocument.print(level + 1);
        }
        this.children.forEach((child) => {
            child.print(level + 1);
        });
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
