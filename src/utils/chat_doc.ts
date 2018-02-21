import {SDB, SDBDoc} from './sharedb_wrapper';
import {EventEmitter} from 'typed-event-emitter';

export enum TypingStatus { IDLE, ACTIVE, IDLE_TYPED };

export type UserID = number;
export interface User {
    id:UserID,
    displayName:string,
    present:boolean,
    typing:TypingStatus
};
export interface Message {
    sender:User,
    timestamp:number
};
export interface TextMessage extends Message{
    content:string
};

export interface ChatDoc {
    users:Array<User>
    messages:Array<Message>
};

export interface UserJoinedEvent {
    user:User,
    after:User
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
    after:Message
};

export class ArboretumChat extends EventEmitter {
    private static userCounter:number = 1;
    private doc:SDBDoc<ChatDoc>;
    public initialized:Promise<void>;
    private meUser:User;
    public userJoined = this.registerEvent<(UserJoinedEvent)=>void>();
    public userNotPresent = this.registerEvent<(UserNotPresentEvent)=>void>();
    public userTypingStatusChanged = this.registerEvent<(UserTypingStatusChangedEvent)=>void>();
    public messageAdded = this.registerEvent<(MessageAddedEvent)=>void>();
    constructor(private sdb:SDB) {
        super();
        this.doc = this.sdb.get<ChatDoc>('arboretum', 'chat');
        this.initialized = this.initializeDoc();
        this.initialized.catch((err) => {
            console.error(err);
        });
    };
    private async initializeDoc():Promise<void> {
        await this.doc.createIfEmpty({
            users: [],
            messages: []
        });
        this.doc.subscribe((op, source, data) => {
            const opInfo = op[0];
            const {p, li} = opInfo;
            if(p[0] === 'users') {
                if(p.length === 2 && li) { // user added
                    this.emit(this.userJoined, {
                        user:li
                    });
                }
            } else if(p[0] === 'messages') {
                this.emit(this.messageAdded, {
                    message:li
                });
            }
            console.log(op);
        });
    };
    public getMe():User {
        return this.meUser;
    };
    public async addUser(displayName:string, isMe:boolean, present=true):Promise<User> {
        const id:UserID = ArboretumChat.userCounter++;
        const user:User = {id, displayName, present, typing:TypingStatus.IDLE};
        await this.initialized;

        const data:ChatDoc = this.doc.getData();
        await this.doc.submitOp([{p:['users', data.users.length], li:user}]);
        if(isMe) { this.meUser = user; }
        return user;
    };
    public async addTextMessage(sender:User, content:string):Promise<void> {
        await this.initialized;

        const timestamp:number = (new Date()).getTime()
        const data:ChatDoc = this.doc.getData();
        const message:TextMessage = {sender, timestamp, content};
        await this.doc.submitOp([{p:['messages', data.messages.length], li:message}]);
    };
    private async getUserIndex(user:User):Promise<number> {
        await this.initialized;
        const data:ChatDoc = this.doc.getData();
        for(let i = 0; i<data.users.length; i++) {
            const u = data.users[i];
            if(user.id === u.id) {
                return i;
            }
        }
        return -1;
    };
    public async markUserNotPresent(user:User):Promise<void> {
        await this.initialized;
        const data:ChatDoc = this.doc.getData();
        const userIndex:number = await this.getUserIndex(user);
        const oldValue = data.users[userIndex].present;
        await this.doc.submitOp([{p:['users', userIndex, 'present'], od:oldValue, oi:false}]);
    };
    public async setUserTypingStatus(user:User, typingStatus:TypingStatus):Promise<void> {
        await this.initialized;
        const data:ChatDoc = this.doc.getData();
        const userIndex:number = await this.getUserIndex(user);
        const oldValue = data.users[userIndex].typing;
        await this.doc.submitOp([{p:['users', userIndex, 'typing'], od:oldValue, oi:typingStatus}]);
    };
};
