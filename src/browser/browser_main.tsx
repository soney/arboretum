import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumNavigationBar} from './ts/nav_bar';
import {ArboretumTab} from './ts/tab';
import {ArboretumSidebar, SetServerActiveValue} from './ts/sidebar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';
import * as url from 'url';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../utils/sharedb_wrapper';
import {ArboretumChat} from '../utils/chat_doc';

export type BrowserTabID = number;

type ArboretumProps = {
    urls:Array<string>
};
type ArboretumState = {
    tabs:Array<{url:string, id:number, selected:boolean}>,
    webViews:Array<JSX.Element>,
    selectedTab:ArboretumTab,
    showingSidebar:boolean,
    serverActive:boolean,
    activeWebViewEl:JSX.Element
};

export class Arboretum extends React.Component<ArboretumProps, ArboretumState> {
    private navBar:ArboretumNavigationBar;
    private sidebar:ArboretumSidebar;
    private tabCounter:number = 0;
    private tabs:Map<BrowserTabID, ArboretumTab> = new Map<BrowserTabID, ArboretumTab>();
    private socket:WebSocket;
    private sdb:SDB;
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
            serverActive:false,
            activeWebViewEl:null
        };
        this.updateWebViews();
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
    private navBarRef = (el:ArboretumNavigationBar):void => {
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
        if(active) {
            const {hostname, port} = await this.sendIPCMessage('startServer');
            const fullShareURL = url.format({ protocol:'http', hostname, port });
            const fullAdminURL = url.format({ protocol:'http', hostname, port, pathname:'/admin' });
            const wsAddress = url.format({ protocol:'ws', hostname, port });
            this.socket = new WebSocket(wsAddress);
            this.sdb = new SDB(true, this.socket);

            const [shareURL, adminURL] = await Promise.all([
                this.getShortcut(fullShareURL), this.getShortcut(fullAdminURL)
            ]);
            return {shareURL, adminURL};
        } else {
            if(this.sdb) {
                await this.sdb.close();
                this.sdb = null;
            }
            if(this.socket) {
                this.socket.close();
                this.socket = null;
            }
            await this.sendIPCMessage('stopServer');
            return {
                shareURL:'',
                adminURL:''
            };
        }
    };
    private async getShortcut(url:string):Promise<string> {
        return url;
    };
    private sendMessage(message:string):void {
        console.log('send message', message);
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

    private selectTab = (selectedTab:ArboretumTab):void => {
        if(selectedTab !== this.state.selectedTab) {
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

    private closeTab = (tab:ArboretumTab):void => {
        let selectedTab:ArboretumTab = this.state.selectedTab;
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

    private tabRef = (el:ArboretumTab):void => {
        if(el) {
            this.tabs.set(el.props.tabID, el);
            this.selectTab(el);
            this.updateWebViews();
        }
    };

    private tabIsLoadingChanged = (tab:ArboretumTab, isLoading:boolean):void => {
        if(tab === this.state.selectedTab) { this.selectedTabLoadingChanged(isLoading); }
    };
    private tabCanGoBackChanged = (tab:ArboretumTab, canGoBack:boolean):void => {
        if(tab === this.state.selectedTab) { this.selectedTabCanGoBackChanged(canGoBack); }
    };
    private tabCanGoForwardChanged = (tab:ArboretumTab, canGoForward:boolean):void => {
        if(tab === this.state.selectedTab) { this.selectedTabCanGoBackChanged(canGoForward); }
    };
    private tabURLChanged = (tab:ArboretumTab, url:string):void => {
        if(tab === this.state.selectedTab) { this.selectedTabURLChanged(url); }
    };
    private pageTitleChanged = (tab:ArboretumTab, title:string):void => {
        if(tab === this.state.selectedTab) { this.selectedTabPageTitleChanged(title); }
    };
    private sidebarRef = (sidebar:ArboretumSidebar):void => {
        this.sidebar = sidebar;
    };

    public render():React.ReactNode {
        const tabs = this.state.tabs.map((info, index) =>
                        <ArboretumTab ref={this.tabRef} selected={info.selected} key={info.id} tabID={info.id} startURL={info.url} onSelect={this.selectTab} onClose={this.closeTab} pageTitleChanged={this.pageTitleChanged} urlChanged={this.tabURLChanged} isLoadingChanged={this.tabIsLoadingChanged} canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} />);
        return <div className="window">
            <header className="toolbar toolbar-header">
                <div id="tabsBar" className="tab-group">
                    <div id='buttonSpacer' className="tab-item tab-item-fixed"> </div>
                    {tabs}
                    <div onClick={this.addTab} className="tab-item tab-item-fixed" id='addTab'>
                        <span className="icon icon-plus"></span>
                    </div>
                </div>
                <ArboretumNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} onToggleSidebar={this.toggleSidebar} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group">
                    <ArboretumSidebar ref={this.sidebarRef} onSendMessage={this.sendMessage} setServerActive={this.setServerActive} isVisible={this.state.showingSidebar} serverActive={this.state.serverActive} onPostTask={this.postTask}/>
                    <div id="browser-pane" className="pane">
                        <div id="content">{this.state.webViews}</div>
                    </div>
                </div>
            </div>
        </div>;
    };
};

ReactDOM.render(
    <Arboretum urls={['http://www.umich.edu/']} />,
    document.getElementById('arboretum_main')
);
