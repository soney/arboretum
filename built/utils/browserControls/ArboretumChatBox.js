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
        this.addHighlights = (pam) => {
            if (this.props.onAddHighlight) {
                const nodeIDs = ArboretumChat_1.ArboretumChat.getRelevantNodeIDs(pam);
                const color = pam.sender.color;
                this.props.onAddHighlight(nodeIDs, color);
            }
        };
        this.removeHighlights = (pam) => {
            if (this.props.onRemoveHighlight) {
                const nodeIDs = ArboretumChat_1.ArboretumChat.getRelevantNodeIDs(pam);
                this.props.onRemoveHighlight(nodeIDs);
            }
        };
        this.performAction = (pam) => {
            this.getChat().setState(pam, ArboretumChat_1.PageActionState.PERFORMED);
            if (this.props.onAction) {
                this.props.onAction(pam);
            }
        };
        this.rejectAction = (pam) => {
            this.getChat().setState(pam, ArboretumChat_1.PageActionState.REJECTED);
            if (this.props.onReject) {
                this.props.onReject(pam);
            }
        };
        this.focusAction = (pam) => {
            if (this.props.onFocus) {
                this.props.onFocus(pam);
            }
        };
        this.addLabel = (pam) => {
            if (this.props.onLabel) {
                this.props.onLabel(pam);
            }
        };
        this.lightChimeRef = (el) => {
            this.lightChimeElement = el;
        };
        this.openEndedChimeRef = (el) => {
            this.openEndedChimeElement = el;
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
                yield this.chat.join(this.props.username);
                yield this.updateMessagesState();
                yield this.updateUsersState();
                this.chat.messageAdded.addListener(this.messageAdded);
                this.chat.userJoined.addListener(this.updateUsersState);
                this.chat.userNotPresent.addListener(this.updateUsersState);
                this.chat.pamStateChanged.addListener(this.updateUsersState);
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
    render() {
        const messages = this.state.messages.map((m, i) => {
            const senderStyle = { color: m.sender.color };
            if (m['content']) {
                const tm = m;
                return React.createElement("li", { tabIndex: 0, key: i, className: 'chat-line' },
                    React.createElement("span", { style: senderStyle, className: 'from' }, tm.sender.displayName),
                    React.createElement("span", { className: 'message' }, tm.content));
            }
            else if (m['action']) {
                const pam = m;
                const { action, data, state } = pam;
                const description = React.createElement("span", { className: 'description', onMouseEnter: () => this.addHighlights(pam), onMouseLeave: () => this.removeHighlights(pam) }, ArboretumChat_1.ArboretumChat.describePageActionMessage(pam));
                const performed = state === ArboretumChat_1.PageActionState.PERFORMED;
                const actions = [
                    React.createElement("a", { key: "focus", href: "javascript:void(0)", onClick: this.focusAction.bind(this, pam) }, "Focus"),
                    React.createElement("a", { key: "label", href: "javascript:void(0)", onClick: this.addLabel.bind(this, pam) }, "Label")
                ];
                if (state === ArboretumChat_1.PageActionState.PERFORMED) {
                    actions.unshift(React.createElement("div", { className: '' }, "(accepted)"));
                }
                else if (state === ArboretumChat_1.PageActionState.REJECTED) {
                    actions.unshift(React.createElement("div", { className: '' }, "(rejected)"));
                }
                else {
                    actions.unshift(React.createElement("a", { key: "accept", href: "javascript:void(0)", onClick: this.performAction.bind(this, pam) }, "Accept"), React.createElement("a", { key: "reject", href: "javascript:void(0)", onClick: this.rejectAction.bind(this, pam) }, "Reject"));
                }
                return React.createElement("li", { tabIndex: 0, key: i, className: 'chat-line action' + (performed ? ' performed' : '') + (this.props.isAdmin ? ' admin' : ' not_admin') },
                    React.createElement("span", { style: senderStyle, className: 'from' }, pam.sender.displayName),
                    " wants to ",
                    description,
                    ".",
                    React.createElement("div", { className: 'messageActions' }, actions));
            }
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
            React.createElement("div", { id: "chat-participants", tabIndex: 0 },
                "Here now: ",
                users),
            React.createElement("ul", { id: "chat-lines", "aria-label": "Chat content" },
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
