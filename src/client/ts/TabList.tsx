import * as _ from 'underscore';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ShareDBDOMNode, TabDoc, BrowserDoc} from '../../utils/state_interfaces';

type TabListProps = {
    sdb:SDB
    onSelectTab:(tabID:CRI.TabID)=>void
};
type TabListState = {
    tabs: Array<CRI.TabInfo>,
    selectedTab:CRI.TabID
};

export class TabList extends React.Component<TabListProps, TabListState> {
    private browserDoc:SDBDoc<BrowserDoc>;
    constructor(props) {
        super(props);
        this.state = {
            tabs: [],
            selectedTab: null
        };
        this.browserDoc = this.props.sdb.get('arboretum', 'browser');
        this.initialize();
    };
    private initialize():void {
        this.browserDoc.subscribe(this.onBrowserDocUpdated);
    };
    private onBrowserDocUpdated = async ():Promise<void> => {
        const data:BrowserDoc = this.browserDoc.getData();
        const {tabs, selectedTab} = data;

        await new Promise((resolve, reject) => {
            this.setState({tabs: _.values(tabs)}, resolve);
        });
        if(selectedTab) {
            this.selectTab(selectedTab);
        }
    };
    private async selectTab(selectedTab:CRI.TabID):Promise<void> {
        await this.setState({selectedTab})
        this.props.onSelectTab(selectedTab);
    };
    private changeSelectedTab = (event:React.MouseEvent<HTMLLIElement>):void => {
        const target = event.target as HTMLLIElement;
        this.selectTab(target.getAttribute('data-tabid'));
        event.preventDefault();
        event.stopPropagation();
    };
    public render():React.ReactNode {
        const tabs:Array<JSX.Element> = this.state.tabs.map((tabInfo:CRI.TabInfo, index) => {
            const {id} = tabInfo;
            const isSelected:boolean = id === this.state.selectedTab;
            return <li className={'tab' + (isSelected?' selected':'')} data-tabid={id} key={id} onClick={this.changeSelectedTab}>{tabInfo.title}</li>
        });
        return <ul id='tabs'>{tabs}</ul>
    };
};
