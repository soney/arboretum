import * as React from 'react';
import {SDB, SDBDoc} from '../../ShareDBDoc';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageActionState, MessageAddedEvent, PAMAction} from '../../ArboretumChat';
import {RegisteredEvent} from '../../TypedEventEmitter';

const ENTER_KEY:number = 13;

type PageActionMessageProps = {
    isAdmin:boolean,
    pam:PageActionMessage,
    performAction?:(action:PAMAction, pam:PageActionMessage)=>void,
    addLabel?:(nodeIDs:CRI.NodeID[], label:string, tabID:CRI.TabID, nodeDescriptions:{}) => void,
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
            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pam.action);
            const color:string = pam.sender.color;
            this.props.onAddHighlight(nodeIDs, color);
        }
    };
    private removeHighlights = (pam:PageActionMessage):void => {
        if(this.props.onRemoveHighlight) {
            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pam.action);
            this.props.onRemoveHighlight(nodeIDs);
        }
    };
    private performAction = (action:PAMAction, pam:PageActionMessage):void => {
        if(action === PAMAction.ADD_LABEL) {
            this.addHighlights(this.props.pam);
            this.setState({labeling:true});
        } else {
            if(this.props.performAction) { this.props.performAction(action, pam); }
        }
    };
    private onLabelKeyDown = (event:React.KeyboardEvent<HTMLInputElement>):void => {
        const {keyCode} = event;
        if(keyCode === 13) { // Enter
            const input = event.target as HTMLInputElement;
            const {value} = input;

            const {pam} = this.props;

            const nodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(pam.action);
            if(this.props.addLabel) { this.props.addLabel(nodeIDs, value, pam.action.tabID, pam.nodeDescriptions); }

            this.removeHighlights(this.props.pam);
            this.setState({labeling:false});
        } else if(keyCode === 27) {
            this.removeHighlights(this.props.pam);
            this.setState({labeling:false});
        }
    };

    public render():React.ReactNode {
        const pam:PageActionMessage = this.props.pam;
        const {action, state, sender} = pam;
        const {data} =  action;
        const pageActionDescription:string = ArboretumChat.describePageAction(action);

        const messageActions:Array<JSX.Element> = ArboretumChat.getActions(pam, this.props.isAdmin).map((action:PAMAction) => {
            const description:string = ArboretumChat.getActionDescription(action);
            return <a key={action} href="javascript:void(0)" onClick={() => this.performAction(action, pam)}>{description}</a>
        });
        const stateDescription:string = ArboretumChat.getStateDescription(pam);
        const labelInput:JSX.Element = <input onKeyDown={this.onLabelKeyDown} ref={(el)=>{if(el){el.focus()}}} type="text" />;

        const messageText:string = `${sender.displayName} wants to ${pageActionDescription}`;
        return <div onMouseEnter={()=>this.addHighlights(pam)} onMouseLeave={()=>this.removeHighlights(pam)} tabIndex={0} aria-label={messageText} className={'chat-line action '+stateDescription}>
            <span style={{color: sender.color}} className='from'>{sender.displayName}</span> wants to {pageActionDescription}.
            <div className='messageState'>{stateDescription}</div>
            <div className='messageActions'>{messageActions}</div>
            {this.state.labeling ? labelInput : null}
        </div>;
    };
};
