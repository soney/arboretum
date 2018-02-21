import * as $ from 'jquery';
import {SDB, SDBDoc} from '../utils/sharedb_wrapper';
import {ArboretumChat} from '../utils/chat_doc';

const wsAddress:string = `ws://${window.location.hostname}:${window.location.port}`;
const socket:WebSocket = new WebSocket(wsAddress);
console.log(socket);

const sdb = new SDB(true, socket);
const chat = new ArboretumChat(sdb);
chat.addUser('steve', true);
console.log(chat);
