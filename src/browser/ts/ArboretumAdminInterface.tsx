import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserTab} from './BrowserTab';
import {BrowserNavigationBar} from '../../utils/browserControls/BrowserNavigationBar';
import {ipcRenderer, remote, BrowserWindow} from 'electron';
import * as url from 'url';
import * as _ from 'underscore';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';
import Switch from 'react-switch';
import * as ShareDB from 'sharedb';
import {BrowserDoc} from '../../utils/state_interfaces';
import {ArboretumChat, ChatCommandEvent, Message, User, TextMessage, PageActionMessage, PageAction, PAMAction} from '../../utils/ArboretumChat';
import {copyToClipboard} from '../../utils/copyToClipboard';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';
import {ArboretumSuggestedActions} from './ArboretumSuggestedActions';

export type BrowserTabID = number;
export interface SetServerActiveValue {
    shareURL:string,
    adminURL:string
};

type ArboretumAdminProps = {
    serverState?:"active" | "idle"
};
type ArboretumAdminState = {
    serverActive:boolean,
    shareURL:string,
    adminURL:string,
    activeWebViewEl:JSX.Element,
    sandbox:boolean
};

export class ArboretumAdminInterface extends React.Component<ArboretumAdminProps, ArboretumAdminState> {
    private navBar:BrowserNavigationBar;
    private tabCounter:number = 0;
    private socket:WebSocket;
    private sdb:SDB;
    private chatbox:ArboretumChatBox;
    private shareURLElement:HTMLInputElement;
    private suggestedActions:ArboretumSuggestedActions;
    private static defaultProps:ArboretumAdminProps = {
        serverState:"idle"
    };
    constructor(props) {
        super(props);
        this.state = {
            serverActive:this.props.serverState === "active",
            activeWebViewEl:null,
            shareURL: '',
            adminURL: '',
            sandbox: true
        };
        if(this.state.serverActive) {
            this.setServerActive(this.state.serverActive);
        }
    };

    private static ipcMessageID:number = 0;
    private async sendIPCMessage(message:{message:string, data?:any}):Promise<any> {
        const messageID:number = ArboretumAdminInterface.ipcMessageID++;
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
            const {protocol, hostname, port} = await this.sendIPCMessage({message: 'startServer'});
            const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
            const fullShareURL = url.format({ protocol, hostname, port });
            const fullAdminURL = url.format({ protocol, hostname, port, pathname:'/a' });
            const wsAddress    = url.format({ protocol: wsProtocol, hostname, port });
            this.socket = new WebSocket(wsAddress);
            this.sdb = new SDB(true, this.socket);

            [shareURL, adminURL] = await Promise.all([
                this.getShortcut(fullShareURL), this.getShortcut(fullAdminURL)
            ]);
        } else {
            if(this.sdb) {
                this.sdb.close();
                this.sdb = null;
            }
            if(this.socket) {
                this.socket.close();
                this.socket = null;
            }
            if(this.chatbox) {
                await this.chatbox.leave();
            }
            await this.sendIPCMessage({message: 'stopServer'});
            [shareURL, adminURL] = ['', ''];
        }
        if(this.chatbox) {
            this.chatbox.setSDB(this.sdb);
        }
        if(this.suggestedActions) {
            this.suggestedActions.setSDB(this.sdb);
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
    private selectedTabPageTitleChanged = (title:string='Arboretum'):void => {
        document.title = title;
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
        if(this.sdb) {
            this.chatbox.setSDB(this.sdb);
        }
    };

    private onAction = async (a:PAMAction, action:PageAction):Promise<void> => {
        await this.sendIPCMessage({
            message:'pageAction',
            data: { a, action }
        });
    };
    // private onReject = async (action:PageAction):Promise<void> => {
    //     await this.sendIPCMessage({
    //         message:'rejectAction',
    //         data:action
    //     });
    // };
    // private onFocus = async (action:PageAction):Promise<void> => {
    //     await this.sendIPCMessage({
    //         message:'focusAction',
    //         data:action
    //     });
    // };
    // private onLabel = async (action:PageAction):Promise<void> => {
    //     await this.sendIPCMessage({
    //         message:'labelAction',
    //         data:action
    //     });
    // };
    private selectShareURL = ():void => {
        this.shareURLElement.select();
        this.shareURLElement.focus();
    };
    private copyShareURL = ():void => {
        copyToClipboard(this.shareURLElement.value);
    };
    private addHighlight = (nodeIds:Array<CRI.NodeID>, color:string):void => {
        // console.log(nodeIds, color);
    };
    private removeHighlight = (nodeIds:Array<CRI.NodeID>):void => {
        // console.log(nodeIds);
    };
    private onCommand = (event:ChatCommandEvent) => {
        this.sendIPCMessage({
            message:'chatCommand',
            data: event
        });
    };
    public async componentWillUnmount():Promise<void> {
        await this.chatbox.leave();
    };

    public render():React.ReactNode {
        return <div id="adminPane" className='pane'>
            <table id="server-controls">
                <tbody>
                    <tr id="control_content">
                        <td>
                            <h5 className="nav-group-title">Server</h5>
                            <Switch aria-label="Toggle Server" height={24} width={48} onChange={this.handleServerSwitchChange} checked={this.state.serverActive} />
                        </td>
                        <td className="copy_area">
                            <h5 className="nav-group-title">Share URL</h5>
                            <input aria-label="Share URL" onClick={this.selectShareURL} ref={this.shareURLRef} value={this.state.shareURL} id="share_url" data-disabled="true"/>
                            <a aria-label="Copy Share URL" href="javascript:void(0)" onClick={this.copyShareURL}><span ref={(el) => (el)} data-clipboard-target="#share_url" id="share_copy" className="icon icon-clipboard"></span></a>
                        </td>
                        <td>
                            <h5 className="nav-group-title">MTurk</h5>
                            <button aria-label="Post to Amazon Mechanical Turk" onClick={this.postToMTurk} id="mturk_post" className='btn btn-default'><span className="icon icon-upload-cloud"></span>&nbsp;Post</button>
                            <br />
                            <label><input aria-label="Use Mechanical Turk Sandbox" type="checkbox" name="sandbox" value="sandbox" id="sandbox" checked={this.state.sandbox} onChange={this.onSandboxChange}/> Sandbox</label>
                        </td>
                    </tr>
                </tbody>
            </table>
            <ArboretumSuggestedActions ref={(el)=>{this.suggestedActions=el;}} onAction={this.onAction} />
            <ArboretumChatBox onCommand={this.onCommand} isAdmin={true} sdb={this.sdb} joinOnStart={true} username="Admin" ref={this.chatBoxRef} onSendMessage={this.sendMessage} onAction={this.onAction} onAddHighlight={this.addHighlight} onRemoveHighlight={this.removeHighlight} />
        </div>;
    };
};
