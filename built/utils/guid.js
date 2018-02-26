"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}
;
function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
exports.guid = guid;
;
function guidIndex(id) {
    let result = 0;
    for (let i = 0; i < id.length; i++) {
        result += id.charCodeAt(i);
    }
    return result;
}
exports.guidIndex = guidIndex;
;
