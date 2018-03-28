"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const PageActionMessageDisplay_1 = require("./PageActionMessage/PageActionMessageDisplay");
const ENTER_KEY = 13;
class ChatMessageDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.onMouseEnter = (event) => {
            this.setState({ hovering: true });
        };
        this.onMouseLeave = (event) => {
            this.setState({ hovering: false });
        };
        this.state = {
            hovering: false
        };
    }
    ;
    render() {
        const { message } = this.props;
        const senderStyle = { color: message.sender.color };
        let display;
        if (message['content']) {
            const tm = message;
            display = React.createElement("div", { tabIndex: 0, className: 'chat-line' },
                React.createElement("span", { style: senderStyle, className: 'from' }, tm.sender.displayName),
                React.createElement("span", { className: 'message' }, tm.content));
        }
        else if (message['action']) {
            const pam = message;
            display = React.createElement(PageActionMessageDisplay_1.PageActionMessageDisplay, { pam: pam, isAdmin: this.props.isAdmin, performAction: this.props.performAction, addLabel: this.props.onAddLabel, onAddHighlight: this.props.onAddHighlight, onRemoveHighlight: this.props.onRemoveHighlight });
        }
        let deleteMessage;
        if (this.props.isMyMessage && this.state.hovering) {
            deleteMessage = React.createElement("a", { style: { position: 'absolute', top: '0px', right: '0px' }, onClick: () => this.props.onDeleteMessage(this.props.message), href: 'javascript:void' }, "(delete message)");
        }
        return React.createElement("li", { style: { position: 'relative' }, onMouseEnter: this.onMouseEnter, onMouseLeave: this.onMouseLeave },
            display,
            deleteMessage);
    }
    ;
}
exports.ChatMessageDisplay = ChatMessageDisplay;
;
