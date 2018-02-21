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
class ArboretumChat {
    constructor(sdb) {
        this.sdb = sdb;
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
                messages: []
            });
            this.doc.subscribe((op, source, data) => {
                console.log(op);
            });
        });
    }
    ;
    getMe() {
        return this.meUser;
    }
    ;
    addUser(displayName, isMe, present = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = ArboretumChat.userCounter++;
            const user = { id, displayName, present, typing: TypingStatus.IDLE };
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
    addTextMessage(sender, content) {
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
}
ArboretumChat.userCounter = 1;
exports.ArboretumChat = ArboretumChat;
;
