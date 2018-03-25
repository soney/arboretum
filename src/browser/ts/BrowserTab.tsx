import * as React from 'react';
import * as _ from 'underscore';
import {BrowserTabID} from './ArboretumBrowser';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import * as ShareDB from 'sharedb';
import {TabDoc} from '../../utils/state_interfaces';

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
    sdb:SDB,
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
    private sdbTabId:CRI.TabID;
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
        this.webViewEl = <webview className="hidden" id={`${this.props.tabID}`} key={this.props.tabID} ref={this.webViewRef}/>;
    };
    public hasSDBTabID():boolean {
        return !!this.sdbTabId;
    };
    public getSDBTabID():CRI.TabID { return this.sdbTabId; };
    public async setSDBTabID(id:CRI.TabID):Promise<void> {
        this.sdbTabId = id;
        if(this.tabDoc) {
            this.tabDoc.destroy();
        }
        const sdb:SDB = this.props.sdb;
        this.tabDoc = await sdb.get<TabDoc>('tab', this.getSDBTabID());
        await this.tabDoc.createIfEmpty({
            id:this.getSDBTabID(),
            root:null,
            canGoBack:false,
            canGoForward:false,
            url:'',
            title:'',
            isLoading: false,
            suggestedActions: []
        });
        await Promise.all([
            this.tabDoc.submitObjectReplaceOp(['canGoBack'], this.state.canGoBack),
            this.tabDoc.submitObjectReplaceOp(['canGoForward'], this.state.canGoForward),
            this.tabDoc.submitObjectReplaceOp(['isLoading'], this.state.isLoading),
            this.tabDoc.submitObjectReplaceOp(['title'], this.state.title),
            this.tabDoc.submitObjectReplaceOp(['url'], this.state.loadedURL)
        ]);
    };

    public getTabID() {
        return this.props.tabID;
    };

    private webViewRef = (el:Electron.WebviewTag):void => {
        if(el) {
            this.webView = el;
            this.webView.setAttribute('src', this.props.startURL);
            if(this.props.selected) {
                setTimeout(() => this.webView.setAttribute('class', ''), 0);
            }
            this.webView.addEventListener('page-title-updated', async (event:Electron.PageTitleUpdatedEvent) => {
                const {title} = event;
                this.setState({title});
                if(this.props.pageTitleChanged) { this.props.pageTitleChanged(this, title); }
                if(this.tabDoc) {
                    await this.tabDoc.submitObjectReplaceOp(['title'], title);
                }
            });
            this.webView.addEventListener('load-commit', async (event:Electron.LoadCommitEvent) => {
                const {isMainFrame, url} = event;

                if(isMainFrame) {
                    const loadedURL = url;
                    if(this.props.urlChanged) { this.props.urlChanged(this, url); }
                    this.setState({loadedURL});
                    if(this.tabDoc) {
                        await this.tabDoc.submitObjectReplaceOp(['url'], loadedURL);
                    }
                    this.updateCanGos();
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
                this.updateCanGos();
            });
            this.webView.addEventListener('did-stop-loading', (event) => {
                this.setState({isLoading:false});
                if(this.props.isLoadingChanged) { this.props.isLoadingChanged(this, false); }
                this.updateCanGos();
            });
        }
    };
    private async updateCanGos():Promise<void> {
        const canGoBack:boolean = this.webView.canGoBack();
        const canGoForward:boolean = this.webView.canGoForward();
        if(canGoBack !== this.state.canGoBack) {
            this.setState({canGoBack});
            if(this.tabDoc) {
                await this.tabDoc.submitObjectReplaceOp(['canGoBack'], canGoBack);
            }
            if(this.props.canGoBackChanged) {
                this.props.canGoBackChanged(this, canGoBack);
            }
        }
        if(canGoForward !== this.state.canGoForward) {
            this.setState({canGoForward});
            if(this.tabDoc) {
                await this.tabDoc.submitObjectReplaceOp(['canGoForward'], canGoForward);
            }
            if(this.props.canGoForwardChanged) {
                this.props.canGoForwardChanged(this, canGoForward);
            }
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
        this.setState({selected});
        if(selected) {
            this.webView.setAttribute('class', '');
        } else {
            this.webView.setAttribute('class', 'hidden');
        }
    };
    public async goBack():Promise<void> {
        if(this.webView.canGoBack()) {
            this.webView.goBack();
        }
    };
    public async goForward():Promise<void> {
        if(this.webView.canGoForward()) {
            this.webView.goForward();
        }
    };
    public async reload():Promise<void> {
        if(this.webView.isLoading()) {
            this.webView.stop();
        } else {
            this.webView.reload();
        }
        if(this.tabDoc) {
            await this.tabDoc.submitObjectReplaceOp(['isLoading'], this.webView.isLoading());
        }
    };
    public navigate(url:string, options?:Electron.LoadURLOptions):void {
        this.webView.loadURL(url, options);
    };

    public render():React.ReactNode {
        return <div aria-label={`Tab ${this.state.title}`} onClick={this.onSelect} className={`tab-item ${this.state.selected ? 'active' : 'not-active' }`}>
            <span onClick={this.onClose} className='icon icon-cancel icon-close-tab'/>
            <span className='tab-icon'>{ this.state.favIconURL ?
                <img className='tab-img' src={this.state.favIconURL} /> : null
            }</span>
            <span className='tab-title'>{this.state.title}</span>
        </div>;
    };
};
