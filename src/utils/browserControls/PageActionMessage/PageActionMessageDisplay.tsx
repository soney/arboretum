import * as React from 'react';
import {SDB, SDBDoc} from '../../ShareDBDoc';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageActionState, MessageAddedEvent} from '../../ArboretumChat';
import {RegisteredEvent} from '../../TypedEventEmitter';

const ENTER_KEY:number = 13;

type PageActionMessageProps = {
    isAdmin:boolean,
    pam:PageActionMessage,
    onAction?:(pam:PageActionMessage) => void,
    onReject?:(pam:PageActionMessage) => void,
    onFocus?:(pam:PageActionMessage) => void,
    addLabel?:(nodeIDs:CRI.NodeID[], label:string, tabID:CRI.TabID, nodeDescriptions:{}) => void,
    requestLabel?:(pam:PageActionMessage) => void,
    onAddHighlight?:(nodeIDs:Array<CRI.NodeID>, color:string)=>void,
    onRemoveHighlight?:(nodeIDs:Array<CRI.NodeID>)=>void,
};
type PageActionMessageState = {
    labeling:boolean
};

export class PageActionMessageDisplay extends React.Component<PageActionMessageProps, PageActionMessageState> {
    private sdb:SDB;
    constructor(props) {
        super(props);
        this.state = {
            labeling:false
        };
    };
    private addHighlights = (pam:PageActionMessage):void => {
        if(this.props.onAddHighlight) {
            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pam);
            const color:string = pam.sender.color;
            this.props.onAddHighlight(nodeIDs, color);
        }
    };
    private removeHighlights = (pam:PageActionMessage):void => {
        if(this.props.onRemoveHighlight) {
            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pam);
            this.props.onRemoveHighlight(nodeIDs);
        }
    };
    private performAction = (pam:PageActionMessage):void => {
        if(this.props.onAction) { this.props.onAction(pam); }
    };
    private rejectAction = (pam:PageActionMessage):void => {
        if(this.props.onReject) { this.props.onReject(pam); }
    };
    private focusAction = (pam:PageActionMessage):void => {
        if(this.props.onFocus) { this.props.onFocus(pam); }
    };
    private addLabel = (pam:PageActionMessage):void => {
        this.addHighlights(this.props.pam);
        this.setState({labeling:true});
    };
    private onLabelKeyDown = (event:React.KeyboardEvent<HTMLInputElement>):void => {
        const {keyCode} = event;
        if(keyCode === 13) { // Enter
            const input = event.target as HTMLInputElement;
            const {value} = input;

            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(this.props.pam);
            if(this.props.addLabel) { this.props.addLabel(nodeIDs, value, this.props.pam.tabID, this.props.pam.nodeDescriptions); }

            this.removeHighlights(this.props.pam);
            this.setState({labeling:false});
        } else if(keyCode === 27) {
            this.removeHighlights(this.props.pam);
            this.setState({labeling:false});
        }
    };

    public render():React.ReactNode {
        const pam:PageActionMessage = this.props.pam;
        const {action, data, state} = pam;
        const description:JSX.Element = <span className='description' onMouseEnter={()=>this.addHighlights(pam)} onMouseLeave={()=>this.removeHighlights(pam)}>{ArboretumChat.describePageActionMessage(pam)}</span>;

        const performed:boolean = state === PageActionState.PERFORMED;
        const actions:Array<JSX.Element> = [
                <a key="focus" href="javascript:void(0)" onClick={this.focusAction.bind(this, pam)}>Focus</a>,
                <a key="label" href="javascript:void(0)" onClick={this.addLabel.bind(this, pam)}>Label</a>
        ];
        if(state === PageActionState.PERFORMED) {
            actions.unshift(
                <div className=''>(accepted)</div>
            );
        } else if(state === PageActionState.REJECTED) {
            actions.unshift(
                <div className=''>(rejected)</div>
            );
        } else {
            actions.unshift(
                <a key="accept" href="javascript:void(0)" onClick={this.performAction.bind(this, pam)}>Accept</a>,
                <a key="reject" href="javascript:void(0)" onClick={this.rejectAction.bind(this, pam)}>Reject</a>
            );
        }
        const messageActions:JSX.Element = <div className='messageActions'>{actions}</div>
        const labelInput:JSX.Element = <input onKeyDown={this.onLabelKeyDown} ref={(el)=>{if(el){el.focus()}}} type="text" />;

        return <li tabIndex={0} className={'chat-line action'+(performed?' performed':'')+(true||this.props.isAdmin ? ' admin':' not_admin')}>
            <span style={{color: pam.sender.color}} className='from'>{pam.sender.displayName}</span> wants to {description}.
            {this.state.labeling ? labelInput : messageActions}
        </li>;
    };
};
