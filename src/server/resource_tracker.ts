var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	processCSS = require('./css_parser').parseCSS,
	mime = require('mime');
var log = require('../utils/logging').getColoredLogger('cyan');

export class ResourceTracker {
	private requests:Map<any, any> = new Map<any, any>();
	private responses:Map<string, any> = new Map<string, any>();
	private resourcePromises = new Map();
	constructor(private chrome:CRI.Chrome, private frame, initialResources) {
		_.each(initialResources, (resource) => this.recordResponse(resource));
	}
	public destroy():void {
		this.requests.clear();
		this.responses.clear();
		this.resourcePromises.clear();
	}
	private recordResponse(response):void {
		this.responses.set(response.url, response);
	}
	public requestWillBeSent(resource):void {
		const {url} = resource;
		this.requests.set(url, resource);
		log.debug('request will be sent ' + url);
	}
	public responseReceived(event) {
		return this.recordResponse(event.response);
	}
	public getResponseBody(requestId:CRI.RequestID):Promise<CRI.GetResponseBodyResponse> {
		return new Promise<CRI.GetResponseBodyResponse>((resolve, reject) => {
			this.chrome.Network.getResponseBody({
				requestId: requestId
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	}
	public getResource(url:string):Promise<any> {
		let promise;
		if(this.resourcePromises.has(url)) {
			promise = this.resourcePromises.get(url);
		} else {
			promise = this.doGetResource(url);
			this.resourcePromises.set(url, promise);
		}
		return promise.then((responseBody) => {
			const resourceInfo = this.responses.get(url);
			const mimeType = resourceInfo ? resourceInfo.mimeType : mime.lookup(url);
			let content;
			if(mimeType === 'text/css') {
				content = processCSS(content, url, this.getFrameId(), this.getTabId());
			} else {
				content = responseBody.content;
			}

			return {
				mimeType: mimeType,
				base64Encoded: responseBody.base64Encoded,
				content: content
			};
		});
	}

	private doGetResource(url:string):Promise<CRI.GetResourceContentResponse> {
		return new Promise<CRI.GetResourceContentResponse>((resolve, reject) => {
			this.chrome.Page.getResourceContent({
				frameId: this.getFrameId(),
				url: url
			}, function(err, val) {
				if(err) {
					reject(new Error('Could not find resource "' + url + '"'));
				} else {
					resolve(val);
				}
			});
		}).catch((err) => {
			throw(err);
		});
	}
	private getFrameId():CRI.FrameID { return this.frame.getFrameId(); }
	private getTabId():CRI.TabID { return this.frame.getTabId(); }
}
