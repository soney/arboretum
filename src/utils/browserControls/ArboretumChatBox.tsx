import * as React from 'react';
import {SDB, SDBDoc} from '../ShareDBDoc';
import {ArboretumChat, ChatCommandEvent, ChatCommandType, Message, User, TextMessage, PageActionMessage, PageAction, PageActionState, MessageAddedEvent, PAMAction} from '../ArboretumChat';
import {RegisteredEvent} from '../TypedEventEmitter';
import {PageActionMessageDisplay} from './PageActionMessage/PageActionMessageDisplay';
import {ChatMessageDisplay} from './ArboretumChatMessage';

require('./ArboretumChat.scss');

const ENTER_KEY:number = 13;

type ArboretumChatProps = {
    onSendMessage?:(message:string)=>void,
    chatText?:string,
    sdb?:SDB,
    username?:string,
    onCommand?:(event:ChatCommandEvent) => void,
    onAction?:(a:PAMAction, action:PageAction) => void,
    onAddHighlight?:(nodeIDs:Array<CRI.NodeID>, color:string)=>void,
    onRemoveHighlight?:(nodeIDs:Array<CRI.NodeID>)=>void,
    isAdmin:boolean,
    joinOnStart?:boolean
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
        this.chat.commandIssued.addListener((event) => {
            if(this.props.onCommand) {
                this.props.onCommand(event);
            }
        });

        this.chat.ready.addListener(async () => {
            if(this.props.joinOnStart) {
                await this.chat.join(this.props.username, 'admin');
            }

            await this.updateMessagesState();
            await this.updateUsersState();

            this.chat.messageAdded.addListener(this.messageAdded);
            this.chat.messageRemoved.addListener(this.updateMessagesState);
            this.chat.userJoined.addListener(this.updateUsersState);
            this.chat.userNotPresent.addListener(this.updateUsersState);
            this.chat.pamStateChanged.addListener(this.updateMessagesState);
            this.chat.userNameChanged.addListener(this.updateUsersState);
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
            let {chatText} = this.state;
            if(chatText !== '') {
                let isCommand:boolean = chatText[0] === '/';
                if(chatText.slice(0, 2) === '\\/') {
                    chatText = `/${chatText.slice(1)}`;
                }

                if(isCommand) {
                    const command = chatText.slice(1);
                    this.chat.doCommand(command);
                } else {
                    if(this.props.onSendMessage) {
                        this.props.onSendMessage(chatText);
                    }
                    if(this.chat) {
                        this.chat.addTextMessage(chatText);
                    }
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
    private performAction = (a:PAMAction, pam:PageActionMessage):void => {
        const {action} = pam;
        if(a === PAMAction.REQUEST_LABEL) {
            this.requestLabel(pam);
        } else if(a === PAMAction.ACCEPT) {
            this.chat.setState(pam, PageActionState.PERFORMED);
        } else if(a === PAMAction.REJECT) {
            this.chat.setState(pam, PageActionState.NOT_PERFORMED);
        }
        if(this.props.onAction) { this.props.onAction(a, pam.action); }
    };
    private deleteMessage = async (message:Message):Promise<void> => {
        await this.chat.removeMessage(message);
    };
    private requestLabel(pam:PageActionMessage):void {
        const action:PageAction = {type:'getLabel', tabID: pam.action.tabID, data: pam.action.data}
        this.chat.addPageActionMessage(action, action.data.nodeDescriptions);
    };
    private onAddLabel = (nodeIDs:CRI.NodeID[], label:string, tabID:CRI.TabID, nodeDescriptions:{}):void => {
        const action:PageAction = {type:'setLabel', tabID, data:{nodeIDs, label, nodeDescriptions}};
        this.chat.addPageActionMessage(action, action.data.nodeDescriptions);
    };

    public render():React.ReactNode {
        const messages = this.state.messages.map((m:Message, i:number) => {
            return <ChatMessageDisplay key={i} message={m} isMyMessage={this.chat.isFromUser(m)} isAdmin={this.props.isAdmin} performAction={this.performAction} onAddLabel={this.onAddLabel} onDeleteMessage={this.deleteMessage} onAddHighlight={this.props.onAddHighlight} onRemoveHighlight={this.props.onRemoveHighlight} />
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
            <div id="chat-participants" tabIndex={0} aria-label="Chat participants">Here now: {users}</div>
            <ul id="chat-lines" tabIndex={0} aria-label="Chat content">
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
