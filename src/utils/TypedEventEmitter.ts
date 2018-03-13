export class TypedEventEmitter {
    private registeredEvents:Array<RegisteredEvent<any>> = [];
    constructor(){};
    public registerEvent<E>():RegisteredEvent<E> {
        const rv = new RegisteredEvent<E>();
        this.registeredEvents.push(rv);
        return rv;
    };
    public clearRegisteredEvents():void {
        this.registeredEvents.forEach((re) => {
            re.clearListeners();
        });
        this.registeredEvents.splice(0, this.registeredEvents.length);
    }
};
export function registerEvent<E>():RegisteredEvent<E> {
    return new RegisteredEvent<E>();
};

export class RegisteredEvent<E> {
    private listeners:Array<TypedListener<E>> = [];
    public emit(event?:E):void {
        this.listeners.forEach((l) => {
            l.fire(event);
        });
    };
    public clearListeners():void { this.listeners.splice(0, this.listeners.length); };
    public removeListener(listener:TypedListener<E>):boolean {
        let found:boolean = false;
        for(let i:number=0;i<this.listeners.length;i++) {
            const l:TypedListener<E> = this.listeners[i];
            if(l === listener) {
                this.listeners.splice(i, 1);
                i--;
                found = true;
            }
        }
        return found;
    };
    public addListener(func:(event:E)=>void, unbindWhenRun:boolean=false):TypedListener<E> {
        const typedListener = new TypedListener<E>(func, this, unbindWhenRun);
        this.listeners.push(typedListener);
        return typedListener;
    };
};

export class TypedListener<E> {
    constructor(private listener:(event:E)=>void, private owner:RegisteredEvent<E>, private unbindWhenRun:boolean=false) {
    };
    public unbind():void { this.owner.removeListener(this); };
    public fire(event:E):void {
        if(this.unbindWhenRun) { this.unbind(); }
        this.listener(event);
    };
    // constructor(public owner: TypedEventEmitter,
    //     public event: Function,
    //     public listener: Function, public unbindWhenRun:boolean=false) {
    // };
    // public fire(event:E) {
    // };
    // public unbind():void {
    //     this.owner.removeListener(this);
    // };
};
