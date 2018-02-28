export class ResolvablePromise<E> {
    private _resolve: (E) => any;
    private _reject: (any) => any;
    private _promise: Promise<E>;
    constructor() {
        this._promise = new Promise<E>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    public resolve(val: E): Promise<E> {
        this._resolve(val);
        return this.getPromise();
    }
    public reject(val: any): Promise<E> {
        this._reject(val);
        return this.getPromise();
    }
    public getPromise(): Promise<E> {
        return this._promise;
    }
}
