import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ShareDBDOMNode, FrameDoc, TabDoc, BrowserDoc} from '../../utils/state_interfaces';
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
        const {p} = op;
        const {node, property} = this.traverse(p);
        if(node && property) {
            const {oi, od} = op;
            console.log(op);
            if(property === 'characterData') {
                node.setNodeValue(oi);
                // node.setCharacterData
            } else if(property === 'nodeValue') {
                node.setNodeValue(oi);
            }
            console.log(node);
            console.log(property);
        } else {
            console.error('Not handled', op);
        }
    };
    private traverse(p:Array<string|number>):{node:ClientNode, property:string} {
        let node:ClientNode;
        for(let i=0; i<p.length; i++) {
            const item:string|number = p[i];
            if(item === 'root') {
                node = this.rootElement;
            } else if(item === 'children') {
                const index:number = p[i+1] as number;
                node = node.getChild(index);
                i++;
            } else if(item === 'contentDocument') {
                node = node.getContentDocument();
            } else if(item === 'nodeValue') {
                return {node, property:item};
            } else if(item === 'shadowRoots') {
                throw new Error('ShadowRoots not expected to be included');
            } else {
                console.log(p);
                console.log(item);
            }
        }
        return {node:null, property:null};
    };
    public render():React.ReactNode {
        return <div>{this.state.frameID}</div>
    };
};
