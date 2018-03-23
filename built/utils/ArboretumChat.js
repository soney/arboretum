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
var PageActionState;
(function (PageActionState) {
    PageActionState[PageActionState["NOT_PERFORMED"] = 0] = "NOT_PERFORMED";
    PageActionState[PageActionState["PERFORMED"] = 1] = "PERFORMED";
    PageActionState[PageActionState["REJECTED"] = 2] = "REJECTED";
})(PageActionState = exports.PageActionState || (exports.PageActionState = {}));
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
        this.pamStateChanged = this.registerEvent();
        this.ready = this.registerEvent();
        if (this.sdb.isServer()) {
            this.sdb.use('op', (request, next) => {
                if (request.collection === ArboretumChat.COLLECTION && request.id === ArboretumChat.DOC_ID) {
                    if (request.op) {
                        const ops = request.op.op;
                        ops.forEach((op) => {
                            const { p } = op;
                            if (p[0] === 'users') {
                                const li = op['li'];
                                if (p.length === 2 && li) {
                                    const { agent } = request;
                                    const { stream } = agent;
                                    const { ws } = stream;
                                    if (ws) {
                                        ws.once('close', () => __awaiter(this, void 0, void 0, function* () {
                                            const user = yield this.getUserByID(li.id);
                                            this.markUserNotPresent(user);
                                        }));
                                    }
                                }
                            }
                        });
                    }
                }
                next();
            });
        }
        this.doc = this.sdb.get(ArboretumChat.COLLECTION, ArboretumChat.DOC_ID);
        this.initialized = this.initializeDoc();
        this.initialized.catch((err) => {
            console.error(err);
        });
    }
    ;
    static describePageActionMessage(pam) {
        const { action, data, state } = pam;
        if (action === 'navigate') {
            const { url } = data;
            return `navigate to ${url}`;
        }
        else if (action === 'mouse_event') {
            const { targetNodeID, type } = data;
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription = nodeDescriptions[targetNodeID] || `element ${targetNodeID}`;
            return `${type} ${nodeDescription}`;
        }
        else if (action === 'setLabel') {
            const { nodeIDs, label } = data;
            const nodeID = nodeIDs[0];
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription = nodeDescriptions[nodeID] || `element ${nodeID}`;
            return `label "${nodeDescription}" as "${label}"`;
        }
        else {
            return `do ${action}`;
        }
    }
    ;
    static getRelevantNodeIDs(pam) {
        const { action, data, state } = pam;
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
        const { p } = op;
        if (p[0] === 'users') {
            const { li } = op;
            if (p.length === 2 && li) {
                this.userJoined.emit({
                    user: li
                });
            }
            else if (p.length === 3 && p[2] === 'present') {
                const userIndex = p[1];
                const { oi, od } = op;
                const user = this.doc.getData().users[userIndex];
                if (oi === false) {
                    this.userNotPresent.emit({ user });
                }
            }
        }
        else if (p[0] === 'messages') {
            const { li } = op;
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
    getUserByID(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
            for (let i = 0; i < data.users.length; i++) {
                const user = data.users[i];
                if (user.id === id) {
                    return user;
                }
            }
            return null;
        });
    }
    ;
    getColor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
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
            const nodeDescriptions = data.nodeDescriptions || {};
            const message = { sender, action, tabID, data, nodeDescriptions, state: PageActionState.NOT_PERFORMED };
            this.addMesssage(message);
        });
    }
    ;
    setState(pam, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = yield this.getMessages();
            const { id } = pam;
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                if (message.id === id) {
                    this.doc.submitObjectReplaceOp(['messages', i, 'state'], state);
                    this.pamStateChanged.emit({});
                    break;
                }
            }
        });
    }
    ;
    getUserIndex(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
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
            const data = yield this.getData();
            const userIndex = yield this.getUserIndex(user);
            yield this.doc.submitObjectReplaceOp(['users', userIndex, 'present'], false);
            // await this.doc.submitObjectDeleteOp(['users', userIndex, 'present']);
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
            const data = yield this.getData();
            const userIndex = yield this.getUserIndex(user);
            yield this.doc.submitObjectReplaceOp(['users', userIndex, 'typing'], typingStatus);
        });
    }
    ;
    getMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
            return data.messages;
        });
    }
    ;
    getUsers(onlyPresent = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
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
    getData() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            return this.doc.getData();
        });
    }
    ;
    stringify() {
        return __awaiter(this, void 0, void 0, function* () {
            return JSON.stringify(yield this.getData());
        });
    }
    ;
}
ArboretumChat.COLLECTION = 'arboretum';
ArboretumChat.DOC_ID = 'chat';
ArboretumChat.userCounter = 1;
ArboretumChat.messageCounter = 1;
exports.ArboretumChat = ArboretumChat;
;
