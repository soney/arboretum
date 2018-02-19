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
    };
    private async setServerActive(active:boolean):Promise<SetServerActiveValue> {
        if(active) {
            ipcRenderer.send('asynchronous-message', 'startServer');
        } else {
            return Promise.resolve({
                shareURL:'',
                activeURL:''
            });
        }
    };
    private sendMessage(message:string):void {
        console.log('send message', message);
    };

    public render():React.ReactNode {
        return <div className="window">
            <header className="toolbar toolbar-header">
                <ArboretumTabs onSelectTab={this.setSelectedTab} urls={['http://www.umich.edu/']} />
                <ArboretumNavigationBar onBack={this.goBack} onForward={this.goForward} onReload={this.reload} onToggleSidebar={this.toggleSidebar} onNavigate={this.navigate} />
            </header>
            <div className="window-content">
                <div className="pane-group">
                    <ArboretumSidebar onSendMessage={this.sendMessage} setServerActive={this.setServerActive} isVisible={this.state.showingSidebar} serverActive={this.state.serverActive} />
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
