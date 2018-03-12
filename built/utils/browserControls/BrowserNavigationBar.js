"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
require('./BrowserNavigationBar.scss');
const ENTER_KEY = 13;
class BrowserNavigationBar extends React.Component {
    constructor(props) {
        super(props);
        this.handleURLChange = (event) => {
            this.setState({ urlText: event.target.value });
        };
        this.backClicked = () => {
            if (this.props.onBack) {
                this.props.onBack();
            }
        };
        this.forwardClicked = () => {
            if (this.props.onForward) {
                this.props.onForward();
            }
        };
        this.reloadClicked = () => {
            if (this.props.onReload) {
                this.props.onReload();
            }
        };
        this.toggleSidebarClicked = () => {
            if (this.props.onToggleSidebar) {
                this.props.onToggleSidebar();
            }
        };
        this.urlKeyDown = (event) => {
            const { keyCode } = event;
            if (keyCode === ENTER_KEY) {
                const { urlText } = this.state;
                if (this.props.onNavigate) {
                    this.props.onNavigate(urlText);
                }
            }
        };
        this.onURLBarFocus = (event) => {
            this.setState({ urlBarFocused: true });
        };
        this.onURLBarBlur = (event) => {
            this.setState({ urlBarFocused: false });
        };
        this.state = {
            urlText: '',
            canGoBack: false,
            canGoForward: false,
            isLoading: false,
            urlBarFocused: false
        };
    }
    ;
    render() {
        const toggleSidebarButton = this.props.showSidebarToggle ? React.createElement("button", { onClick: this.toggleSidebarClicked, className: 'btn btn-default btn-mini', id: 'task' },
            React.createElement("span", { className: 'icon icon-publish' })) : null;
        return React.createElement("div", { className: "toolbar toolbar-header", id: "navBar" },
            React.createElement("div", { className: "toolbar-actions" },
                React.createElement("div", { className: "btn-group" },
                    React.createElement("button", { disabled: !this.state.canGoBack, onClick: this.backClicked, className: 'btn btn-default btn-mini', id: 'back' },
                        React.createElement("span", { className: 'icon icon-left-open-big' })),
                    React.createElement("button", { disabled: !this.state.canGoForward, onClick: this.forwardClicked, className: 'btn btn-default btn-mini', id: 'forward' },
                        React.createElement("span", { className: 'icon icon-right-open-big' }))),
                React.createElement("button", { onClick: this.reloadClicked, className: 'btn btn-default btn-mini', id: 'reload' },
                    React.createElement("span", { className: `icon ${this.state.isLoading ? 'icon-cancel' : 'icon-ccw'}` })),
                toggleSidebarButton),
            React.createElement("input", { value: this.state.urlText, onChange: this.handleURLChange, onKeyDown: this.urlKeyDown, onFocus: this.onURLBarFocus, onBlur: this.onURLBarBlur, id: 'url', type: "text", placeholder: "Enter URL or Term to Search" }));
    }
    ;
}
exports.BrowserNavigationBar = BrowserNavigationBar;
;
