import * as ShareDB from 'sharedb';
import {SDB, SDBDoc} from './ShareDBDoc';
import {TypedEventEmitter, TypedListener} from './TypedEventEmitter';

export abstract class ShareDBSharedState<E> extends TypedEventEmitter {
    constructor(private attachedToShareDBDoc:boolean=false) {
        super();
    };

    public abstract getAbsoluteShareDBPath():Array<string|number>;
    protected abstract async onAttachedToShareDBDoc?():Promise<void>;
    protected abstract getShareDBDoc():SDBDoc<E>;

    protected isAttachedToShareDBDoc():boolean { return this.attachedToShareDBDoc; };

    public async markDetachedFromShareDBDoc():Promise<void> {
        if(this.isAttachedToShareDBDoc()) {
            this.attachedToShareDBDoc = false;
        }
    };
    public async markAttachedToShareDBDoc():Promise<void> {
        if(!this.isAttachedToShareDBDoc()) {
            this.attachedToShareDBDoc = true;
            await this.onAttachedToShareDBDoc();
        }
    };

    protected p(...toAdd:Array<string|number>):Array<string|number> {
        return this.getAbsoluteShareDBPath().concat(...toAdd);
    };
    public async submitOp(...ops:Array<ShareDB.Op>):Promise<void> {
        if(this.isAttachedToShareDBDoc()) {
            try {
                await this.getShareDBDoc().submitOp(ops);
            } catch(e) {
                console.error(e);
                console.error(e.stack);
            }
        } else {
            throw new Error('Tried to submit ShareDB Op before being attached to document');
        }
    };
};
