import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ArboretumNavigationBar} from './ts/nav_bar';
import {ArboretumTabs} from './ts/tabs';
import {ArboretumTab} from './ts/tab';
import {ArboretumSidebar, SetServerActiveValue} from './ts/sidebar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';

type ArboretumProps = {};
type ArboretumState = {
    selectedTab:ArboretumTab,
    showingSidebar:boolean,
    serverActive:boolean
};

export class Arboretum extends React.Component<ArboretumProps, ArboretumState> {
    private navBar:ArboretumNavigationBar;
    constructor(props) {
        super(props);
        this.state = {
            selectedTab:null,
            showingSidebar:false,
            serverActive:false
        };
    };

    private goBack = ():void => {
        const {selectedTab} = this.state;
        if(selectedTab) {
            selectedTab.goBack();
        }
    };
    private goForward = ():void => {
        const {selectedTab} = this.state;
        if(selectedTab) {
            selectedTab.goForward();
        }
    };
    private reload = ():void => {
        const {selectedTab} = this.state;
        if(selectedTab) {
            selectedTab.reload();
        }
    };
    private toggleSidebar = ():void => {
    };
    private navigate = (url:string):void => {
        const {selectedTab} = this.state;
        if(selectedTab) {
            selectedTab.navigate(url);
        }
    };
    private setSelectedTab = (selectedTab:ArboretumTab):void => {
        this.setState({ selectedTab });
        this.updateNavBarState();
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
    private async setServerActive(active:boolean):Promise<SetServerActiveValue> {
        if(active) {
            ipcRenderer.send('asynchronous-message', 'startServer');
            return new Promise<SetServerActiveValue>((resolve, reject) => {
                ipcRenderer.once('asynchronous-reply', (event:Electron.IpcMessageEvent, address:string) => {
                    resolve({
                        shareURL:'google.com',
                        adminURL:'yahoo.com'
                    });
                });
            });
        } else {
            ipcRenderer.send('asynchronous-message', 'stopServer');
            return Promise.resolve({
                shareURL:'',
                adminURL:''
            });
        }
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
    private onSelectedTabCanGoForwardChanged = (canGoForward:boolean):void => { this.updateNavBarState(); };
    private async getShortcut(address:string, path:string):Promise<string> {
        return new Promise<string>((resolve, reject) => {

        });
    };
    // private async getMyShortcut(address:string, path:string):Promise<string> {
    //     const url = require('url');
    //     return Sidebar.getIPAddress().then(function(ip) {
    //         var myLink = url.format({
    //             protocol: 'http',
    //             hostname: ip,
    //             port: 3000,
    //             pathname: path || '/'
    //         });
    //         return Sidebar.getShortcut(myLink)
    //     }).then(function(result) {
    //         const shortcut = result.shortcut;
    //         return url.format({
    //             protocol: 'http',
    //             hostname: 'arbor.site',
    //             pathname: shortcut
    //         });
    //     });
    // }
    //
    // private static async getShortcut(url:string):Promise<string> {
    //     return new Promise<string>((resolve, reject) => {
    //         $.ajax({
    //             method: 'PUT',
    //             url: 'https://api.arbor.site',
    //             contentType: 'application/json',
    //             headers: {
    //                 'x-api-key': API_KEY
    //             },
    //             data: JSON.stringify({
    //                 target: url
    //             })
    //         }).done((data) => {
    //             resolve(data);
    //         }).fail((err) => {
    //             reject(err);
    //         });
    //     });
    // }

    public render():React.ReactNode {
        return <div className="window">
            <header className="toolbar toolbar-header">
                <ArboretumTabs onSelectTab={this.setSelectedTab} onSelectedTabURLChanged={this.selectedTabURLChanged} onSelectedTabLoadingChanged={this.selectedTabLoadingChanged} onSelectedTabCanGoBackChanged={this.selectedTabCanGoBackChanged} onSelectedTabCanGoForwardChanged={this.onSelectedTabCanGoForwardChanged} urls={['http://www.umich.edu/']} />
                <ArboretumNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} onToggleSidebar={this.toggleSidebar} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group">
                    <ArboretumSidebar onSendMessage={this.sendMessage} setServerActive={this.setServerActive} isVisible={this.state.showingSidebar} serverActive={this.state.serverActive} onPostTask={this.postTask}/>
                    <div id="browser-pane" className="pane">
                        <div id="content">{this.state.selectedTab ? this.state.selectedTab.webViewEl : null}</div>
                    </div>
                </div>
            </div>
        </div>;
    };
};

ReactDOM.render(
    <Arboretum />,
    document.getElementById('arboretum_main')
);

// import * as path from 'path';
// import {ipcRenderer, remote, BrowserWindow} from 'electron';
// import {Tabs} from './ts/tabs';
// import {URLBar} from './ts/url_bar';
// import {Sidebar} from './ts/sidebar';
// var $ = require('jquery'),
//     _ = require('underscore');
// require('jquery-ui');
// var path = require('path');

// export class Arboretum {
    // private browserWindow:BrowserWindow;
    // private tabs:Tabs = new Tabs(this);
    // private urlBar:URLBar = new URLBar(this);
    // private sidebar:Sidebar = new Sidebar(this);
    // constructor() {
    //     this.browserWindow = remote.getCurrentWindow();
    //     this.listen();
    //     this.tabs.createNew(`file://${path.resolve('test/simple.html')}`, true);
    // };
    // public loadURL(url:string):void {
    //     this.tabs.active.webView[0].loadURL(formattedURL);
    // };
    // public goBack():void {
    // };
    //
    // listen() {
    //     const {ipcRenderer} = require('electron');
    //     ipcRenderer.send('asynchronous-message','test');
    //     $(window).on('keydown', (e) => {
    //         if(e.which === 82 && (e.ctrlKey || e.metaKey)) { // CTRL + ALT + R
    //             if(e.altKey){
    //               location.reload();
    //             }
    //             else{
    //               e.preventDefault();
    //               window.arboretum.urlBar.refreshStop.click();
    //             }
    //         } else if((e.which === 73 && e.ctrlKey && e.shiftKey) || e.which === 123) { // F12 OR CTRL + SHIFT + I
    //             var activeTab = this.tabs.active;
    //             // if(activeTab) {
    //             //     if(activeTab.WebView.isDevToolsOpened()) {
    //             //         activeTab.WebView.closeDevTools();
    //             //     } else {
    //             //         activeTab.WebView.openDevTools();
    //             //     }
    //             // }
    //         } else if(e.which === 76 && (e.ctrlKey || e.metaKey)) {
    //             window.arboretum.urlBar.urlInput.focus();
    //         } else if((e.which === 9 && (e.ctrlKey || e.metaKey)) ||( e.which === 9)) {
    //             e.preventDefault();
    //             let tabs = window.arboretum.tabs.tabs;
    //             let selectedKey = window.arboretum.tabs.active.TabId;
    //             let Keys = Object.keys(tabs);
    //             let i = Keys.indexOf(selectedKey.toString());
    //             i++;
    //             if(i+1 > Keys.length)
    //                i = 0;
    //             window.arboretum.tabs.select(tabs[Keys[i]]);
    //         } else if(e.which === 78 && (e.ctrlKey || e.metaKey)) {
    //            e.preventDefault();
    //            const {ipcRenderer} = require('electron');
    //            console.log(ipcRenderer);
    //            ipcRenderer.send('New-Window','test');
    //         }
    //
    //     });
    //     ipcRenderer.on('asynchronous-reply',function(arg) {
    //        window.arboretum.tabs.createNew('',true);
    //     });
    //     ipcRenderer.on('TabRefId',function(event,arg) {
    //        var keys = Object.keys(window.arboretum.tabs.tabs).map(Number);
    //        var maxKey = Math.max.apply(Math,keys);
    //        window.arboretum.tabs.tabs[maxKey].RefId = arg;
    //     });
    //     ipcRenderer.on('closeTab',function(event,arg) {
    //       var theKey = _.find(Object.keys(window.arboretum.tabs.tabs),function(key) {
    //          return window.arboretum.tabs.tabs[key].RefId == arg;
    //       });
    //       window.arboretum.tabs.tabs[theKey].closeButton.click();
    //     });
    // }
// }
//
// $(function() {
//      new Arboretum();
// });
