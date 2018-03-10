import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserTab} from './BrowserTab';
import {BrowserSidebar, SetServerActiveValue} from './BrowserSidebar';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';
import * as url from 'url';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ArboretumChat} from '../../utils/ArboretumChat';
import {BrowserDoc} from '../../utils/state_interfaces';

export type BrowserTabID = number;

type ArboretumProps = {
    urls:Array<string>,
    serverState:"active" | "idle"
};
type ArboretumState = {
    tabs:Array<{url:string, id:number, selected:boolean}>,
    webViews:Array<JSX.Element>,
    selectedTab:BrowserTab,
    showingSidebar:boolean,
    serverActive:boolean,
    shareURL:string,
    adminURL:string,
    activeWebViewEl:JSX.Element
};

export class ArboretumBrowser extends React.Component<ArboretumProps, ArboretumState> {
    private navBar:BrowserNavigationBar;
    private sidebar:BrowserSidebar;
    private tabCounter:number = 0;
    private tabs:Map<BrowserTabID, BrowserTab> = new Map<BrowserTabID, BrowserTab>();
    private socket:WebSocket;
    private sdb:SDB;
    private doc:SDBDoc<BrowserDoc>;
    constructor(props) {
        super(props);
        this.state = {
            tabs: this.props.urls.map((url, index) => {
                return {
                    selected: index===0,
                    id: this.tabCounter++,
                    url: url
                };
            }),
            webViews: [],
            selectedTab:null,
            showingSidebar:false,
            serverActive:this.props.serverState === "active",
            activeWebViewEl:null,
            shareURL: '',
            adminURL: ''
        };
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
    private async sendIPCMessage(message:any):Promise<any> {
        ipcRenderer.send('asynchronous-message', message);
        const reply = await new Promise<any>((resolve, reject) => {
            ipcRenderer.once('asynchronous-reply', (event:Electron.IpcMessageEvent, data:any) => {
                resolve(data);
            });
        });
        return reply;
    };
    private setServerActive = async (active:boolean):Promise<SetServerActiveValue> => {
        let shareURL:string, adminURL:string;
        if(active) {
            const {hostname, port} = await this.sendIPCMessage('startServer');
            const fullShareURL = url.format({ protocol:'http', hostname, port });
            const fullAdminURL = url.format({ protocol:'http', hostname, port, pathname:'/admin' });
            const wsAddress = url.format({ protocol:'ws', hostname, port });
            this.socket = new WebSocket(wsAddress);
            this.sdb = new SDB(true, this.socket);
            this.doc = this.sdb.get<BrowserDoc>('arboretum', 'browser');

            if(this.sidebar) {
                this.sidebar.setSDB(this.sdb);
            }

            [shareURL, adminURL] = await Promise.all([
                this.getShortcut(fullShareURL), this.getShortcut(fullAdminURL)
            ]);
        } else {
            if(this.doc) {
                this.doc.destroy();
            }
            if(this.sidebar) {
                this.sidebar.setSDB(null);
            }
            if(this.sdb) {
                await this.sdb.close();
                this.sdb = null;
            }
            if(this.socket) {
                this.socket.close();
                this.socket = null;
            }
            await this.sendIPCMessage('stopServer');
            [shareURL, adminURL] = ['', ''];
        }
        if(this.sidebar) {
            this.sidebar.setState({shareURL, adminURL});
        }
        this.setState({shareURL, adminURL});
        return {shareURL, adminURL};
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
    private addTab = ():void => {
        const tabs = this.state.tabs.map((tab) => {
            return _.extend(tab, {selected: false});
        }).concat([{
            id: this.tabCounter++,
            url:'http://www.cmu.edu/',
            selected: false
        }]);
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
                const isSelected = t===selectedTab;
                t.markSelected(isSelected);
                if(t.webView) {
                    t.webView.setAttribute('class', isSelected?'':'hidden');
                }
            });
            const activeWebViewEl = selectedTab ? selectedTab.webViewEl : null;
            this.setState({selectedTab, activeWebViewEl}, () => {
                this.updateNavBarState();
                if(this.state.selectedTab) {
                    this.selectedTabPageTitleChanged(selectedTab.state.title);
                }
            });
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
            this.selectTab(el);
            this.updateWebViews();
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
    private sidebarRef = (sidebar:BrowserSidebar):void => {
        this.sidebar = sidebar;
        this.setServerActive(this.state.serverActive);
    };

    public render():React.ReactNode {
        const tabs = this.state.tabs.map((info, index) =>
                        <BrowserTab ref={this.tabRef} selected={info.selected} key={info.id} tabID={info.id} startURL={info.url} onSelect={this.selectTab} onClose={this.closeTab} pageTitleChanged={this.pageTitleChanged} urlChanged={this.tabURLChanged} isLoadingChanged={this.tabIsLoadingChanged} canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} />);
        return <div className="window">
            <header className="toolbar toolbar-header">
                <div id="tabsBar" className="tab-group">
                    <div id='buttonSpacer' className="tab-item tab-item-fixed"> </div>
                    {tabs}
                    <div onClick={this.addTab} className="tab-item tab-item-fixed" id='addTab'>
                        <span className="icon icon-plus"></span>
                    </div>
                </div>
                <BrowserNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} showSidebarToggle={false} onToggleSidebar={this.toggleSidebar} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group">
                    <BrowserSidebar shareURL={this.state.shareURL} adminURL={this.state.adminURL} ref={this.sidebarRef} setServerActive={this.setServerActive} isVisible={this.state.showingSidebar} serverActive={this.state.serverActive} onPostTask={this.postTask}/>
                    <div id="browser-pane" className="pane">
                        <div id="content">{this.state.webViews}</div>
                    </div>
                </div>
            </div>
        </div>;
    };
};
