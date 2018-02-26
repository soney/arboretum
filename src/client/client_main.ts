import * as $ from 'jquery';
import {SDB, SDBDoc} from '../utils/sharedb_wrapper';
import {ArboretumChat} from '../utils/chat_doc';
import {ShareDBDOMNode, ShareDBFrame, TabDoc, BrowserDoc} from '../utils/state_interfaces';

const wsAddress:string = `ws://${window.location.hostname}:${window.location.port}`;
const socket:WebSocket = new WebSocket(wsAddress);
console.log(socket);

const sdb = new SDB(true, socket);
const chat = new ArboretumChat(sdb);
chat.addUser('steve', true);

const browser:SDBDoc<BrowserDoc> = sdb.get('arboretum', 'browser');
browser.subscribe(() => {
    console.log(browser.getData());
});

window.addEventListener('beforeunload', () => {
    chat.markUserNotPresent(chat.getMe());
});
