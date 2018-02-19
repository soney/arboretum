// import {Arboretum} from '../browser_main';
// import {Chat} from './chat';
// import * as Clipboard from 'clipboard';
// // import * as _toggles from 'jquery-toggles';
// import 'jquery-toggles';
//
//
// const API_KEY = 'FN0FXKCHSRapKomlD7JeF4AJQGNZPKf12Tvv9ebA';
// export class Sidebar {
//     private chat:Chat;
//     constructor(private arboretum:Arboretum) {
//         this.chat = new Chat(this.arboretum);
//         $('.sidebar .toggle').toggles({
//             clicker: $('.switch_label'),
//             width: 50
//         }).on('toggle', (event, isActive) => {
//             if (isActive) {
//                 this.startServer();
//             } else {
//                 this.stopServer();
//             }
//         });
//
//         $('#mturk_post').on('click', () => {
//             this.postToMTurk();
//         });
//
//         new Clipboard('#admin_copy');
//         new Clipboard('#share_copy');
//         $('.copy_area input').on('click', (event) => {
//             const target = $(event.target);
//             target.select();
//         });
//
//         this.chat.disable();
//
//         // this.startServer();
//     }
//
//     populateShareURLs() {
//         $('#share_url').val('loading...');
//         $('#admin_url').val('loading...');
//
//         this.getMyShortcut().then(function(url) {
//             $('#share_url').val(url.replace('http://', '')).prop('disabled', false);
//         });
//         this.getMyShortcut('/a').then(function(url) {
//             $('#admin_url').val(url.replace('http://', '')).prop('disabled', false);
//         });
//     }
//
//     startServer() {
//         this.chat.enable();
//         const {ipcRenderer} = require('electron');
//         ipcRenderer.send('asynchronous-message', 'startServer');
//         // this.populateShareURLs();
//         // remote.getCurrentWindow().emit('startServer', () => {
//         //     ipcRenderer.send('asynchronous-message','test');
//         //     this.chat.connect();
//         // });
//     }
//
//     private stopServer():void {
//         ipcRenderer.send('asynchronous-message', 'stopServer');
//         $('#share_url').val('').prop('disabled', true);
//         $('#admin_url').val('').prop('disabled', true);
//         this.chat.clear();
//         this.chat.disable();
//     }
//
//     postToMTurk() {
//         console.log($('#sandbox').is(":checked"));
//
//         remote.getCurrentWindow().emit('postHIT', {
//             share_url: 'http://'+$('#share_url').val(),
//             sandbox: $('#sandbox').is(":checked")
//         }, _.bind(() => {
//             console.log('posted!')
//         }, this));
//     }
//
//     private async getMyShortcut(address:string, path:string):Promise<string> {
//         const url = require('url');
//         return Sidebar.getIPAddress().then(function(ip) {
//             var myLink = url.format({
//                 protocol: 'http',
//                 hostname: ip,
//                 port: 3000,
//                 pathname: path || '/'
//             });
//             return Sidebar.getShortcut(myLink)
//         }).then(function(result) {
//             const shortcut = result.shortcut;
//             return url.format({
//                 protocol: 'http',
//                 hostname: 'arbor.site',
//                 pathname: shortcut
//             });
//         });
//     }
//
//     private static async getShortcut(url:string):Promise<string> {
//         return new Promise<string>((resolve, reject) => {
//             $.ajax({
//                 method: 'PUT',
//                 url: 'https://api.arbor.site',
//                 contentType: 'application/json',
//                 headers: {
//                     'x-api-key': API_KEY
//                 },
//                 data: JSON.stringify({
//                     target: url
//                 })
//             }).done((data) => {
//                 resolve(data);
//             }).fail((err) => {
//                 reject(err);
//             });
//         });
//     }
// }
import * as React from 'react';
import {ArboretumChat} from './chat';

const ENTER_KEY:number = 13;

type ArboretumSidebarProps = {
};
type ArboretumSidebarState = {
};

export class ArboretumSidebar extends React.Component<ArboretumSidebarProps, ArboretumSidebarState> {
    constructor(props) {
        super(props);
        this.state = {
        };
    };

    public render():React.ReactNode {
        return <div className='sidebar'>
            <table id="server-controls">
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
                <tr id="control_content">
                    <td>
                        <div data-type="checkbox" className="toggle toggle-modern"></div>
                    </td>
                    <td className="copy_area">
                        <input id="share_url" value="" data-disabled="true"/>
                        <span data-clipboard-target="#share_url" id="share_copy" className="icon icon-clipboard"></span>
                    </td>
                    <td className="copy_area">
                        <input id="admin_url" value="" data-disabled="true"/>
                        <span data-clipboard-target="#admin_url" id="admin_copy" className="icon icon-clipboard"></span>
                    </td>
                    <td>
                        <button id="mturk_post" className='btn btn-default'><span className="icon icon-upload-cloud"></span>&nbsp;Post</button>
                        <br />
                        <label><input data-type="checkbox" name="sandbox" value="sandbox" id="sandbox" data-checked="checked"/> Sandbox</label>
                    </td>
                </tr>
            </table>
            <ArboretumChat />
        </div>;
    };
};
