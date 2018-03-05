import {ShareDBDOMNode, FrameDoc, TabDoc, BrowserDoc, CanvasImage} from '../../utils/state_interfaces';
import {NodeCode} from '../../utils/NodeCode';

export function createClientNode(sdbNode:ShareDBDOMNode) {
    const {nodeType} = sdbNode;
    if(nodeType === NodeCode.DOCUMENT_NODE) {
        return new ClientDocumentNode(sdbNode);
    } else if(nodeType === NodeCode.ELEMENT_NODE) {
        return new ClientElementNode(sdbNode);
    } else if(nodeType === NodeCode.TEXT_NODE) {
        return new ClientTextNode(sdbNode);
    } else if(nodeType === NodeCode.COMMENT_NODE) {
        return new ClientCommentNode(sdbNode);
    } else if(nodeType === NodeCode.DOCUMENT_TYPE_NODE) {
        return new ClientDocumentTypeNode(sdbNode);
    } else {
        console.log(sdbNode);
    }
};

export abstract class ClientNode {
    private children:Array<ClientNode>;
    protected contentDocument:ClientDocumentNode;
    constructor(protected sdbNode:ShareDBDOMNode) {
        this.children = this.getNodeChildren().map((child) => createClientNode(child));
    };
    public getContentDocument():ClientDocumentNode { return this.contentDocument; };
    public getChild(index:number=0):ClientNode { return this.children[index]; };
    protected getChildren():Array<ClientNode> { return this.children; };
    public setChildren(children:Array<ClientNode>):void { this.children = children; };
    protected getNodeChildren():Array<ShareDBDOMNode> { return this.sdbNode.children; };
    public setInlineStyle(style:string):void {};
    public getAttributes():Array<[string, string]> { return this.sdbNode.attributes; };
    public setAttribute(name:string, value:string):void {};
    public removeAttribute(name:string):void {};
    public insertChild(child: ClientNode, index:number):void { this.children.splice(index, 0, child); };
    public removeChild(index:number):void { this.children.splice(index, 1); };
    // protected getNodeShadowRoots():Array<ShareDBDOMNode> { return this.sdbNode.shadowRoots; };
    public setCharacterData(characterData:string):void {}
    public setNodeValue(value:string):void {}
    public abstract getElement():HTMLElement|SVGElement|Text|Comment;
};

export class ClientDocumentNode extends ClientNode {
    constructor(sdbNode:ShareDBDOMNode, private document?:Document) {
        super(sdbNode);
    };
    public getDocument():Document { return this.document; };
    public removeChildren():void {
        for(let i = this.document.children.length-1; i>=0; i--) {
            const c = this.document.children.item(i);
            c.remove();
        }
    };
    public getElement():HTMLElement|SVGElement|Text|Comment {
        return this.getChild().getElement();
    };
};
export class ClientDocumentTypeNode extends ClientNode {
    constructor(sdbNode:ShareDBDOMNode) { super(sdbNode); };
    public getElement():null {
        return null;
    }
};
export class ClientElementNode extends ClientNode {
    private element:HTMLElement|SVGElement;
    constructor(sdbNode:ShareDBDOMNode) {
        super(sdbNode);
        const {nodeName, isSVG} = this.sdbNode;
        if(isSVG) {
            this.element = document.createElementNS('http://www.w3.org/2000/svg', nodeName);
        } else {
            this.element = document.createElement(nodeName)
        }
        this.initialize();
    };
    private async initialize():Promise<void> {
        const {nodeName} = this.sdbNode;
        this.getAttributes().forEach((attr) => {
            const [name, value] = attr;
            this.setAttribute(name, value);
        });
        if(nodeName === 'IFRAME') {
            const iFrameElement = (this.element as HTMLIFrameElement);
            await iframeLoaded(iFrameElement);

            this.contentDocument = new ClientDocumentNode(this.getNodeContentDocument(), iFrameElement.contentDocument);
            this.contentDocument.removeChildren();
            const iframeBody = this.contentDocument.getChild();
            iFrameElement.contentDocument.appendChild(iframeBody.getElement());
        } else {
            this.getChildren().forEach((child) => {
                this.element.appendChild(child.getElement());
            });
        }
    };
    public setChildren(children:Array<ClientNode>):void {
        for(let i = this.element.children.length-1; i>=0; i--) {
            const c = this.element.children.item(i);
            c.remove();
        }
        children.forEach((c) => {
            this.element.appendChild(c.getElement());
        });
        super.setChildren(children);
    };
    public insertChild(child: ClientNode, index:number):void {
        if(this.element.children.length>=index) {
            this.element.insertBefore(child.getElement(), this.element.children.item(index));
        } else {
            this.element.appendChild(child.getElement());
        }
        super.insertChild(child, index);
    };
    public removeChild(index:number):void {
        this.element.children.item(index).remove();
        super.removeChild(index);
    };
    public setInlineStyle(style:string):void {
        this.element.setAttribute('style', style);
    };
    public setAttribute(name:string, value:string):void {
        this.element.setAttribute(name, value);
    };
    public removeAttribute(name:string):void {
        this.element.removeAttribute(name);
    };
    public setInputValue(value:string):void {
        const inputElement = this.element as HTMLInputElement | HTMLTextAreaElement;
        inputElement.value = value;
    };
    public setCanvasValue(imageData:ImageData) {
        const canvasElement = this.element as HTMLCanvasElement
        const ctx:CanvasRenderingContext2D = canvasElement.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    };
    public getNodeContentDocument():ShareDBDOMNode { return this.sdbNode.contentDocument; };
    public getElement():HTMLElement|SVGElement {
        return this.element;
    };
    public setNodeValue(value:string):void {
        this.element['value'] = value;
    };
};
export class ClientTextNode extends ClientNode {
    private element:Text;
    constructor(sdbNode:ShareDBDOMNode) {
        super(sdbNode);
        const {nodeValue} = sdbNode;
        this.element = document.createTextNode(nodeValue);
    };
    public getElement():Text {
        return this.element;
    };
    public setNodeValue(value:string):void {
        this.element.replaceData(0, this.element.length, value);
    }
};
export class ClientCommentNode extends ClientNode {
    private element:Comment;
    constructor(sdbNode:ShareDBDOMNode) {
        super(sdbNode);
        const {nodeValue} = sdbNode;
        this.element = document.createComment(nodeValue);
    };
    public getElement():Comment {
        return this.element;
    };
};
function iframeLoaded(element:HTMLIFrameElement):Promise<HTMLIFrameElement> {
    return new Promise<HTMLIFrameElement>((resolve, reject) => {
        element.addEventListener('load', () => {
            resolve(element);
        });
    });
}
