import * as $ from 'jquery';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ClientTab} from './ClientTab';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageAction} from '../../utils/ArboretumChat';
import {TabList} from './TabList';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

type ArboretumClientProps = {
    wsAddress?:string,
    userID?:string,
    frameID?:string,
    tabID?:string,
    viewType?:string
};
type ArboretumClientState = {
    showControls:boolean
};

export class ArboretumClient extends React.Component<ArboretumClientProps, ArboretumClientState> {
    private sdb:SDB;
    private tabID:CRI.TabID;
    private socket:WebSocket;
    private clientTab:ClientTab;
    private navBar:BrowserNavigationBar;
    private arboretumChat:ArboretumChatBox;

    protected static defaultProps:ArboretumClientProps = {
        wsAddress: `ws://${window.location.hostname}:${window.location.port}`
    };

    constructor(props) {
        super(props);
        this.state = {
            showControls: !this.props.frameID
        };
        this.socket = new WebSocket(this.props.wsAddress);
        this.sdb = new SDB(true, this.socket);
    };
    public componentWillUnmount():void {
        this.sdb.close();
    };
    private onSelectTab = (tabID:CRI.TabID):void => {
        this.tabID = tabID;
        if(this.clientTab) {
            this.clientTab.setTabID(this.tabID);
        }
    };
    private clientTabRef = (clientTab:ClientTab):void => {
        this.clientTab = clientTab;
        if(this.tabID) {
            this.clientTab.setTabID(this.tabID);
        }
        this.clientTab.pageAction.addListener((event:{pa:PageAction,data:any}) => {
            const chat = this.getChat();
            const {pa, data} = event;
            chat.addPageActionMessage(pa, data);
        });
    };
    private navBarRef = (navBar:BrowserNavigationBar):void => {
        this.navBar = navBar;
    };
    private chatRef = (arboretumChat:ArboretumChatBox):void => {
        this.arboretumChat = arboretumChat;
    };
    private goBack = ():void => {
        this.getChat().addPageActionMessage('goBack', {});
    };
    private goForward = ():void => {
        this.getChat().addPageActionMessage('goForward', {});
    };
    private reload = ():void => {
        this.getChat().addPageActionMessage('reload', {});
    };
    private navigate = (url:string):void => {
        this.getChat().addPageActionMessage('navigate', {url, tabID:this.tabID});
    };
    private tabIsLoadingChanged = (tab:ClientTab, isLoading:boolean):void => {
        if(this.navBar) { this.navBar.setState({isLoading}); }
    };
    private tabCanGoBackChanged = (tab:ClientTab, canGoBack:boolean):void => {
        if(this.navBar) { this.navBar.setState({canGoBack}); }
    };
    private tabCanGoForwardChanged = (tab:ClientTab, canGoForward:boolean):void => {
        if(this.navBar) { this.navBar.setState({canGoForward}); }
    };
    private tabURLChanged = (tab:ClientTab, url:string):void => {
        if(this.navBar) { this.navBar.setState({urlText: url}); }
    };
    private pageTitleChanged = (tab:ClientTab, title:string):void => { };
    private getChat():ArboretumChat { return this.arboretumChat.getChat(); }

    public render():React.ReactNode {
        const {showControls} = this.state;
        return <div className="window" id="arboretum_client">
            <TabList sdb={this.sdb} onSelectTab={this.onSelectTab} />
            <header>
                <BrowserNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} showSidebarToggle={false} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group" id="client_body">
                    <div className="pane-sm sidebar" id="client_sidebar">
                        <ArboretumChatBox isAdmin={false} ref={this.chatRef} sdb={this.sdb} username="Steve" />
                    </div>
                    <div className="pane" id="client_content">
                        <ClientTab canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} urlChanged={this.tabURLChanged} titleChanged={this.pageTitleChanged} isLoadingChanged={this.tabIsLoadingChanged} tabID={this.props.tabID} frameID={this.props.frameID} ref={this.clientTabRef} sdb={this.sdb} />
                    </div>
                </div>
            </div>
        </div>;
    };
};
