import {EventEmitter} from 'events';
import { getColoredLogger, level, setLevel } from '../../utils/logging';
import { TabState } from '../../server/state/tab_state';
import { FrameState } from '../../server/state/frame_state';
import { ShadowFrame } from './frame_shadow';
import { ShadowBrowser } from './browser_shadow';
// var _ = require('underscore'),
// 	util = require('util'),
// 	EventEmitter = require('events'),
// 	ShadowFrame = require('./frame_shadow').ShadowFrame;
//
// var log = require('../../utils/logging').getColoredLogger('yellow', 'bgBlack');

const log = getColoredLogger('red', 'bgBlack');

export class ShadowTab extends EventEmitter {
    private frames = new Map();
    private shadowFrame:ShadowFrame;
    constructor(private tabState:TabState, private socket, private browserShadow:ShadowBrowser) {
        super();
    	log.debug(`::: CREATED TAB SHADOW ${this.getTab().getTabId()} :::`);
    }
    private getTab():TabState {
        return this.tabState;
    };
    private getSocket() {
        return this.socket;
    }
    private getBrowserShadow():ShadowBrowser {
        return this.browserShadow;
    }
    private mainFrameChanged = ():void => {
        const tab = this.getTab();
        const rootFrame = tab.getRootFrame();
        this.setFrame(rootFrame.getFrameId());
    };
    private setFrame(frameId:CRI.FrameID):void {
        const socket = this.getSocket();
        if(this.shadowFrame) {
            this.shadowFrame.destroy();
        }
        const frameState = this.getTab().getFrame(frameId);
        this.shadowFrame = new ShadowFrame(frameState, socket, this.getBrowserShadow());
        log.debug(`Frame changed ${frameId}`);
        socket.emit('frameChanged');
    };
    public openURL(url:string) {
        this.getTab().navigate(url);
    };
    public destroy():void {
        const tabState = this.getTab();
        tabState.removeListener('mainFrameChanged', this.mainFrameChanged);
    };
};
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
