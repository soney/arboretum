"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logging_1 = require("../../utils/logging");
const frame_shadow_1 = require("./frame_shadow");
// var _ = require('underscore'),
// 	util = require('util'),
// 	EventEmitter = require('events'),
// 	ShadowFrame = require('./frame_shadow').ShadowFrame;
//
// var log = require('../../utils/logging').getColoredLogger('yellow', 'bgBlack');
const log = logging_1.getColoredLogger('red', 'bgBlack');
class ShadowTab extends events_1.EventEmitter {
    constructor(tabState, socket, browserShadow) {
        super();
        this.tabState = tabState;
        this.socket = socket;
        this.browserShadow = browserShadow;
        this.frames = new Map();
        this.mainFrameChanged = () => {
            const tab = this.getTab();
            const rootFrame = tab.getRootFrame();
            this.setFrame(rootFrame.getFrameId());
        };
        log.debug(`::: CREATED TAB SHADOW ${this.getTab().getTabId()} :::`);
    }
    getTab() {
        return this.tabState;
    }
    ;
    getSocket() {
        return this.socket;
    }
    getBrowserShadow() {
        return this.browserShadow;
    }
    setFrame(frameId) {
        const socket = this.getSocket();
        if (this.shadowFrame) {
            this.shadowFrame.destroy();
        }
        const frameState = this.getTab().getFrame(frameId);
        this.shadowFrame = new frame_shadow_1.ShadowFrame(frameState, socket, this.getBrowserShadow());
        log.debug(`Frame changed ${frameId}`);
        socket.emit('frameChanged');
    }
    ;
    openURL(url) {
        this.getTab().navigate(url);
    }
    ;
    destroy() {
        const tabState = this.getTab();
        tabState.removeListener('mainFrameChanged', this.mainFrameChanged);
    }
    ;
}
exports.ShadowTab = ShadowTab;
;
//
// var ShadowTab = function(options) {
// 	this.options = options;
// 	this._frames = {};
//
// 	log.debug('::: CREATED TAB SHADOW ' + this._getTab().getTabId() + ' :::');
//
// 	this._initialize();
// };
//
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
//
// 	proto._initialize = function() {
// 		this.$mainFrameChanged = _.bind(this.mainFrameChanged, this);
// 		this.mainFrameChanged();
// 		this._addFrameListener();
// 	};
//
// 	proto._getTab = function() {
// 		return this.options.tab;
// 	};
// 	proto.mainFrameChanged = function() {
// 		var tab = this._getTab(),
// 			mainFrame = tab.getMainFrame();
// 		this.setFrame(mainFrame.getFrameId());
// 	};
// 	proto._getSocket = function() {
// 		return this.options.socket;
// 	};
// 	proto.setFrame = function(frameId) {
// 		var socket = this._getSocket();
//
// 		if(this.shadowFrame) {
// 			this.shadowFrame.destroy();
// 		}
// 		var frame = this._getTab().getFrame(frameId);
// 		this.shadowFrame = new ShadowFrame(_.extend({}, this.options, {
// 			frame: frame,
// 			socket: socket,
// 			browserShadow: this.getBrowserShadow()
// 		}));
// 		log.debug('Frame changed ' + frameId);
// 		socket.emit('frameChanged');
// 	};
//
// 	proto._addFrameListener = function() {
// 		var tab = this._getTab();
// 		if(!this.frameId) {
// 			tab.on('mainFrameChanged', this.$mainFrameChanged);
// 		}
// 	};
// 	proto._removeFrameListener = function() {
// 		var tab = this._getTab();
// 		tab.removeListener('mainFrameChanged', this.$mainFrameChanged);
// 	};
// 	proto.getFrameId = function() {
// 		return this.frameId;
// 	};
// 	proto.getTabId = function() {
// 		return this._getTab().getTabId();
// 	};
// 	proto.openURL = function(url) {
// 		this._getTab().navigate(url);
// 	};
// 	proto.getBrowserShadow = function() {
// 		return this.options.browserShadow;
// 	};
//
// 	proto.destroy = function() {
// 		this._removeFrameListener();
// 		if(this.shadowFrame) {
// 			this.shadowFrame.destroy();
// 		}
// 		log.debug('::: DESTROYED TAB SHADOW ' + this._getTab().getTabId() + ' :::');
// 	};
// }(ShadowTab));
//
// module.exports = {
// 	ShadowTab: ShadowTab
// };
