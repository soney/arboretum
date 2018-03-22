import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserTab} from './BrowserTab';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';
import * as url from 'url';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import Switch from 'react-switch';
import * as ShareDB from 'sharedb';
import {BrowserDoc} from '../../utils/state_interfaces';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage} from '../../utils/ArboretumChat';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';
import {} from './ArboretumAdminInterface';

export type BrowserTabID = number;

type ArboretumProps = {
    urls:Array<string>
};
type ArboretumState = {
    tabs:Array<{url:string, id:number, selected:boolean}>,
    webViews:Array<JSX.Element>,
    selectedTab:BrowserTab,
    serverActive:boolean
};

export class ArboretumBrowser extends React.Component<ArboretumProps, ArboretumState> {
    private navBar:BrowserNavigationBar;
    private tabCounter:number = 0;
    private tabs:Map<BrowserTabID, BrowserTab> = new Map<BrowserTabID, BrowserTab>();
    private socket:WebSocket;
    private sdb:SDB;
    private doc:SDBDoc<BrowserDoc>;
    private chatbox:ArboretumChatBox;
    private shareURLElement:HTMLInputElement;
    private static defaultProps:ArboretumProps = {
        urls:[]
    };
    constructor(props) {
        super(props);
        this.state = {
            tabs: [],
            webViews: [],
            selectedTab:null,
            serverActive:false
        };
        ipcRenderer.on('server-active', (event:Electron.IpcMessageEvent, data:any) => {
            this.setServerActive(data.active);
        });
        ipcRenderer.on('focusWebview', () => {
            const {selectedTab} = this.state;
            if(selectedTab) {
                const {webView} = selectedTab;
                if(webView) {
                    webView.focus();
                }
            }
        });
    };

    public componentDidMount():void {
        this.props.urls.forEach((url, index) => {
            this.addTab(url);
        });
    };

    private goBack = ():void => {
        const {selectedTab} = this.state;
        if(selectedTab) { selectedTab.goBack(); }
    };
    private goForward = ():void => {
        const {selectedTab} = this.state;
        if(selectedTab) { selectedTab.goForward(); }
    };
    private reload = ():void => {
        const {selectedTab} = this.state;
        if(selectedTab) { selectedTab.reload(); }
    };
    private toggleSidebar = ():void => {
    };
    private navigate = (url:string):void => {
        const {selectedTab} = this.state;
        if(selectedTab) { selectedTab.navigate(url); }
    };
    private navBarRef = (el:BrowserNavigationBar):void => {
        this.navBar = el;
        this.updateNavBarState();
    };
    private updateNavBarState():void {
        const {selectedTab} = this.state;
        if(selectedTab && this.navBar) {
            const {canGoBack, canGoForward, isLoading, loadedURL} = selectedTab.state;
            this.navBar.setState({canGoBack, canGoForward, isLoading});
            if(!this.navBar.state.urlBarFocused) {
                this.navBar.setState({urlText:loadedURL});
            }
        }
    };
    private static ipcMessageID:number = 0;
    private async sendIPCMessage(message:{message:string, data?:any}):Promise<any> {
        const messageID:number = ArboretumBrowser.ipcMessageID++;
        const replyChannel:string = `reply-${messageID}`;
        ipcRenderer.send('asynchronous-message', messageID, message);
        const reply = await new Promise<any>((resolve, reject) => {
            ipcRenderer.once(replyChannel, (event:Electron.IpcMessageEvent, data:any) => {
                resolve(data);
            });
        });
        return reply;
    };
    private setServerActive = async (active:boolean):Promise<void> => {
        let shareURL:string, adminURL:string;
        if(active) {
            const {hostname, port} = await this.sendIPCMessage({message: 'startServer'});
            const wsAddress = url.format({ protocol:'ws', hostname, port });
            this.socket = new WebSocket(wsAddress);
            this.sdb = new SDB(true, this.socket);
            this.doc = this.sdb.get<BrowserDoc>('arboretum', 'browser');
            this.doc.subscribe((ops?:Array<ShareDB.Op>, source?:boolean, data?:BrowserDoc) => {
                const {tabs} = data;
                const tabObjects:Array<CRI.TabInfo> = _.values(data.tabs);
                const unmatchedTabIDs:Set<CRI.TabID> = new Set<CRI.TabID>(tabObjects.map((t) => t.id));
                const unmatchedTabs:Set<BrowserTab> = new Set<BrowserTab>(this.tabs.values());
                unmatchedTabs.forEach((tab:BrowserTab) => {
                    if(tab.hasSDBTabID()) {
                        unmatchedTabs.delete(tab);
                        unmatchedTabIDs.delete(tab.getSDBTabID());
                    }
                });

                if(unmatchedTabIDs.size === 1 && unmatchedTabs.size === 1) {
                    const tabID:CRI.TabID = Array.from(unmatchedTabIDs.values())[0];
                    const tab:BrowserTab = Array.from(unmatchedTabs.values())[0];
                    tab.setSDBTabID(tabID);
                }
            });
        } else {
            if(this.doc) {
                this.doc.destroy();
            }
            if(this.sdb) {
                await this.sdb.close();
                this.sdb = null;
            }
            if(this.socket) {
                this.socket.close();
                this.socket = null;
            }
        }
        if(this.chatbox) {
            this.chatbox.setSDB(this.sdb);
        }
    };
    private async getShortcut(url:string):Promise<string> {
        return url;
    };
    private postTask(sandbox:boolean):void {
        console.log('post task', sandbox);
    };
    private selectedTabURLChanged = (url:string):void => { this.updateNavBarState(); };
    private selectedTabLoadingChanged = (isLoading:boolean):void => { this.updateNavBarState(); };
    private selectedTabCanGoBackChanged = (canGoBack:boolean):void => { this.updateNavBarState(); };
    private selectedTabCanGoForwardChanged = (canGoForward:boolean):void => { this.updateNavBarState(); };
    private selectedTabPageTitleChanged = (title:string):void => {
        if(!title) {
            title='Arboretum';
        }
        document.title = title;
    };
    private addTab = (url:string='http://www.umich.edu', selected:boolean=true):void => {
        const id:number = this.tabCounter++;
        if(selected) {
            this.tabs.forEach((t) => {
                t.markSelected(false);
            });
        }
        const tabs = this.state.tabs.map((tab) => {
            const wasSelected = tab.selected;
            return _.extend(tab, {selected: (selected?false:wasSelected)});
        }).concat([{ url,selected,id }]);
        this.setState({tabs}, () => {
            this.updateWebViews();
        });
    };

    private updateWebViews():void {
        const webViews:Array<JSX.Element> = this.state.tabs.map((tab) => {
            const {id} = tab;
            if(this.tabs.has(id)) {
                const arboretumTab = this.tabs.get(id);
                return arboretumTab.webViewEl;
            } else {
                return null;
            }
        });
        this.setState({webViews});
    };

    private selectTab = (selectedTab:BrowserTab):void => {
        if(selectedTab !== this.state.selectedTab) {
            const tabID = selectedTab.getTabID();
            this.tabs.forEach((t) => {
                t.markSelected(t===selectedTab);
            });
            this.setState({selectedTab}, () => {
                this.updateNavBarState();
                if(this.state.selectedTab) {
                    this.selectedTabPageTitleChanged(selectedTab.state.title);
                }
            });
            this.updateWebViews();
        }
    };

    private closeTab = (tab:BrowserTab):void => {
        let selectedTab:BrowserTab = this.state.selectedTab;
        if(tab === this.state.selectedTab) {
            const tabIndex:number = this.state.tabs.map((t) => t.id).indexOf(tab.props.tabID);
            if(this.state.tabs.length === 1) { // was the only tab
                selectedTab = null;
            } else if(tabIndex === this.state.tabs.length-1) {
                selectedTab = this.tabs.get(this.state.tabs[tabIndex-1].id);
            } else {
                selectedTab = this.tabs.get(this.state.tabs[tabIndex+1].id);
            }
        }

        this.tabs.delete(tab.props.tabID);
        const tabs = this.state.tabs.filter((tabInfo) => tabInfo.id !== tab.props.tabID);
        this.setState({tabs}, () => {
            this.selectTab(selectedTab);
            this.updateWebViews();
        });
    };

    private tabRef = (el:BrowserTab):void => {
        if(el) {
            this.tabs.set(el.props.tabID, el);
            if(el.state.selected) {
                this.setState({selectedTab:el});
            }
            // setTimeout(() => {
            //     this.selectTab(el);
            //     this.updateWebViews();
            // }, 7000);
        }
    };

    private tabIsLoadingChanged = (tab:BrowserTab, isLoading:boolean):void => {
        if(tab === this.state.selectedTab) { this.selectedTabLoadingChanged(isLoading); }
    };
    private tabCanGoBackChanged = (tab:BrowserTab, canGoBack:boolean):void => {
        if(tab === this.state.selectedTab) { this.selectedTabCanGoBackChanged(canGoBack); }
    };
    private tabCanGoForwardChanged = (tab:BrowserTab, canGoForward:boolean):void => {
        if(tab === this.state.selectedTab) { this.selectedTabCanGoBackChanged(canGoForward); }
    };
    private tabURLChanged = (tab:BrowserTab, url:string):void => {
        if(tab === this.state.selectedTab) { this.selectedTabURLChanged(url); }
    };
    private pageTitleChanged = (tab:BrowserTab, title:string):void => {
        if(tab === this.state.selectedTab) { this.selectedTabPageTitleChanged(title); }
    };

    public render():React.ReactNode {
        const tabs = this.state.tabs.map((info, index) =>
                        <BrowserTab sdb={this.sdb} ref={this.tabRef} selected={info.selected} key={info.id} tabID={info.id} startURL={info.url} onSelect={this.selectTab} onClose={this.closeTab} pageTitleChanged={this.pageTitleChanged} urlChanged={this.tabURLChanged} isLoadingChanged={this.tabIsLoadingChanged} canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} />);
        return <div className="window">
                <div id="tabsBar" className="tab-group">
                    <div id='buttonSpacer' className="tab-item tab-item-fixed"> </div>
                    {tabs}
                    <div onClick={()=>this.addTab()} className="tab-item tab-item-fixed" id='addTab'>
                        <span className="icon icon-plus"></span>
                    </div>
                </div>
            <header>
                <BrowserNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} showSidebarToggle={false} onToggleSidebar={this.toggleSidebar} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group">
                    <div id="browser-pane" className="pane">
                        <div id="content">{this.state.webViews}</div>
                    </div>
                </div>
            </div>
        </div>;
    };
};
