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
class ShareDBSharedState extends TypedEventEmitter_1.TypedEventEmitter {
    constructor(attachedToShareDBDoc = false) {
        super();
        this.attachedToShareDBDoc = attachedToShareDBDoc;
    }
    ;
    isAttachedToShareDBDoc() { return this.attachedToShareDBDoc; }
    ;
    markDetachedFromShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isAttachedToShareDBDoc()) {
                this.attachedToShareDBDoc = false;
            }
        });
    }
    ;
    markAttachedToShareDBDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAttachedToShareDBDoc()) {
                this.attachedToShareDBDoc = true;
                yield this.onAttachedToShareDBDoc();
            }
        });
    }
    ;
    p(...toAdd) {
        return this.getAbsoluteShareDBPath().concat(...toAdd);
    }
    ;
    submitOp(...ops) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isAttachedToShareDBDoc()) {
                try {
                    yield this.getShareDBDoc().submitOp(ops);
                }
                catch (e) {
                    console.error(e);
                    console.error(e.stack);
                }
            }
            else {
                throw new Error('Tried to submit ShareDB Op before being attached to document');
            }
        });
    }
    ;
}
exports.ShareDBSharedState = ShareDBSharedState;
;
