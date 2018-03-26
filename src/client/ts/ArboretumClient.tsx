import * as $ from 'jquery';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ClientTab} from './ClientTab';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageAction, PAMAction} from '../../utils/ArboretumChat';
import {TabList} from './TabList';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

type ArboretumClientProps = {
    wsAddress?:string,
    userID?:string,
    isAdmin?:boolean
};
type ArboretumClientState = {
    enteringLabel:boolean
};

export class ArboretumClient extends React.Component<ArboretumClientProps, ArboretumClientState> {
    private sdb:SDB;
    private tabID:CRI.TabID;
    private socket:WebSocket;
    private clientTab:ClientTab;
    private navBar:BrowserNavigationBar;
    private arboretumChat:ArboretumChatBox;

    protected static defaultProps:ArboretumClientProps = {
        isAdmin:false,
        wsAddress: `ws://${window.location.hostname}:${window.location.port}`
    };

    constructor(props) {
        super(props);
        this.state = {
            enteringLabel:false
        };
        this.socket = new WebSocket(this.props.wsAddress);
        this.sdb = new SDB(true, this.socket);
    };
    private static wsMessageID=1;
    private async sendWebsocketMessage(message:{message:string, data?:any}):Promise<any> {
        const messageID:number = ArboretumClient.wsMessageID++;
        const response = await new Promise((resolve, reject) => {
            const onMessage = (event) => {
                const messageData = JSON.parse(event.data);
                if(!messageData.a) {
                    const {replyID, data} = messageData;
                    if(replyID === messageID) {
                        this.socket.removeEventListener('message', onMessage);
                        resolve(data);
                    }
                }
            };
            this.socket.addEventListener('message', onMessage);
            this.socket.send(JSON.stringify(_.extend(message, {messageID})));
        });
        return response;
    };
    public async componentWillUnmount():Promise<void> {
        await this.arboretumChat.leave();
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
        this.clientTab.pageAction.addListener((action:PageAction) => {
            if(this.props.isAdmin) {
                this.sendWebsocketMessage({
                    message: 'pageAction',
                    data: {a:PAMAction.ACCEPT, action}
                });
            } else {
                const chat = this.getChat();
                chat.addPageActionMessage(action.type, this.tabID, action.data);
            }
        });
    };
    private navBarRef = (navBar:BrowserNavigationBar):void => {
        this.navBar = navBar;
    };
    private chatRef = (arboretumChat:ArboretumChatBox):void => {
        this.arboretumChat = arboretumChat;
    };
    private goBack = ():void => {
        this.getChat().addPageActionMessage('goBack', this.tabID);
    };
    private goForward = ():void => {
        this.getChat().addPageActionMessage('goForward', this.tabID);
    };
    private reload = ():void => {
        this.getChat().addPageActionMessage('reload', this.tabID);
    };
    private navigate = (url:string):void => {
        this.getChat().addPageActionMessage('navigate', this.tabID, {url});
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
    private addHighlight = (nodeIds:Array<CRI.NodeID>, color:string):void => {
        if(this.clientTab) {
            this.clientTab.addHighlight(nodeIds, color);
        }
    };
    private removeHighlight = (nodeIds:Array<CRI.NodeID>):void => {
        if(this.clientTab) {
            this.clientTab.removeHighlight(nodeIds);
        }
    };
    private onAction = (a:PAMAction, action:PageAction):void => {
        if(this.props.isAdmin) {
            this.sendWebsocketMessage({
                message: 'pageAction',
                data: {a, action}
            });
        } else {
            if(a === PAMAction.ADD_LABEL) {
                this.onLabel(action);
            }
        }
    }
    private onLabel(action:PageAction):void {
        const {tabID} = action;
        const relevantNodeIDs = ArboretumChat.getRelevantNodeIDs(action);
        if(this.clientTab) {
            // console.log(this.tabID);
            // console.log(this.clientTab.getTabID());
            if(this.clientTab.getTabID() === tabID) {
                this.setState({enteringLabel:true})
                // const domNodes = relevantNodeIDs.map((nid) => this.clientTab.getNode(nid));
                // console.log(domNodes);
            }
        }
    };

    public render():React.ReactNode {
        return <div className="window" id="arboretum_client">
            <TabList sdb={this.sdb} onSelectTab={this.onSelectTab} />
            <header>
                <BrowserNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} showSidebarToggle={false} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group" id="client_body">
                    <div className="pane-sm sidebar" id="client_sidebar">
                        <ArboretumChatBox onAction={this.onAction} onAddHighlight={this.addHighlight} onRemoveHighlight={this.removeHighlight} isAdmin={this.props.isAdmin} ref={this.chatRef} sdb={this.sdb} username="Steve" />
                    </div>
                    <div className="pane" id="client_content">
                        <ClientTab canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} urlChanged={this.tabURLChanged} titleChanged={this.pageTitleChanged} isLoadingChanged={this.tabIsLoadingChanged} ref={this.clientTabRef} sdb={this.sdb} />
                    </div>
                </div>
            </div>
        </div>;
    };
};
