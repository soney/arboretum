var socket_client = require('socket.io-client');
var _ = require('underscore'), util = require('util'), EventEmitter = require('events'), P = require('bluebird');
function ArborScript(host, options) {
    if (host) {
        this.connect(host);
    }
}
(function (My) {
    util.inherits(My, EventEmitter);
    var proto = My.prototype;
    proto.getElementsPromise = function (elements, frameStack) {
        if (_.isString(elements)) {
            return this.getElements(elements, frameStack);
        }
        else {
            return elements;
        }
    };
    proto.getElements = function (selector, frameStack) {
        var args = arguments;
        return this.socketPromise.then(_.bind(function (socket) {
            return new P(function (resolve, reject) {
                var elementsListener = function (info) {
                    if (info.selector === selector && _.isEqual(info.frameStack, frameStack)) {
                        if (info.value) {
                            resolve(info.value);
                            socket.off('elements', elementsListener);
                        }
                    }
                };
                socket.on('elements', elementsListener);
                socket.emit('getElements', {
                    selector: selector,
                    frameStack: frameStack
                });
            }).timeout(1000).catch(P.TimeoutError, _.bind(function (e) {
                return this.getElements.apply(this, args);
            }, this));
        }, this));
    };
    proto.deviceEvent = function (elements, frameStack, options) {
        var socket;
        return this.socketPromise.then(_.bind(function (s) {
            socket = s;
            return this.getElementsPromise(elements, frameStack);
        }, this)).then(function (val) {
            var elements = val.nodes;
            var firstEl = elements[0];
            var frameId = val.frameId;
            if (firstEl) {
                return new P(function (resolve, reject) {
                    socket.once('eventHappened', function () {
                        resolve();
                    });
                    socket.emit('deviceEvent', _.extend({
                        id: firstEl.nodeId,
                        frameId: frameId
                    }, options));
                });
            }
        });
    };
    proto.click = function (elements, frameStack) {
        return this.deviceEvent(elements, frameStack, {
            type: 'click'
        });
    };
    proto.input = function (elements, val, frameStack) {
        return this.deviceEvent(elements, frameStack, {
            type: 'click',
            value: val
        });
    };
    proto.open = function (url) {
        return this.socketPromise.then(function (socket) {
            return new P(function (resolve, reject) {
                socket.once('navigated', function () {
                    resolve(url);
                });
                socket.emit('navigate', url);
            });
        });
    };
    proto.connect = function (host) {
        this.socketPromise = new P(function (resolve, reject) {
            var socket = socket_client.connect(host);
            socket.on('connect', function () {
                resolve(socket);
            });
        }).then(function (socket) {
            socket.emit('scriptReady', {});
            return socket;
        });
        return this.socketPromise;
    };
    proto.exit = function () {
        return this.socketPromise.then(function (socket) {
            socket.disconnect();
        });
    };
    proto.handoff = function (elementSelectors, frameStack) {
        var socket;
        return this.socketPromise.then(_.bind(function (s) {
            socket = s;
            return P.all(_.map(elementSelectors, function (elementSelector) {
                return this.getElementsPromise(elementSelector, frameStack);
            }, this));
        }, this)).then(function (elements) {
            return new P(function (resolve, reject) {
                socket.once('handed', function () {
                    resolve();
                });
                socket.emit('handoff', {
                    elements: elements
                });
            });
        }).catch(function (err) {
            console.error(err);
            console.error(err.stack);
        });
    };
}(ArborScript));
module.exports = ArborScript;
