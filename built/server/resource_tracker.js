"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore'), util = require('util'), EventEmitter = require('events'), processCSS = require('./css_parser').parseCSS, mime = require('mime');
var log = require('../utils/ColoredLogger').getColoredLogger('cyan');
class ResourceTracker {
    constructor(chrome, frame, initialResources) {
        this.chrome = chrome;
        this.frame = frame;
        this.requests = new Map();
        this.responses = new Map();
        this.resourcePromises = new Map();
        _.each(initialResources, (resource) => this.recordResponse(resource));
    }
    destroy() {
        this.requests.clear();
        this.responses.clear();
        this.resourcePromises.clear();
    }
    recordResponse(response) {
        this.responses.set(response.url, response);
    }
    requestWillBeSent(resource) {
        const { url } = resource;
        this.requests.set(url, resource);
        log.debug('request will be sent ' + url);
    }
    responseReceived(event) {
        return this.recordResponse(event.response);
    }
    getResponseBody(requestId) {
        return new Promise((resolve, reject) => {
            this.chrome.Network.getResponseBody({
                requestId: requestId
            }, function (err, value) {
                if (err) {
                    reject(value);
                }
                else {
                    resolve(value);
                }
            });
        });
    }
    getResource(url) {
        let promise;
        if (this.resourcePromises.has(url)) {
            promise = this.resourcePromises.get(url);
        }
        else {
            promise = this.doGetResource(url);
            this.resourcePromises.set(url, promise);
        }
        return promise.then((responseBody) => {
            const resourceInfo = this.responses.get(url);
            const mimeType = resourceInfo ? resourceInfo.mimeType : mime.lookup(url);
            let content;
            if (mimeType === 'text/css') {
                content = processCSS(content, url, this.getFrameId(), this.getTabId());
            }
            else {
                content = responseBody.content;
            }
            return {
                mimeType: mimeType,
                base64Encoded: responseBody.base64Encoded,
                content: content
            };
        });
    }
    doGetResource(url) {
        return new Promise((resolve, reject) => {
            this.chrome.Page.getResourceContent({
                frameId: this.getFrameId(),
                url: url
            }, function (err, val) {
                if (err) {
                    reject(new Error('Could not find resource "' + url + '"'));
                }
                else {
                    resolve(val);
                }
            });
        }).catch((err) => {
            throw (err);
        });
    }
    getFrameId() { return this.frame.getFrameId(); }
    getTabId() { return this.frame.getTabId(); }
}
exports.ResourceTracker = ResourceTracker;
