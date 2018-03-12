import * as React from 'react';
import * as _ from 'underscore';
import {BrowserTabID} from './ArboretumBrowser';
import {ShareDBDOMNode, TabDoc, BrowserDoc, CanvasImage} from '../../utils/state_interfaces';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';

type BrowserTabProps = {
    startURL:string,
    onSelect:(tab:BrowserTab) => void,
    onClose:(tab:BrowserTab) => void,
    tabID:BrowserTabID,
    selected:boolean,
    canGoBackChanged?:(tab:BrowserTab, canGoBack:boolean) => void,
    canGoForwardChanged?:(tab:BrowserTab, canGoForward:boolean) => void,
    isLoadingChanged?:(tab:BrowserTab, isLoading:boolean) => void,
    urlChanged?:(tab:BrowserTab, url:string) => void,
    pageTitleChanged?:(tab:BrowserTab, title:string) => void
};
type BrowserTabState = {
    title:string,
    selected:boolean,
    loadedURL:string,
    favIconURL:string,
    canGoBack:boolean,
    canGoForward:boolean,
    isLoading:boolean
};

export class BrowserTab extends React.Component<BrowserTabProps, BrowserTabState> {
    public webViewEl:JSX.Element;
    public webView:Electron.WebviewTag;
    private tabDoc:SDBDoc<TabDoc>;
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
        this.webViewEl = <webview id={`${this.props.tabID}`} key={this.props.tabID} ref={this.webViewRef} src={this.props.startURL}/>;
        this.tabDoc = this.props.sdb.get<TabDoc>('tab', this.state.tabID);
    };

    public getTabID() {
        return this.props.tabID;
    };

    private webViewRef = (el:Electron.WebviewTag):void => {
        if(el) {
            this.webView = el;
            this.webView.addEventListener('page-title-updated', (event:Electron.PageTitleUpdatedEvent) => {
                const {title} = event;
                this.setState({title});
                if(this.props.pageTitleChanged) { this.props.pageTitleChanged(this, title); }
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
