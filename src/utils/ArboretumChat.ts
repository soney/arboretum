import {SDB, SDBDoc} from './ShareDBDoc';
import {TypedEventEmitter} from './TypedEventEmitter';
import {guid, guidIndex} from './guid';
import * as _ from 'underscore';
import {BrowserState} from '../server/state/BrowserState';
import { getColoredLogger, level, setLevel } from './ColoredLogger';

const log = getColoredLogger('red');

export type Color = string;
export const userColors:Array<Array<Color>> = [
    ['#A80000', '#B05E0D', '#C19C00', '#107C10', '#038387', '#004E8C', '#5C126B' ]
];
export enum TypingStatus { IDLE, ACTIVE, IDLE_TYPED };
export enum PageActionState { NOT_PERFORMED, PERFORMED, REJECTED };
export type PageActionType ='navigate'|'goBack'|'goForward'|'mouse_event'|'keyboard_event'|'element_event'|'focus_event'|'reload'|'getLabel'|'setLabel';
export enum PAMAction { ACCEPT, REJECT, FOCUS, REQUEST_LABEL, ADD_LABEL};

export type ChatCommandType ='help'|'done'|'setname'|'boot';
export type UserRole = 'admin' | 'user' | 'helper';

export type UserID = string;
export interface User {
    id:UserID,
    role:UserRole,
    displayName:string,
    present:boolean,
    typing:TypingStatus,
    color:Color
};
export interface Message {
    sender:User,
    timestamp?:number,
    id?:string,
};
export interface TextMessage extends Message {
    content:string
};
export interface PageAction {
    type:PageActionType,
    tabID:CRI.TabID,
    data:any
}
export interface PageActionMessage extends Message {
    action:PageAction,
    state:PageActionState,
    nodeDescriptions:{[id:number]:string;}
};

export interface ChatDoc {
    users:Array<User>,
    messages:Array<Message>,
    colors:Array<Color>
};

export interface UserJoinedEvent {
    user:User,
    after?:User
};
export interface UserNotPresentEvent {
    user:User
};
export interface UserTypingStatusChangedEvent {
    user:User,
    typing:TypingStatus
};
export interface MessageAddedEvent {
    message:Message,
    after?:Message
};
export interface UserNameChangedEvent {
    user:User
};
export interface MessageRemovedEvent {
    message:Message
};
export interface ChatCommandEvent {
    command:ChatCommandType,
    data?:any
};

export interface ReadyEvent { };
export interface PAMStateChanged { };

export class ArboretumChat extends TypedEventEmitter {
    private static COLLECTION:string = 'arboretum';
    private static DOC_ID:string = 'chat';
    private static userCounter:number = 1;
    private static messageCounter:number = 1;
    private doc:SDBDoc<ChatDoc>;
    public initialized:Promise<void>;
    private meUser:User;
    public userJoined = this.registerEvent<UserJoinedEvent>();
    public userNotPresent = this.registerEvent<UserNotPresentEvent>();
    public userTypingStatusChanged = this.registerEvent<UserTypingStatusChangedEvent>();
    public userNameChanged = this.registerEvent<UserNameChangedEvent>();
    public messageAdded = this.registerEvent<MessageAddedEvent>();
    public messageRemoved = this.registerEvent<MessageRemovedEvent>();
    public pamStateChanged = this.registerEvent<PAMStateChanged>();
    public commandIssued = this.registerEvent<ChatCommandEvent>();
    public ready = this.registerEvent<ReadyEvent>();
    constructor(private sdb:SDB, private browserState?:BrowserState) {
        super();

        if(this.sdb.isServer()) {
            this.sdb.use('op', (request, next) => {
                const {collection, id, agent} = request;
                const {clientId, stream} = agent;
                if(collection === ArboretumChat.COLLECTION && id === ArboretumChat.DOC_ID) {
                    if(request.op && request.op.src === clientId) {
                        const ops = request.op.op;
                        const {src} = request.op;
                        ops.forEach((op) => {
                            const {p} = op;
                            if(p[0] === 'users') {
                                const li = op['li'];
                                if(p.length === 2 && li) { // user added
                                    const {ws} = stream;
                                    if(ws) {
                                        if(this.showDebug()) {
                                            log.debug(p);
                                            log.debug(li);
                                        }
                                        if(this.showDebug()) {
                                            log.debug(`User ${li.displayName} is on socket ${ws.id}`);
                                        }
                                        ws.once('close', async () => {
                                            const user:User = await this.getUserByID(li.id);
                                            if(this.showDebug()) {
                                                log.debug(`Socket ${ws.id} closed`);
                                                log.debug(`Marking ${user.displayName} as not present due to socket close`);
                                            }
                                            this.markUserNotPresent(user);
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
                next();
            });
        }

        this.initialized = this.initializeDoc();
        this.initialized.catch((err) => {
            console.error(err);
        });
    };
    private async hasUser(name:string, onlyPresent:boolean=true):Promise<boolean> {
        const data:ChatDoc = await this.getData();
        for(let i = 0; i<data.users.length; i++) {
            const u = data.users[i];
            if(u.displayName === name) {
                if(onlyPresent) {
                    if(u.present) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
        return false;
    };
    public async validateUsername(name:string):Promise<{valid:boolean, feedback?:string}> {
        name = name.trim();
        if(name.length < 2) {
            return {valid: false, feedback: 'Must be more than 2 characters long'};
        } else if(name.length >= 20) {
            return {valid: false, feedback: 'Must be less than 20 characters long'};
        } else if(!name.match(/^[a-z0-9_\\-]+$/i)) {
            return {valid: false, feedback: 'May only contain letters, numbers, and dashes'};
        } else if(await this.hasUser(name)) {
            return {valid: false, feedback: `There is already a user with name ${name}`};
        } else {
            return {valid: true};
        }
    };
    public static pageActionsEqual(a1:PageAction, a2:PageAction):boolean {
        if(a1.type === a2.type) {
            if(a1.data && a2.data) {
                if(a1.data.targetNodeID === a2.data.targetNodeID) {
                    return true;
                }
            }
        }
        return false;
    };
    public static describePageAction(action:PageAction):string {
        const {type, data} = action;
        if(type === 'navigate') {
            const {url} = data;
            return `navigate to ${url}`;
        } else if(type === 'mouse_event') {
            const {targetNodeID, type} = data;
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription:string = nodeDescriptions[targetNodeID] || `element ${targetNodeID}`;
            return `${type} ${nodeDescription}`;
        } else if(type === 'setLabel') {
            const {nodeIDs, label} = data;
            const nodeID = nodeIDs[0];
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription:string = nodeDescriptions[nodeID] || `element ${nodeID}`;
            return `label "${nodeDescription}" as "${label}"`;
        } else if(type === 'getLabel') {
            const {targetNodeID, label} = data;
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription:string = nodeDescriptions[targetNodeID] || `element ${targetNodeID}`;
            return `you to label "${nodeDescription}"`;
        } else {
            return `do ${type}`;
        }
    };
    public static getActionDescription(action:PAMAction):string {
        if(action === PAMAction.ACCEPT) {
            return 'accept';
        } else if(action === PAMAction.REJECT) {
            return 'reject';
        } else if(action === PAMAction.FOCUS) {
            return 'focus';
        } else if(action === PAMAction.REQUEST_LABEL) {
            return 'request label';
        } else if(action === PAMAction.ADD_LABEL) {
            return 'add label';
        } else {
            return '';
        }
    };
    public static getStateDescription(pam:PageActionMessage):string {
        const {action, state} = pam;
        if(state === PageActionState.NOT_PERFORMED) {
            return '';
        } else if(state === PageActionState.PERFORMED) {
            return 'accepted';
        } else if(state === PageActionState.REJECTED) {
            return 'rejected';
        } else {
            return '';
        }
    };
    public static getActions(pam:PageActionMessage, isAdmin:boolean) {
        const {action, state} = pam;
        const {type} = action;
        if(type === 'navigate' || type === 'goBack' || type === 'goForward' || type === 'reload') {
            if(isAdmin && state === PageActionState.NOT_PERFORMED) {
                return [PAMAction.ACCEPT, PAMAction.REJECT];
            } else {
                return [];
            }
        } else if(type === 'mouse_event' || type === 'keyboard_event' || type === 'element_event') {
            if(isAdmin) {
                if(state === PageActionState.NOT_PERFORMED) {
                    return [PAMAction.ACCEPT, PAMAction.REJECT, PAMAction.FOCUS];//, PAMAction.REQUEST_LABEL];
                } else {
                    return [PAMAction.FOCUS];//, PAMAction.REQUEST_LABEL];
                }
            } else {
                return [];//PAMAction.ADD_LABEL];
            }
        } else if(type === 'getLabel') {
            if(isAdmin) {
                return [PAMAction.FOCUS];
            } else {
                return [PAMAction.FOCUS];//, PAMAction.ADD_LABEL];
            }
        } else if(type === 'setLabel') {
            if(isAdmin) {
                if(state === PageActionState.NOT_PERFORMED) {
                    return [PAMAction.ACCEPT, PAMAction.REJECT, PAMAction.FOCUS];
                } else {
                    return [PAMAction.FOCUS];
                }
            } else {
                return [];
            }
        } else {
            return [];
        }
    };
    public static retargetPageAction(pa:PageAction, tabID:CRI.TabID, nodeMap:Map<CRI.NodeID, CRI.NodeID>):PageAction {
        const {type, data} = pa;
        let newData:any = _.clone(data);
        if(type === 'navigate' || type === 'goBack' || type === 'goForward' || type === 'reload') {
            newData = data;
        } else if(type === 'mouse_event' || type === 'keyboard_event' || type === 'element_event') {
            const {targetNodeID} = data;
            const newTarget = nodeMap.get(targetNodeID);
            if(newTarget) {
                newData.targetNodeID = newTarget
            } else {
                return null;
            }
        } else if(type === 'getLabel') {
            return null;
        } else if(type === 'setLabel') {
            const {targetNodeID} = data;
            const newTarget = nodeMap.get(targetNodeID);
            if(newTarget) {
                newData.targetNodeID = newTarget
            } else {
                return null;
            }
        }
        return { type, tabID, data:newData };
    };
    public static getRelevantNodeIDs(action:PageAction):Array<CRI.NodeID> {
        const {type, data} = action;
        const {targetNodeID} = data;
        if(targetNodeID) {
            return [targetNodeID];
        } else {
            return [];
        }
    };
    public destroy():void {
        this.leave();
        if(this.doc) {
            this.doc.destroy();
        }
    };
    private async initializeDoc():Promise<void> {
        this.doc = this.sdb.get<ChatDoc>(ArboretumChat.COLLECTION, ArboretumChat.DOC_ID);
        await this.doc.createIfEmpty({
            users: [],
            messages: [],
            colors: _.shuffle(_.sample(userColors))
        });
        this.doc.subscribe((ops, source, data) => {
            if(ops) {
                ops.forEach((op) => this.handleOp(op));
            } else {
                this.ready.emit();
            }
        });
    };
    private handleOp(op) {
        const {p} = op;
        if(p[0] === 'users') {
            const {li} = op;
            if(p.length === 2 && li) { // user added
                this.userJoined.emit({
                    user:li
                });
            } else if(p.length === 3 && p[2] === 'present') { // presence status changed
                const userIndex = p[1];
                const {oi, od} = op;
                const user = this.doc.getData().users[userIndex];
                if(oi === false) {
                    this.userNotPresent.emit({ user });
                }
            } else if(p.length === 3 && p[2] === 'displayName') { // display name changed
                const userIndex = p[1];
                const {oi, od} = op;
                const user = this.doc.getData().users[userIndex];
                this.userNameChanged.emit({user})
            }
        } else if(p[0] === 'messages') {
            if(p.length === 2) {
                const {li, ld} = op;
                if(li) {
                    if(li.action && li.data && this.browserState) {
                        const pam = li as PageActionMessage;
                        const relevantNodeIDs:Array<CRI.NodeID> = ArboretumChat.getRelevantNodeIDs(li.action);
                        const relevantNodes = relevantNodeIDs.map((id) => this.browserState.getNode(id));
                    }
                    this.messageAdded.emit({
                        message:li
                    });
                } else if(ld) {
                    this.messageRemoved.emit({
                        message:ld
                    });
                }
            }
        }
    };
    public getMe():User {
        return this.meUser;
    };
    public async getUserByID(id:UserID):Promise<User> {
        const data:ChatDoc = await this.getData();
        for(let i = 0; i<data.users.length; i++) {
            const user:User = data.users[i];
            if(user.id === id) { return user; }
        }
        return null;
    };
    private async getColor(id:UserID):Promise<Color> {
        const data:ChatDoc = await this.getData();
        const {colors} = data;
        const index = guidIndex(id) % colors.length;
        return colors[index];
    };
    public async join(displayName:string, role:UserRole):Promise<User> {
        return this.addUser(displayName, role);
    };
    public async addUser(displayName:string, role:UserRole, isMe:boolean=true, present=true):Promise<User> {
        const id:UserID = guid();
        const color:Color = await this.getColor(id);
        const user:User = {id, color, displayName, present, role, typing:TypingStatus.IDLE};
        await this.initialized;

        if(this.showDebug()) {
            log.debug(`Adding user ${user.displayName}`)
        }
        await this.doc.submitListPushOp(['users'], user);
        if(isMe) { this.meUser = user; }
        return user;
    };
    private async addMesssage(message:Message):Promise<void> {
        await this.initialized;
        const timestamp:number = (new Date()).getTime()
        message.timestamp = (new Date()).getTime();
        message.id = guid();
        await this.doc.submitListPushOp(['messages'], message);
    };
    public async removeMessage(message:Message):Promise<boolean> {
        const {messages} = await this.getData();
        for(let i = 0; i<messages.length; i++) {
            if(messages[i].id === message.id) {
                await this.doc.submitListDeleteOp(['messages', i]);
                return true;
            }
        }
        return false;
    };
    public async addTextMessage(content:string, sender:User=this.getMe()):Promise<void> {
        const message:TextMessage = {sender, content};
        this.addMesssage(message);
    };
    public async addPageActionMessage(action:PageAction, nodeDescriptions={}, sender:User=this.getMe()):Promise<void> {
        // const nodeDescriptions = data.nodeDescriptions || {};
        // const action = { type, tabID, data };
        const message:PageActionMessage = {sender, action, nodeDescriptions, state:PageActionState.NOT_PERFORMED}
        this.addMesssage(message);
    };
    public async setState(pam:PageActionMessage, state:PageActionState):Promise<void> {
        const messages = await this.getMessages();
        const {id} = pam;
        for(let i = 0; i<messages.length; i++) {
            const message:Message = messages[i];
            if(message.id === id) {
                await this.doc.submitObjectReplaceOp(['messages', i, 'state'], state);
                break;
            }
        }
    };
    private async getUserIndex(user:User):Promise<number> {
        const data:ChatDoc = await this.getData();
        for(let i = 0; i<data.users.length; i++) {
            const u = data.users[i];
            if(user.id === u.id) {
                return i;
            }
        }
        return -1;
    };
    public isFromUser(message:Message, user:User=this.getMe()):boolean {
        if(user) {
            return user.id === message.sender.id;
        }
        return false;
    };
    public async setUsername(name:string, user:User=this.getMe()):Promise<void> {
        const data:ChatDoc = await this.getData();
        const userIndex:number = await this.getUserIndex(user);
        await this.doc.submitObjectReplaceOp(['users', userIndex, 'displayName'], name);
    };
    public async markUserNotPresent(user:User):Promise<void> {
        const data:ChatDoc = await this.getData();
        const userIndex:number = await this.getUserIndex(user);
        await this.doc.submitObjectReplaceOp(['users', userIndex, 'present'], false);
    };
    public async leave():Promise<void> {
        await this.markUserNotPresent(this.getMe());
    };
    public async setUserTypingStatus(user:User, typingStatus:TypingStatus):Promise<void> {
        const data:ChatDoc = await this.getData();
        const userIndex:number = await this.getUserIndex(user);
        await this.doc.submitObjectReplaceOp(['users', userIndex, 'typing'], typingStatus);
    };
    public async getMessages():Promise<Array<Message>> {
        const data:ChatDoc = await this.getData();
        return data.messages;
    };
    public async getUsers(onlyPresent:boolean = true):Promise<Array<User>> {
        const data:ChatDoc = await this.getData();
        const {users} = data;
        if(onlyPresent) {
            return users.filter((u) => u.present);
        } else {
            return users;
        }
    };
    public async getData():Promise<ChatDoc> {
        await this.initialized;
        return this.doc.getData();
    };
    public async stringify():Promise<string> {
        return JSON.stringify(await this.getData());
    };
    public doCommand(chatStr:string):boolean {
        const [command, ...params] = chatStr.split(' ');
        if(command === 'done') {
            this.commandIssued.emit({command:'done'});
            return true;
        } else if(command === 'boot') {
            const data:any = {user: params[0]};
            const message = params.slice(1).filter((s) => s.trim().length>0).join(' ');
            if(message) {
                data.message = message;
            }
            this.commandIssued.emit({command:'boot', data});
            return true;
        } else {
            return false;
        }
    };
    public shouldSuppressErrors():boolean { return this.browserState ? this.browserState.shouldSuppressErrors() : true; }
    public shouldShowErrors():boolean { return !this.shouldSuppressErrors(); }
    public showDebug():boolean { return this.browserState ? this.browserState.showDebug() : true; }
    public hideDebug():boolean { return !this.showDebug(); }
};
