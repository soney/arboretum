import * as React from 'react';
import {SDB, SDBDoc} from '../ShareDBDoc';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage} from '../ArboretumChat';

require('./ArboretumChat.scss');

const ENTER_KEY:number = 13;

type ArboretumChatProps = {
    onSendMessage?:(message:string)=>void,
    chatText?:string,
    sdb?:SDB,
    username:string,
    onAction?:(pam:PageActionMessage) => void,
    isAdmin:boolean
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
    public getChat():ArboretumChat { return this.chat; }
    public async setSDB(sdb:SDB):Promise<void> {
        this.sdb = sdb;
        this.chat = new ArboretumChat(this.sdb);

        this.chat.ready.addListener(async () => {
            await this.chat.join(this.props.username);

            await this.updateMessagesState();
            await this.updateUsersState();

            this.chat.messageAdded.addListener(this.updateMessagesState);
            this.chat.userJoined.addListener(this.updateUsersState);
            this.chat.userNotPresent.addListener(this.updateUsersState);
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
    private performAction = (pam:PageActionMessage):void => {
        this.getChat().markPerformed(pam);
        if(this.props.onAction) { this.props.onAction(pam); }
    };

    public render():React.ReactNode {
        const messages = this.state.messages.map((m:Message, i:number) => {
            const senderStyle = {color: m.sender.color};
            if(m['content']) {
                const tm:TextMessage = m as TextMessage;
                return <li key={i} className='chat-line'><span style={senderStyle} className='from'>{tm.sender.displayName}</span><span className='message'>{tm.content}</span></li>;
            } else if(m['action']) {
                const pam:PageActionMessage = m as PageActionMessage;
                const {action, data, performed} = pam;
                let description:JSX.Element;
                let actions:JSX.Element;
                if(action === 'navigate') {
                    const {url} = data;
                    description = <span className='navigate description'>navigate to {url}</span>;
                } else if(action === 'click') {
                    const {targetNodeID} = data;
                    description = <span className='navigate description'>click on {targetNodeID}</span>;
                }

                if(performed) {
                    actions = <div className=''>(accepted)</div>
                } else {
                    actions = <div className='messageAction'><a href="javascript:void(0)" onClick={this.performAction.bind(this, pam)}>Accept</a></div>
                }

                return <li key={i} className={'chat-line action'+(performed?' performed':'')+(this.props.isAdmin ? ' admin':' not_admin')}><span style={senderStyle} className='from'>{pam.sender.displayName}</span> wants to {description}.{actions}</li>;
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
            <div id="chat-participants">{users}</div>
            <ul id="chat-lines">
                {messages.filter(m => !!m)}
                <li style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }} />
            </ul>
            <form id="chat-form">
                <textarea id="chat-box" className="form-control" placeholder="Send a message" onChange={this.onTextareaChange} onKeyDown={this.chatKeyDown} value={this.state.chatText}></textarea>
            </form>
        </div>;
    };
};
