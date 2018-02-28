"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hack_driver_1 = require("./hack_driver/hack_driver");
class EventManager {
    constructor(chrome, frameState) {
        this.chrome = chrome;
        this.frameState = frameState;
    }
    ;
    onDeviceEvent(event, frame) {
        const { type } = event;
        if (EventManager.MOUSE_EVENT_TYPES.has(type)) {
            hack_driver_1.mouseEvent(this.chrome, event.id, type);
        }
        else if (type === 'input') {
            hack_driver_1.setElementValue(this.chrome, event.id, event.value);
        }
    }
    ;
}
EventManager.MOUSE_EVENT_TYPES = new Set(['click', 'mousedown', 'mouseup', 'mousemove']);
exports.EventManager = EventManager;
;
