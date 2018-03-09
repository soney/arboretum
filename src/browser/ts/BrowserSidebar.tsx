import * as React from 'react';
import {ArboretumChatBox} from '../../utils/browserControls/ArboretumChatBox';
import * as Clipboard from 'clipboard';
import Switch from 'react-switch';
import {SDB, SDBDoc} from '../../utils/ShareDBDoc';

const ENTER_KEY:number = 13;

export interface SetServerActiveValue {
    shareURL:string,
    adminURL:string
};

type BrowserSidebarProps = {
    isVisible:boolean,
    serverActive:boolean,
    setServerActive?:(active:boolean)=>Promise<SetServerActiveValue>,
    onSendMessage?:(message:string)=>void,
    onPostTask?:(sandbox:boolean)=>void,
    shareURL:string,
    adminURL:string
};
type BrowserSidebarState = {
    isVisible:boolean,
    serverActive:boolean,
    shareURL:string,
    adminURL:string,
    sandbox:boolean
};

export class BrowserSidebar extends React.Component<BrowserSidebarProps, BrowserSidebarState> {
    private chatbox:ArboretumChatBox;
    constructor(props) {
        super(props);
        this.state = {
            isVisible:this.props.isVisible,
            serverActive:this.props.serverActive,
            shareURL:this.props.shareURL,
            adminURL:this.props.adminURL,
            sandbox:true
        };
    };
    public setVisible(isVisible:boolean):void {
        this.setState({isVisible});
    };
    private handleServerSwitchChange = async (serverActive:boolean):Promise<void> => {
        this.setState({serverActive});
        if(this.props.setServerActive) {
            const shareURLs = await this.props.setServerActive(serverActive);
            if(serverActive) {
                const {shareURL, adminURL} = shareURLs;
                this.setState({shareURL, adminURL});
            } else {
                this.setState({shareURL:'', adminURL:''});
            }
        }
    };
    private sendMessage = (message:string):void => {
        if(this.props.onSendMessage) { this.props.onSendMessage(message); }
    };
    private postToMTurk = ():void => {
        if(this.props.onPostTask) { this.props.onPostTask(this.state.sandbox); }
    };
    private onSandboxChange = (event:React.ChangeEvent<HTMLInputElement>) => {
        this.setState({sandbox: event.target.checked});
    };
    private adminURLRef = (el:HTMLInputElement):void => {
        if(el) {
            new Clipboard(el);
        }
    };
    private shareURLRef = (el:HTMLInputElement):void => {
        if(el) {
            new Clipboard(el);
        }
    };
    private chatBoxRef = (chatbox:ArboretumChatBox):void => {
        this.chatbox = chatbox;
    };

    public setSDB(sdb:SDB):void {
        if(this.chatbox) {
            this.chatbox.setSDB(sdb);
        }
    };
    public render():React.ReactNode {
        return <div className='sidebar'>
            <table id="server-controls">
                <thead>
                    <tr>
                        <td>
                            <h5 className="nav-group-title">Server</h5>
                        </td>
                        <td>
                            <h5 className="nav-group-title">Share URL</h5>
                        </td>
                        <td>
                            <h5 className="nav-group-title">Admin URL</h5>
                        </td>
                        <td>
                            <h5 className="nav-group-title">MTurk</h5>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr id="control_content">
                        <td>
                            <Switch height={24} width={48} onChange={this.handleServerSwitchChange} checked={this.state.serverActive} />
                        </td>
                        <td className="copy_area">
                            <input ref={this.shareURLRef} value={this.state.shareURL} id="share_url" data-disabled="true"/>
                            <span ref={(el) => (el)} data-clipboard-target="#share_url" id="share_copy" className="icon icon-clipboard"></span>
                        </td>
                        <td className="copy_area">
                            <input ref={this.adminURLRef} value={this.state.adminURL} id="admin_url" data-disabled="true"/>
                            <span data-clipboard-target="#admin_url" id="admin_copy" className="icon icon-clipboard"></span>
                        </td>
                        <td>
                            <button onClick={this.postToMTurk} id="mturk_post" className='btn btn-default'><span className="icon icon-upload-cloud"></span>&nbsp;Post</button>
                            <br />
                            <label><input type="checkbox" name="sandbox" value="sandbox" id="sandbox" checked={this.state.sandbox} onChange={this.onSandboxChange}/> Sandbox</label>
                        </td>
                    </tr>
                </tbody>
            </table>
            <ArboretumChatBox username="Admin" ref={this.chatBoxRef} onSendMessage={this.sendMessage} />
        </div>;
    };
};
