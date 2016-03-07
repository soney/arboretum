var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	processCSS = require('./css_parser').parseCSS,
	mime = require('mime');

log.setLevel('trace');

var ResourceTracker = function(chrome, frame, initialResources) {
	this._resetData();
	this.frame = frame;
	this.chrome = chrome;
	this._initialize(initialResources);
};

(function(My) {
	var proto = My.prototype;

	proto._initialize = function(initialResources) {
		var chrome = this._getChrome();

		_.each(initialResources, function(resource) {
			this._recordResponse(resource);
		}, this);
	};

	proto._resetData = function() {
		this._requests = {};
		this._responses = {};
		this._resourcePromises = {};
	};

	proto.destroy = function() {
		var chrome = this._getChrome();
		this._resetData();
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto._requestWillBeSent = function(resource) {
		var request = resource.request,
			id = resource.requestId,
			url = request.url;

		this._requests[url] = resource;
		log.debug('request will be sent ' + url);
	};
	proto._responseReceived = function(event) {
		return this._recordResponse(event.response);
	};
	proto._recordResponse = function(response) {
		this._responses[response.url] = response;
		log.debug('response received ' + response.url);
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
		var promise = this._resourcePromises[url];

		if(!promise) {
			promise = this._resourcePromises[url] = this._doGetResource(url);
		}
		return promise.then(_.bind(function(responseBody) {
			var resourceInfo = this._responses[url],
				content = responseBody.content,
				mimeType;

			if(resourceInfo) {
				mimeType = resourceInfo.mimeType;
			} else {
				mimeType = mime.lookup(url);
			}

			if(mimeType === 'text/css') {
				content = processCSS(content, url, this._getFrameId(), this._getTabId());
			}

			return {
				mimeType: mimeType,
				base64Encoded: responseBody.base64Encoded,
				content: content
			};
		}, this));
	};

	proto._doGetResource = function(url) {
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
		}, this));
	};

	proto._getFrame = function() {
		return this.frame;
	};

	proto._getFrameId = function() {
		return this._getFrame().getFrameId();
	};
	proto._getTabId = function() {
		return this._getFrame().getTabId();
	};

}(ResourceTracker));

module.exports = {
	ResourceTracker: ResourceTracker
};