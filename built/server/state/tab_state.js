"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cri = require("chrome-remote-interface");
const frame_state_1 = require("./frame_state");
const logging_1 = require("../../utils/logging");
const _ = require("underscore");
const events_1 = require("events");
const log = logging_1.getColoredLogger('yellow');
class TabState extends events_1.EventEmitter {
    constructor(info) {
        super();
        this.info = info;
        this.frames = new Map();
        this.pendingFrameEvents = new Map();
        this.onDocumentUpdated = () => {
            var frame = this.getMainFrame();
            // if(frame) {
            frame.documentUpdated();
            // }
        };
        this.onSetChildNodes = (event) => {
            const setChildNodesPromises = [];
            this.frames.forEach((frameState) => {
                const p = frameState.setChildNodes(event);
                setChildNodesPromises.push(p);
            });
            Promise.all(setChildNodesPromises).then((vals) => {
                const wasHandled = _.any(vals);
                if (!wasHandled) {
                    log.error('No frame found for set child nodes event', event);
                }
                return wasHandled;
            }).catch((err) => {
                throw (err);
            });
        };
        // 	proto._createEmptyFrame = function(frameInfo) {
        // 		var frameId = frameInfo.frameId;
        //
        // 		var frameState = this._frames[frameId] = new FrameState(_.extend({
        // 			chrome: this._getChrome()
        // 		}, {
        // 			id: frameId,
        // 			page: this,
        // 			parentId: frameInfo.parentFrameId
        // 		}));
        //
        // 		if(!frameInfo.parentFrameId) {
        // 			this._setMainFrame(frameState);
        // 		}
        // 		this._updateFrameOnEvents(frameState);
        //
        // 		return frameState;
        // 	};
        this.onCharacterDataModified = function (event) {
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.characterDataModified(event);
            // });
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for character data modified event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            // });
        };
        this.onChildNodeRemoved = function (event) {
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.childNodeRemoved(event);
            // });
            //
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for child node removed event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            // });
        };
        this.onChildNodeInserted = function (event) {
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.childNodeInserted(event);
            // });
            //
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for child node inserted event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            // });
        };
        this.onAttributeModified = function (event) {
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.attributeModified(event);
            // });
            //
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for attribute modified event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            //    });
        };
        this.onAttributeRemoved = function (event) {
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.attributeRemoved(event);
            // });
            //
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for attribute removed event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            // });
        };
        this.onChildNodeCountUpdated = function (event) {
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.childNodeCountUpdated(event);
            // });
            //
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for child node count updated event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            // });
        };
        this.onInlineStyleInvalidated = function (event) {
            this.frames.forEach((frame) => {
            });
            // var promises = _.map(this._frames, function(frame) {
            // 	return frame.inlineStyleInvalidated(event);
            // });
            //
            // return Promise.all(promises).then(function(vals) {
            // 	return _.any(vals);
            // }).then(function(wasHandled) {
            // 	if(!wasHandled) {
            // 		log.error('No frame found for inline style invalidated event', event);
            // 	}
            // }).catch(function(err) {
            // 	if(err.stack) { console.error(err.stack); }
            // 	else { console.error(err); }
            // });
        };
        this.onFrameAttached = (frameInfo) => {
            const { frameId, parentFrameId } = frameInfo;
            const frameState = new frame_state_1.FrameState(this.chrome, {
                id: frameId,
                parentId: parentFrameId
            }, this);
            this.frames.set(frameId, frameState);
            if (!parentFrameId) {
                this.setMainFrame(frameState);
            }
            this.updateFrameOnEvents(frameState);
        };
        this.onFrameNavigated = (frameInfo) => {
            const { frame } = frameInfo;
            const { id, url } = frame;
            let frameState;
            if (this.hasFrame(id)) {
                frameState = this.getFrame(id);
            }
            else {
                frameState = new frame_state_1.FrameState(this.chrome, frame, this);
            }
            frameState.updateInfo(frameInfo);
        };
        this.onFrameDetached = (frameInfo) => {
            const { frameId } = frameInfo;
            this.destroyFrame(frameId);
        };
        this.requestWillBeSent = (event) => {
            const { frameId } = event;
            if (this.hasFrame(frameId)) {
                const frame = this.getFrame(frameId);
                frame.requestWillBeSent(event);
            }
            else {
                this.addPendingFrameEvent({
                    frameId: frameId,
                    event: event,
                    type: 'requestWillBeSent'
                });
            }
        };
        this.responseReceived = (event) => {
            const { frameId } = event;
            if (this.hasFrame(frameId)) {
                this.getFrame(frameId).responseReceived(event);
            }
            else {
                this.addPendingFrameEvent({
                    frameId: frameId,
                    event: event,
                    type: 'responseReceived'
                });
            }
        };
        this.executionContextCreated = (event) => {
            const { context } = event;
            const { auxData } = context;
            const { frameId } = auxData;
            if (this.hasFrame(frameId)) {
                const frameState = this.getFrame(frameId);
                frameState.executionContextCreated(event);
            }
            else {
                log.error(`Could not find frame ${frameId}`);
            }
        };
        const chromeEventEmitter = cri({
            chooseTab: this.info
        });
        this.chromePromise = new Promise((resolve, reject) => {
            chromeEventEmitter.once('connect', (chrome) => {
                this.chrome = chrome;
                resolve(chrome);
            });
        }).catch((err) => {
            throw (err);
        });
        this.chromePromise.then(() => {
            this.getResourceTree();
            this.addFrameListeners();
            this.addDOMListeners();
            this.addNetworkListeners();
            this.addExecutionContextListeners();
        }).catch((err) => {
            throw (err);
        });
        log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
    }
    ;
    getMainFrame() {
        return this.rootFrame;
    }
    getTabId() { return this.info.id; }
    addFrameListeners() {
        this.chrome.Page.enable();
        this.getResourceTree().then((tree) => {
            this.chrome.Page.frameAttached(this.onFrameAttached);
            this.chrome.Page.frameDetached(this.onFrameDetached);
            this.chrome.Page.frameNavigated(this.onFrameNavigated);
        });
    }
    addNetworkListeners() {
        this.chrome.Network.enable();
        this.chrome.Network.requestWillBeSent(this.requestWillBeSent);
        this.chrome.Network.responseReceived(this.responseReceived);
    }
    ;
    addExecutionContextListeners() {
        this.chrome.Runtime.enable();
        this.chrome.Runtime.executionContextCreated(this.executionContextCreated);
    }
    addDOMListeners() {
        this.getDocument().then((root) => {
            // this.rootFrame.setRoot(root);
            TabState.DOMEventTypes.forEach((eventType) => {
                const capitalizedEventType = `on${eventType[0].toUpperCase()}${eventType.substr(1)}`;
                const func = this[capitalizedEventType];
                this.chrome.on(`DOM.${eventType}`, func);
            });
            this.requestChildNodes(root.nodeId);
        });
    }
    ;
    requestChildNodes(nodeId, depth = -1) {
        return new Promise((resolve, reject) => {
            this.chrome.DOM.requestChildNodes({ nodeId, depth }, (err, val) => {
                if (err) {
                    reject(val);
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    ;
    getTitle() { return this.info.title; }
    getURL() { return this.info.url; }
    setTitle(title) {
        this.info.title = title;
    }
    setURL(url) {
        this.info.url = url;
    }
    updateInfo(tabInfo) {
        const { title, url } = tabInfo;
        this.setTitle(title);
        this.setURL(url);
    }
    setMainFrame(frame) {
        if (this.rootFrame) {
            this.frames.forEach((frame, id) => {
                if (id !== frame.getFrameId()) {
                    this.destroyFrame(id);
                }
            });
        }
        this.rootFrame = frame;
        frame.markSetMainFrameExecuted(true);
        return this.getDocument().then((root) => {
            this.rootFrame.setRoot(root);
            this.emit('mainFrameChanged');
        });
    }
    createEmptyFrame(frameInfo) {
        // this._createEmptyFrame(frameInfo, parentFrameId ? this.getFrame(parentFrameId) : false);
        const { frameId, parentFrameId } = frameInfo;
        // const frameState:FrameState = new FrameState();
    }
    ;
    updateFrameOnEvents(frameState) {
        const frameId = frameState.getFrameId();
        const pendingFrameEvents = this.pendingFrameEvents.get(frameId);
        if (pendingFrameEvents) {
            const resourceTracker = frameState.resourceTracker;
            pendingFrameEvents.forEach((eventInfo) => {
                const { type, event } = eventInfo;
                if (type === 'responseReceived') {
                    resourceTracker.responseReceived(event);
                }
                else if (type === 'requestWillBeSent') {
                    resourceTracker.requestWillBeSent(event);
                }
            });
            this.pendingFrameEvents.delete(frameId);
        }
    }
    ;
    addPendingFrameEvent(eventInfo) {
        const { frameId } = eventInfo;
        if (this.pendingFrameEvents.has(frameId)) {
            this.pendingFrameEvents.get(frameId).push(eventInfo);
        }
        else {
            this.pendingFrameEvents.set(frameId, [eventInfo]);
        }
    }
    getFrame(id) { return this.frames.get(id); }
    hasFrame(id) { return this.frames.has(id); }
    getResourceTree() {
        return new Promise((resolve, reject) => {
            this.chrome.Page.getResourceTree({}, (err, value) => {
                if (err) {
                    reject(value);
                }
                else {
                    resolve(value);
                }
            });
        }).catch((err) => {
            throw (err);
        });
    }
    ;
    getDocument() {
        return new Promise((resolve, reject) => {
            this.chrome.DOM.getDocument({}, (err, value) => {
                if (err) {
                    reject(value);
                }
                else {
                    resolve(value.root);
                }
            });
        }).catch((err) => {
            throw (err);
        });
    }
    ;
    destroyFrame(frameId) {
        if (this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.destroy();
        }
    }
    destroy() {
    }
    ;
}
TabState.DOMEventTypes = ['attributeModified', 'attributeRemoved', 'characterDataModified',
    'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
    'documentUpdated', 'setChildNodes', 'inlineStyleInvalidated'];
exports.TabState = TabState;
// var _ = require('underscore'),
// 	util = require('util'),
// 	URL = require('url'),
// 	EventEmitter = require('events'),
// 	FrameState = require('./frame_state').FrameState;
// var log = require('../../utils/logging').getColoredLogger('yellow');
//
//
// var TabState = function(tabId, chrome) {
// 	this.chrome = chrome;
// 	this._tabId = tabId;
// 	this._rootFrame = false;
// 	this._frames = {};
//
// 	this._pendingFrameEvents = {};
//
// 	this._initialized = this._initialize();
// 	log.debug('=== CREATED TAB STATE', this.getTabId(), ' ====');
// };
//
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
//
//
//
// 	proto.navigate = function(url) {
// 		var parsedURL = URL.parse(url);
// 		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
// 		url = URL.format(parsedURL);
//
// 		var chrome = this._getChrome();
// 		return new Promise(function(resolve, reject) {
// 			chrome.Page.navigate({
// 				url: url
// 			}, function(err, frameId) {
// 				if(err) { reject(frameId); }
// 				else { resolve(frameId); }
// 			})
// 		});
// 	};
// 	proto.getTabId = function() {
// 		return this._tabId;
// 	};
//
// 	proto.evaluate = function(expression, frameId) {
// 		var frame;
//
// 		if(frameId) {
// 			frame = this.getFrame(frameId);
// 		} else {
// 			frame = this.getMainFrame();
// 		}
//
// 		var executionContext = frame.getExecutionContext();
// 		return chromeDriver.evaluate(this._getChrome(), executionContext, {
// 			expression: expression
// 		});
// 		return frame.evaluate(expression);
// 	};
//
// 	proto.getURL = function() {
// 		var mainFrame = this.getMainFrame();
// 		if(mainFrame) {
// 			return mainFrame.getURL();
// 		} else {
// 			return '';
// 		}
// 	};
//
// 	proto.isInitialized = function() {
// 		return this._initialized;
// 	};
//
// 	proto.requestResource = function(url, frameId) {
// 		var frame = this.getFrame(frameId);
// 		return frame.requestResource(url);
// 	};
//
// 	proto.getMainFrame = function() {
// 		return this._rootFrame;
// 	};
//
// 	proto._setMainFrame = function(frame) {
//                 if(this._rootFrame) {
//                   _.each(_.keys(this._frames),_.bind(function(id) {
//                       if (id != frame.getFrameId()) {
//                          this._destroyFrame(id);
//                       }
//                   },this));
//                 }
//                 this._rootFrame = frame;
//                 frame.setSetMainFrameExecuted(true);
//
// 		return this._getDocument().then(_.bind(function(doc) {
// 			var root = doc.root;
// 			this._rootFrame.setRoot(doc.root);
// 			this.emit('mainFrameChanged');
// 		}, this));
// 	};
//
// 	proto._initialize = function() {
// 		var chrome = this._getChrome();
//
// 		return  this._addFrameListeners().then(_.bind(function() {
// 			return this._addDOMListeners();
// 		}, this)).then(_.bind(function() {
// 			return this._addNetworkListeners();
// 		}, this)).then(_.bind(function() {
// 			return this._addExecutionContextListeners();
// 		}, this)).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
//
// 	proto._getResourceTree = function() {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.Page.getResourceTree({}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto._getDocument = function() {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.getDocument({}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto._addNetworkListeners = function() {
// 		var chrome = this._getChrome();
// 		chrome.Network.enable();
//
// 		this.$_requestWillBeSent = _.bind(this._requestWillBeSent, this);
// 		this.$_responseReceived = _.bind(this._responseReceived, this);
//
// 		chrome.Network.requestWillBeSent(this.$_requestWillBeSent);
// 		chrome.Network.responseReceived(this.$_responseReceived);
// 	};
//
// 	proto._requestWillBeSent = function(resource) {
// 		var frameId = resource.frameId;
// 		var frame = this.getFrame(frameId);
// 		if(frame) {
// 			var resourceTracker = frame.getResourceTracker();
// 			resourceTracker._requestWillBeSent(resource);
// 		} else {
// 			var pendingFrameEvents = this._pendingFrameEvents[frameId];
// 			var eventInfo = {
// 				event: resource,
// 				type: 'requestWillBeSent'
// 			};
// 			if(pendingFrameEvents) {
// 				pendingFrameEvents.push(eventInfo);
// 			} else {
// 				this._pendingFrameEvents[frameId] = [eventInfo];
// 			}
// 			//log.error('Could not find frame ' + frameId);
// 		}
// 	};
// 	proto._responseReceived = function(event) {
// 		var frameId = event.frameId;
// 		var frame = this.getFrame(frameId);
// 		if(frame) {
// 			var resourceTracker = frame.getResourceTracker();
// 			resourceTracker._responseReceived(event);
// 		} else {
// 			var pendingFrameEvents = this._pendingFrameEvents[frameId];
// 			var eventInfo = {
// 				event: event,
// 				type: 'responseReceived'
// 			};
// 			if(pendingFrameEvents) {
// 				pendingFrameEvents.push(eventInfo);
// 			} else {
// 				this._pendingFrameEvents[frameId] = [eventInfo];
// 			}
// 			//log.error('Could not find frame ' + frameId);
// 		}
// 	};
//
// 	proto._addFrameListeners = function() {
// 		var chrome = this._getChrome();
// 		this.$_onFrameAttached = _.bind(this._onFrameAttached, this);
// 		this.$_onFrameNavigated = _.bind(this._onFrameNavigated, this);
// 		this.$_onFrameDetached = _.bind(this._onFrameDetached, this);
//
// 		chrome.Page.enable();
// 		return this._getResourceTree().then(_.bind(function(tree){
// 			var frameTree = tree.frameTree;
// 			this._createFrame(frameTree);
//
// 			chrome.Page.frameAttached(this.$_onFrameAttached);
// 			chrome.Page.frameDetached(this.$_onFrameDetached);
// 			chrome.Page.frameNavigated(this.$_onFrameNavigated);
// 		}, this));
// 	};
// 	proto._onFrameAttached = function(frameInfo) {
// 		var frameId = frameInfo.frameId,
// 			parentFrameId = frameInfo.parentFrameId;
//
// 		log.debug('Frame attached  ' + frameId + ' (parent: ' + parentFrameId + ')');
//
// 		this._createEmptyFrame(frameInfo, parentFrameId ? this.getFrame(parentFrameId) : false);
// 	};
// 	proto._onFrameNavigated = function(frameInfo) {
// 		var frame = frameInfo.frame,
// 			frameId = frame.id,
// 			frameUrl = frame.url;
//
// 		log.debug('Frame navigated ' + frameId + ' ' + frameUrl);
//
// 		var frame;
// 		if(this._hasFrame(frameId)) {
// 			frame = this.getFrame(frameId);
// 		} else {
// 			frame = this._createFrame(frameInfo);
// 		}
//
// 		frame.navigated(frameInfo);
// 	};
// 	proto._onFrameDetached = function(frameInfo) {
// 		var frameId = frameInfo.frameId;
//
// 		log.debug('Frame detached ' + frameId);
//
// 		this._destroyFrame(frameId);
// 	};
//
// 	proto._hasFrame = function(frameId) {
// 		return this._frames.hasOwnProperty(frameId);
// 	};
//
// 	proto.getFrame = function(frameId) {
// 		return this._frames[frameId];
// 	};
//
// 	proto._createFrame = function(frameInfo, parent) {
// 		var resources = frameInfo.resources,
// 			childFrames = frameInfo.childFrames,
// 			frame = frameInfo.frame,
// 			frameId = frame.id;
//
// 		log.debug('Frame created ' + frameId);
//
// 		var frameState = this._frames[frameId] = new FrameState(_.extend({
// 			chrome: this._getChrome(),
// 			resources: resources,
// 			page: this,
// 			parentFrame: parent,
//                         frameId: frameId
// 		}, frame));
// 		if(!frame.parentId) {
// 			this._setMainFrame(frameState);
// 		}
//
// 		_.each(childFrames, function(childFrame) {
// 			this._createFrame(childFrame, frameState);
// 		}, this);
//
// 		this._updateFrameOnEvents(frameState);
//
// 		return frameState;
// 	};
//
// 	proto._createEmptyFrame = function(frameInfo) {
// 		var frameId = frameInfo.frameId;
//
// 		var frameState = this._frames[frameId] = new FrameState(_.extend({
// 			chrome: this._getChrome()
// 		}, {
// 			id: frameId,
// 			page: this,
// 			parentId: frameInfo.parentFrameId
// 		}));
//
// 		if(!frameInfo.parentFrameId) {
// 			this._setMainFrame(frameState);
// 		}
// 		this._updateFrameOnEvents(frameState);
//
// 		return frameState;
// 	};
//
// 	proto._updateFrameOnEvents = function(frame) {
// 		var frameId = frame.getFrameId();
// 		var pendingFrameEvents = this._pendingFrameEvents[frameId];
//
// 		if(pendingFrameEvents) {
// 			var resourceTracker = frame.getResourceTracker();
//
// 			_.each(pendingFrameEvents, function(eventInfo) {
// 				var eventType = eventInfo.type,
// 					event = eventInfo.event;
// 				if(eventType === 'responseReceived') {
// 					resourceTracker._responseReceived(event);
// 				} else if(eventType === 'requestWillBeSent') {
// 					resourceTracker._requestWillBeSent(event);
// 				}
// 			});
// 			delete this._pendingFrameEvents[frameId];
// 		}
// 	};
//
// 	proto._destroyFrame = function(frameId) {
// 		if(this._hasFrame(frameId)) {
// 			var frame = this.getFrame(frameId);
// 			frame.destroy();
// 			delete this._frames[frameId];
// 		} else {
// 			throw new Error('Could not find frame with id ' + frameId);
// 		}
// 	};
//
// 	proto.print = function() {
// 		return this._rootFrame.print();
// 	};
// 	proto.serialize = function() {
// 		return this._rootFrame.serialize()
// 	};
// 	proto.stringify = function() {
// 		return JSON.stringify(this.serialize());
// 	};
// 	proto.summarize = function() {
// 		return this._rootFrame.summarize();
// 	};
//
// 	proto.requestChildNodes = function(nodeId, depth) {
// 		if(!depth) { depth = -1; }
//
// 		var chrome = this._getChrome();
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.requestChildNodes({
// 				nodeId: nodeId,
// 				depth: depth
// 			}, function(err, val) {
// 				if(err) {
// 					reject(val);
// 				} else {
// 					resolve(nodeId);
// 				}
// 			})
// 		});
// 	};
//
// 	proto._onDocumentUpdated = function() {
// 		var frame = this.getMainFrame();
// 		frame.documentUpdated();
// 	};
// 	proto.findNode = function(nodeId) {
// 		var result;
// 		_.each(this._frames, function(frame) {
// 			var node = frame.findNode(nodeId);
// 			if(node) {
// 				result = node;
// 			}
// 		}, this);
// 		return result;
// 	};
//
// 	proto._onSetChildNodes = function(event) {
//               //  log.debug('event',event);
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.setChildNodes(event);
// 		});
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for set child nodes event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onCharacterDataModified = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.characterDataModified(event);
// 		});
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for character data modified event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onChildNodeRemoved = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.childNodeRemoved(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for child node removed event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onChildNodeInserted = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.childNodeInserted(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for child node inserted event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
//
// 	proto._onAttributeModified = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.attributeModified(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for attribute modified event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onAttributeRemoved = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.attributeRemoved(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for attribute removed event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onChildNodeCountUpdated = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.childNodeCountUpdated(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for child node count updated event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
// 	proto._onInlineStyleInvalidated = function(event) {
// 		var promises = _.map(this._frames, function(frame) {
// 			return frame.inlineStyleInvalidated(event);
// 		});
//
// 		return Promise.all(promises).then(function(vals) {
// 			return _.any(vals);
// 		}).then(function(wasHandled) {
// 			if(!wasHandled) {
// 				log.error('No frame found for inline style invalidated event', event);
// 			}
// 		}).catch(function(err) {
// 			if(err.stack) { console.error(err.stack); }
// 			else { console.error(err); }
// 		});
// 	};
//
// 	var eventTypes = [ 'attributeModified', 'attributeRemoved', 'characterDataModified',
// 							'childNodeCountUpdated', 'childNodeInserted', 'childNodeRemoved',
// 							'documentUpdated', 'setChildNodes', 'inlineStyleInvalidated' ];
//
// 	proto._addDOMListeners = function() {
// 		var chrome = this._getChrome();
//
// 		return this._getDocument().then(_.bind(function(doc) {
// 			var root = doc.root;
// 			this._rootFrame.setRoot(doc.root);
//
// 			_.each(eventTypes, function(eventType) {
// 				var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
// 				var func = this['$_on'+capitalizedEventType] = _.bind(this['_on' + capitalizedEventType], this);
// 				chrome.on('DOM.' + eventType, func);
// 			}, this);
// 			this.requestChildNodes(root.nodeId, 1);
// 		}, this));
// 	};
//
// 	proto._removeListeners = function() {
// 		var chrome = this._getChrome();
//
// 		_.each(eventTypes, function(eventType) {
// 			var capitalizedEventType = eventType[0].toUpperCase() + eventType.substr(1);
// 			var func = this['$_on'+capitalizedEventType];
// 			if(func) {
// 				chrome.removeListener('DOM.' + eventType, func);
// 			}
// 		}, this);
// 	};
//
// 	proto.highlight = function(nodeId) {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.highlightNode({
// 				nodeId: nodeId,
// 				highlightConfig: {
// 					borderColor: {
// 						r: 255,
// 						g: 0,
// 						b: 0,
// 						a: 1
// 					},
// 					contentColor: {
// 						r: 255,
// 						g: 0,
// 						b: 0,
// 						a: 0.5
// 					},
// 					showInfo: true
// 				}
// 			}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto.removeHighlight = function(nodeId) {
// 		var chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.DOM.hideHighlight({
// 				nodeId: nodeId
// 			}, function(err, value) {
// 				if(err) {
// 					reject(value);
// 				} else {
// 					resolve(value);
// 				}
// 			});
// 		});
// 	};
//
// 	proto.destroy = function() {
// 		var chrome = this._getChrome();
// 		chrome.close();
// 		log.debug('=== DESTROYED TAB STATE', this.getTabId(), ' ====');
// 	};
//
// 	proto._getChrome = function() {
// 		return this.chrome;
// 	};
// }(TabState));
//
// module.exports = {
// 	TabState: TabState
// };
