import * as React from 'react';
import {SDB, SDBDoc} from '../ShareDBDoc';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageActionState, MessageAddedEvent, PAMAction} from '../ArboretumChat';
import {RegisteredEvent} from '../TypedEventEmitter';
import {PageActionMessageDisplay} from './PageActionMessage/PageActionMessageDisplay';

const ENTER_KEY:number = 13;

type ChatMessageProps = {
    isAdmin:boolean,
    message:Message,
    isMyMessage:boolean,
    performAction?:(action:PAMAction, pam:PageActionMessage)=>void,
    onAddLabel?:(nodeIDs:CRI.NodeID[], label:string, tabID:CRI.TabID, nodeDescriptions:{}) => void,
    onAddHighlight?:(nodeIDs:Array<CRI.NodeID>, color:string)=>void,
    onRemoveHighlight?:(nodeIDs:Array<CRI.NodeID>)=>void,
    onDeleteMessage?:(message:Message)=>void,
};
type ChatMessageState = {
    hovering:boolean
};

export class ChatMessageDisplay extends React.Component<ChatMessageProps, ChatMessageState> {
    private sdb:SDB;
    constructor(props) {
        super(props);
        this.state = {
            hovering:false
        };
    };

    private onMouseEnter = (event:React.MouseEvent<HTMLLIElement>):void => {
        this.setState({hovering: true});
    };
    private onMouseLeave = (event:React.MouseEvent<HTMLLIElement>):void => {
        this.setState({hovering: false});
    };

    public render():React.ReactNode {
        const {message} = this.props;
        const senderStyle = {color: message.sender.color};
        let display:JSX.Element;
        if(message['content']) {
            const tm:TextMessage = message as TextMessage;
            display = <div  tabIndex={0} className='chat-line'><span style={senderStyle} className='from'>{tm.sender.displayName}</span><span className='message'>{tm.content}</span></div>;
        } else if(message['action']) {
            const pam:PageActionMessage = message as PageActionMessage;
            display = <PageActionMessageDisplay pam={pam} isAdmin={this.props.isAdmin} performAction={this.props.performAction} addLabel={this.props.onAddLabel} onAddHighlight={this.props.onAddHighlight} onRemoveHighlight={this.props.onRemoveHighlight} />
        }
        let deleteMessage:JSX.Element;
        if(this.props.isMyMessage && this.state.hovering) {
            deleteMessage = <a style={{'backgroundColor': '#EEE', position:'absolute', top:'0px', right:'0px'}} onClick={() => this.props.onDeleteMessage(this.props.message)} href='javascript:void(0)'>(delete message)</a>
        }
        return <li style={{position:'relative'}} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
            {display}
            {deleteMessage}
        </li>;
    };
};
