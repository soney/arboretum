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
                const nodeIDs = ArboretumChat_1.ArboretumChat.getRelevantNodeIDs(pam.action);
                const color = pam.sender.color;
                this.props.onAddHighlight(nodeIDs, color);
            }
        };
        this.removeHighlights = (pam) => {
            if (this.props.onRemoveHighlight) {
                const nodeIDs = ArboretumChat_1.ArboretumChat.getRelevantNodeIDs(pam.action);
                this.props.onRemoveHighlight(nodeIDs);
            }
        };
        this.performAction = (action, pam) => {
            if (action === ArboretumChat_1.PAMAction.ADD_LABEL) {
                this.addHighlights(this.props.pam);
                this.setState({ labeling: true });
            }
            else {
                if (this.props.performAction) {
                    this.props.performAction(action, pam);
                }
            }
        };
        this.onLabelKeyDown = (event) => {
            const { keyCode } = event;
            if (keyCode === 13) {
                const input = event.target;
                const { value } = input;
                const { pam } = this.props;
                const nodeIDs = ArboretumChat_1.ArboretumChat.getRelevantNodeIDs(pam.action);
                if (this.props.addLabel) {
                    this.props.addLabel(nodeIDs, value, pam.action.tabID, pam.nodeDescriptions);
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
        const { action, state, sender } = pam;
        const { data } = action;
        const pageActionDescription = ArboretumChat_1.ArboretumChat.describePageAction(action);
        const messageActions = ArboretumChat_1.ArboretumChat.getActions(pam, this.props.isAdmin).map((action) => {
            const description = ArboretumChat_1.ArboretumChat.getActionDescription(action);
            return React.createElement("a", { key: action, href: "javascript:void(0)", onClick: () => this.performAction(action, pam) }, description);
        });
        const stateDescription = ArboretumChat_1.ArboretumChat.getStateDescription(pam);
        const labelInput = React.createElement("input", { onKeyDown: this.onLabelKeyDown, ref: (el) => { if (el) {
                el.focus();
            } }, type: "text" });
        const messageText = `${sender.displayName} wants to ${pageActionDescription}`;
        return React.createElement("li", { onMouseEnter: () => this.addHighlights(pam), onMouseLeave: () => this.removeHighlights(pam), tabIndex: 0, "aria-label": messageText, className: 'chat-line action ' + stateDescription },
            React.createElement("span", { style: { color: sender.color }, className: 'from' }, sender.displayName),
            " wants to ",
            pageActionDescription,
            ".",
            React.createElement("div", { className: 'messageState' }, stateDescription),
            React.createElement("div", { className: 'messageActions' }, messageActions),
            this.state.labeling ? labelInput : null);
    }
    ;
}
exports.PageActionMessageDisplay = PageActionMessageDisplay;
;
