import * as React from 'react';
import {SDB, SDBDoc} from '../../utils/sharedb_wrapper';
import {ArboretumChat, Message, User} from '../../utils/chat_doc';

const ENTER_KEY:number = 13;

type ArboretumChatProps = {
    onSendMessage:(message:string)=>void,
    chatText?:string
};
type ArboretumChatState = {
    chatText:string,
    messages:Array<Message>,
    users:Array<User>
};

export class ArboretumChatBox extends React.Component<ArboretumChatProps, ArboretumChatState> {
    private sdb:SDB;
    private chat:ArboretumChat;
    constructor(props) {
        super(props);
        this.state = {
            chatText:this.props.chatText||'',
            messages:[],
            users:[]
        };
    };
    public setSDB(sdb:SDB) {
        this.sdb = sdb;
        if(sdb) {
            this.chat = new ArboretumChat(sdb);
            this.chat.addUser('Admin');
            this.chat.messageAdded(this.updateMessagesState);
            this.chat.userJoined(this.updateUsersState);
        } else {
            this.chat = null;
        }
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
                if(this.props.onSendMessage) { this.props.onSendMessage(chatText); }
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

    public render():React.ReactNode {
        const messages = this.state.messages.map((m) => {
            return <li>{m.content}</li>;
        });
        let meUserID;
        if(this.chat) {
            const meUser = this.chat.getMe();
            meUserID = meUser.id;
        } else {
            meUserID = null;
        }
        const users = this.state.users.map((u) => {
            const isMe = u.id === meUserID;
            return <span>{u.displayName}</span>;
        });
        return <div className='chat'>
            <h6 id="task_title"><span className="icon icon-chat"></span><span id='task-name'>Chat</span></h6>
            <div id="chat-participants">{users}</div>
            <ul id="chat-lines">
                {messages}
            </ul>
            <form id="chat-form">
                <textarea id="chat-box" className="form-control" placeholder="Send a message" onChange={this.onTextareaChange} onKeyDown={this.chatKeyDown} value={this.state.chatText}></textarea>
            </form>
        </div>;
    };
};
