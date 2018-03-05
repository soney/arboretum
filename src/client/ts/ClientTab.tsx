import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ShareDBDOMNode, FrameDoc, TabDoc, BrowserDoc, CanvasImage} from '../../utils/state_interfaces';
import * as ShareDBClient from 'sharedb/lib/client';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {createClientNode, ClientNode, ClientElementNode} from './ClientDOMNode';

type ClientTabProps = {
    tabID?:CRI.TabID,
    frameID?:CRI.FrameID,
    sdb:SDB
};
type ClientTabState = {
    tabID:CRI.TabID,
    frameID:CRI.FrameID
};

export class ClientTab extends React.Component<ClientTabProps, ClientTabState> {
    private tabDoc:SDBDoc<TabDoc>;
    private rootElement:ClientNode;
    constructor(props) {
        super(props);
        this.state = {
            tabID:this.props.tabID,
            frameID:this.props.frameID
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
        }
    };
    private docUpdated = (ops?:Array<ShareDBClient.Op>, source?:boolean, data?:TabDoc):void => {
        // console.log(data);
        if(ops) {
            ops.forEach((op:ShareDBClient.Op) => {
                this.handleOp(op);
            })
        } else {
            if(this.props.frameID) {
                console.log(this.props.frameID);
            } else {
                const data:TabDoc = this.tabDoc.getData();
                const {root} = data;

                this.rootElement = createClientNode(root);
                const node = ReactDOM.findDOMNode(this);
                node.appendChild(this.rootElement.getElement());
            }
        }
    };
    private handleOp(op:ShareDBClient.Op):void {
        const {node, property, path} = this.traverse(op);
        if(node && property) {
            const {oi, od} = op;
            if(property === 'characterData') {
                node.setNodeValue(oi);
            } else if(property === 'nodeValue') {
                node.setNodeValue(oi);
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
            } else if(property === 'children') {
                if(path.length === 0) { // set all children
                    const children = oi.map((c) => createClientNode(c))
                    node.setChildren(children);
                } else { // set a specific child
                    const {li, ld} = op;
                    const index:number = (path[0] as number);
                    if(ld) {
                        node.removeChild(index);
                    } else if(li) {
                        const child = createClientNode(li);
                        node.insertChild(child, index);
                    }
                }
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
                node = this.rootElement;
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
            } else if(item === 'shadowRoots') {
                throw new Error('ShadowRoots not expected to be included');
            } else {
                console.log(p);
                console.log(item);
            }
        }
        return {node:null, property:null, path:p};
    };
    public render():React.ReactNode {
        return <div>{this.state.frameID}</div>
    };
};
