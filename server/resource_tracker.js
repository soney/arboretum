var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	processCSS = require('./css_parser').parseCSS;

log.setLevel('trace');

var ResourceTracker = function(chrome, frame, initialResources) {
	this._resources = {};
	this.frame = frame;
	this.chrome = chrome;
	this._initialize(initialResources);
};

(function(My) {
	var proto = My.prototype;

	proto._initialize = function(initialResources) {
		var chrome = this._getChrome();

		_.each(initialResources, function(resource) {
			this._requestWillBeSent(resource);
		}, this);
	};

	proto.destroy = function() {
		var chrome = this._getChrome();
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto._requestWillBeSent = function(resource) {
		if(resource.frameId === this._getFrameId()) {
			var request = resource.request,
				id = resource.requestId,
				url = request.url;

			this._resources[url] = resource;
			log.debug('request will be sent ' + url);
		}
	};
	proto._responseReceived = function(event) {
		if(event.frameId === this._getFrameId()) {
			var response = event.response;
			this._resources[response.url] = response;
			log.debug('response received ' + response.url);
		}
	};

	proto._getResponseBody = function(requestId) {
		var chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.Network.getResponseBody({
				requestId: requestId
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto.getResource = function(url) {
		var frameId = this._getFrameId(),
			chrome = this._getChrome();
		/*
		_.each(tree, function(frame) {
			var resources = frame.resources;
			_.each(resources, function(resource) {
				if(resource.url === url) {
					resourceInfo = resource;
				}
			});
		});
		*/
		return new Promise(_.bind(function(resolve, reject) {
			chrome.Page.getResourceContent({
				frameId: frameId,
				url: url
			}, function(err, val) {
				if(err) {
					reject(new Error('Could not find resource "' + url + '"'));
				} else {
					resolve(val);
				}
			});
		}, this)).then(_.bind(function(responseBody) {
			var resourceInfo = this._resources[url];
			if(resourceInfo) {
				var mimeType = resourceInfo.mimeType;
				if(mimeType === 'text/css') {
					responseBody.content = processCSS(responseBody.content, url, frameId);
				}
				return _.extend({
					resourceInfo : resourceInfo
				}, responseBody);
			} else {
				log.debug('No resource info for ' + url);
				return responseBody;
			}
		}, this));
	};

	proto._getFrame = function() {
		return this.frame;
	};

	proto._getFrameId = function() {
		return this._getFrame().getFrameId();
	};

}(ResourceTracker));

module.exports = {
	ResourceTracker: ResourceTracker
};