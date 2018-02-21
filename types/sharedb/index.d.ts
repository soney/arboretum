declare module 'sharedb' {
    import * as stream from 'stream';
    type DocumentID = string;
    type Snapshot = number;
    class ShareDB {
        constructor(options?:{db?:ShareDB.DB, pubsub?:ShareDB.PubSub});
        public use(action:'connect'|'op'|'doc'|'query'|'submit'|'apply'|'commit'|'after submit'|'receive', fn:(request:any, callback:any)=>any):any
        public addProjection(name:string, collection:string, fields:{}):any;
        public listen(stream:stream.Duplex):void;
        public close(callback?:(err:ShareDB.Error)=>any):void;
        public connect():ShareDB.Connection;
    }
    namespace ShareDB {
        interface Error {
            code:number,
            message:string
        }

        interface DB { }
        export type OTType = 'ot-text' | 'ot-json0' | 'ot-text-tp2' | 'rich-text';

        interface AddNumOp { p:Array<string|number>, na:number }
        interface ListInsertOp { p:Array<string|number>, li:any }
        interface ListDeleteOp { p:Array<string|number>, ld:any }
        interface ListReplaceOp { p:Array<string|number>, li:any, ld:any }
        interface ListMoveOp { p:Array<string|number>, lm:any }

        interface ObjectInsertOp { p:Array<string|number>, oi:any }
        interface ObjectDeleteOp { p:Array<string|number>, od:any }
        interface ObjectReplaceOp { p:Array<string|number>, oi:any, od:any }

        interface StringInsertOp { p:Array<string|number>, si:string }
        interface StringDeleteOp { p:Array<string|number>, sd:string }

        interface SubtypeOp { p:Array<string|number>, t:string, o:any }

        type Op = AddNumOp | ListInsertOp | ListDeleteOp | ListReplaceOp | ListMoveOp | ObjectInsertOp | ObjectDeleteOp | ObjectReplaceOp | StringInsertOp | StringDeleteOp | SubtypeOp;

        class MemoryDB implements DB { }
        interface ShareDBSourceOptions { source?:boolean }
        interface ShareDBCreateOptions extends ShareDBSourceOptions{}
        interface ShareDBDelOptions extends ShareDBSourceOptions{}
        interface ShareDBSubmitOpOptions extends ShareDBSourceOptions{}

        interface Doc<E> {
            type:string;
            id:DocumentID;
            data:E;
            fetch:(callback:(err:ShareDB.Error)=>void) => void;
            subscribe:(callback:(err:ShareDB.Error)=>void) => void
            on:(event:'load'|'create'|'before op'|'op'|'del'|'error', callback:(...args:Array<any>)=>any)=>void;
            ingestSnapshot:(snapshot:Snapshot, callback:(err:ShareDB.Error)=>any)=>void;
            destroy:()=>void;
            create:(data:any, type?:OTType, options?:ShareDBCreateOptions, callback?:(err:ShareDB.Error)=>any)=>void;
            submitOp:(data:Array<Op>, options?:ShareDBSubmitOpOptions, callback?:(err:ShareDB.Error)=>any)=>void;
            del:(options:ShareDBDelOptions, callback:(err:ShareDB.Error)=>void)=>void
            removeListener:(eventName:string, listener:Function)=>void
        }
        class Connection {
            constructor(ws:WebSocket);
            public get<E>(collectionName:string, documentID:DocumentID):ShareDB.Doc<E>
            public createFetchQuery(collectionName:string, query:string, options:{results?:Array<Query>}, callback:(err:ShareDB.Error, results:any)=>any):Query
            public createSubscribeQuery(collectionName:string, query:string, options:{results?:Array<Query>}, callback:(err:ShareDB.Error, results:any)=>any):Query
        }
        class PubSub { }
        class Query {
            ready:boolean;
            results:Array<ShareDB.Doc<any>>;
            extra:any;
            on:(event:'ready'|'error'|'changed'|'insert'|'move'|'remove'|'extra', callback:(...args:Array<any>)=>any)=>any;
            destroy:()=>void;
        }
    }
    export = ShareDB;
}
