var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events');

var ResourceTracker = function(chrome) {
	this._resources = {};
	this._urlResourceIds = {};
	this.chrome = chrome;
	this._initialize();
};

(function(My) {
	var proto = My.prototype;

	proto._initialize = function() {
		var chrome = this._getChrome();

		chrome.Network.enable();

		this.$_requestWillBeSent = _.bind(this._requestWillBeSent, this);

		chrome.Network.requestWillBeSent(this.$_requestWillBeSent);
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto._requestWillBeSent = function(resource) {
		var request = resource.request,
			id = resource.requestId,
			url = request.url;

		this._resources[id] = resource;
		this._urlResourceIds[request.url] = id;
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

	proto.getResource = function(tree, url) {
		var resourceInfo = false;
		_.each(tree, function(frame) {
			var resources = frame.resources;
			_.each(resources, function(resource) {
				if(resource.url === url) {
					resourceInfo = resource;
				}
			});
		});
		return new Promise(_.bind(function(resolve, reject) {
			var resourceId = this._urlResourceIds[url];
			if(resourceId) {
				resolve(this._getResponseBody(resourceId));
			} else {
				reject(new Error('Could not find resource "' + url + '"'));
			}
		}, this)).then(function(responseBody) {
			if(resourceInfo) {
				return _.extend({
					resourceInfo : resourceInfo
				}, responseBody);
			} else {
				return responseBody;
			}
		});
	};

	proto.hasResource = function(url) {
		return _.has(this._urlResourceIds, url);
	};

}(ResourceTracker));

module.exports = {
	ResourceTracker: ResourceTracker
};