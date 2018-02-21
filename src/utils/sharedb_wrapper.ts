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
    public subscribe(callback:(op:ShareDB.Op, source:boolean, data:E)=>void):()=>void {
        this.doc.subscribe((err) => {
            if(err) { throw(err); }
            callback(null, null, this.doc.data);
        });
        const onOpFunc = (op:ShareDB.Op, source:boolean) => {
            callback(op, source, this.doc.data);
        };
        this.doc.on('op', onOpFunc);
        return () => {
            this.doc.removeListener('op', onOpFunc);
        };
    };
    public async submitOp(op:Array<ShareDB.Op>, source:boolean=true):Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.doc.submitOp(op, {source}, (err) => {
                if(err) {reject(err);}
                else {resolve();}
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
