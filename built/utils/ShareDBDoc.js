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
const ShareDBClient = require("sharedb/lib/client");
const ShareDB = require("sharedb");
class SDB {
    constructor(client, connection) {
        this.docs = new Map();
        if (client) {
            this.connection = new ShareDBClient.Connection(connection);
        }
        else {
            this.share = new ShareDB();
            this.connection = this.share.connect();
        }
    }
    ;
    getDocIdentifier(collectionName, documentID) {
        return [collectionName, documentID];
    }
    ;
    listen(stream) {
        this.share.listen(stream);
    }
    ;
    get(collectionName, documentID) {
        const docIdentifier = this.getDocIdentifier(collectionName, documentID);
        let sdbDoc;
        if (this.docs.has(docIdentifier)) {
            sdbDoc = this.docs.get(docIdentifier);
        }
        else {
            const doc = this.connection.get(collectionName, documentID);
            sdbDoc = new SDBDoc(docIdentifier, doc, this);
            this.docs.set(docIdentifier, sdbDoc);
        }
        return sdbDoc;
    }
    ;
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                if (this.share) {
                    this.share.close(() => {
                        resolve(null);
                    });
                }
            });
        });
    }
    ;
    deleteDoc(doc) {
        this.docs.delete(doc.docIdentifier);
    }
    ;
}
exports.SDB = SDB;
;
class SDBDoc {
    constructor(docIdentifier, doc, sdb) {
        this.docIdentifier = docIdentifier;
        this.doc = doc;
        this.sdb = sdb;
    }
    ;
    traverse(path) {
        let x = this.getData();
        for (let i = 0; i < path.length; i++) {
            x = x[path[i]];
        }
        return x;
    }
    ;
    submitObjectReplaceOp(p, oi, od = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, oi, od };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitObjectInsertOp(p, oi) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, oi };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitObjectDeleteOp(p, od = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, od };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListReplaceOp(p, li, ld = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, li, ld };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListInsertOp(p, li) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, li };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListDeleteOp(p, ld = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, ld };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListPushOp(p, ...items) {
        return __awaiter(this, void 0, void 0, function* () {
            const arr = this.traverse(p);
            const previousLength = arr.length;
            const ops = items.map((x, i) => {
                const op = { p: p.concat(previousLength + i), li: x };
                return op;
            });
            return yield this.submitOp(ops);
        });
    }
    ;
    submitListUnshiftOp(p, ...items) {
        return __awaiter(this, void 0, void 0, function* () {
            const arr = this.traverse(p);
            const previousLength = arr.length;
            const ops = items.map((x, i) => {
                const op = { p: p.concat(i), li: x };
                return op;
            });
            return yield this.submitOp(ops);
        });
    }
    ;
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.doc.fetch((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.doc);
                    }
                });
            });
        });
    }
    ;
    create(data, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.doc.create(data, type, options, () => {
                    resolve(this.doc);
                });
            });
        });
    }
    ;
    del(source = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                this.doc.del({ source }, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
            this.sdb.deleteDoc(this);
        });
    }
    ;
    subscribe(callback) {
        this.doc.subscribe((err) => {
            if (err) {
                throw (err);
            }
            callback(null, null, this.doc.data);
        });
        const onOpFunc = (ops, source) => {
            callback(ops, source, this.doc.data);
        };
        this.doc.on('op', onOpFunc);
        return () => {
            this.doc.removeListener('op', onOpFunc);
        };
    }
    ;
    submitOp(op, source = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                this.doc.submitOp(op, { source }, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    ;
    createIfEmpty(data, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.fetch();
            if (doc.type === null) {
                return this.create(data, type, options);
            }
            else {
                return doc;
            }
        });
    }
    ;
    getData() {
        return this.doc.data;
    }
    ;
    destroy() {
        this.doc.destroy();
        this.sdb.deleteDoc(this);
    }
    ;
}
exports.SDBDoc = SDBDoc;
;
class SDBObject {
    constructor(value) {
        this.value = value;
        this.attachedToDoc = false;
    }
    ;
    markAttachedToShareDBDoc(doc, path) {
        this.doc = doc;
        this.path = path;
        this.attachedToDoc = true;
    }
    ;
    isAttached() { return this.attachedToDoc; }
    ;
    getValue() { return this.value; }
    ;
}
exports.SDBObject = SDBObject;
;
class SDBArray extends SDBObject {
    constructor(value = []) {
        super(value);
    }
    ;
    push(...args) {
        this.value.push(...args);
        if (this.isAttached()) {
            this.doc.submitListPushOp(this.path, ...args);
        }
    }
    ;
    splice(start, deleteCount, ...toAdd) {
        this.value.splice(start, deleteCount, ...toAdd);
        if (this.isAttached()) {
            for (let _ = 0; _ < deleteCount; _++) {
                this.doc.submitListDeleteOp(this.path.concat(start));
            }
            toAdd.forEach((item, i) => {
                this.doc.submitListInsertOp(this.path.concat(i), item);
            });
        }
    }
    ;
    length() { return this.value.length; }
    item(i) { return this.value[i]; }
    ;
    indexOf(item) { return this.value.indexOf(item); }
    contains(item) { return this.indexOf(item) >= 0; }
    forEach(callbackFunc) {
        this.value.forEach(callbackFunc);
    }
    ;
    map(callbackFunc) { return this.value.map(callbackFunc); }
    ;
    join(glue) { return this.value.join(glue); }
    ;
}
exports.SDBArray = SDBArray;
