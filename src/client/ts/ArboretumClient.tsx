import * as $ from 'jquery';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ClientTab} from './ClientTab';
import {ArboretumChatBox} from '../../utils/ArboretumChatBox';
import {TabList} from './TabList';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

type ArboretumClientProps = {
    wsAddress?:string,
    userID?:string,
    frameID?:string,
    tabID?:string,
    viewType?:string
};
type ArboretumClientState = {
    showControls:boolean
};

export class ArboretumClient extends React.Component<ArboretumClientProps, ArboretumClientState> {
    private socket:WebSocket;
    private sdb:SDB;
    private clientTab:ClientTab;
    private tabID:CRI.TabID;

    protected static defaultProps:ArboretumClientProps = {
        wsAddress: `ws://${window.location.hostname}:${window.location.port}`
    };

    constructor(props) {
        super(props);
        this.state = {
            showControls: !this.props.frameID
        };
        this.socket = new WebSocket(this.props.wsAddress);
        this.sdb = new SDB(true, this.socket);
    };
    public componentWillUnmount():void {
        this.sdb.close();
    };
    private onSelectTab = (tabID:CRI.TabID):void => {
        this.tabID = tabID;
        if(this.clientTab) {
            this.clientTab.setTabID(this.tabID);
        }
    };
    private clientTabRef = (clientTab:ClientTab):void => {
        this.clientTab = clientTab;
        if(this.tabID) {
            this.clientTab.setTabID(this.tabID);
        }
    };
    public render():React.ReactNode {
        const {showControls} = this.state;
        return <div>
            {showControls ? <TabList sdb={this.sdb} onSelectTab={this.onSelectTab} /> : null}
            {showControls ? <ArboretumChatBox username="Steve" sdb={this.sdb} /> : null}
            <ClientTab tabID={this.props.tabID} frameID={this.props.frameID} ref={this.clientTabRef} sdb={this.sdb} />
        </div>;
    };
};
