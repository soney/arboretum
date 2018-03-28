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
const ArboretumChat_1 = require("../ArboretumChat");
const ArboretumChatMessage_1 = require("./ArboretumChatMessage");
require('./ArboretumChat.scss');
const ENTER_KEY = 13;
class ArboretumChatBox extends React.Component {
    constructor(props) {
        super(props);
        this.messageAdded = (event) => __awaiter(this, void 0, void 0, function* () {
            const { message } = event;
            const { sender } = message;
            if (sender.id !== this.chat.getMe().id) {
                if (message['action']) {
                    this.playPageActionMessageChime();
                }
                else {
                    this.playTextMessageChime();
                }
            }
            this.updateMessagesState();
        });
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
        this.lightChimeRef = (el) => {
            this.lightChimeElement = el;
        };
        this.openEndedChimeRef = (el) => {
            this.openEndedChimeElement = el;
        };
        this.performAction = (a, pam) => {
            const { action } = pam;
            if (a === ArboretumChat_1.PAMAction.REQUEST_LABEL) {
                this.requestLabel(pam);
            }
            else if (a === ArboretumChat_1.PAMAction.ACCEPT) {
                this.chat.setState(pam, ArboretumChat_1.PageActionState.PERFORMED);
            }
            else if (a === ArboretumChat_1.PAMAction.REJECT) {
                this.chat.setState(pam, ArboretumChat_1.PageActionState.NOT_PERFORMED);
            }
            if (this.props.onAction) {
                this.props.onAction(a, pam.action);
            }
        };
        this.deleteMessage = (message) => __awaiter(this, void 0, void 0, function* () {
            yield this.chat.removeMessage(message);
        });
        this.onAddLabel = (nodeIDs, label, tabID, nodeDescriptions) => {
            const action = { type: 'setLabel', tabID, data: { nodeIDs, label, nodeDescriptions } };
            this.chat.addPageActionMessage(action, action.data.nodeDescriptions);
        };
        this.state = {
            chatText: this.props.chatText || '',
            messages: [],
            users: []
        };
        if (this.props.sdb) {
            this.setSDB(this.props.sdb);
        }
        window.addEventListener('beforeunload', (event) => {
            this.leave();
        });
    }
    ;
    getChat() { return this.chat; }
    setSDB(sdb) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sdb = sdb;
            this.chat = new ArboretumChat_1.ArboretumChat(this.sdb);
            this.chat.ready.addListener(() => __awaiter(this, void 0, void 0, function* () {
                if (this.props.joinOnStart) {
                    yield this.chat.join(this.props.username);
                }
                yield this.updateMessagesState();
                yield this.updateUsersState();
                this.chat.messageAdded.addListener(this.messageAdded);
                this.chat.messageRemoved.addListener(this.updateMessagesState);
                this.chat.userJoined.addListener(this.updateUsersState);
                this.chat.userNotPresent.addListener(this.updateUsersState);
                this.chat.pamStateChanged.addListener(this.updateMessagesState);
                this.chat.userNameChanged.addListener(this.updateUsersState);
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
    static playAudio(el) {
        if (el) {
            el.currentTime = 0;
            el.play();
        }
    }
    playTextMessageChime() {
        ArboretumChatBox.playAudio(this.lightChimeElement);
    }
    ;
    playPageActionMessageChime() {
        ArboretumChatBox.playAudio(this.openEndedChimeElement);
    }
    ;
    requestLabel(pam) {
        const action = { type: 'getLabel', tabID: pam.action.tabID, data: pam.action.data };
        this.chat.addPageActionMessage(action, action.data.nodeDescriptions);
    }
    ;
    render() {
        const messages = this.state.messages.map((m, i) => {
            return React.createElement(ArboretumChatMessage_1.ChatMessageDisplay, { key: i, message: m, isMyMessage: this.chat.isFromUser(m), isAdmin: this.props.isAdmin, performAction: this.performAction, onAddLabel: this.onAddLabel, onDeleteMessage: this.deleteMessage, onAddHighlight: this.props.onAddHighlight, onRemoveHighlight: this.props.onRemoveHighlight });
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
            return React.createElement("span", { key: u.id, className: `participant ${isMe ? 'me' : ''}`, style: style }, u.displayName);
        });
        return React.createElement("div", { className: 'chat' },
            React.createElement("div", { id: "chat-participants", tabIndex: 0, "aria-label": "Chat participants" },
                "Here now: ",
                users),
            React.createElement("ul", { id: "chat-lines", tabIndex: 0, "aria-label": "Chat content" },
                messages.filter(m => !!m),
                React.createElement("li", { style: { float: "left", clear: "both" }, ref: (el) => { this.messagesEnd = el; } })),
            React.createElement("form", { id: "chat-form" },
                React.createElement("textarea", { "aria-label": "Send a message", id: "chat-box", className: "form-control", placeholder: "Send a message", onChange: this.onTextareaChange, onKeyDown: this.chatKeyDown, value: this.state.chatText })),
            React.createElement("audio", { ref: this.lightChimeRef, style: { display: 'none' } },
                React.createElement("source", { src: "audio/light.ogg", type: "audio/ogg" }),
                React.createElement("source", { src: "audio/light.mp3", type: "audio/mpeg" }),
                React.createElement("source", { src: "audio/light.m4r", type: "audio/m4a" })),
            React.createElement("audio", { ref: this.openEndedChimeRef, style: { display: 'none' } },
                React.createElement("source", { src: "audio/open-ended.ogg", type: "audio/ogg" }),
                React.createElement("source", { src: "audio/open-ended.mp3", type: "audio/mpeg" }),
                React.createElement("source", { src: "audio/open-ended.m4r", type: "audio/m4a" })));
    }
    ;
}
exports.ArboretumChatBox = ArboretumChatBox;
;
