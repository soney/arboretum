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
class ArboretumChat extends TypedEventEmitter_1.TypedEventEmitter {
    constructor(sdb) {
        super();
        this.sdb = sdb;
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
    initializeDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doc.createIfEmpty({
                users: [],
                messages: [],
                colors: _.shuffle(_.sample(exports.userColors))
            });
            this.doc.subscribe((op, source, data) => {
                if (op) {
                    const opInfo = op[0];
                    const { p, li } = opInfo;
                    if (p[0] === 'users') {
                        if (p.length === 2 && li) {
                            this.emit(this.userJoined, {
                                user: li
                            });
                        }
                        else if (p.length === 3 && p[2] === 'present') {
                            const userIndex = p[1];
                            const user = this.doc.getData().users[userIndex];
                            this.emit(this.userNotPresent, { user });
                        }
                    }
                    else if (p[0] === 'messages') {
                        this.emit(this.messageAdded, {
                            message: li
                        });
                    }
                }
                else {
                    this.emit(this.ready);
                }
            });
        });
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
    addUser(displayName, isMe = true, present = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = guid_1.guid();
            const color = yield this.getColor(id);
            const user = { id, color, displayName, present, typing: TypingStatus.IDLE };
            yield this.initialized;
            const data = this.doc.getData();
            yield this.doc.submitOp([{ p: ['users', data.users.length], li: user }]);
            if (isMe) {
                this.meUser = user;
            }
            return user;
        });
    }
    ;
    addTextMessage(content, sender = this.getMe()) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const timestamp = (new Date()).getTime();
            const data = this.doc.getData();
            const message = { sender, timestamp, content };
            yield this.doc.submitOp([{ p: ['messages', data.messages.length], li: message }]);
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
            const oldValue = data.users[userIndex].present;
            yield this.doc.submitOp([{ p: ['users', userIndex, 'present'], od: oldValue, oi: false }]);
        });
    }
    ;
    setUserTypingStatus(user, typingStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const userIndex = yield this.getUserIndex(user);
            const oldValue = data.users[userIndex].typing;
            yield this.doc.submitOp([{ p: ['users', userIndex, 'typing'], od: oldValue, oi: typingStatus }]);
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
exports.ArboretumChat = ArboretumChat;
;
