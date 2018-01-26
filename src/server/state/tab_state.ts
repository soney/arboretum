import * as cri from 'chrome-remote-interface';
import {FrameState} from './frame_state';
import {getColoredLogger, level, setLevel} from '../../utils/logging';
import * as _ from 'underscore';
import {EventEmitter} from 'events';
import {parse, format} from 'url';

const log = getColoredLogger('yellow');

export class TabState extends EventEmitter {
    private tabID:CRI.TabID;
    private rootFrame:FrameState;
    private frames:Map<CRI.FrameID, FrameState> = new Map<CRI.FrameID, FrameState>();
    private pendingFrameEvents:Map<CRI.FrameID, Array<any>> = new Map<CRI.FrameID, Array<any>>();
    private chrome:CRI.Chrome;
    private chromePromise:Promise<CRI.Chrome>;
    constructor(private info:CRI.TabInfo) {
        super();
        const chromeEventEmitter = cri({
            chooseTab: this.info
        });
        this.chromePromise = new Promise<CRI.Chrome>((resolve, reject) => {
            chromeEventEmitter.once('connect', (chrome:CRI.Chrome) => {
                this.chrome = chrome;
                resolve(chrome);
            });
        }).catch((err) => {
            throw(err);
        });

        this.chromePromise.then(() => {
            //TODO: Convert getResourceTree call to getFrameTree when supported
            this.getResourceTree().then((tree:CRI.FrameResourceTree) => {
                const {frameTree} = tree;
                const {frame, childFrames, resources} = frameTree;
    			this.createFrameState(frame, null, childFrames, resources);
            });
            this.addFrameListeners();
            this.addDOMListeners();
            this.addNetworkListeners();
            this.addExecutionContextListeners();
        }).catch((err) => {
            throw(err);
        });
    	log.debug(`=== CREATED TAB STATE ${this.getTabId()} ====`);
    };
    public getMainFrame():FrameState {
        return this.rootFrame;
    }
    private createFrameState(info:CRI.Frame, parentFrame:FrameState=null, childFrames:Array<CRI.FrameTree>=[], resources:Array<CRI.FrameResource>=[]):FrameState {
        const {id, parentId} = info;
        const frameState:FrameState = new FrameState(this.chrome, info, this, resources);
        this.frames.set(id, frameState);
        if(!parentId) {
            this.setMainFrame(frameState);
        }
        this.updateFrameOnEvents(frameState);
        childFrames.forEach((childFrame) => {
            const {frame, childFrames, resources} = childFrame;
            this.createFrameState(frame, frameState, childFrames, resources);
        });
        return frameState;
    }
    public getTabId():string { return this.info.id; }
    private addFrameListeners() {
        this.chrome.Page.enable();
        this.chrome.Page.frameAttached(this.onFrameAttached);
        this.chrome.Page.frameDetached(this.onFrameDetached);
        this.chrome.Page.frameNavigated(this.onFrameNavigated);
    }
    private addNetworkListeners() {
        this.chrome.Network.enable();
        this.chrome.Network.requestWillBeSent(this.requestWillBeSent);
        this.chrome.Network.responseReceived(this.responseReceived);
    };
    private addExecutionContextListeners() {
        this.chrome.Runtime.enable();
        this.chrome.Runtime.executionContextCreated(this.executionContextCreated);
    }
    private static DOMEventTypes = [
        'attributeRemoved', 'attributeModified', 'characterDataModified',
        'childNodeInserted', 'childNodeRemoved',
        'setChildNodes', 'childNodeCountUpdated',
        'inlineStyleInvalidated', 'documentUpdated'
    ];
	private addDOMListeners():void {
        this.getDocument().then((root:CRI.Node) => {
            TabState.DOMEventTypes.forEach((eventType:string) => {
                this.forwardEventToFrames(eventType);
            });
            this.requestChildNodes(root.nodeId);
		}).catch((err) => {
            throw(err);
        });
	};
    private forwardEventToFrames(eventType:string, namespace:string='DOM'):void {
        this.chrome.on(`${namespace}.${eventType}`, (event:any) => {
            const frameArray:Array<FrameState> = Array.from(this.frames.values());
            const eventResultPromise:Array<Promise<boolean>> = frameArray.map((frameState:FrameState) => {
                return frameState.handleFrameEvent(event, eventType);
            });
        });
    }
	public requestChildNodes(nodeId:CRI.NodeID, depth:number=-1):Promise<null> {
        return new Promise<null>((resolve, reject) => {
            this.chrome.DOM.requestChildNodes({nodeId, depth}, (err, val) => {
                if(err) { reject(val); }
                else { resolve(null); }
            });
        });
	};
    public getTitle():string { return this.info.title; }
    public getURL():string { return this.info.url; }
    private setTitle(title:string):void {
        this.info.title = title;
    }
    private setURL(url:string):void {
        this.info.url = url;
    }
    public updateInfo(tabInfo) {
		const {title, url} = tabInfo;
        this.setTitle(title);
        this.setURL(url);
    }
    private setMainFrame(frame:FrameState) {
        if(this.rootFrame) {
            this.frames.forEach((frame:FrameState, id:CRI.FrameID) => {
                if(id !== frame.getFrameId()) {
                    this.destroyFrame(id);
                }
            });
        }
        this.rootFrame = frame;
        frame.markSetMainFrameExecuted(true);
        return this.getDocument().then((root:CRI.Node) => {
            this.rootFrame.setRoot(root);
            this.emit('mainFrameChanged');
        });
    }
    public navigate(url:string):Promise<CRI.FrameID> {
        const parsedURL = parse(url);
        if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
        url = format(parsedURL);
        return new Promise((resolve, reject) => {
            this.chrome.Page.navigate({ url }, (err, result:CRI.Page.NavigateResult) => {
                if(err) { throw(err); }
                else { resolve(result.frameId); }
            })
        });
    }

    private onFrameAttached = (frameInfo:CRI.FrameAttachedEvent):void => {
		const {frameId, parentFrameId} = frameInfo;
        this.createFrameState({
            id: frameId,
            parentId:parentFrameId
        })
	};
	private updateFrameOnEvents(frameState:FrameState):void {
        const frameId = frameState.getFrameId();
        const pendingFrameEvents = this.pendingFrameEvents.get(frameId);

		if(pendingFrameEvents) {
            const resourceTracker = frameState.resourceTracker;
            pendingFrameEvents.forEach((eventInfo) => {
                const {type, event} = eventInfo;
                if(type === 'responseReceived') {
                    resourceTracker.responseReceived(event);
                } else if(type === 'requestWillBeSent') {
                    resourceTracker.requestWillBeSent(event);
                }
            });
            this.pendingFrameEvents.delete(frameId);
		}
	};
    private onFrameNavigated = (frameInfo:CRI.FrameNavigatedEvent):void => {
        const {frame} = frameInfo;
        const {id, url} = frame;

        let frameState:FrameState;
        if(this.hasFrame(id)) {
            frameState = this.getFrame(id);
        } else {
            frameState = this.createFrameState(frame);
        }
        frameState.updateInfo(frame);
    }
    private onFrameDetached = (frameInfo:CRI.FrameDetachedEvent):void => {
        const {frameId} = frameInfo;
        this.destroyFrame(frameId);
    };
    private requestWillBeSent  = (event:CRI.RequestWillBeSentEvent):void => {
        const {frameId} = event;
        if(this.hasFrame(frameId)) {
            const frame = this.getFrame(frameId);
            frame.requestWillBeSent(event);
        } else {
            this.addPendingFrameEvent({
                frameId: frameId,
                event: event,
                type: 'requestWillBeSent'
            });
        }
    }
    private responseReceived = (event:CRI.ResponseReceivedEvent):void => {
        const {frameId} = event;
        if(this.hasFrame(frameId)) {
            this.getFrame(frameId).responseReceived(event);
        } else {
            this.addPendingFrameEvent({
                frameId: frameId,
                event: event,
                type: 'responseReceived'
            });
        }
    }
    private executionContextCreated = (event:CRI.ExecutionContextCreatedEvent):void => {
        const {context} = event;
        const {auxData} = context;
        const {frameId} = auxData;
        if(this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.executionContextCreated(context);
        } else {
            log.error(`Could not find frame ${frameId} for execution context`);
        }
    };
    private addPendingFrameEvent(eventInfo:any):void {
        const {frameId} = eventInfo;
        if(this.pendingFrameEvents.has(frameId)) {
            this.pendingFrameEvents.get(frameId).push(eventInfo);
        } else {
            this.pendingFrameEvents.set(frameId, [eventInfo])
        }
    }
    private getFrame(id:CRI.FrameID):FrameState { return this.frames.get(id); }
    private hasFrame(id:CRI.FrameID):boolean { return this.frames.has(id); }
    private getFrameTree():Promise<CRI.FrameTree> {
        throw new Error("Not supported yet")
        // return new Promise<CRI.FrameTree>((resolve, reject) => {
        //     this.chrome.Page.getFrameTree({}, (err, value:CRI.FrameTree) => {
        //         if(err) { reject(value); }
        //         else { resolve(value); }
        //     });
        // }).catch((err) => {
        //     throw(err);
        // });
    }

    private getResourceTree():Promise<CRI.FrameResourceTree> {
        return new Promise<CRI.FrameResourceTree>((resolve, reject) => {
            this.chrome.Page.getResourceTree({}, (err, value:CRI.FrameResourceTree) => {
                if(err) { reject(value); }
                else { resolve(value); }
            });
        }).catch((err) => {
            throw(err);
        });
    };
    public getDocument():Promise<CRI.Node> {
        return new Promise<CRI.Node>((resolve, reject) => {
            this.chrome.DOM.getDocument({}, (err, value) => {
                if(err) { reject(value); }
                else { resolve(value.root); }
            });
        }).catch((err) => {
            throw(err);
        });
    };
    private destroyFrame(frameId:CRI.FrameID) {
        if(this.hasFrame(frameId)) {
            const frameState = this.getFrame(frameId);
            frameState.destroy();
        }
    }
    public destroy() {

    };
}
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
