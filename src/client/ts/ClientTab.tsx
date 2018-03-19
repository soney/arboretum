import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ShareDBDOMNode, TabDoc, BrowserDoc, CanvasImage} from '../../utils/state_interfaces';
import * as ShareDBClient from 'sharedb/lib/client';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {createClientNode, ClientDocumentNode, ClientNode, ClientElementNode} from './ClientDOMNode';
import {NodeSelector} from './NodeSelector';
import {registerEvent} from '../../utils/TypedEventEmitter';
import {PageAction, PageActionMessage} from '../../utils/ArboretumChat';

type ClientTabProps = {
    tabID?:CRI.TabID,
    frameID?:CRI.FrameID,
    sdb:SDB,
    canGoBackChanged?:(tab:ClientTab, canGoBack:boolean) => void,
    canGoForwardChanged?:(tab:ClientTab, canGoForward:boolean) => void,
    isLoadingChanged?:(tab:ClientTab, isLoading:boolean) => void,
    urlChanged?:(tab:ClientTab, url:string) => void,
    titleChanged?:(tab:ClientTab, title:string) => void
};
type ClientTabState = {
    tabID:CRI.TabID,
    frameID:CRI.FrameID,
    canGoBack:boolean,
    canGoForward:boolean,
    isLoading:boolean,
    url:string,
    title:string
};

export class ClientTab extends React.Component<ClientTabProps, ClientTabState> {
    private tabDoc:SDBDoc<TabDoc>;
    private clientNodes:Map<CRI.NodeID, ClientNode> = new Map<CRI.NodeID, ClientNode>();
    private rootElement:ClientNode;
    private nodeSelector:NodeSelector = new NodeSelector();
    private iframeElement:HTMLIFrameElement;
    public pageAction = registerEvent<{pa:PageAction, data:any}>();

    constructor(props) {
        super(props);
        this.state = {
            tabID:this.props.tabID,
            frameID:this.props.frameID,
            canGoBack:false,
            canGoForward:false,
            isLoading:false,
            url:'',
            title:''
        };
        // this.setTabID(this.props.tabID);
    };
    private getTabID():CRI.TabID { return this.props.tabID; };
    private hasTabID():boolean { return !!this.getTabID(); };
    public async setTabID(tabID:CRI.TabID):Promise<void> {
        await new Promise((resolve, reject) => {
            this.setState({tabID}, resolve);
        });

        if(this.tabDoc) {
            this.tabDoc.destroy();
        }

        if(this.state.tabID) {
            this.tabDoc = this.props.sdb.get<TabDoc>('tab', this.state.tabID);
            this.tabDoc.subscribe(this.docUpdated);
            window['tabDoc'] = this.tabDoc;
        }
    };
    private getNode(nodeId:CRI.NodeID):ClientNode {
        return this.clientNodes.get(nodeId);
    };
    public addHighlight (nodeIds:Array<CRI.NodeID>, color:string):void {
        nodeIds.forEach((id) => {
            const node = this.getNode(id);
            if(node) {
                node.addHighlight(color);
            }
        });
    };
    public removeHighlight (nodeIds:Array<CRI.NodeID>):void {
        nodeIds.forEach((id) => {
            const node = this.getNode(id);
            if(node) {
                node.removeHighlight(color);
            }
        });
    };
    private docUpdated = (ops?:Array<ShareDBClient.Op>, source?:boolean, data?:TabDoc):void => {
        if(ops) {
            ops.forEach((op:ShareDBClient.Op) => {
                this.handleOp(op);
            })
        } else {
            const {canGoBack, canGoForward, isLoading, url, title} = data;
            this.setState({canGoBack, canGoForward, isLoading, url, title});
            if(this.props.canGoBackChanged) { this.props.canGoBackChanged(this, canGoBack); }
            if(this.props.canGoForwardChanged) { this.props.canGoForwardChanged(this, canGoForward); }
            if(this.props.isLoadingChanged) { this.props.isLoadingChanged(this, isLoading); }
            if(this.props.urlChanged) { this.props.urlChanged(this, url); }
            if(this.props.titleChanged) { this.props.titleChanged(this, title); }
            if(this.props.frameID) {
                console.log(this.props.frameID);
            } else {
                const data = this.tabDoc.getData();
                this.setRoot(data.root);
            }
        }
    };
    private setRoot(root:ShareDBDOMNode):void {
        if(this.rootElement) {
            this.rootElement.remove();
            this.rootElement.destroy();
            this.rootElement = null;
        }

        this.rootElement = new ClientDocumentNode(root, this.onDOMNodeCreated, this.iframeElement.contentDocument);
        // const node = ReactDOM.findDOMNode(this);
        // node.appendChild(this.rootElement.getElement());
    };
    private onDOMNodeCreated = (clientNode:ClientNode):void => {
        this.clientNodes.set(clientNode.getNodeID(), clientNode);
        clientNode.mouseEvent.addListener((event) => {
            this.pageAction.emit({
                pa:'mouse_event',
                data:event
            });
        });
        clientNode.keyboardEvent.addListener((event) => {
            this.pageAction.emit({
                pa:'keyboard_event',
                data:event
            });
        });
        clientNode.elementEvent.addListener((event) => {
            this.pageAction.emit({
                pa: 'element_event',
                data:event
            });
        });
    };
    private handleOp(op:ShareDBClient.Op):void {
        const {node, property, path} = this.traverse(op);
        if(property) {
            const {oi, od} = op;
            if(property === 'characterData') {
                node.setNodeValue(oi);
            } else if(property === 'nodeValue') {
                node.setNodeValue(oi);
            } else if(property === 'root') {
                this.setRoot(oi);
            } else if(property === 'attributes') {
                const {li, ld} = op;
                if(path.length === 1) { // insert a new attribute
                    if(ld) {
                        const [name, value] = ld;
                        node.removeAttribute(name);
                    } else if(li) {
                        const [name, value] = li;
                        node.setAttribute(name, value);
                    }
                } else if(path.length === 2) { // change an attribute
                    const attribute = node.getAttributes()[path[0]];
                    const [name, value] = attribute;
                    node.setAttribute(name, li);
                }
            } else if(property === 'inlineStyle') {
                node.setInlineStyle(oi);
            } else if(property === 'inputValue') {
                (node as ClientElementNode).setInputValue(oi as string);
            } else if(property === 'canvasData') {
                const imageData:ImageData = new ImageData(new Uint8ClampedArray(oi.data), oi.width, oi.height);
                (node as ClientElementNode).setCanvasValue(imageData);
            } else if(property === 'listenedEvents') {
                const {li, ld} = op;
                if(ld) {
                    node.removeListenedEvent(ld);
                }
                if(li) {
                    node.addListenedEvent(li);
                }
            } else if(property === 'children') {
                if(path.length === 0) { // set all children
                    const children = oi.map((c) => createClientNode(c, this.onDOMNodeCreated))
                    node.setChildren(children);
                } else { // set a specific child
                    const {li, ld} = op;
                    const index:number = (path[0] as number);
                    if(ld) {
                        node.removeChild(index);
                    } else if(li) {
                        const child = createClientNode(li, this.onDOMNodeCreated);
                        node.insertChild(child, index);
                    }
                }
            } else if(property === 'canGoBack') {
                this.setState({canGoBack:oi});
                if(this.props.canGoBackChanged) { this.props.canGoBackChanged(this, oi); }
            } else if(property === 'canGoForward') {
                this.setState({canGoForward:oi});
                if(this.props.canGoForwardChanged) { this.props.canGoForwardChanged(this, oi); }
            } else if(property === 'isLoading') {
                this.setState({isLoading:oi});
                if(this.props.isLoadingChanged) { this.props.isLoadingChanged(this, oi); }
            } else if(property === 'title') {
                this.setState({title:oi});
                if(this.props.titleChanged) { this.props.titleChanged(this, oi); }
            } else if(property === 'url') {
                this.setState({url:oi});
                if(this.props.urlChanged) { this.props.urlChanged(this, oi); }
            } else {
                console.error('Not handled 1', op);
            }
        } else {
            console.error('Not handled 2', op);
        }
    };
    private traverse(op:ShareDBClient.Op):{node:ClientNode, property:string, path:Array<string|number>} {
        const {p} = op;
        let node:ClientNode;
        for(let i=0; i<p.length; i++) {
            const item:string|number = p[i];
            if(item === 'root') {
                if(p.length === 1) {
                    return {node: op.oi, property:'root', path:[] };
                } else {
                    node = this.rootElement;
                }
            } else if(item === 'children') {
                if(i >= p.length-2) {
                    // set children: ends with [...,'children']
                    // set child: ends with [...,'children', 3]
                    return {node, property:'children', path:p.slice(i+1) };
                } else {
                    const index:number = p[i+1] as number;
                    node = node.getChild(index);
                    i++;
                }
            } else if(item === 'contentDocument') {
                node = node.getContentDocument();
            } else if(item === 'nodeValue') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'attributes') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'inlineStyle') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'inputValue') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'canvasData') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'canGoBack' || item === 'canGoForward' || item === 'isLoading' || item === 'title' || item === 'url') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'listenedEvents') {
                return {node, property:item, path:p.slice(i+1)};
            } else if(item === 'shadowRoots') {
                throw new Error('ShadowRoots not expected to be included');
            } else {
                console.log(p);
                console.log(item);
            }
        }
        return {node:null, property:null, path:p};
    };
    // private updateIFrameContents():void {

        // ReactDOM.render((
            // <ClientTab tabID={this.props.tabID} frameID={this.props.frameID} ref={this.clientTabRef} sdb={this.props.sdb} />
        // ), this.iframeElement.contentDocument.children[0]);
    // };
    // public componentDidMount():void {
        // if(this.iframeElement) { this.updateIFrameContents(); }
    // };
    // public componentDidUpdate():void {
        // if(this.iframeElement) { this.updateIFrameContents(); }
    // };
    private contentFrameRef = (el:HTMLIFrameElement):void => {
        this.iframeElement = el;
        // console.log(this.iframeElement);
        // this.updateIFrameContents();
    };
    public render():React.ReactNode {
        return <iframe id='content' ref={this.contentFrameRef} />;
    };
};
