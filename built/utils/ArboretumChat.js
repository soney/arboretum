"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TypedEventEmitter_1 = require("./TypedEventEmitter");
const guid_1 = require("./guid");
const _ = require("underscore");
exports.userColors = [
    ['#A80000', '#B05E0D', '#C19C00', '#107C10', '#038387', '#004E8C', '#5C126B']
];
var TypingStatus;
(function (TypingStatus) {
    TypingStatus[TypingStatus["IDLE"] = 0] = "IDLE";
    TypingStatus[TypingStatus["ACTIVE"] = 1] = "ACTIVE";
    TypingStatus[TypingStatus["IDLE_TYPED"] = 2] = "IDLE_TYPED";
})(TypingStatus = exports.TypingStatus || (exports.TypingStatus = {}));
;
;
;
;
;
;
;
;
;
;
;
class ArboretumChat extends TypedEventEmitter_1.TypedEventEmitter {
    constructor(sdb, browserState) {
        super();
        this.sdb = sdb;
        this.browserState = browserState;
        this.userJoined = this.registerEvent();
        this.userNotPresent = this.registerEvent();
        this.userTypingStatusChanged = this.registerEvent();
        this.messageAdded = this.registerEvent();
        this.ready = this.registerEvent();
        this.doc = this.sdb.get('arboretum', 'chat');
        this.initialized = this.initializeDoc();
        this.initialized.catch((err) => {
            console.error(err);
        });
    }
    ;
    static describePageActionMessage(pam) {
        const { action, data, performed } = pam;
        if (action === 'navigate') {
            const { url } = data;
            return `navigate to ${url}`;
        }
        else if (action === 'mouse_event') {
            const { targetNodeID, type, targetNodeDescription } = data;
            return `${type} ${targetNodeID}`;
        }
        else {
            return `do ${action}`;
        }
    }
    ;
    static getRelevantNodeIDs(pam) {
        const { action, data, performed } = pam;
        const { targetNodeID } = data;
        if (targetNodeID) {
            return [targetNodeID];
        }
        else {
            return [];
        }
    }
    ;
    initializeDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doc.createIfEmpty({
                users: [],
                messages: [],
                colors: _.shuffle(_.sample(exports.userColors))
            });
            this.doc.subscribe((ops, source, data) => {
                if (ops) {
                    ops.forEach((op) => this.handleOp(op));
                }
                else {
                    this.ready.emit();
                }
            });
        });
    }
    ;
    handleOp(op) {
        const { p, li } = op;
        if (p[0] === 'users') {
            if (p.length === 2 && li) {
                this.userJoined.emit({
                    user: li
                });
            }
            else if (p.length === 3 && p[2] === 'present') {
                const userIndex = p[1];
                const user = this.doc.getData().users[userIndex];
                this.userNotPresent.emit({ user });
            }
        }
        else if (p[0] === 'messages') {
            if (li.action && li.data && this.browserState) {
                const relevantNodeIDs = ArboretumChat.getRelevantNodeIDs(li);
                const relevantNodes = relevantNodeIDs.map((id) => this.browserState.getNode(id));
            }
            this.messageAdded.emit({
                message: li
            });
        }
    }
    ;
    getMe() {
        return this.meUser;
    }
    ;
    getColor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const { colors } = data;
            const index = guid_1.guidIndex(id) % colors.length;
            return colors[index];
        });
    }
    ;
    join(displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addUser(displayName);
        });
    }
    ;
    addUser(displayName, isMe = true, present = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = guid_1.guid();
            const color = yield this.getColor(id);
            const user = { id, color, displayName, present, typing: TypingStatus.IDLE };
            yield this.initialized;
            yield this.doc.submitListPushOp(['users'], user);
            if (isMe) {
                this.meUser = user;
            }
            return user;
        });
    }
    ;
    addMesssage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const timestamp = (new Date()).getTime();
            message.timestamp = (new Date()).getTime();
            message.id = ArboretumChat.messageCounter++;
            this.doc.submitListPushOp(['messages'], message);
        });
    }
    ;
    addTextMessage(content, sender = this.getMe()) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = { sender, content };
            this.addMesssage(message);
        });
    }
    ;
    addPageActionMessage(action, tabID, data = {}, sender = this.getMe()) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = { sender, action, tabID, data, performed: false };
            this.addMesssage(message);
        });
    }
    ;
    markPerformed(pam, performed = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = yield this.getMessages();
            const { id } = pam;
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (message.id === id) {
                    this.doc.submitObjectReplaceOp(['messages', i, 'performed'], performed);
                    break;
                }
            }
        });
    }
    ;
    getUserIndex(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            for (let i = 0; i < data.users.length; i++) {
                const u = data.users[i];
                if (user.id === u.id) {
                    return i;
                }
            }
            return -1;
        });
    }
    ;
    markUserNotPresent(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const userIndex = yield this.getUserIndex(user);
            yield this.doc.submitObjectReplaceOp(['users', userIndex, 'present'], false);
        });
    }
    ;
    leave() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.markUserNotPresent(this.getMe());
        });
    }
    ;
    setUserTypingStatus(user, typingStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const userIndex = yield this.getUserIndex(user);
            yield this.doc.submitObjectReplaceOp(['users', userIndex, 'typing'], typingStatus);
        });
    }
    ;
    getMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            return data.messages;
        });
    }
    ;
    getUsers(onlyPresent = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const { users } = data;
            if (onlyPresent) {
                return users.filter((u) => u.present);
            }
            else {
                return users;
            }
        });
    }
    ;
}
ArboretumChat.userCounter = 1;
ArboretumChat.messageCounter = 1;
exports.ArboretumChat = ArboretumChat;
;
