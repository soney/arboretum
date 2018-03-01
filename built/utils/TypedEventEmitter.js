"use strict";
/******************************************************************************
 * The MIT License (MIT)                                                      *
 *                                                                            *
 * Copyright (c) 2016 Simon "Tenry" Burchert                                  *
 *                                                                            *
 * Permission is hereby granted, free of charge, to any person obtaining a    *
 * copy of this software and associated documentation files (the "Software"), *
 * to deal in the Software without restriction, including without limitation  *
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,   *
 * and/or sell copies of the Software, and to permit persons to whom the      *
 * Software is furnished to do so, subject to the following conditions:       *
 *                                                                            *
 * The above copyright notice and this permission notice shall be included in *
 * all copies or substantial portions of the Software.                        *
 *                                                                            *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,   *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL    *
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING    *
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER        *
 * EALINGS IN THE SOFTWARE.                                                   *
 ******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
class TypedEventEmitter {
    constructor() {
        this.eventListeners = new Map();
    }
    ;
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [listener]);
        }
        else {
            this.eventListeners.get(event).push(listener);
        }
        return new TypedListener(this, event, listener);
    }
    ;
    once(event, baseListener) {
        const listener = (...args) => {
            const rv = baseListener(...args);
            this.removeListener(event, listener);
            return rv;
        };
        return this.on(event, listener);
    }
    ;
    addListener(event, listener) {
        return this.on(event, listener);
    }
    ;
    removeListener() {
        if (arguments.length == 0) {
            this.eventListeners.clear();
        }
        else if (arguments.length == 1 && typeof arguments[0] == 'object') {
            const id = arguments[0];
            this.removeListener(id.event, id.listener);
        }
        else if (arguments.length >= 1) {
            let event = arguments[0];
            let listener = arguments[1];
            if (this.eventListeners.has(event)) {
                const listeners = this.eventListeners.get(event);
                let idx;
                while (!listener || (idx = listeners.indexOf(listener)) != -1) {
                    listeners.splice(idx, 1);
                }
            }
        }
    }
    ;
    /**
     * Emit event. Calls all bound listeners with args.
     */
    emit(event, ...args) {
        if (this.eventListeners.has(event)) {
            for (let listener of this.eventListeners.get(event)) {
                listener(...args);
            }
        }
    }
    ;
    /**
     * @typeparam T The event handler signature.
     */
    registerEvent() {
        const eventBinder = (handler) => {
            return this.addListener(eventBinder, handler);
        };
        return eventBinder;
    }
    ;
}
exports.TypedEventEmitter = TypedEventEmitter;
;
class TypedListener {
    constructor(owner, event, listener, unbindWhenRun = false) {
        this.owner = owner;
        this.event = event;
        this.listener = listener;
        this.unbindWhenRun = unbindWhenRun;
    }
    ;
    unbind() {
        this.owner.removeListener(this);
    }
    ;
}
exports.TypedListener = TypedListener;
;
