"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResolvablePromise {
    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    resolve(val) {
        this._resolve(val);
        return this.getPromise();
    }
    reject(val) {
        this._reject(val);
        return this.getPromise();
    }
    getPromise() {
        return this._promise;
    }
}
exports.ResolvablePromise = ResolvablePromise;
