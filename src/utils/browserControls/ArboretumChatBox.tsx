import * as React from 'react';
import {SDB, SDBDoc} from '../ShareDBDoc';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageActionState, MessageAddedEvent} from '../ArboretumChat';
import {RegisteredEvent} from '../TypedEventEmitter';

require('./ArboretumChat.scss');

const ENTER_KEY:number = 13;

type ArboretumChatProps = {
    onSendMessage?:(message:string)=>void,
    chatText?:string,
    sdb?:SDB,
    username:string,
    onAction?:(pam:PageActionMessage) => void,
    onReject?:(pam:PageActionMessage) => void,
    onFocus?:(pam:PageActionMessage) => void,
    onLabel?:(pam:PageActionMessage) => void,
    onAddHighlight?:(nodeIDs:Array<CRI.NodeID>, color:string)=>void,
    onRemoveHighlight?:(nodeIDs:Array<CRI.NodeID>)=>void,
    isAdmin:boolean
};
type ArboretumChatState = {
    chatText:string,
    messages:Array<Message>,
    users:Array<User>
};
type AddHighlightEvent = {
    color:string,
    nodeIDs:Array<CRI.NodeID>
};
type RemoveHighlightEvent = {
    nodeIDs:Array<CRI.NodeID>
};

export class ArboretumChatBox extends React.Component<ArboretumChatProps, ArboretumChatState> {
    private sdb:SDB;
    private chat:ArboretumChat;
    private messagesEnd:HTMLLIElement;
    private lightChimeElement:HTMLAudioElement;
    private openEndedChimeElement:HTMLAudioElement;
    constructor(props) {
        super(props);
        this.state = {
            chatText:this.props.chatText||'',
            messages:[],
            users:[]
        };
        if(this.props.sdb) { this.setSDB(this.props.sdb); }
        window.addEventListener('beforeunload', (event) => {
            this.leave();
        });
    };
    public getChat():ArboretumChat { return this.chat; }
    public async setSDB(sdb:SDB):Promise<void> {
        this.sdb = sdb;
        this.chat = new ArboretumChat(this.sdb);

        this.chat.ready.addListener(async () => {
            await this.chat.join(this.props.username);

            await this.updateMessagesState();
            await this.updateUsersState();

            this.chat.messageAdded.addListener(this.messageAdded);
            this.chat.userJoined.addListener(this.updateUsersState);
            this.chat.userNotPresent.addListener(this.updateUsersState);
            this.chat.pamStateChanged.addListener(this.updateUsersState);
        });
    };
    private messageAdded = async (event:MessageAddedEvent):Promise<void> => {
        const {message} = event;
        const {sender} = message;

        if(sender.id !== this.chat.getMe().id) {
            if(message['action']) {
                this.playPageActionMessageChime();
            } else {
                this.playTextMessageChime();
            }
        }
        this.updateMessagesState();
    };
    private updateMessagesState = async ():Promise<void> => {
        const messages = await this.chat.getMessages();
        this.setState({messages});
    };
    private updateUsersState = async ():Promise<void> => {
        const users = await this.chat.getUsers();
        this.setState({users});
    };

    private chatKeyDown = (event:React.KeyboardEvent<HTMLTextAreaElement>):void => {
        const {keyCode, ctrlKey, altKey, metaKey, shiftKey} = event;
        if(keyCode === ENTER_KEY && !(ctrlKey || altKey || metaKey || shiftKey)) {
            event.preventDefault();
            const {chatText} = this.state;
            if(chatText !== '') {
                if(this.props.onSendMessage) {
                    this.props.onSendMessage(chatText);
                }
                if(this.chat) {
                    this.chat.addTextMessage(chatText);
                }
                this.setState({chatText:''});
            }
        }
    };

    private onTextareaChange = (event:React.ChangeEvent<HTMLTextAreaElement>):void => {
        this.setState({ chatText:event.target.value });
    };

    //https://stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react
    private scrollToBottom():void {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    };

    public componentDidMount():void {
        this.scrollToBottom();
    };

    public leave():void {
        if(this.chat) {
            this.chat.leave();
        }
    };

    public componentWillUnmount():void {
        this.leave();
    };

    public componentDidUpdate():void {
        this.scrollToBottom();
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
        this.getChat().setState(pam, PageActionState.PERFORMED);
        if(this.props.onAction) { this.props.onAction(pam); }
    };
    private rejectAction = (pam:PageActionMessage):void => {
        this.getChat().setState(pam, PageActionState.REJECTED);
        if(this.props.onReject) { this.props.onReject(pam); }
    };
    private focusAction = (pam:PageActionMessage):void => {
        if(this.props.onFocus) { this.props.onFocus(pam); }
    };
    private addLabel = (pam:PageActionMessage):void => {
        if(this.props.onLabel) { this.props.onLabel(pam); }
    };
    private static playAudio(el:HTMLAudioElement) {
        if(el) {
            el.currentTime = 0;
            el.play();
        }
    }
    private playTextMessageChime():void {
        ArboretumChatBox.playAudio(this.lightChimeElement);
    };
    private playPageActionMessageChime():void {
        ArboretumChatBox.playAudio(this.openEndedChimeElement);
    };
    private lightChimeRef = (el:HTMLAudioElement):void => {
        this.lightChimeElement = el;
    };
    private openEndedChimeRef = (el:HTMLAudioElement):void => {
        this.openEndedChimeElement = el;
    };

    public render():React.ReactNode {
        const messages = this.state.messages.map((m:Message, i:number) => {
            const senderStyle = {color: m.sender.color};
            if(m['content']) {
                const tm:TextMessage = m as TextMessage;
                return <li tabIndex={0} key={i} className='chat-line'><span style={senderStyle} className='from'>{tm.sender.displayName}</span><span className='message'>{tm.content}</span></li>;
            } else if(m['action']) {
                const pam:PageActionMessage = m as PageActionMessage;
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

                return <li tabIndex={0} key={i} className={'chat-line action'+(performed?' performed':'')+(this.props.isAdmin ? ' admin':' not_admin')}>
                    <span style={senderStyle} className='from'>{pam.sender.displayName}</span> wants to {description}.
                    <div className='messageActions'>
                        {actions}
                    </div>
                </li>;
            }
        });

        let meUserID;
        if(this.chat) {
            const meUser = this.chat.getMe();
            if(meUser) {
                meUserID = meUser.id;
            }
        }
        const users = this.state.users.map((u) => {
            const isMe = u.id === meUserID;
            const style = {color: u.color};
            return <span key={u.id} className={`participant ${isMe?'me':''}`} style={style}>{u.displayName}</span>;
        });
        return <div className='chat'>
            <div id="chat-participants" tabIndex={0}>Here now: {users}</div>
            <ul id="chat-lines" aria-label="Chat content">
                {messages.filter(m => !!m)}
                <li style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }} />
            </ul>
            <form id="chat-form">
                <textarea aria-label="Send a message" id="chat-box" className="form-control" placeholder="Send a message" onChange={this.onTextareaChange} onKeyDown={this.chatKeyDown} value={this.state.chatText}></textarea>
            </form>
            <audio ref={this.lightChimeRef} style={{display:'none'}}>
                <source src="audio/light.ogg" type="audio/ogg"/>
                <source src="audio/light.mp3" type="audio/mpeg"/>
                <source src="audio/light.m4r" type="audio/m4a"/>
            </audio>
            <audio ref={this.openEndedChimeRef} style={{display:'none'}}>
                <source src="audio/open-ended.ogg" type="audio/ogg"/>
                <source src="audio/open-ended.mp3" type="audio/mpeg"/>
                <source src="audio/open-ended.m4r" type="audio/m4a"/>
            </audio>
        </div>;
    };
};
