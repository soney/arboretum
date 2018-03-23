"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ArboretumChat_1 = require("../../ArboretumChat");
const ENTER_KEY = 13;
class PageActionMessageDisplay extends React.Component {
    constructor(props) {
        super(props);
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
            if (this.props.onAction) {
                this.props.onAction(pam);
            }
        };
        this.rejectAction = (pam) => {
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
            this.addHighlights(this.props.pam);
            this.setState({ labeling: true });
        };
        this.onLabelKeyDown = (event) => {
            const { keyCode } = event;
            if (keyCode === 13) {
                const input = event.target;
                const { value } = input;
                const nodeIDs = ArboretumChat_1.ArboretumChat.getRelevantNodeIDs(this.props.pam);
                if (this.props.addLabel) {
                    this.props.addLabel(nodeIDs, value, this.props.pam.tabID, this.props.pam.nodeDescriptions);
                }
                this.removeHighlights(this.props.pam);
                this.setState({ labeling: false });
            }
            else if (keyCode === 27) {
                this.removeHighlights(this.props.pam);
                this.setState({ labeling: false });
            }
        };
        this.state = {
            labeling: false
        };
    }
    ;
    render() {
        const pam = this.props.pam;
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
        const messageActions = React.createElement("div", { className: 'messageActions' }, actions);
        const labelInput = React.createElement("input", { onKeyDown: this.onLabelKeyDown, ref: (el) => { if (el) {
                el.focus();
            } }, type: "text" });
        return React.createElement("li", { tabIndex: 0, className: 'chat-line action' + (performed ? ' performed' : '') + (true || this.props.isAdmin ? ' admin' : ' not_admin') },
            React.createElement("span", { style: { color: pam.sender.color }, className: 'from' }, pam.sender.displayName),
            " wants to ",
            description,
            ".",
            this.state.labeling ? labelInput : messageActions);
    }
    ;
}
exports.PageActionMessageDisplay = PageActionMessageDisplay;
;
