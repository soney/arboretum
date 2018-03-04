import {ShareDBDOMNode, FrameDoc, TabDoc, BrowserDoc} from '../../utils/state_interfaces';
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
    protected getNodeChildren():Array<ShareDBDOMNode> { return this.sdbNode.children; };
    // protected getNodeShadowRoots():Array<ShareDBDOMNode> { return this.sdbNode.shadowRoots; };
    public setCharacterData(characterData:string):void {}
    public setNodeValue(value:string):void {}
    public abstract getElement():HTMLElement|Text|Comment;
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
    public getElement():HTMLElement|Text|Comment {
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
    private element:HTMLElement;
    constructor(sdbNode:ShareDBDOMNode) {
        super(sdbNode);
        const {nodeName} = this.sdbNode;
        this.element = document.createElement(nodeName)
        this.initialize();
    };
    private async initialize():Promise<void> {
        const {nodeName} = this.sdbNode;
        this.getAttributes().forEach((attr) => {
            const [name, value] = attr;
            this.element.setAttribute(name, value);
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
    public getNodeContentDocument():ShareDBDOMNode { return this.sdbNode.contentDocument; };
    private getAttributes():Array<[string, string]> { return this.sdbNode.attributes; };
    public getElement():HTMLElement {
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
