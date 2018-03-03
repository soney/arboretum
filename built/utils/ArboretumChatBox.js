"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ArboretumChat_1 = require("./ArboretumChat");
const ENTER_KEY = 13;
class ArboretumChatBox extends React.Component {
    constructor(props) {
        super(props);
        this.updateMessagesState = () => __awaiter(this, void 0, void 0, function* () {
            const messages = yield this.chat.getMessages();
            this.setState({ messages });
        });
        this.updateUsersState = () => __awaiter(this, void 0, void 0, function* () {
            const users = yield this.chat.getUsers();
            this.setState({ users });
        });
        this.chatKeyDown = (event) => {
            const { keyCode, ctrlKey, altKey, metaKey, shiftKey } = event;
            if (keyCode === ENTER_KEY && !(ctrlKey || altKey || metaKey || shiftKey)) {
                event.preventDefault();
                const { chatText } = this.state;
                if (chatText !== '') {
                    if (this.props.onSendMessage) {
                        this.props.onSendMessage(chatText);
                    }
                    if (this.chat) {
                        this.chat.addTextMessage(chatText);
                    }
                    this.setState({ chatText: '' });
                }
            }
        };
        this.onTextareaChange = (event) => {
            this.setState({ chatText: event.target.value });
        };
        this.state = {
            chatText: this.props.chatText || '',
            messages: [],
            users: []
        };
        if (this.props.sdb) {
            this.setSDB(this.props.sdb);
        }
        window.addEventListener('beforeunload', () => this.leave());
    }
    ;
    setSDB(sdb) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sdb = sdb;
            this.chat = new ArboretumChat_1.ArboretumChat(this.sdb);
            this.chat.ready(() => __awaiter(this, void 0, void 0, function* () {
                yield this.chat.join(this.props.username);
                yield this.updateMessagesState();
                yield this.updateUsersState();
                this.chat.messageAdded(this.updateMessagesState);
                this.chat.userJoined(this.updateUsersState);
                this.chat.userNotPresent(this.updateUsersState);
            }));
        });
    }
    ;
    //https://stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react
    scrollToBottom() {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }
    ;
    componentDidMount() {
        this.scrollToBottom();
    }
    ;
    leave() {
        if (this.chat) {
            this.chat.leave();
        }
    }
    ;
    componentWillUnmount() {
        this.leave();
    }
    ;
    componentDidUpdate() {
        this.scrollToBottom();
    }
    ;
    render() {
        const messages = this.state.messages.map((m, i) => {
            const senderStyle = { color: m.sender.color };
            return React.createElement("li", { key: i, className: 'chat-line' },
                React.createElement("span", { style: senderStyle, className: 'from' }, m.sender.displayName),
                React.createElement("span", { className: 'message' }, m.content));
        });
        let meUserID;
        if (this.chat) {
            const meUser = this.chat.getMe();
            if (meUser) {
                meUserID = meUser.id;
            }
        }
        const users = this.state.users.map((u) => {
            const isMe = u.id === meUserID;
            const style = { color: u.color };
            if (isMe) {
                style['textDecoration'] = 'underline overline';
                style['fontWeight'] = 'bold';
            }
            return React.createElement("span", { key: u.id, className: `participant ${isMe ? 'me' : ''}`, style: style }, u.displayName);
        });
        return React.createElement("div", { className: 'chat' },
            React.createElement("h6", { id: "task_title" },
                React.createElement("span", { className: "icon icon-chat" }),
                React.createElement("span", { id: 'task-name' }, "Chat")),
            React.createElement("div", { id: "chat-participants" }, users),
            React.createElement("ul", { id: "chat-lines" },
                messages,
                React.createElement("li", { style: { float: "left", clear: "both" }, ref: (el) => { this.messagesEnd = el; } })),
            React.createElement("form", { id: "chat-form" },
                React.createElement("textarea", { id: "chat-box", className: "form-control", placeholder: "Send a message", onChange: this.onTextareaChange, onKeyDown: this.chatKeyDown, value: this.state.chatText })));
    }
    ;
}
exports.ArboretumChatBox = ArboretumChatBox;
;
