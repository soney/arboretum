import * as ShareDBClient from 'sharedb/lib/client';
import * as ShareDB from 'sharedb';
import * as stream from 'stream';

type DocIdentifier = [string,string];

export class SDB {
    private docs:Map<DocIdentifier, SDBDoc<any>> = new Map<DocIdentifier, SDBDoc<any>>();
    private share:ShareDB|ShareDBClient;
    private connection:ShareDB.Connection;
    constructor(client:boolean, connection?:WebSocket) {
        if(client) {
            this.connection = new ShareDBClient.Connection(connection);
        } else {
            this.share = new ShareDB();
            this.connection = this.share.connect();
        }
    };
    private getDocIdentifier(collectionName:string, documentID:string):DocIdentifier {
        return [collectionName, documentID];
    };

    public listen(stream:stream.Duplex):void {
        this.share.listen(stream);
    };

    public get<E>(collectionName:string, documentID:string):SDBDoc<E> {
        const docIdentifier:DocIdentifier = this.getDocIdentifier(collectionName, documentID);
        let sdbDoc:SDBDoc<E>;
        if(this.docs.has(docIdentifier)) {
            sdbDoc = this.docs.get(docIdentifier);
        } else {
            const doc:ShareDB.Doc<E> = this.connection.get(collectionName, documentID);
            sdbDoc = new SDBDoc<E>(docIdentifier, doc, this);
            this.docs.set(docIdentifier, sdbDoc);
        }
        return sdbDoc;
    };

    public async close():Promise<void> {
        await new Promise((resolve, reject) => {
            this.share.close(()=> {
                resolve(null);
            });
        });
    };

    public deleteDoc(doc:SDBDoc<any>):void {
        this.docs.delete(doc.docIdentifier);
    };
};

export class SDBDoc<E> {
    constructor(public docIdentifier:DocIdentifier, private doc:ShareDB.Doc<E>, private sdb:SDB) {
    };
    public traverse(path:Array<string|number>):any {
        let x:any = this.getData();
        for(let i:number = 0; i<path.length; i++) {
            x = x[path[i]];
        }
        return x;
    };
    public async submitObjectReplaceOp(p:Array<string|number>, oi:any, od:any=this.traverse(p)):Promise<void> {
        const op:ShareDB.ObjectReplaceOp = {p, oi, od};
        return await this.submitOp([op]);
    };
    public async submitObjectInsertOp(p:Array<string|number>, oi:any):Promise<void> {
        const op:ShareDB.ObjectInsertOp = {p, oi};
        return await this.submitOp([op]);
    };
    public async submitObjectDeleteOp(p:Array<string|number>, od:any=this.traverse(p)):Promise<void> {
        const op:ShareDB.ObjectDeleteOp = {p, od};
        return await this.submitOp([op]);
    };
    public async submitListReplaceOp(p:Array<string|number>, li:any, ld:any=this.traverse(p)):Promise<void> {
        const op:ShareDB.ListReplaceOp = {p, li, ld};
        return await this.submitOp([op]);
    };
    public async submitListInsertOp(p:Array<string|number>, li:any):Promise<void> {
        const op:ShareDB.ListInsertOp = {p, li};
        return await this.submitOp([op]);
    };
    public async submitListDeleteOp(p:Array<string|number>, ld:any=this.traverse(p)):Promise<void> {
        const op:ShareDB.ListDeleteOp = {p, ld};
        return await this.submitOp([op]);
    };
    public async submitListPushOp(p:Array<string|number>, ...items:Array<any>):Promise<void> {
        const arr:Array<any> = this.traverse(p);
        const previousLength:number = arr.length;
        const ops:Array<ShareDB.ListInsertOp> = items.map((x:any, i:number) => {
            const op:ShareDB.ListInsertOp = {p:p.concat(previousLength+i), li:x};
            return op;
        });
        return await this.submitOp(ops);
    };
    public async submitListUnshiftOp(p:Array<string|number>, ...items:Array<any>):Promise<void> {
        const arr:Array<any> = this.traverse(p);
        const previousLength:number = arr.length;
        const ops:Array<ShareDB.ListInsertOp> = items.map((x:any, i:number) => {
            const op:ShareDB.ListInsertOp = {p:p.concat(i), li:x};
            return op;
        });
        return await this.submitOp(ops);
    };

    public async fetch():Promise<ShareDB.Doc<E>> {
        return new Promise<ShareDB.Doc<E>>((resolve, reject) => {
            this.doc.fetch((err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(this.doc);
                }
            });
        });
    };
    public async create(data:E, type?:ShareDB.OTType, options?:ShareDB.ShareDBCreateOptions):Promise<ShareDB.Doc<E>> {
        return new Promise<ShareDB.Doc<E>>((resolve, reject) => {
            this.doc.create(data, type, options, () => {
                resolve(this.doc);
            });
        });
    };
    public async del(source:boolean=true):Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.doc.del({source}, (err) => {
                if(err) { reject(err); }
                else { resolve(); }
            });
        });
        this.sdb.deleteDoc(this);
    };
    public subscribe(callback:(ops:Array<ShareDB.Op>, source:boolean, data:E)=>void):()=>void {
        this.doc.subscribe((err) => {
            if(err) { throw(err); }
            callback(null, null, this.doc.data);
        });
        const onOpFunc = (ops:Array<ShareDB.Op>, source:boolean) => {
            callback(ops, source, this.doc.data);
        };
        this.doc.on('op', onOpFunc);
        return () => {
            this.doc.removeListener('op', onOpFunc);
        };
    };
    public async submitOp(op:Array<ShareDB.Op>, source:boolean=true):Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.doc.submitOp(op, {source}, (err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };
    public async createIfEmpty(data:E, type?:ShareDB.OTType, options?:ShareDB.ShareDBCreateOptions):Promise<ShareDB.Doc<E>> {
        const doc:ShareDB.Doc<E> = await this.fetch();
        if(doc.type === null) {
            return this.create(data, type, options);
        } else {
            return doc;
        }
    };
    public getData():E {
        return this.doc.data;
    };
    public destroy():void {
        this.doc.destroy();
        this.sdb.deleteDoc(this);
    };
};
