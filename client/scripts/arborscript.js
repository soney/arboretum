var socket_client = require('socket.io-client');
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
    P = require('bluebird');

function ArborScript(host) {
	if(host) {
		this.connect(host);
	}
}

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

    proto.getElementsPromise = function(elements, frameStack) {
        if(_.isString(elements)) {
            return this.getElements(elements, frameStack);
        } else {
            return elements;
        }
    };

    proto.getElements = function(selector, frameStack) {
        return this.socketPromise.then(function(socket) {
            return new P(function(resolve, reject) {
				var elementsListener = function(info) {
					if(info.selector === selector && _.isEqual(info.frameStack, frameStack)) {
						resolve(info.value);
						socket.off('elements', elementsListener);
					}
				};
                socket.on('elements', elementsListener);
                socket.emit('getElements', {
                    selector: selector,
                    frameStack: frameStack
                })
            });
        });
    };

    proto.deviceEvent = function(elements, frameStack, options) {
        var socket;
        return this.socketPromise.then(_.bind(function(s) {
            socket = s;
            return this.getElementsPromise(elements, frameStack);
        }, this)).then(function(val) {
            var elements = val.nodes;
            var firstEl = elements[0];
            var frameId = val.frameId;
            if(firstEl) {
                return new P(function(resolve, reject) {
                    socket.once('eventHappened', function() {
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

    proto.click = function(elements, frameStack) {
        return this.deviceEvent(elements, frameStack, {
            type: 'click'
        });
    };

    proto.input = function(elements, val, frameStack) {
        return this.deviceEvent(elements, frameStack, {
            type: 'click',
            value: val
        });
    };

    proto.navigate = function(url) {
        return this.socketPromise.then(function(socket) {
            return new P(function(resolve, reject) {
                socket.once('navigated', function() {
                    resolve(url);
                });
                socket.emit('navigate', url);
            });
        });
    };

    proto.connect = function(host) {
        this.socketPromise = new P(function(resolve, reject) {
            var socket = socket_client.connect(host);
            socket.on('connect', function() {
                resolve(socket);
            });
        }).then(function(socket) {
            socket.emit('scriptReady', {});
            return socket;
        });

        return this.socketPromise;
    };

    proto.disconnect = function() {
        return this.socketPromise.then(function(socket) {
            socket.disconnect();
        });
    };
    proto.handoff = function(elementSelectors, frameStack) {
        var socket;
        return this.socketPromise.then(_.bind(function(s) {
            socket = s;
			return P.all(_.map(elementSelectors, function(elementSelector) {
	            return this.getElementsPromise(elementSelector, frameStack);
			}, this));
        }, this)).then(function(elements) {
            return new P(function(resolve, reject) {
                socket.once('handed', function() {
                    resolve();
                });
                socket.emit('handoff', {
					elements: elements
				});
            });
        });
    };
}(ArborScript));

var child_process = require('child_process'),
	exec = child_process.exec;

function startChrome(options) {
	options = _.extend({
		port: 9222,
		appName: 'Chromium',
		url: ''
	}, options);

	return new Promise(function(resolve, reject) {
		exec('open -a "' + options.appName + '" --args ' + options.url + ' --remote-debugging-port=' + options.port, function(err, stout, stderr) {
			if(err) {
				reject(err);
			} else {
				resolve(options.port);
			}
		});
	}).then(function(port) {
		return wait(500, port);
	});
}
function wait(ms, val) {
	return new Promise(function(resolve) {
		setTimeout(function() {
			resolve(val);
		}, ms);
	});
}
/*

var BrowserState = require('../server/state/browser_state'),
	clientDriver = require('../client/client_driver');

var chrome, doc, port;
startChrome().then(function(port) {
    var browserState = new BrowserState({
    	port: port
    });
	return clientDriver.createClient(browserState).then(function(port) {
		return {
			clientPort: port,
			browser: browserState
		};
	}).catch(function(err) {
		console.error(err.stack);
	});
}).then(function() {
    return wait(500);
}).then(function() {
*/
    var script = new ArborScript('http://localhost:3000');
	script.handoff(["#message", "#willChange", ".glyphicon.glyphicon-star", "a"], [false, "#iframeResult"]).then(function() {
		return script.disconnect();
	});
	/*
    script.connect('http://localhost:3000').then(function(socket) {
        return script.click('a', [false, 'iframe']);
        //return script.navigate('http://umich.edu/');
    }).then(function() {
        script.disconnect();
    });
	*/
	/*
}).catch(function(err) {
    console.error(err.stack);
})
*/



module.exports = ArborScript;