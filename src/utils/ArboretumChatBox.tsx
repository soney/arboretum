import * as React from 'react';
import {SDB, SDBDoc} from './ShareDBDoc';
import {ArboretumChat, Message, User} from './ArboretumChat';

const ENTER_KEY:number = 13;

type ArboretumChatProps = {
    onSendMessage?:(message:string)=>void,
    chatText?:string,
    sdb?:SDB,
    username:string
};
type ArboretumChatState = {
    chatText:string,
    messages:Array<Message>,
    users:Array<User>
};

export class ArboretumChatBox extends React.Component<ArboretumChatProps, ArboretumChatState> {
    private sdb:SDB;
    private chat:ArboretumChat;
    private messagesEnd:HTMLLIElement;
    constructor(props) {
        super(props);
        this.state = {
            chatText:this.props.chatText||'',
            messages:[],
            users:[]
        };
        if(this.props.sdb) { this.setSDB(this.props.sdb); }
        window.addEventListener('beforeunload', () => this.leave());
    };
    public async setSDB(sdb:SDB):Promise<void> {
        this.sdb = sdb;
        this.chat = new ArboretumChat(this.sdb);

        this.chat.ready(async () => {
            await this.chat.join(this.props.username);

            await this.updateMessagesState();
            await this.updateUsersState();

            this.chat.messageAdded(this.updateMessagesState);
            this.chat.userJoined(this.updateUsersState);
            this.chat.userNotPresent(this.updateUsersState);
        });
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

    private leave():void {
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

    public render():React.ReactNode {
        const messages = this.state.messages.map((m:Message, i:number) => {
            const senderStyle = {color: m.sender.color};
            return <li key={i} className='chat-line'><span style={senderStyle} className='from'>{m.sender.displayName}</span><span className='message'>{m.content}</span></li>;
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
            if(isMe) {
                style['textDecoration'] = 'underline overline';
                style['fontWeight'] = 'bold';
            }
            return <span key={u.id} className={`participant ${isMe?'me':''}`} style={style}>{u.displayName}</span>;
        });
        return <div className='chat'>
            <h6 id="task_title"><span className="icon icon-chat"></span><span id='task-name'>Chat</span></h6>
            <div id="chat-participants">{users}</div>
            <ul id="chat-lines">
                {messages}
                <li style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }} />
            </ul>
            <form id="chat-form">
                <textarea id="chat-box" className="form-control" placeholder="Send a message" onChange={this.onTextareaChange} onKeyDown={this.chatKeyDown} value={this.state.chatText}></textarea>
            </form>
        </div>;
    };
};