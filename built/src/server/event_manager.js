var _ = require('underscore'), util = require('util'), EventEmitter = require('events'), driver = require('./hack_driver/hack_driver');
var log = require('../utils/logging').getColoredLogger('white');
var EventManager = function (chrome, frameState) {
    this.chrome = chrome;
    this.frameState = frameState;
};
(function (My) {
    util.inherits(My, EventEmitter);
    var proto = My.prototype;
    //events come from client/client_pages/js/tree_node.js
    //(state.deviceEvent)
    proto.onDeviceEvent = function (event, frame) {
        var chrome = this._getChrome();
        var type = event.type;
        if (type === 'click' || type === 'mousedown' || type === 'mouseup' || type === 'mousemove') {
            driver.mouseEvent(chrome, event.id, type);
        }
        else if (type === 'input') {
            driver.setElementValue(chrome, event.id, event.value);
        }
    };
    proto._getChrome = function () {
        return this.chrome;
    };
}(EventManager));
module.exports = {
    EventManager: EventManager
};
