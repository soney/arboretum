declare module 'sharedb' {
    import * as stream from 'stream';
    type DocumentID = string;
    type Snapshot = number;
    type OTType = 'ot-text' | 'ot-json0' | 'ot-text-tp2' | 'rich-text';
    class ShareDB {
        constructor(options?:{db?:ShareDB.DB, pubsub?:ShareDB.PubSub});
        public use(action:'connect'|'op'|'doc'|'query'|'submit'|'apply'|'commit'|'after submit'|'receive', fn:(request:any, callback:any)=>any):any
        public addProjection(name:string, collection:string, fields:{}):any;
        public listen(stream:stream.Duplex):void;
        public close(callback:(err:ShareDB.Error)=>any):void;
        public connect():ShareDB.Connection;
    }
    namespace ShareDB {
        interface Error {
            code:number,
            message:string
        }
        interface DB {

        }
        class MemoryDB implements DB {

        }
        interface Doc {
            type:string;
            id:DocumentID;
            data:any;
            fetch:(callback:(err:ShareDB.Error)=>void) => void;
            subscribe:(callback:(err:ShareDB.Error)=>void) => void;
            on:(event:'load'|'create'|'before op'|'op'|'del'|'error', callback:(...args:Array<any>)=>any)=>void;
            ingestSnapshot:(snapshot:Snapshot, callback:(err:ShareDB.Error)=>any)=>void;
            destroy:()=>void;
            create:(data:any, type?:OTType, options?:{source?:boolean}, callback?:(err:ShareDB.Error)=>any)=>void;
            submitOp:(data:any, type?:OTType, options?:{source?:boolean}, callback?:(err:ShareDB.Error)=>any)=>void;
        }
        class Connection {
            public get(collectionName:string, documentID:DocumentID):ShareDB.Doc
            public createFetchQuery(collectionName:string, query:string, options:{results?:Array<Query>}, callback:(err:ShareDB.Error, results:any)=>any):Query
            public createSubscribeQuery(collectionName:string, query:string, options:{results?:Array<Query>}, callback:(err:ShareDB.Error, results:any)=>any):Query
        }
        class PubSub { }
        class Query {
            ready:boolean;
            results:Array<ShareDB.Doc>;
            extra:any;
            on:(event:'ready'|'error'|'changed'|'insert'|'move'|'remove'|'extra', callback:(...args:Array<any>)=>any)=>any;
            destroy:()=>void;
        }
    }
    export = ShareDB;
}
