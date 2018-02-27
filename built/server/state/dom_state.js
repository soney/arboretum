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
const logging_1 = require("../../utils/logging");
const css_parser_1 = require("../css_parser");
const events_1 = require("events");
const node_code_1 = require("../../utils/node_code");
const url_transform_1 = require("../url_transform");
const _ = require("underscore");
const timers = require("timers");
const log = logging_1.getColoredLogger('magenta');
class DOMState extends events_1.EventEmitter {
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
        this.getFullString().then((fullNodeValue) => {
            this.setNodeValue(fullNodeValue);
        }).catch((err) => {
            if (err.code && err.code === -32000) {
                log.error(`Could not find node ${this.getNodeId()}`);
            }
        });
        log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
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
    getShareDBNode() { return this.shareDBNode; }
    ;
    submitOp(...ops) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.getShareDBDoc().submitOp(ops);
            }
            catch (e) {
                console.error(e);
                console.error(e.stack);
            }
        });
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
    p(...toAdd) {
        return this.getAbsoluteShareDBPath().concat(...toAdd);
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
        this.emit('destroyed');
        this.destroyed = true;
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
                if (nodeType === node_code_1.NodeCode.TEXT_NODE && nodeValue && nodeValue.endsWith('…')) {
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
                const inputValue = yield this.getInputValue();
                const oldData = this.shareDBNode.inputValue;
                const shareDBOp = { p: this.p('inputValue'), oi: inputValue, od: oldData };
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
            const oldData = this.shareDBNode.inlineStyle;
            const shareDBOp = { p: this.p('inlineStyle'), oi: cssText, od: oldData };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    insertChild(childDomState, previousDomState) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = previousDomState ? this.children.indexOf(previousDomState) + 1 : 0;
            this.children.splice(index, 0, childDomState);
            this.node.children.splice(index, 0, childDomState.getNode());
            childDomState.setParent(this);
            const shareDBOp = { p: this.p('children', index), li: childDomState.getShareDBNode().node };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    setCharacterData(characterData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.node.nodeValue = characterData;
            const previousNodeValue = this.shareDBNode.node.nodeValue;
            const shareDBOp = { p: this.p('nodeValue'), od: previousNodeValue, oi: characterData };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    setNodeValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.node.nodeValue = value;
            const previousNodeValue = this.shareDBNode.node.nodeValue;
            const shareDBOp = { p: this.p('nodeValue'), od: previousNodeValue, oi: value };
            yield this.submitOp(shareDBOp);
        });
    }
    ;
    getNodeValue() {
        return this.node.nodeValue;
    }
    ;
    removeChild(child) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.children.indexOf(child);
            if (index >= 0) {
                this.node.children.splice(index, 1);
                this.children.splice(index, 1);
                child.destroy();
                const oldValue = this.shareDBNode.node.children[index];
                const shareDBOp = { p: this.p('nodeValue', index), ld: oldValue };
                yield this.submitOp(shareDBOp);
                return true;
            }
            else {
                return false;
            }
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
                    const shareDBOp = { p: this.p('attributes', i + 1), li: value };
                    yield this.submitOp(shareDBOp);
                    found = true;
                    break;
                }
            }
            if (!found) {
                attributes.push(name, value);
                const index = this.shareDBNode.node.attributes.length;
                const shareDBOps = [{ p: this.p('attributes', index), li: name }, { p: this.p('attributes', index + 1), li: value }];
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
                const shareDBOps = [{ p: this.p('attributes', attributeIndex + 1), ld: oldValue }, { p: this.p('attributes', attributeIndex), ld: name }];
                yield this.submitOp(...shareDBOps);
                return true;
            }
            else {
                return false;
            }
        });
    }
    ;
    childCountUpdated(count) {
        this.getTab().requestChildNodes(this.getNodeId());
    }
    ;
    requestInlineStyle() {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeType = this.getNodeType();
            if (nodeType === node_code_1.NodeCode.ELEMENT_NODE) {
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
            this.node.children = children.map((c) => c.getNode());
            this.node.childNodeCount = this.node.children.length;
            const previousChildren = this.shareDBNode.node.children;
            const previousChildNodeCount = this.shareDBNode.node.childNodeCount;
            const shareDBOps = [
                { p: this.p('children'), od: previousChildren, oi: this.children.map((c) => c.getShareDBNode().node) },
                { p: this.p('childNodeCount'), od: previousChildNodeCount, oi: this.node.children.length }
            ];
            yield this.submitOp(...shareDBOps);
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
        if (type === node_code_1.NodeCode.DOCUMENT_NODE) {
            return `(${id}) ${this.getTagName()}`;
        }
        else if (type === node_code_1.NodeCode.TEXT_NODE) {
            var text = this.getNodeValue().replace(/(\n|\t)/gi, '');
            if (text.length > MAX_TEXT_LENGTH) {
                text = `${text.substr(0, MAX_TEXT_LENGTH)}...`;
            }
            return `(${id}) text: ${text}`;
        }
        else if (type === node_code_1.NodeCode.DOCUMENT_TYPE_NODE) {
            return `(${id}) <${this.getTagName()}>`;
        }
        else if (type === node_code_1.NodeCode.ELEMENT_NODE) {
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
        else if (type === node_code_1.NodeCode.COMMENT_NODE) {
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
