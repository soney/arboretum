// import * as $ from 'jquery';
// import {Tab, TabID} from './tab';
// import {Arboretum} from '../browser_main';
//
// export class Tabs {
//     private activeTab:Tab;
//     private rootEl:JQuery<HTMLElement> = $('#content');
//     private addTabEl:JQuery<HTMLElement> = $('#addTab');
//     private tabsRowEl:JQuery<HTMLElement> = $('#tabsBar');
//     private tabs:Map<TabID, Tab> = new Map<TabID, Tab>();
//
//     constructor(private arboretum:Arboretum) {
//         this.addTabEl.on('click', () => {
//             this.createNew('', true);
//             // this.resize();
//         });
//     }
//     private createNew(url:string, isSelected:boolean=true):Tab {
//         const theTab = new Tab(url);
//         this.tabs.set(theTab.TabId, theTab);
//         if(isSelected) {
//             this.select(theTab);
//         }
//         return theTab;
//     }
//
//     public select(tab:Tab):void {
//         if(this.activeTab) {
//             this.activeTab.webView.removeClass('show');
//             this.activeTab.content.addClass('unselected');
//             this.activeTab.tab.removeClass('active')
//                            .addClass('not-active');
//         }
//         //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
//         this.activeTab = tab;
//         this.activeTab.webView.addClass('show');
//         this.activeTab.tab.addClass('active')
//                         .removeClass('not-active');
//         this.activeTab.content.removeClass('unselected');
//         document.title = $(this.activeTab[0]).children('.tab-title').text();
//     }
//
// }



import * as React from 'react';
import {ArboretumTab} from './tab';
import * as _ from 'underscore';

export type BrowserTabID = number;

type ArboretumTabsProps = {
    urls:Array<string>,
    onSelectTab:(selectedTab:ArboretumTab) => void,
    onSelectedTabLoadingChanged:(isLoading:boolean) => void,
    onSelectedTabCanGoBackChanged:(canGoBack:boolean) => void,
    onSelectedTabCanGoForwardChanged:(canGoForward:boolean) => void,
    onSelectedTabURLChanged:(url:string) => void
};
type ArboretumTabsState = {
    selectedTab:ArboretumTab,
    tabs:Array<{url:string, id:number, selected:boolean}>
};

export class ArboretumTabs extends React.Component<ArboretumTabsProps, ArboretumTabsState> {
    private tabCounter:number = 0;
    private tabs:Map<BrowserTabID, ArboretumTab> = new Map<BrowserTabID, ArboretumTab>();
    constructor(props) {
        super(props);
        this.state = {
            selectedTab:null,
            tabs: this.props.urls.map((url, index) => {
                return {
                    selected: index===0,
                    id: this.tabCounter++,
                    url: url
                };
            })
        };
    };

    private addTab = ():void => {
        console.log('abc');
        const tabs = this.state.tabs.map((tab) => {
            return _.extend(tab, {selected: false});
        }).concat([{
            id: this.tabCounter++,
            url:'http://www.umich.edu/',
            selected: false
        }]);
        this.setState({tabs});
    };

    private selectTab = (selectedTab:ArboretumTab):void => {
        if(selectedTab !== this.state.selectedTab) {
            this.tabs.forEach((t) => {
                t.markSelected(t === selectedTab);
            });
            this.setState({selectedTab});
            if(this.props.onSelectTab) { this.props.onSelectTab(selectedTab); }
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
        this.setState({tabs});
        this.selectTab(selectedTab);
    };

    private tabRef = (el:ArboretumTab):void => {
        if(el) {
            this.tabs.set(el.props.tabID, el);
            this.selectTab(el);
        }
    };

    private tabIsLoadingChanged = (tab:ArboretumTab, isLoading:boolean):void => {
        if(tab === this.state.selectedTab) {
            if(this.props.onSelectedTabLoadingChanged) { this.props.onSelectedTabLoadingChanged(isLoading); }
        }
    };
    private tabCanGoBackChanged = (tab:ArboretumTab, canGoBack:boolean):void => {
        if(tab === this.state.selectedTab) {
            if(this.props.onSelectedTabCanGoBackChanged) { this.props.onSelectedTabCanGoBackChanged(canGoBack); }
        }
    };
    private tabCanGoForwardChanged = (tab:ArboretumTab, canGoForward:boolean):void => {
        if(tab === this.state.selectedTab) {
            if(this.props.onSelectedTabCanGoForwardChanged) { this.props.onSelectedTabCanGoForwardChanged(canGoForward); }
        }
    };
    private tabURLChanged = (tab:ArboretumTab, url:string):void => {
        if(tab === this.state.selectedTab) {
            if(this.props.onSelectedTabURLChanged) { this.props.onSelectedTabURLChanged(url); }
        }
    };

    public render():React.ReactNode {
        const tabs = this.state.tabs.map((info, index) =>
                        <ArboretumTab ref={this.tabRef} selected={info.selected} key={info.id} tabID={info.id} startURL={info.url} onSelect={this.selectTab} onClose={this.closeTab} urlChanged={this.tabURLChanged} isLoadingChanged={this.tabIsLoadingChanged} canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} />);
        return <div id="tabsBar" className="tab-group">
                    <div id='buttonSpacer' className="tab-item tab-item-fixed"> </div>
                    {tabs}
                    <div onClick={this.addTab} className="tab-item tab-item-fixed" id='addTab'>
                        <span className="icon icon-plus"></span>
                    </div>
                </div>;
    };
};
