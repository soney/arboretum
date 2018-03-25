import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserTab} from './BrowserTab';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';
import * as url from 'url';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import Switch from 'react-switch';
import * as ShareDB from 'sharedb';
import {BrowserDoc, TabDoc} from '../../utils/state_interfaces';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageAction, PAMAction} from '../../utils/ArboretumChat';
import {copyToClipboard} from '../../utils/copyToClipboard';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';

type SuggestedActionsProps = {
    onAction?:(a:PAMAction, action:PageAction) => void,
    onAddHighlight?:(nodeIDs:Array<CRI.NodeID>, color:string)=>void,
    onRemoveHighlight?:(nodeIDs:Array<CRI.NodeID>)=>void,
};
type SuggestedActionsState = {
    actions:PageAction[]
};

export class ArboretumSuggestedActions extends React.Component<SuggestedActionsProps, SuggestedActionsState> {
    private static defaultProps:SuggestedActionsProps = { };
    private sdb:SDB;
    private selectedTab:CRI.TabID;
    private browserDoc:SDBDoc<BrowserDoc>;
    private tabDoc:SDBDoc<TabDoc>;
    constructor(props) {
        super(props);
        this.state = {
            actions:[]
        };
    };
    public setSDB(sdb:SDB):void {
        this.sdb = sdb;
        if(this.sdb) {
            this.browserDoc = this.sdb.get<BrowserDoc>('arboretum', 'browser');
            this.browserDoc.subscribe((ops:ShareDB.Op[]):void => {
                const data:BrowserDoc = this.browserDoc.getData();
                const {selectedTab} = data;
                if(selectedTab !== this.selectedTab) {
                    this.setSelectedTab(selectedTab);
                }
            });
        }
        if(this.selectedTab && this.sdb) {
            this.subscribeToTabDoc();
        }
    };
    private setSelectedTab(tabID:CRI.TabID) {
        this.selectedTab = tabID;
        if(this.tabDoc) {
            this.tabDoc.destroy();
        }
        if(this.selectedTab && this.sdb) {
            this.subscribeToTabDoc();
        }
    };
    private subscribeToTabDoc():void {
        this.tabDoc = this.sdb.get('tab', this.selectedTab);
        this.tabDoc.subscribe((ops:ShareDB.Op[]) => {
            const data:TabDoc = this.tabDoc.getData();
            if(data) {
                const {suggestedActions} = data;
                this.setState({actions:suggestedActions});
            }
        });
    };
    private addHighlights = (pa:PageAction):void => {
        if(this.props.onAddHighlight) {
            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pa);
            const color:string = '#0000FF';
            this.props.onAddHighlight(nodeIDs, color);
        }
    };
    private removeHighlights = (pa:PageAction):void => {
        if(this.props.onRemoveHighlight) {
            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pa);
            this.props.onRemoveHighlight(nodeIDs);
        }
    };
    private performAction = (a:PAMAction, action:PageAction):void => {
        if(this.props.onAction) { this.props.onAction(a, action); }
    };
    public render():React.ReactNode {
        const suggestedActions:Array<JSX.Element> = this.state.actions.map((action:PageAction, i:number) => {
            const description:JSX.Element = <span className='description' onMouseEnter={()=>this.addHighlights(action)} onMouseLeave={()=>this.removeHighlights(action)}>{ArboretumChat.describePageAction(action)}</span>;

            const messageActions:Array<JSX.Element> = [PAMAction.ACCEPT].map((a:PAMAction) => {
                return <a key={a} href="javascript:void(0)" onClick={() => this.performAction(a, action)}>{ArboretumChat.getActionDescription(a)}</a>
            });
            return <li tabIndex={0} key={i}>
                {description}
                <div className='messageActions'>{messageActions}</div>
            </li>
        });
        const header:JSX.Element = suggestedActions.length > 0 ? <h5 className="nav-group-title">Actions</h5> : null;
        return <div className='suggestedActions'>
            {header}
            <ul>{suggestedActions}</ul>
        </div>;
    };
};
