import * as React from 'react';

require('./BrowserNavigationBar.scss');

const ENTER_KEY:number = 13;

type BrowserNavigationBarProps = {
    onBack:()=>void,
    onForward:()=>void,
    onReload:()=>void,
    onToggleSidebar?:()=>void,
    onNavigate:(url:string)=>void,
    showSidebarToggle:boolean
};
type BrowserNavigationBarState = {
    urlText:string,
    canGoBack:boolean,
    canGoForward:boolean,
    isLoading:boolean,
    urlBarFocused:boolean
};

export class BrowserNavigationBar extends React.Component<BrowserNavigationBarProps, BrowserNavigationBarState> {
    constructor(props) {
        super(props);
        this.state = {
            urlText:'',
            canGoBack:false,
            canGoForward:false,
            isLoading:false,
            urlBarFocused:false
        };
    };

    private handleURLChange = (event:React.ChangeEvent<HTMLInputElement>):void => {
        this.setState({ urlText:event.target.value });
    };

    private backClicked = ():void => {
        if(this.props.onBack) { this.props.onBack(); }
    };

    private forwardClicked = ():void => {
        if(this.props.onForward) { this.props.onForward(); }
    };

    private reloadClicked = ():void => {
        if(this.props.onReload) { this.props.onReload(); }
    };

    private toggleSidebarClicked = ():void => {
        if(this.props.onToggleSidebar) { this.props.onToggleSidebar(); }
    };

    private urlKeyDown = (event:React.KeyboardEvent<HTMLInputElement>):void => {
        const {keyCode} = event;
        if(keyCode === ENTER_KEY) { // Enter
            const {urlText} = this.state;
            if(this.props.onNavigate) { this.props.onNavigate(urlText); }
        }
    };

    private onURLBarFocus = (event:React.FocusEvent<HTMLInputElement>):void => {
        this.setState({urlBarFocused: true});
    };
    private onURLBarBlur = (event:React.FocusEvent<HTMLInputElement>):void => {
        this.setState({urlBarFocused: false});
    };

    public render():React.ReactNode {
        const toggleSidebarButton = this.props.showSidebarToggle ? <button onClick={this.toggleSidebarClicked} className = 'btn btn-default btn-mini' id='task'><span className='icon icon-publish'></span></button> : null;
        return <div className="toolbar toolbar-header" id="navBar">
                    <div className="toolbar-actions">
                        <div className="btn-group">
                            <button aria-label="Back" disabled={!this.state.canGoBack} onClick={this.backClicked} className = 'btn btn-default btn-mini' id='back'><span className='icon icon-left-open-big'></span></button>
                            <button aria-label="Forward" disabled={!this.state.canGoForward} onClick={this.forwardClicked} className = 'btn btn-default btn-mini' id='forward'><span className='icon icon-right-open-big'></span></button>
                        </div>
                        <button aria-label="Refresh/Stop" onClick={this.reloadClicked} className = 'btn btn-default btn-mini' id='reload'><span className={`icon ${this.state.isLoading ? 'icon-cancel' : 'icon-ccw'}`}></span></button>
                        {toggleSidebarButton}
                    </div>
                    <input aria-label="URL" value={this.state.urlText} onChange={this.handleURLChange} onKeyDown={this.urlKeyDown} onFocus={this.onURLBarFocus} onBlur={this.onURLBarBlur} id='url' type="text" placeholder="Enter URL or Term to Search" />
                </div>;
    };
};
