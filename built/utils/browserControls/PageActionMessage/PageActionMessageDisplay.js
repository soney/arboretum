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
        const messageActions = ArboretumChat_1.ArboretumChat.getActions(pam, this.props.isAdmin).map((action) => {
            const description = ArboretumChat_1.ArboretumChat.getActionDescription(action);
            return React.createElement("a", { key: action, href: "javascript:void(0)", onClick: () => this.performAction(action, pam) }, description);
        });
        const stateDescription = ArboretumChat_1.ArboretumChat.getStateDescription(pam);
        const labelInput = React.createElement("input", { onKeyDown: this.onLabelKeyDown, ref: (el) => { if (el) {
                el.focus();
            } }, type: "text" });
        return React.createElement("li", { tabIndex: 0, className: 'chat-line action ' + stateDescription },
            React.createElement("span", { style: { color: pam.sender.color }, className: 'from' }, pam.sender.displayName),
            " wants to ",
            description,
            ".",
            React.createElement("div", { className: 'messageState' }, stateDescription),
            React.createElement("div", { className: 'messageActions' }, messageActions),
            this.state.labeling ? labelInput : null);
    }
    ;
}
exports.PageActionMessageDisplay = PageActionMessageDisplay;
;
