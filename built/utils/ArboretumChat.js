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
const ColoredLogger_1 = require("./ColoredLogger");
const log = ColoredLogger_1.getColoredLogger('red');
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
var PAMAction;
(function (PAMAction) {
    PAMAction[PAMAction["ACCEPT"] = 0] = "ACCEPT";
    PAMAction[PAMAction["REJECT"] = 1] = "REJECT";
    PAMAction[PAMAction["FOCUS"] = 2] = "FOCUS";
    PAMAction[PAMAction["REQUEST_LABEL"] = 3] = "REQUEST_LABEL";
    PAMAction[PAMAction["ADD_LABEL"] = 4] = "ADD_LABEL";
})(PAMAction = exports.PAMAction || (exports.PAMAction = {}));
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
        this.userNameChanged = this.registerEvent();
        this.messageAdded = this.registerEvent();
        this.messageRemoved = this.registerEvent();
        this.pamStateChanged = this.registerEvent();
        this.commandIssued = this.registerEvent();
        this.ready = this.registerEvent();
        if (this.sdb.isServer()) {
            this.sdb.use('op', (request, next) => {
                const { collection, id, agent } = request;
                const { clientId, stream } = agent;
                if (collection === ArboretumChat.COLLECTION && id === ArboretumChat.DOC_ID) {
                    if (request.op && request.op.src === clientId) {
                        const ops = request.op.op;
                        const { src } = request.op;
                        ops.forEach((op) => {
                            const { p } = op;
                            if (p[0] === 'users') {
                                const li = op['li'];
                                if (p.length === 2 && li) {
                                    const { ws } = stream;
                                    if (ws) {
                                        if (this.showDebug()) {
                                            log.debug(p);
                                            log.debug(li);
                                        }
                                        if (this.showDebug()) {
                                            log.debug(`User ${li.displayName} is on socket ${ws.id}`);
                                        }
                                        ws.once('close', () => __awaiter(this, void 0, void 0, function* () {
                                            const user = yield this.getUserByID(li.id);
                                            if (this.showDebug()) {
                                                log.debug(`Socket ${ws.id} closed`);
                                                log.debug(`Marking ${user.displayName} as not present due to socket close`);
                                            }
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
        this.initialized = this.initializeDoc();
        this.initialized.catch((err) => {
            console.error(err);
        });
    }
    ;
    hasUser(name, onlyPresent = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
            for (let i = 0; i < data.users.length; i++) {
                const u = data.users[i];
                if (u.displayName === name) {
                    if (onlyPresent) {
                        if (u.present) {
                            return true;
                        }
                    }
                    else {
                        return true;
                    }
                }
            }
            return false;
        });
    }
    ;
    validateUsername(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.trim();
            if (name.length < 2) {
                return { valid: false, feedback: 'Must be more than 2 characters long' };
            }
            else if (name.length >= 20) {
                return { valid: false, feedback: 'Must be less than 20 characters long' };
            }
            else if (!name.match(/^[a-z0-9_\\-]+$/i)) {
                return { valid: false, feedback: 'May only contain letters, numbers, and dashes' };
            }
            else if (yield this.hasUser(name)) {
                return { valid: false, feedback: `There is already a user with name ${name}` };
            }
            else {
                return { valid: true };
            }
        });
    }
    ;
    static pageActionsEqual(a1, a2) {
        if (a1.type === a2.type) {
            if (a1.data && a2.data) {
                if (a1.data.targetNodeID === a2.data.targetNodeID) {
                    return true;
                }
            }
        }
        return false;
    }
    ;
    static describePageAction(action) {
        const { type, data } = action;
        if (type === 'navigate') {
            const { url } = data;
            return `navigate to ${url}`;
        }
        else if (type === 'mouse_event') {
            const { targetNodeID, type } = data;
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription = nodeDescriptions[targetNodeID] || `element ${targetNodeID}`;
            return `${type} ${nodeDescription}`;
        }
        else if (type === 'setLabel') {
            const { nodeIDs, label } = data;
            const nodeID = nodeIDs[0];
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription = nodeDescriptions[nodeID] || `element ${nodeID}`;
            return `label "${nodeDescription}" as "${label}"`;
        }
        else if (type === 'getLabel') {
            const { targetNodeID, label } = data;
            const nodeDescriptions = data.nodeDescriptions || {};
            const nodeDescription = nodeDescriptions[targetNodeID] || `element ${targetNodeID}`;
            return `you to label "${nodeDescription}"`;
        }
        else {
            return `do ${type}`;
        }
    }
    ;
    static getActionDescription(action) {
        if (action === PAMAction.ACCEPT) {
            return 'accept';
        }
        else if (action === PAMAction.REJECT) {
            return 'reject';
        }
        else if (action === PAMAction.FOCUS) {
            return 'focus';
        }
        else if (action === PAMAction.REQUEST_LABEL) {
            return 'request label';
        }
        else if (action === PAMAction.ADD_LABEL) {
            return 'add label';
        }
        else {
            return '';
        }
    }
    ;
    static getStateDescription(pam) {
        const { action, state } = pam;
        if (state === PageActionState.NOT_PERFORMED) {
            return '';
        }
        else if (state === PageActionState.PERFORMED) {
            return 'accepted';
        }
        else if (state === PageActionState.REJECTED) {
            return 'rejected';
        }
        else {
            return '';
        }
    }
    ;
    static getActions(pam, isAdmin) {
        const { action, state } = pam;
        const { type } = action;
        if (type === 'navigate' || type === 'goBack' || type === 'goForward' || type === 'reload') {
            if (isAdmin && state === PageActionState.NOT_PERFORMED) {
                return [PAMAction.ACCEPT, PAMAction.REJECT];
            }
            else {
                return [];
            }
        }
        else if (type === 'mouse_event' || type === 'keyboard_event' || type === 'element_event') {
            if (isAdmin) {
                if (state === PageActionState.NOT_PERFORMED) {
                    return [PAMAction.ACCEPT, PAMAction.REJECT, PAMAction.FOCUS]; //, PAMAction.REQUEST_LABEL];
                }
                else {
                    return [PAMAction.FOCUS]; //, PAMAction.REQUEST_LABEL];
                }
            }
            else {
                return []; //PAMAction.ADD_LABEL];
            }
        }
        else if (type === 'getLabel') {
            if (isAdmin) {
                return [PAMAction.FOCUS];
            }
            else {
                return [PAMAction.FOCUS]; //, PAMAction.ADD_LABEL];
            }
        }
        else if (type === 'setLabel') {
            if (isAdmin) {
                if (state === PageActionState.NOT_PERFORMED) {
                    return [PAMAction.ACCEPT, PAMAction.REJECT, PAMAction.FOCUS];
                }
                else {
                    return [PAMAction.FOCUS];
                }
            }
            else {
                return [];
            }
        }
        else {
            return [];
        }
    }
    ;
    static retargetPageAction(pa, tabID, nodeMap) {
        const { type, data } = pa;
        let newData = _.clone(data);
        if (type === 'navigate' || type === 'goBack' || type === 'goForward' || type === 'reload') {
            newData = data;
        }
        else if (type === 'mouse_event' || type === 'keyboard_event' || type === 'element_event') {
            const { targetNodeID } = data;
            const newTarget = nodeMap.get(targetNodeID);
            if (newTarget) {
                newData.targetNodeID = newTarget;
            }
            else {
                return null;
            }
        }
        else if (type === 'getLabel') {
            return null;
        }
        else if (type === 'setLabel') {
            const { targetNodeID } = data;
            const newTarget = nodeMap.get(targetNodeID);
            if (newTarget) {
                newData.targetNodeID = newTarget;
            }
            else {
                return null;
            }
        }
        return { type, tabID, data: newData };
    }
    ;
    static getRelevantNodeIDs(action) {
        const { type, data } = action;
        const { targetNodeID } = data;
        if (targetNodeID) {
            return [targetNodeID];
        }
        else {
            return [];
        }
    }
    ;
    destroy() {
        this.leave();
        if (this.doc) {
            this.doc.destroy();
        }
    }
    ;
    initializeDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            this.doc = this.sdb.get(ArboretumChat.COLLECTION, ArboretumChat.DOC_ID);
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
            else if (p.length === 3 && p[2] === 'displayName') {
                const userIndex = p[1];
                const { oi, od } = op;
                const user = this.doc.getData().users[userIndex];
                this.userNameChanged.emit({ user });
            }
        }
        else if (p[0] === 'messages') {
            if (p.length === 2) {
                const { li, ld } = op;
                if (li) {
                    if (li.action && li.data && this.browserState) {
                        const pam = li;
                        const relevantNodeIDs = ArboretumChat.getRelevantNodeIDs(li.action);
                        const relevantNodes = relevantNodeIDs.map((id) => this.browserState.getNode(id));
                    }
                    this.messageAdded.emit({
                        message: li
                    });
                }
                else if (ld) {
                    this.messageRemoved.emit({
                        message: ld
                    });
                }
            }
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
    join(displayName, role) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addUser(displayName, role);
        });
    }
    ;
    addUser(displayName, role, isMe = true, present = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = guid_1.guid();
            const color = yield this.getColor(id);
            const user = { id, color, displayName, present, role, typing: TypingStatus.IDLE };
            yield this.initialized;
            if (this.showDebug()) {
                log.debug(`Adding user ${user.displayName}`);
            }
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
            message.id = guid_1.guid();
            yield this.doc.submitListPushOp(['messages'], message);
        });
    }
    ;
    removeMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messages } = yield this.getData();
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].id === message.id) {
                    yield this.doc.submitListDeleteOp(['messages', i]);
                    return true;
                }
            }
            return false;
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
    addPageActionMessage(action, nodeDescriptions = {}, sender = this.getMe()) {
        return __awaiter(this, void 0, void 0, function* () {
            // const nodeDescriptions = data.nodeDescriptions || {};
            // const action = { type, tabID, data };
            const message = { sender, action, nodeDescriptions, state: PageActionState.NOT_PERFORMED };
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
                    yield this.doc.submitObjectReplaceOp(['messages', i, 'state'], state);
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
    isFromUser(message, user = this.getMe()) {
        if (user) {
            return user.id === message.sender.id;
        }
        return false;
    }
    ;
    setUsername(name, user = this.getMe()) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
            const userIndex = yield this.getUserIndex(user);
            yield this.doc.submitObjectReplaceOp(['users', userIndex, 'displayName'], name);
        });
    }
    ;
    markUserNotPresent(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
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
    doCommand(chatStr) {
        const [command, ...params] = chatStr.split(' ');
        if (command === 'done') {
            this.commandIssued.emit({ command: 'done' });
            return true;
        }
        else if (command === 'boot') {
            const data = { user: params[0] };
            const message = params.slice(1).filter((s) => s.trim().length > 0).join(' ');
            if (message) {
                data.message = message;
            }
            this.commandIssued.emit({ command: 'boot', data });
            return true;
        }
        else {
            return false;
        }
    }
    ;
    shouldSuppressErrors() { return this.browserState ? this.browserState.shouldSuppressErrors() : true; }
    shouldShowErrors() { return !this.shouldSuppressErrors(); }
    showDebug() { return this.browserState ? this.browserState.showDebug() : true; }
    hideDebug() { return !this.showDebug(); }
}
ArboretumChat.COLLECTION = 'arboretum';
ArboretumChat.DOC_ID = 'chat';
ArboretumChat.userCounter = 1;
ArboretumChat.messageCounter = 1;
exports.ArboretumChat = ArboretumChat;
;
