import * as $ from 'jquery';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import {ClientTab} from './ClientTab';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ArboretumChat, Message, User, TextMessage, PageActionMessage, PageAction, PAMAction, UserRole} from '../../utils/ArboretumChat';
import {TabList} from './TabList';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Modal from 'react-modal';
import * as store from 'store';

Modal.setAppElement('#client_main');

type ArboretumClientProps = {
    wsAddress?:string,
    username?:string,
    isAdmin?:boolean,
    url?:string,
    hideNavBar?:boolean
};
type ArboretumClientState = {
    enteringLabel:boolean,
    modalIsOpen:boolean,
    usernameInputValue:string,
    usernameValid:boolean,
    usernameFeedback:string,
    disabled:boolean,
    disabledMessages:string[]
};

export class ArboretumClient extends React.Component<ArboretumClientProps, ArboretumClientState> {
    private username:string;
    private sdb:SDB;
    private tabID:CRI.TabID;
    private socket:WebSocket;
    private clientTab:ClientTab;
    private navBar:BrowserNavigationBar;
    private arboretumChat:ArboretumChatBox;
    private hasNavigatedInitially:boolean = false;

    protected static defaultProps:ArboretumClientProps = {
        url:null,
        isAdmin:false,
        wsAddress: `${window.location.protocol.toLowerCase()==='https:' ? 'wss' : 'ws'}://${window.location.hostname}:${window.location.port}`
    };

    constructor(props) {
        super(props);
        const displayName = store.get('displayName', '');
        this.state = {
            enteringLabel:false,
            modalIsOpen:!this.props.username,
            usernameInputValue:store.get('displayName', ''),
            usernameValid:false,
            usernameFeedback:'',
            disabled: false,
            disabledMessages: [] 
        };
        this.username = this.props.username;
        this.socket = new WebSocket(this.props.wsAddress);
        this.socket.addEventListener('message', (event) => {
            const messageData = JSON.parse(event.data);
            if(messageData.message === 'taskDone') {
                if(!this.props.isAdmin) {
                    this.closeClient(`You have succesfully completed this HIT. Thank you!`, `Verification Code: ${decryptVerify()}`)
                }
            } else if(messageData.message === 'boot') {
                const {data} = messageData;
                const {user, message} = data;
                const me = this.getChat().getMe();
                if(me.displayName === user) {
                    this.closeClient(message || 'Thank you for participating!');
                }
            }
        });
        this.socket.addEventListener('close', () => {
            this.closeClient();
        });
        this.sdb = new SDB(true, this.socket);
        // window.addEventListener('beforeunload', () => {
            // this.closeClient();
        // });
    };
    private static wsMessageID=1;
    private async sendWebsocketMessage(message:{message:string, data?:any}):Promise<any> {
        const messageID:number = ArboretumClient.wsMessageID++;
        const response = await new Promise((resolve, reject) => {
            const onMessage = (event) => {
                const messageData = JSON.parse(event.data);
                if(!messageData.a) {
                    const {replyID, data} = messageData;
                    if(replyID === messageID) {
                        this.socket.removeEventListener('message', onMessage);
                        resolve(data);
                    }
                }
            };
            this.socket.addEventListener('message', onMessage);
            this.socket.send(JSON.stringify(_.extend(message, {messageID})));
        });
        return response;
    };
    public async componentWillUnmount():Promise<void> {
        if(this.arboretumChat) {
            await this.arboretumChat.leave();
        }
        this.sdb.close();
    };
    private onSelectTab = (tabID:CRI.TabID):void => {
        this.tabID = tabID;
        if(this.props.isAdmin && this.props.url && !this.hasNavigatedInitially) {
            this.hasNavigatedInitially = true;
            this.navigate(this.props.url);
        }
        if(this.clientTab) {
            this.clientTab.setTabID(this.tabID);
        }
    };
    private clientTabRef = (clientTab:ClientTab):void => {
        this.clientTab = clientTab;
        if(this.clientTab) {
            if(this.tabID) {
                this.clientTab.setTabID(this.tabID);
            }
            this.clientTab.pageAction.addListener((action:PageAction) => {
                if(this.props.isAdmin) {
                    this.sendWebsocketMessage({
                        message: 'pageAction',
                        data: {a:PAMAction.ACCEPT, action}
                    });
                } else {
                    const chat = this.getChat();
                    chat.addPageActionMessage(action, action.data.nodeDescriptions);
                }
            });
        }
    };
    private navBarRef = (navBar:BrowserNavigationBar):void => {
        this.navBar = navBar;
    };
    private chatRef = async (arboretumChat:ArboretumChatBox):Promise<void> => {
        this.arboretumChat = arboretumChat;
        if(this.arboretumChat) {
            const displayName = this.state.usernameInputValue;
            const {valid, feedback} = await this.getChat().validateUsername(displayName);
            this.setState({usernameValid:valid, usernameFeedback:feedback});
        }
    };
    private goBack = ():void => {
        const action:PageAction = {type:'goBack', tabID: this.tabID, data:{}};
        if(this.props.isAdmin) {
            this.sendWebsocketMessage({
                message: 'pageAction',
                data: {a:PAMAction.ACCEPT, action }
            });
        } else {
            this.getChat().addPageActionMessage(action);
        }
    };
    private goForward = ():void => {
        const action:PageAction = {type:'goForward', tabID: this.tabID, data:{}};
        if(this.props.isAdmin) {
            this.sendWebsocketMessage({
                message: 'pageAction',
                data: {a:PAMAction.ACCEPT, action }
            });
        } else {
            this.getChat().addPageActionMessage(action);
        }
    };
    private reload = ():void => {
        const action:PageAction = {type:'reload', tabID: this.tabID, data:{}};
        if(this.props.isAdmin) {
            this.sendWebsocketMessage({
                message: 'pageAction',
                data: {a:PAMAction.ACCEPT, action }
            });
        } else {
            this.getChat().addPageActionMessage(action);
        }
    };
    private navigate = (url:string):void => {
        const action:PageAction = {type:'navigate', tabID: this.tabID, data:{url}};
        if(this.props.isAdmin) {
            this.sendWebsocketMessage({
                message: 'pageAction',
                data: {a:PAMAction.ACCEPT, action }
            });
        } else {
            this.getChat().addPageActionMessage(action);
        }
    };
    private tabIsLoadingChanged = (tab:ClientTab, isLoading:boolean):void => {
        if(this.navBar) { this.navBar.setState({isLoading}); }
    };
    private tabCanGoBackChanged = (tab:ClientTab, canGoBack:boolean):void => {
        if(this.navBar) { this.navBar.setState({canGoBack}); }
    };
    private tabCanGoForwardChanged = (tab:ClientTab, canGoForward:boolean):void => {
        if(this.navBar) { this.navBar.setState({canGoForward}); }
    };
    private tabURLChanged = (tab:ClientTab, url:string):void => {
        if(this.navBar) { this.navBar.setState({urlText: url}); }
    };
    private pageTitleChanged = (tab:ClientTab, title:string):void => { };
    private getChat():ArboretumChat { return this.arboretumChat.getChat(); }
    private addHighlight = (nodeIds:Array<CRI.NodeID>, color:string):void => {
        if(this.clientTab) {
            this.clientTab.addHighlight(nodeIds, color);
        }
    };
    private removeHighlight = (nodeIds:Array<CRI.NodeID>):void => {
        if(this.clientTab) {
            this.clientTab.removeHighlight(nodeIds);
        }
    };
    private onAction = (a:PAMAction, action:PageAction):void => {
        if(a === PAMAction.FOCUS) {
            const relevantNodeIDs = ArboretumChat.getRelevantNodeIDs(action);
            this.clientTab.focusOn(relevantNodeIDs);
        } else {
            if(this.props.isAdmin) {
                this.sendWebsocketMessage({
                    message: 'pageAction',
                    data: {a, action}
                });
            } else {
                if(a === PAMAction.ADD_LABEL) {
                    this.onLabel(action);
                }
            }
        }
    }
    private onLabel(action:PageAction):void {
        const {tabID} = action;
        const relevantNodeIDs = ArboretumChat.getRelevantNodeIDs(action);
        if(this.clientTab) {
            // console.log(this.tabID);
            // console.log(this.clientTab.getTabID());
            if(this.clientTab.getTabID() === tabID) {
                this.setState({enteringLabel:true})
                // const domNodes = relevantNodeIDs.map((nid) => this.clientTab.getNode(nid));
                // console.log(domNodes);
            }
        }
    };

    private handleUsernameInputChange = async (event:React.ChangeEvent<HTMLInputElement>):Promise<void> => {
        const value = event.target.value;
        this.setState({usernameInputValue:value});
        const chat:ArboretumChat = this.getChat();
        if(chat) {
            const {valid, feedback} = await chat.validateUsername(value);
            this.setState({usernameValid:valid, usernameFeedback:feedback});
        }
    };

    private onSubmitUsername = async (event:React.FormEvent<HTMLElement>):Promise<void> => {
        event.preventDefault();
        if(this.state.usernameValid) {
            const displayName:string = this.state.usernameInputValue;
            const chat:ArboretumChat = this.getChat();
            const role:UserRole = this.props.isAdmin ? 'user':'helper';
            await chat.join(displayName, role);
            const users:User[] = await chat.getUsers();

            store.set('displayName', displayName);

            if(role === 'helper') {
                let enduser:string;
                users.forEach((u) => {
                    if(u.role==='user') {
                        enduser = u.displayName;
                    }
                });
                if(enduser) {
                    chat.addTextMessage(`Hi ${enduser}, I'm ${displayName}, a worker from MTurk. What can I do for you?`);
                }
            }

            this.closeModal();
        }
    };

    private closeModal():void {
        this.setState({modalIsOpen:false});
    }
    private onSubmitDone = (event:React.FormEvent<HTMLElement>):void => {
        window.location.replace('https://www.google.com/');
    };

    public async closeClient(...messages:string[]):Promise<void> {
        this.setState({disabled: true, disabledMessages:messages});
        const chat = this.getChat();
        if(chat) {
            await chat.leave();
        }
        await this.sdb.close();
    };

    public render():React.ReactNode {
        if(this.state.disabled) {
            return <div className="window">
                {/* <form className='usernameInput' method='POST' onSubmit={this.onSubmitDone}  action={`${getURLParameter('turkSubmitTo')}/mturk/externalSubmit`}>
                    <input type='hidden' name='assignmentId' value={getURLParameter('assignmentId')} />
                    <input type='hidden' name='workerId' value={getURLParameter('workerId')} />
                    <input type='hidden' name='hitId' value={getURLParameter('hitId')} />
                    <div className="form-group">
                        <p>You have succesfully completed this HIT. Thank you!</p>
                        <h2>Verification Code: {decryptVerify()}</h2>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-form btn-primary">Close</button>
                    </div>
                </form> */}
                {this.state.disabledMessages.map((m) => <h1>{m}</h1> )}
            </div>
        }
        const navigationBar:Array<JSX.Element> = this.props.hideNavBar ? [] : [
            <header>
                <BrowserNavigationBar ref={this.navBarRef} onBack={this.goBack} onForward={this.goForward} onReload={this.reload} showSidebarToggle={false} onNavigate={this.navigate} />
            </header>
        ];
        return <div className="window" id="arboretum_client">
            <Modal isOpen={this.state.modalIsOpen}>
                <form className='usernameInput' onSubmit={this.onSubmitUsername}>
                    <div className="form-group">
                        <label style={{display:'block'}}>Select a username for chat</label>
                        <input aria-label="Enter a username" value={this.state.usernameInputValue} onChange={this.handleUsernameInputChange} type="text" placeholder="Enter a username" ref={(el)=>{if(el){el.focus()}}} ></input>
                        <p>
                            {this.state.usernameFeedback}
                        </p>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-form btn-primary">OK</button>
                    </div>
                </form>
            </Modal>
            <TabList sdb={this.sdb} onSelectTab={this.onSelectTab} />
            {navigationBar}
            <div className="window-content">
                <div className="pane-group" id="client_body">
                    <div className="pane-sm sidebar" tabIndex={0} aria-label="Chat" id="client_sidebar">
                        <ArboretumChatBox onAction={this.onAction} onAddHighlight={this.addHighlight} onRemoveHighlight={this.removeHighlight} isAdmin={this.props.isAdmin} ref={this.chatRef} sdb={this.sdb} username={this.username} />
                    </div>
                    <div className="pane" id="client_content">
                        <ClientTab canGoBackChanged={this.tabCanGoBackChanged} canGoForwardChanged={this.tabCanGoForwardChanged} urlChanged={this.tabURLChanged} titleChanged={this.pageTitleChanged} isLoadingChanged={this.tabIsLoadingChanged} ref={this.clientTabRef} sdb={this.sdb} />
                    </div>
                </div>
            </div>
        </div>;
    };
};

function getURLParameter(sParam:string):string {
    const sPageURL = window.location.search.substring(1);
    const sURLVariables = sPageURL.split('&');
    for (let i = 0; i < sURLVariables.length; i++) {
        const sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1]
        }
    }
}

function decryptVerify():string {
    const enc = parseInt(getURLParameter('enc'));
    const key = parseInt(getURLParameter('key'));
    return String(enc/key);
}
