import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserTab} from './BrowserTab';
import {BrowserSidebar, SetServerActiveValue} from './BrowserSidebar';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';
import * as url from 'url';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import Switch from 'react-switch';
import * as ShareDB from 'sharedb';
import {BrowserDoc} from '../../utils/state_interfaces';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage} from '../../utils/ArboretumChat';
import {copyToClipboard} from '../../utils/copyToClipboard';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';

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
    activeWebViewEl:JSX.Element,
    sandbox:boolean
};

export class ArboretumBrowser extends React.Component<ArboretumProps, ArboretumState> {
    private navBar:BrowserNavigationBar;
    private sidebar:BrowserSidebar;
    private tabCounter:number = 0;
    private tabs:Map<BrowserTabID, BrowserTab> = new Map<BrowserTabID, BrowserTab>();
    private socket:WebSocket;
    private sdb:SDB;
    private doc:SDBDoc<BrowserDoc>;
    private chatbox:ArboretumChatBox;
    private shareURLElement:HTMLInputElement;
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
            adminURL: '',
            sandbox: true
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
    private setServerActive = async (active:boolean):Promise<SetServerActiveValue> => {
        let shareURL:string, adminURL:string;
        if(active) {
            const {hostname, port} = await this.sendIPCMessage({message: 'startServer'});
            const fullShareURL = url.format({ protocol:'http', hostname, port });
            const fullAdminURL = url.format({ protocol:'http', hostname, port, pathname:'/admin' });
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
            await this.sendIPCMessage({message: 'stopServer'});
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
    public setSidebarVisible(showingSidebar:boolean):void {
        this.setState({showingSidebar});
    };
    private handleServerSwitchChange = async (serverActive:boolean):Promise<void> => {
        this.setState({serverActive});
        const shareURLs = await this.setServerActive(serverActive);
        if(serverActive) {
            const {shareURL, adminURL} = shareURLs;
            this.setState({shareURL, adminURL});
        } else {
            this.setState({shareURL:'', adminURL:''});
        }
    };
    private sendMessage = (message:string):void => {
    };
    private postToMTurk = ():void => {
        console.log('post');
    };
    private onSandboxChange = (event:React.ChangeEvent<HTMLInputElement>) => {
        this.setState({sandbox: event.target.checked});
    };
    // private adminURLRef = (el:HTMLInputElement):void => {
    //     if(el) {
    //         new Clipboard(el);
    //     }
    // };
    private shareURLRef = (el:HTMLInputElement):void => {
        this.shareURLElement = el;
        // if(el) {
        //     new Clipboard(el);
        // }
    };
    private chatBoxRef = (chatbox:ArboretumChatBox):void => {
        this.chatbox = chatbox;
    };

    public setSDB(sdb:SDB):void {
        if(this.chatbox) {
            this.chatbox.setSDB(sdb);
        }
    };
    private onAction = async (pam:PageActionMessage):Promise<void> => {
        await this.sendIPCMessage({
            message:'performAction',
            data:pam
        });
    };
    private selectShareURL = ():void => {
        this.shareURLElement.select();
        this.shareURLElement.focus();
    };
    private copyShareURL = ():void => {
        copyToClipboard(this.shareURLElement.value);
    };
    private addHighlight = (nodeIds:Array<CRI.NodeID>, color:string):void => {
        console.log(nodeIds, color);
    };
    private removeHighlight = (nodeIds:Array<CRI.NodeID>):void => {
        console.log(nodeIds);
    };

    public render():React.ReactNode {
        const tabs = this.state.tabs.map((info, index) =>
                        <BrowserTab sdb={this.sdb} ref={this.tabRef} selected={info.selected} key={info.id} tabID={info.id} startURL={info.url} onSelect={this.selectTab} onClose={this.closeTab} pageTitleChanged={this.pageTitleChanged} urlChanged={this.tabURLChanged} isLoadingChanged={this.tabIsLoadingChanged} canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} />);
        return <div className="window">
                <div id="tabsBar" className="tab-group">
                    <div id='buttonSpacer' className="tab-item tab-item-fixed"> </div>
                    {tabs}
                    <div onClick={this.addTab} className="tab-item tab-item-fixed" id='addTab'>
                        <span className="icon icon-plus"></span>
                    </div>
                </div>
            <header>
                <BrowserNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} showSidebarToggle={false} onToggleSidebar={this.toggleSidebar} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group">
                    <div className='sidebar'>
                        <table id="server-controls">
                            <thead>
                                <tr>
                                    <td>
                                        <h5 className="nav-group-title">Server</h5>
                                    </td>
                                    <td>
                                        <h5 className="nav-group-title">Share URL</h5>
                                    </td>
                                    {/* <td>
                                        <h5 className="nav-group-title">Admin URL</h5>
                                    </td> */}
                                    <td>
                                        <h5 className="nav-group-title">MTurk</h5>
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr id="control_content">
                                    <td>
                                        <Switch height={24} width={48} onChange={this.handleServerSwitchChange} checked={this.state.serverActive} />
                                    </td>
                                    <td className="copy_area">
                                        <input onClick={this.selectShareURL} ref={this.shareURLRef} value={this.state.shareURL} id="share_url" data-disabled="true"/>
                                        <a href="javascript:void(0)" onClick={this.copyShareURL}><span ref={(el) => (el)} data-clipboard-target="#share_url" id="share_copy" className="icon icon-clipboard"></span></a>
                                    </td>
                                    {/* <td className="copy_area">
                                        <input ref={this.adminURLRef} value={this.state.adminURL} id="admin_url" data-disabled="true"/>
                                        <span data-clipboard-target="#admin_url" id="admin_copy" className="icon icon-clipboard"></span>
                                    </td> */}
                                    <td>
                                        <button onClick={this.postToMTurk} id="mturk_post" className='btn btn-default'><span className="icon icon-upload-cloud"></span>&nbsp;Post</button>
                                        <br />
                                        <label><input type="checkbox" name="sandbox" value="sandbox" id="sandbox" checked={this.state.sandbox} onChange={this.onSandboxChange}/> Sandbox</label>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <ArboretumChatBox isAdmin={true} username="Admin" ref={this.chatBoxRef} onSendMessage={this.sendMessage} onAction={this.onAction} onAddHighlight={this.addHighlight} onRemoveHighlight={this.removeHighlight} />
                    </div>
                    <div id="browser-pane" className="pane">
                        <div id="content">{this.state.webViews}</div>
                    </div>
                </div>
            </div>
        </div>;
    };
};
