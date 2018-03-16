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
    static shouldIncludeChild(child) {
        const node = child.getNode();
        const { nodeName, nodeType } = node;
        if (nodeName === 'SCRIPT' || nodeName === '#comment' || nodeName === 'BASE' || nodeType === NodeCode_1.NodeCode.DOCUMENT_TYPE_NODE) {
            return false;
        }
        else {
            return true;
        }
    }
    ;
    static shouldIncludeAttribute(node, attributeName) {
        const { nodeName, nodeType } = node;
        const lowercaseAttributeName = attributeName.toLowerCase();
        if (DOMState.attributesToIgnore.indexOf(lowercaseAttributeName) >= 0) {
            return false;
        }
        else {
            if (nodeName === 'IFRAME') {
                if (['src'].indexOf(lowercaseAttributeName) >= 0) {
                    return false;
                }
            }
        }
        return true;
    }
    ;
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
            // if(this.getNodeId() === 21) { debugger; }
            log.debug(`DOM State ${this.getNodeId()} added to ShareDB doc`);
            yield this.updateNodeValue();
            this.getChildren().forEach((child) => {
                if (DOMState.shouldIncludeChild(child)) {
                    child.markAttachedToShareDBDoc();
                }
            });
            // if(this.childFrame) {
            //     this.childFrame.markAttachedToShareDBDoc();
            // }
            if (this.contentDocument) {
                this.contentDocument.markAttachedToShareDBDoc();
            }
            this.addValueListeners();
        });
    }
    ;
    processNodeValue(nodeValue) {
        const parent = this.getParent();
        if (parent && parent.getTagName().toLowerCase() === 'style') {
            return css_parser_1.processCSSURLs(nodeValue, this.getBaseURL(), this.getFrameId(), this.getTabId());
        }
        else {
            return nodeValue;
        }
    }
    ;
    updateNodeValue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fullNodeValue = yield this.getFullString();
                yield this.setNodeValue(fullNodeValue);
            }
            catch (err) {
                if (err.code && err.code === -32000) {
                    log.error(`Could not find node ${this.getNodeId()}`);
                }
            }
        });
    }
    ;
    getContentDocument() { return this.contentDocument; }
    ;
    getShareDBDoc() {
        return this.tab.getShareDBDoc();
    }
    ;
    createShareDBNode() {
        const filteredChildren = this.getChildren().filter((c) => DOMState.shouldIncludeChild(c));
        const children = filteredChildren.map((c) => c.createShareDBNode());
        const { nodeId, nodeType, nodeName, nodeValue, attributes, isSVG } = this.getNode();
        return {
            nodeId, nodeType, nodeName, children, isSVG,
            canvasData: null,
            nodeValue: this.processNodeValue(nodeValue),
            attributes: this.computeGroupedAttributes(attributes),
            contentDocument: this.contentDocument ? this.contentDocument.createShareDBNode() : null,
            childFrame: this.childFrame ? this.childFrame.getFrameInfo() : null,
            inlineStyle: this.inlineStyle,
            inputValue: this.inputValue
        };
    }
    ;
    computeGroupedAttributes(attributes) {
        if (!attributes) {
            return null;
        }
        const tagName = this.getTagName();
        const tagTransform = url_transform_1.urlTransform[tagName.toLowerCase()];
        const rv = [];
        const len = attributes.length;
        let i = 0;
        while (i < len) {
            const [attributeName, attributeValue] = [attributes[i], attributes[i + 1]];
            if (DOMState.shouldIncludeAttribute(this.getNode(), attributeName)) {
                const newValue = this.transformAttributeValue(attributeName, attributeValue);
                rv.push([attributeName, newValue]);
            }
            i += 2;
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
        const filteredChildren = this.getChildren().filter(DOMState.shouldIncludeChild);
        const fcIndex = filteredChildren.indexOf(child);
        if (fcIndex >= 0) {
            return ['children', fcIndex];
        }
        if (child === this.contentDocument) {
            return ['contentDocument'];
        }
        // const shadowRootIndex:number = this.getShadowRoots().indexOf(child);
        // if(shadowRootIndex >= 0) {
        //     return ['shadowRoots', shadowRootIndex];
        // }
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
        this.getShadowRoots().forEach((sr) => {
            sr.destroy();
        });
        if (this.contentDocument) {
            this.contentDocument.destroy();
        }
        this.destroyed = true;
        this.onDestroyed.emit();
        log.debug(`=== DESTROYED DOM STATE ${this.getNodeId()} ====`);
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
                const oldInputValue = this.inputValue;
                this.inputValue = yield this.getInputValue();
                if (oldInputValue !== this.inputValue && this.isAttachedToShareDBDoc()) {
                    const doc = this.getShareDBDoc();
                    yield doc.submitObjectReplaceOp(this.p('inputValue'), this.inputValue);
                }
            }), 700);
        }
        else if (tagName === 'canvas') {
            this.updateValueInterval = timers.setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (this.isAttachedToShareDBDoc()) {
                    const canvasImageData = yield this.getCanvasImage();
                    const doc = this.getShareDBDoc();
                    yield doc.submitObjectReplaceOp(this.p('canvasData'), canvasImageData);
                }
            }), 10000);
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
            if (this.isAttachedToShareDBDoc()) {
                const doc = this.getShareDBDoc();
                yield doc.submitObjectReplaceOp(this.p('inlineStyle'), cssText);
            }
        });
    }
    ;
    pushShadowRoot(root) {
        return __awaiter(this, void 0, void 0, function* () {
            const rootNode = root.getNode();
            const shadowRoots = this.getShadowRoots();
            this.node.shadowRoots.push(rootNode);
            shadowRoots.push(root);
            if (this.isAttachedToShareDBDoc()) {
                const p = this.p('shadowRoots');
                const doc = this.getShareDBDoc();
                doc.submitListPushOp(p, root);
            }
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
                if (this.isAttachedToShareDBDoc()) {
                    const p = this.p('shadowRoots', rootIndex);
                    const doc = this.getShareDBDoc();
                    doc.submitListDeleteOp(p);
                }
            }
            else {
                throw new Error(`Chould not find shadow root ${root.getNodeId()} in ${this.getNodeId()}`);
            }
        });
    }
    ;
    setCharacterData(characterData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setNodeValue(characterData);
        });
    }
    ;
    setNodeValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const previousNodeValue = this.node.nodeValue;
            this.node.nodeValue = value;
            if (previousNodeValue !== this.node.nodeValue && this.isAttachedToShareDBDoc()) {
                const p = this.p('nodeValue');
                const doc = this.getShareDBDoc();
                yield doc.submitObjectReplaceOp(p, this.processNodeValue(value));
            }
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
            if (this.isAttachedToShareDBDoc() && DOMState.shouldIncludeChild(childDomState)) {
                const filteredChildren = children.filter(DOMState.shouldIncludeChild);
                const fcIndex = filteredChildren.indexOf(childDomState);
                const doc = this.getShareDBDoc();
                yield doc.submitListInsertOp(this.p('children', fcIndex), childDomState.createShareDBNode());
                childDomState.markAttachedToShareDBDoc();
            }
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
                if (this.isAttachedToShareDBDoc()) {
                    const doc = this.getShareDBDoc();
                    const sdbChildren = doc.traverse(this.p('children'));
                    const nodeId = child.getNodeId();
                    for (let i = 0; i < sdbChildren.length; i++) {
                        const sdbChild = sdbChildren[i];
                        if (sdbChild.nodeId === nodeId) {
                            yield doc.submitListDeleteOp(this.p('children', i));
                            child.markDetachedFromShareDBDoc();
                            break;
                        }
                    }
                }
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
                    found = true;
                    break;
                }
            }
            if (!found) {
                attributes.push(name, value);
            }
            // === TRANSFORMED ATTRIBUTES ===
            if (this.isAttachedToShareDBDoc() && DOMState.shouldIncludeAttribute(this.getNode(), name)) {
                const doc = this.getShareDBDoc();
                const sdbNode = this.getComputedShareDBNode();
                const sdbAttributes = sdbNode.attributes;
                const newValue = this.transformAttributeValue(name, value);
                found = false;
                for (let i = 0; i < sdbAttributes.length; i++) {
                    const [attributeName, attributeValue] = sdbAttributes[i];
                    if (attributeName === name) {
                        yield doc.submitListReplaceOp(this.p('attributes', i, 1), newValue);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    yield doc.submitListPushOp(this.p('attributes'), [name, newValue]);
                }
            }
        });
    }
    ;
    transformAttributeValue(attributeName, attributeValue) {
        const lowercaseTagName = this.getTagName().toLowerCase();
        const tagTransform = url_transform_1.urlTransform[lowercaseTagName];
        const lowercaseAttributeName = attributeName.toLowerCase();
        const baseURL = this.getBaseURL();
        let newValue = attributeValue;
        if (_.has(tagTransform, lowercaseAttributeName)) {
            const attributeTransform = tagTransform[lowercaseAttributeName];
            if (baseURL) {
                newValue = attributeTransform.transform(attributeValue, baseURL, this);
            }
            else {
                log.debug('No base URL');
            }
        }
        else if (lowercaseAttributeName === 'style') {
            newValue = css_parser_1.processCSSURLs(attributeValue, baseURL, this.getFrameId(), this.getTabId());
        }
        return newValue;
    }
    ;
    removeAttribute(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = this.node;
            const { attributes } = node;
            const attributeIndex = attributes.indexOf(name);
            if (attributeIndex >= 0) {
                attributes.splice(attributeIndex, 2);
                if (this.isAttachedToShareDBDoc()) {
                    const doc = this.getShareDBDoc();
                    const sdbNode = this.getComputedShareDBNode();
                    const sdbAttributes = sdbNode.attributes;
                    for (let i = 0; i < sdbAttributes.length; i++) {
                        const [attributeName, attributeValue] = sdbAttributes[i];
                        if (attributeName === name) {
                            yield doc.submitListDeleteOp(this.p('attributes', i));
                            break;
                        }
                    }
                }
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
            return `(${id}) ${nodeName} (type: ${shadowRootType})`;
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
    getAttributesMap() {
        return new Map(this.computeGroupedAttributes(this.getNode().attributes));
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
    setChildrenRecursive(children = [], shadowRoots = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const childDOMStates = children.map((child) => {
                const { contentDocument, frameId } = child;
                const contentDocState = contentDocument ? this.tab.getOrCreateDOMState(contentDocument) : null;
                const frame = frameId ? this.tab.getFrame(frameId) : null;
                const domState = this.tab.getOrCreateDOMState(child, contentDocState, frame, this);
                return domState;
            });
            this.setSubNodes('children', childDOMStates);
            this.node.children = childDOMStates.map((c) => c.getNode());
            this.node.childNodeCount = this.node.children.length;
            childDOMStates.map((domState) => {
                const child = domState.getNode();
                const { children, shadowRoots } = child;
                domState.setChildrenRecursive(children, shadowRoots);
                return domState;
            });
            const shadowDOMNodes = shadowRoots;
            const shadowDOMRoots = shadowDOMNodes.map((r) => {
                const { contentDocument, frameId } = r;
                const contentDocState = contentDocument ? this.tab.getOrCreateDOMState(contentDocument) : null;
                const frame = frameId ? this.tab.getFrame(frameId) : null;
                const domState = this.tab.getOrCreateDOMState(r, contentDocState, frame, this);
                return domState;
            });
            this.setSubNodes('shadowRoots', shadowDOMRoots);
            this.node.shadowRoots = shadowDOMRoots.map((c) => c.getNode());
            shadowDOMRoots.map((domState) => {
                const child = domState.getNode();
                const { children, shadowRoots } = child;
                domState.setChildrenRecursive(children, shadowRoots);
                return domState;
            });
            const contentDocument = this.getContentDocument();
            if (contentDocument) {
                const node = contentDocument.getNode();
                const { children, shadowRoots } = node;
                contentDocument.setChildrenRecursive(children, shadowRoots);
            }
            if (this.isAttachedToShareDBDoc()) {
                const doc = this.getShareDBDoc();
                const filteredChildren = childDOMStates.filter((c) => DOMState.shouldIncludeChild(c));
                const sdbChildren = filteredChildren.map((c) => c.createShareDBNode());
                yield doc.submitObjectReplaceOp(this.p('children'), sdbChildren);
                filteredChildren.forEach((c) => c.markAttachedToShareDBDoc());
            }
        });
    }
    ;
}
DOMState.attributesToIgnore = ['onload', 'onclick', 'onmouseover', 'onmouseout', 'onmouseenter', 'onmouseleave', 'action', 'oncontextmenu', 'onfocus'];
exports.DOMState = DOMState;
