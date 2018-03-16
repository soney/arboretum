"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TypedEventEmitter {
    constructor() {
        this.registeredEvents = [];
    }
    ;
    registerEvent() {
        const rv = new RegisteredEvent();
        this.registeredEvents.push(rv);
        return rv;
    }
    ;
    clearRegisteredEvents() {
        this.registeredEvents.forEach((re) => {
            re.clearListeners();
        });
        this.registeredEvents.splice(0, this.registeredEvents.length);
    }
}
exports.TypedEventEmitter = TypedEventEmitter;
;
function registerEvent() {
    return new RegisteredEvent();
}
exports.registerEvent = registerEvent;
;
class RegisteredEvent {
    constructor() {
        this.listeners = [];
    }
    emit(event) {
        this.listeners.forEach((l) => {
            l.fire(event);
        });
    }
    ;
    clearListeners() { this.listeners.splice(0, this.listeners.length); }
    ;
    removeListener(listener) {
        let found = false;
        for (let i = 0; i < this.listeners.length; i++) {
            const l = this.listeners[i];
            if (l === listener) {
                this.listeners.splice(i, 1);
                i--;
                found = true;
            }
        }
        return found;
    }
    ;
    addListener(func, unbindWhenRun = false) {
        const typedListener = new TypedListener(func, this, unbindWhenRun);
        this.listeners.push(typedListener);
        return typedListener;
    }
    ;
}
exports.RegisteredEvent = RegisteredEvent;
;
class TypedListener {
    constructor(listener, owner, unbindWhenRun = false) {
        this.listener = listener;
        this.owner = owner;
        this.unbindWhenRun = unbindWhenRun;
    }
    ;
    unbind() { this.owner.removeListener(this); }
    ;
    fire(event) {
        if (this.unbindWhenRun) {
            this.unbind();
        }
        this.listener(event);
    }
    ;
}
exports.TypedListener = TypedListener;
;
