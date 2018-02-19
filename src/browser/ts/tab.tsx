// import {EventEmitter} from 'events';
// import {Arboretum} from '../browser_main';
//
// export type TabID = number;
//
//
// var cri = require('chrome-remote-interface');
//
// var NavStatus = {
//     START: 'START',
//     RECEIVING: 'RECEIVING',
//     STOP: 'STOP',
//     REDIRECT: 'REDIRECT',
//     FAIL: 'FAIL'
// };
//
// class Tab extends EventEmitter {
//     private static tabNum:number = 0;
//     private tabID:TabID;
//     private titleEl:JQuery<HTMLElement> = $('<span />', {text: 'New Tab', class: 'tab-title'});
//     private iconEl:JQuery<HTMLElement> = $('<span />', {class: 'tab-icon'});
//     private closeButtonEl:JQuery<HTMLElement> =  $('<span />', {class:'icon icon-cancel icon-close-tab'});
//     private webViewEl:JQuery<HTMLElement>;
//     private tabEl:JQuery<HTMLElement>;
//     private contentEl:JQuery<HTMLElement>;
//     constructor(private arboretum:Arboretum) {
//         super();
//         Tab.tabNum++;
//         this.tabID = Tab.tabNum;
//
//         this.webViewEl = $('<webview />', {src: 'http://www.umich.edu/',id:`wv${this.tabID}`});
//         this.tabEl = $('<div />', {class: 'tab-item', id: `li${this.tabID}`});
//         // this.tabLink = $('<a />', {class: 'clickableTab', href: '#tab'+tabNum});
//         this.contentEl = $('<div />', {id: `tab${this.tabID}`, class:'tab_content unselected'}).append(this.webViewEl);
//         // .appendTo(this.arboretum.tabs.root).append(this.webViewEl);
//
//         // this.tabLink.append(icon, title);
//         this.tabEl.append(this.iconEl, this.titleEl, this.closeButtonEl);
//         arboretum.tabs.addTab.before(this.tab);
//
//         this.closeButtonEl.on('click',() => {
//             $(`#tab${this.tabID}`).remove();
//             $(`#li${this.tabID}`).remove();
//             this.arboretum.removeTab(this.tabID);
//             if(this.arboretum.tabs.active === thisTab){
//                var tmp = thisTab.TabId-1;
//                var T = arboretum.tabs.tabs;
//                while(!T[tmp]){
//                     tmp--;
//                }
//                var NewSelectedTab = T[tmp];
//                arboretum.tabs.select(NewSelectedTab);
//             }
//         });
//         this.tabEl.on('click', () => {
//             this.arboretum.selectTab(thisTab);
//         });
//         //
//         // // Subscribing on own events
//         // this.on('Navigation:Status', (status) => {
//         //     this.status = lastStatus = status;
//         //     if(status === NavStatus.START || status === NavStatus.REDIRECT) {
//         //         this.iconEl.html('<paper-spinner class="request backward" active></paper-spinner>');
//         //     } else if(status === NavStatus.RECEIVING){
//         //         this.iconEl.html('<paper-spinner class="yellow" active></paper-spinner>');
//         //     } else if(status === NavStatus.STOP || status === NavStatus.FAIL) {
//         //         if(this.webViewEl[0].getURL() === lastURL && lastFavicon.length){
//         //             this.emit('Favicon:Render');
//         //         } else {
//         //             this.iconEl.html('');
//         //         }
//         //     }
//         // });
//         // this.on('Favicon:Render', () => {
//         //     this.iconEl.html(`<img class="tab-img" src="${lastFavicon}" />`);
//         // });
//         // this.on('Favicon:Update', (URL) => {
//         //     lastURL = this.webViewEl[0].getURL();
//         //     lastFavicon = URL;
//         //     this.favicon = URL;
//         //     if(lastStatus === NavStatus.STOP){
//         //         emit('Favicon:Render');
//         //     }
//         // });
//         // this.on('Title:Update', (titleVal) => {
//         //     title.text(titleVal);
//         //     if(arboretum.tabs.active == this)
//         //        document.title = titleVal;
//         // });
//         //
//         // // WebView Events
//         // this.emit('Navigation:Status', NavStatus.START);
//         // this.webViewEl.attr('src', URL);
//         // this.webViewEl.on('page-title-set', (e) => {
//         //     var event = e.originalEvent;
//         //     this.emit('Title:Update', this.getURL() === 'about:blank' ? 'New Tab' : event.title);
//         // });
//         // this.webView.on('did-start-loading', function() {
//         //     expecting = true;
//         //     this.emit('URL:Update', this.getURL());
//         //     this.emit('Navigation:Status', NavStatus.START);
//         // });
//         // this.webView.on('did-get-redirect-request', function(e) {
//         //     var event = e.originalEvent;
//         //     if(event.isMainFrame){
//         //         this.emit('URL:Update', event.newUrl);
//         //     }
//         // });
//         // this.webViewEl.on('did-stop-loading', () => {
//         //     expecting = false;
//         //     this.emit('Navigation:Status', NavStatus.STOP);
//         // });
//         // this.webViewEl.on('did-fail-load', (event) => {
//         //     this.emit('Navigation:Status', NavStatus.FAIL, {code: event.errorCode, description: event.errorDescription});
//         // });
//         // this.webViewEl.on('page-favicon-updated', (e) => {
//         //     var event = e.originalEvent;
//         //     this.emit('Favicon:Update', event.favicons[0]);
//         // });
//         // this.webViewEl.on('did-get-response-details', (e) => {
//         //     var event = e.originalEvent;
//         //
//         //     if(!expecting) return ;
//         //     expecting = false;
//         //     if(lastStatus !== NavStatus.STOP) {
//         //         this.emit('URL:Update', event.newUrl);
//         //         this.emit('Navigation:Status', NavStatus.RECEIVING);
//         //     }
//         // });
//         // // Listen on extra high-level events
//         // this.listen();
//     }
//     listen() {
//         // let oldURL = null;
//         // this.on('URL:Update', (url) => {
//         //     if(this !== this.arboretum.tabs.active) return void(oldURL = url);
//         //
//         //     if(arboretum.urlBar.urlInput.is(':focus')) {
//         //         if(oldURL === arboretum.urlBar.url) {
//         //             arboretum.urlBar.urlInput.val(url);
//         //         }
//         //     } else {
//         //         arboretum.urlBar.urlInput.val(url);
//         //         oldURL = url;
//         //     }
//         // });
//         //
//         // this.on('Navigation:Status', function(status) {
//         //     if(this !== arboretum.tabs.active) return ;
//         //     arboretum.urlBar.backButton.attr('disabled', !this.webView[0].canGoBack());
//         //     arboretum.urlBar.forwardButton.attr('disabled', !this.webView[0].canGoForward());
//         //     if(status === NavStatus.STOP) {
//         //         arboretum.urlBar.refreshStop.icon = 'refresh';
//         //     } else {
//         //         arboretum.urlBar.refreshStop.icon = 'close';
//         //     }
//         // });
//     }
// }

import * as React from 'react';
import * as _ from 'underscore';
import {BrowserTabID} from './tabs';

type ArboretumTabProps = {
    startURL:string,
    onSelect:(tab:ArboretumTab) => void,
    onClose:(tab:ArboretumTab) => void,
    tabID:BrowserTabID,
    selected:boolean,
    canGoBackChanged?:(tab:ArboretumTab, canGoBack:boolean) => void,
    canGoForwardChanged?:(tab:ArboretumTab, canGoForward:boolean) => void,
    isLoadingChanged?:(tab:ArboretumTab, isLoading:boolean) => void,
    urlChanged?:(tab:ArboretumTab, url:string) => void
};
type ArboretumTabState = {
    title:string,
    selected:boolean,
    loadedURL:string,
    favIconURL:string,
    canGoBack:boolean,
    canGoForward:boolean,
    isLoading:boolean
};

export class ArboretumTab extends React.Component<ArboretumTabProps, ArboretumTabState> {
    public webViewEl:JSX.Element;
    private webView:Electron.WebviewTag;
    constructor(props) {
        super(props);
        this.state = {
            title:this.props.startURL,
            selected:this.props.selected,
            loadedURL:this.props.startURL,
            favIconURL:null,
            canGoBack:false,
            canGoForward:false,
            isLoading:false
        };
        this.webViewEl = <webview ref={this.webViewRef} src={this.props.startURL}/>;
    };

    private webViewRef = (el:Electron.WebviewTag):void => {
        if(el) {
            this.webView = el;
            this.webView.addEventListener('page-title-updated', (event:Electron.PageTitleUpdatedEvent) => {
                const {title} = event;
                this.setState({title});
            });
            this.webView.addEventListener('load-commit', (event:Electron.LoadCommitEvent) => {
                const {isMainFrame, url} = event;

                if(isMainFrame) {
                    const loadedURL = url;
                    if(this.props.urlChanged) { this.props.urlChanged(this, url); }
                    this.setState({loadedURL});
                }
            });
            this.webView.addEventListener('page-favicon-updated', (event:Electron.PageFaviconUpdatedEvent) => {
                const {favicons} = event;
                const favIconURL = favicons[0];
                this.setState({favIconURL});
            });
            this.webView.addEventListener('did-start-loading', (event) => {
                this.setState({isLoading:true});
                if(this.props.isLoadingChanged) { this.props.isLoadingChanged(this, true); }
            });
            this.webView.addEventListener('did-stop-loading', (event) => {
                this.setState({isLoading:false});
                if(this.props.isLoadingChanged) { this.props.isLoadingChanged(this, false); }
            });
        }
    };

    private onSelect = (event:React.MouseEvent<Element>):void => {
        if(this.props.onSelect) { this.props.onSelect(this); }
    };
    private onClose = (event:React.MouseEvent<Element>):void => {
        event.stopPropagation(); // don't send a select event
        if(this.props.onClose) { this.props.onClose(this); }
    };
    public markSelected(selected:boolean=true):void {
        this.setState(_.extend(this.state, {selected}));
    };
    public goBack():void {
        this.webView.goBack();
    };
    public goForward():void {
        this.webView.goForward();
    };
    public reload():void {
        if(this.webView.isLoading()) {
            this.webView.stop();
        } else {
            this.webView.reload();
        }
    };
    public navigate(url:string, options?:Electron.LoadURLOptions):void {
        this.webView.loadURL(url, options);
    };

    public render():React.ReactNode {
        return <div onClick={this.onSelect} className={`tab-item ${this.state.selected ? 'active' : 'not-active' }`}>
            <span onClick={this.onClose} className='icon icon-cancel icon-close-tab'/>
            <span className='tab-icon'>{ this.state.favIconURL ?
                <img className='tab-img' src={this.state.favIconURL} /> : null
            }</span>
            <span className='tab-title'>{this.state.title}</span>
        </div>;
    };
};
//     private titleEl:JQuery<HTMLElement> = $('<span />', {text: 'New Tab', class: 'tab-title'});
//     private iconEl:JQuery<HTMLElement> = $('<span />', {class: 'tab-icon'});
//     private closeButtonEl:JQuery<HTMLElement> =  $('<span />', {class:'icon icon-cancel icon-close-tab'});
//     private webViewEl:JQuery<HTMLElement>;
//     private tabEl:JQuery<HTMLElement>;
//     private contentEl:JQuery<HTMLElement>;
//     constructor(private arboretum:Arboretum) {
//         super();
//         Tab.tabNum++;
//         this.tabID = Tab.tabNum;
//
//         this.webViewEl = $('<webview />', {src: 'http://www.umich.edu/',id:`wv${this.tabID}`});
//         this.tabEl = $('<div />', {class: 'tab-item', id: `li${this.tabID}`});
