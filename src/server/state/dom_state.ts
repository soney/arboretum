import {FrameState} from './frame_state';
import {getCanvasImage, getUniqueSelector, getElementValue} from '../hack_driver/hack_driver';
import {getColoredLogger, level, setLevel} from '../../utils/logging';
import {processCSSURLs} from '../css_parser';
import {EventEmitter} from 'events';
import {TabState} from './tab_state';
import {NodeCode} from '../../utils/node_code';
import {urlTransform} from '../url_transform';

const log = getColoredLogger('magenta');

export class DOMState extends EventEmitter {
    private destroyed:boolean = false;
    private namespace:any = null;
    private inlineStyle:string = '';
    private children:Array<any> = [];
	private updateValueInterval:NodeJS.Timer = null;
	private childFrame:FrameState = null;

    constructor(private chrome:CRI.Chrome, private node:CRI.Node, private frame:FrameState, private parent:DOMState) {
		super();
		if(node.frameId) {
			const frameRoot:CRI.Node = node.contentDocument;
			const tab:TabState = this.getTab();
			const frame:FrameState = tab.getFrame(node.frameId);

			frame.setRoot(frameRoot);
			frame.setDOMParent(this);

			this.childFrame = frame;
		}

		this.getFullString().then((fullNodeValue:string) => {
			this.setNodeValue(fullNodeValue);
		}).catch((err) => {
			if(err.code && err.code === -32000) {
				log.error(`Could not find node ${this.getNodeId()}`)
			}
		});
		// log.debug(`=== CREATED DOM STATE ${this.getNodeId()} ====`);
    }
    public destroy():void {
		this.removeValueListeners();
		this.children.forEach((child:DOMState) => {
			child.destroy();
		});
		this.emit('destroyed');
		this.destroyed = true;
		// log.debug(`=== DESTROYED DOM STATE ${this.getNodeId()} ====`);
    }
	public getTab():TabState { return this.getFrame().getTab(); };
	public getNodeId():CRI.NodeID { return this.node.nodeId; };
    public getTagName():string { return this.node.nodeName; };
    public getNodeAttributes():Array<string> { return this.node.attributes;};
    public getFrame():FrameState { return this.frame;};
	public getFrameId():CRI.FrameID { return this.getFrame().getFrameId(); };
	public getTabId():CRI.TabID { return this.getFrame().getTabId(); };
    public getParent():DOMState { return this.parent; };
    public setParent(parent:DOMState):void { this.parent = parent; }
	public getNodeType():number { return this.node.nodeType; }
	public getCanvasImage():Promise<any> { return getCanvasImage(this.chrome, this.getNodeId()); };
	public getUniqueSelector():Promise<string> {
		return getUniqueSelector(this.chrome, this.getNodeId());
	};
	public getInputValue():Promise<string> {
		return getElementValue(this.chrome, this.getNodeId());
	};
	private getFullString():Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const nodeType = this.getNodeType();
			const nodeValue = this.getNodeValue();

			if(nodeType === NodeCode.TEXT_NODE && nodeValue && nodeValue.endsWith('…')) {
				this.chrome.DOM.getOuterHTML({
					nodeId: this.getNodeId()
				}, (err, value) => {
					if(err) {
						reject(value);
					} else {
						resolve(value.outerHTML);
					}
				});
			} else {
				resolve(nodeValue);
			}
		}).catch((err) => {
			log.error(err);
            throw(err);
        });
	};
	private addValueListeners() {
		const tagName:string = this.getTagName().toLowerCase();
		if(tagName === 'input' || tagName === 'textarea') {
			this.updateValueInterval = setInterval(() => {
				this.getInputValue().then((data:string) => {
					this.emit('valueUpdated', 'input', data);
				});
			}, 700);
		} else if(tagName === 'canvas') {

		}
	}
	private removeValueListeners() {
		if(this.updateValueInterval) {
			clearInterval(this.updateValueInterval);
			this.updateValueInterval = null;
		}
	}
    public updateInlineStyle():void {
		const oldInlineStyle:string = this.inlineStyle;
		this.requestInlineStyle().then((inlineStyle) => {
			this.inlineStyle = inlineStyle.cssText;
			if(this.inlineStyle !== oldInlineStyle) {
				this.emit('inlineStyleChanged', {
					inlineStyle: this.inlineStyle
				});
			}
		});
	};
	public insertChild(childDomState:DOMState, previousDomState:DOMState=null):void {
		if(previousDomState) {
			const index = this.children.indexOf(previousDomState);
			this.children.splice(index+1, 0, childDomState);
		} else {
			this.children.unshift(childDomState);
		}
		childDomState.setParent(this);
		this.emit('childAdded', {
			child: childDomState,
			previousNode: previousDomState
		})
	}

    public setCharacterData(characterData:string):void {
		this.node.nodeValue = characterData;
		this.emit('nodeValueChanged', {
			value: this.getNodeValue()
		})
    }
	private setNodeValue(value:string):void {
		this.node.nodeValue = value;
	}
	public getNodeValue():string {
		return this.node.nodeValue;
	}
	public removeChild(child:DOMState):boolean {
		const index = this.children.indexOf(child);
		if(index >= 0) {
			this.children.splice(index, 1);
			this.emit('childRemoved', { child })
			child.destroy();
			return true;
		} else {
			return false;
		}
	}
	public setAttribute(name:string, value:string):void {
		const node = this.node;
		const {attributes} = node;
		if(!attributes) {
			throw new Error('Could not find attributes');
		}
		let found:boolean = false;
		for(let i:number = 0; i<attributes.length; i+=2) {
			const n = attributes[i];
			if(n === name) {
				attributes[i+1] = value;
				found = true;
				break;
			}
		}
		if(!found) {
			attributes.push(name, value);
		}
		this.notifyAttributeChange();
	}
	public removeAttribute(name:string):boolean {
		const node = this.node;
		const {attributes} = node;
		const attributeIndex = attributes.indexOf(name);
		if(attributeIndex >= 0) {
			attributes.splice(attributeIndex, 2);
			this.notifyAttributeChange();
			return true;
		} else {
			return false;
		}
	}
	private notifyAttributeChange():void {
		this.emit('attributesChanged');
	}
	public childCountUpdated(count:number):void {
		this.getTab().requestChildNodes(this.getNodeId())
	}
	private requestInlineStyle():Promise<CRI.CSSStyle> {
		const nodeType = this.getNodeType();
		if(nodeType === 1) {
			return new Promise<CRI.CSSStyle>((resolve, reject) => {
				this.chrome.CSS.getInlineStylesForNode({
					nodeId: this.getNodeId()
				}, (err, data:CRI.GetInlineStylesResponse) => {
					if(this.destroyed) {
						reject(new Error(`Node ${this.getNodeId()} was destroyed`));
					} else if(err) {
						reject(err);
					} else {
						const {inlineStyle} = data;
						if(inlineStyle.cssText) {
							const newCSSText = processCSSURLs(inlineStyle.cssText, this.getBaseURL(), this.getFrameId(), this.getTabId());
							inlineStyle.cssText = newCSSText;
						}
						resolve(inlineStyle);
					}
				});
			}).catch((err) => {
				log.error(err);
                throw(err);
            });
		}

		// 	return new Promise(_.bind(function(resolve, reject) {
		// 		chrome.CSS.getInlineStylesForNode({
		// 			nodeId: id
		// 		}, _.bind(function(err, value) {
		// 			if(this._destroyed) {
		// 				var myError = new Error('Node ' + id + ' was destroyed');
		// 				myError.expected = true;
		// 				reject(myError);
		// 			} else if(err) {
		// 				//reject(new Error('Could not find node ' + id));
		// 			} else {
		// 				resolve(value.inlineStyle);
		// 			}
		// 		}, this));
		// 	}, this)).then(_.bind(function(is) {
		// 		inlineStyle = is;
		// 		if(inlineStyle.cssText) {
		// 			return this._getBaseURL();
		// 		}
		// 	}, this)).then(_.bind(function(url) {
		// 		if(inlineStyle.cssText) {
		// 			inlineStyle.cssText = processCSSURLs(inlineStyle.cssText, url, this.getFrameId(), this.getTabId());
		// 		}
		// 		return inlineStyle;
		// 	}, this));
		// } else {
		// 	return new Promise(function(resolve, reject) {
		// 		resolve({
		// 			cssText: ''
		// 		});
		// 	});
		// }
	}
    public setChildren(children:Array<DOMState>):void {
		this.children.forEach((child:DOMState) => {
			if(!children.includes(child)) {
				child.destroy();
			}
		});
		this.children = children;
		this.children.forEach((child) => {
			child.setParent(this);
		});
		this.emit('childrenChanged', { children })
    }

    private getBaseURL():string {
    	const frame = this.getFrame();
    	return frame.getURL();
    };

	private stringifySelf():string {
		const MAX_TEXT_LENGTH:number = 50;
		const type = this.getNodeType();
		const id = this.getNodeId();
		if(type === NodeCode.DOCUMENT_NODE) {
			return `(${id}) ${this.getTagName()}`
		} else if(type === NodeCode.TEXT_NODE) {
			var text = this.getNodeValue().replace(/(\n|\t)/gi, '');
			if(text.length > MAX_TEXT_LENGTH) {
				text = `${text.substr(0, MAX_TEXT_LENGTH)}...`;
			}
			return `(${id}) text: ${text}`
		} else if(type === NodeCode.DOCUMENT_TYPE_NODE) {
			return `(${id}) <${this.getTagName()}>`;
		} else if(type === NodeCode.ELEMENT_NODE) {
			let text = `(${id}) <${this.getTagName()}`;
			var attributesMap = this.getAttributesMap();
			var style = this.getInlineStyle();
			if(style) {
				attributesMap.set('style', style);
			}
			attributesMap.forEach((val:string, key:string) => {
				text += ` ${key} = '${val}'`;
			});
			text += '>';
			return text;
		} else if(type === NodeCode.COMMENT_NODE) {
			let text = `(${id}) <!-- `
			text += this.getNodeValue().replace(/(\n|\t)/gi, '');
			if(text.length > MAX_TEXT_LENGTH) {
				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
			}
			text +=  ' -->';
			return text;
		} else {
			return 'node';
		}
	};
	private getInlineStyle():string {
		return this.inlineStyle;
	}
	private static attributesToIgnore:Array<string> = ['onload', 'onclick', 'onmouseover', 'onmouseout',
			'onmouseenter', 'onmouseleave', 'action', 'oncontextmenu', 'onfocus'];
	private shouldIncludeAttribute(attributeName:string):boolean {
		const lowercaseAttributeName = attributeName.toLowerCase();
		return DOMState.attributesToIgnore.indexOf(lowercaseAttributeName) < 0;
	};
	private getAttributesMap(shadow?):Map<string, string> {
		const tagName = this.getTagName();
		const tagTransform = urlTransform[tagName.toLowerCase()];
		const attributes = this.getNodeAttributes();
		const rv = new Map<string, string>();

		const len:number = attributes.length;
		let i:number = 0;
		while(i < len) {
			const [attributeName, attributeValue] = [attributes[i], attributes[i+1]];
			let newValue:string = attributeValue;
			if(this.shouldIncludeAttribute(attributeName)) {
				newValue = '';
			} else {
				if(tagTransform) {
					const attributeTransofrm = tagTransform(attributeName.toLowerCase());
					const url = this.getBaseURL();
					if(url) {
						newValue = attributeTransofrm.transform(attributeValue, url, this, shadow);
					} else {
						log.debug('No base URL')
					}
				}
			}
			rv.set(attributeName, newValue);
			i += 2;
		}
		return rv;
	};
	public stringify(level:number=0):string {
		let result:string = `${'    '.repeat(level)}${this.stringifySelf()}`;
		if(this.childFrame) {
			result += `(${this.childFrame.getFrameId()})`;
		}
		result += '\n';

		this.children.forEach((child:DOMState) => {
			result += child.stringify(level + 1);
		});
		return result;
	}
	public print(level:number=0):void {
		console.log(this.stringify(level));
	}
	public getFrameStack() {
		return this.frame.getFrameStack();
	}
	public querySelectorAll(selector:string):Promise<Array<CRI.NodeID>> {
		return new Promise<Array<CRI.NodeID>>((resolve, reject) => {
			this.chrome.DOM.querySelectorAll({
				nodeId: this.getNodeId(),
				selector: selector
			}, (err, value) => {
				if(err) { reject(value); }
				else { resolve(value.nodeIds); }
			})
		});
	}
// 	proto.print = function(level) {
// 		var str = '';
// 		if(!level) { level = 0; }
// 		for(var i = 0; i<level; i++) {
// 			str += '  ';
// 		}
//         var node = this._getNode(),
// 		type = node.nodeType,
// 		id = node.nodeId;
// 		str += this._stringifySelf();
// 		var childFrame = this.getChildFrame();
//
// 		if(childFrame) {
// 			str += ' ('+childFrame.getFrameId()+')';
// 		}
// 		console.log(str);
// 		_.each(this.getChildren(), function(child) {
// 			child.print(level+1);
// 		});
// 		/*if(childFrame) {
// 			childFrame.print(level+1);
// 		}*/
//
// 		return this;
// 	};
// 	proto._requestInlineStyle = function() {
// 		var node = this._getNode(),
// 			type = node.nodeType;
// 		if(type === 1) {
// 			var id = this.getId(),
// 				chrome = this._getChrome(),
// 				inlineStyle;
//
// 			return new Promise(_.bind(function(resolve, reject) {
// 				chrome.CSS.getInlineStylesForNode({
// 					nodeId: id
// 				}, _.bind(function(err, value) {
// 					if(this._destroyed) {
// 						var myError = new Error('Node ' + id + ' was destroyed');
// 						myError.expected = true;
// 						reject(myError);
// 					} else if(err) {
// 						//reject(new Error('Could not find node ' + id));
// 					} else {
// 						resolve(value.inlineStyle);
// 					}
// 				}, this));
// 			}, this)).then(_.bind(function(is) {
// 				inlineStyle = is;
// 				if(inlineStyle.cssText) {
// 					return this._getBaseURL();
// 				}
// 			}, this)).then(_.bind(function(url) {
// 				if(inlineStyle.cssText) {
// 					inlineStyle.cssText = processCSSURLs(inlineStyle.cssText, url, this.getFrameId(), this.getTabId());
// 				}
// 				return inlineStyle;
// 			}, this));
// 		} else {
// 			return new Promise(function(resolve, reject) {
// 				resolve({
// 					cssText: ''
// 				});
// 			});
// 		}
// 	};
}
// var _ = require('underscore'),
// 	URL = require('url'),
// 	util = require('util'),
// 	EventEmitter = require('events'),
// 	path = require('path'),
// 	urlTransform = require('../url_transform').urlTransform,
// 	driver = require('../hack_driver/hack_driver');
// 	processCSSURLs = require('../css_parser').processCSSURLs,
// 	NODE_CODE = require('../../utils/node_code'),
// 	Deferred = require('../../utils/deferred');
// var log = require('../../utils/logging').getColoredLogger('magenta');
//
// //var regdids = {};
//
// var DOMState = function(options) {
// 	this.node = options.node;
// 	this.chrome = options.chrome;
// 	this.frame = options.frame;
//
// 	this._parent = options.parent;
//
// 	this._destroyed = false;
// 	this._namespace = null;
// 	this._inlineStyle = '';
// 	this.children = [];
// 	this._self_initialized = this.initialize().then(_.bind(function() {
// 		//log.debug('DOM state ' + this.getId() + ' initialized');
// 	}, this)).catch(function(err) {
// 		if(!err.expected) {
// 			log.error(err.message);
// 		}
// 	});
// 	//if(regdids[this.getId()]) debugger;
// 	//regdids[this.getId()] = true;
//
// 	//this._self_initialized._node = this.node;
// 	//this._updateChildrenInitializedPromise();
// 	//this._initialized = Promise.all([this._self_initialized, this._children_initialized]);
// 	//log.debug('=== CREATED DOM STATE', this.getId(), ' ====');
// };
//
// (function(My) {
// 	util.inherits(My, EventEmitter);
// 	var proto = My.prototype;
//
// 	proto.isInitialized = function() {
// 		return this._self_initialized;
// 	};
// 	proto._addValueListeners = function() {
// 		var tagName = this._getTagName().toLowerCase();
// 		if(tagName === 'canvas') {
// 			// this._updateValueInterval = setTimeout(_.bind(function() {
// 			// 	this.getCanvasImage().then(_.bind(function(data) {
// 			// 		this.emit('valueUpdated', 'canvas', data);
// 			// 	}, this));
// 			// }, this), 5000);
// 		} else if(tagName === 'input' || tagName=='textarea') {
// 			this._updateValueInterval = setInterval(_.bind(function() {
// 				this.getInputValue().then(_.bind(function(data) {
// 					this.emit('valueUpdated', 'input', data);
// 				}, this));
// 			}, this), 700);
// 		}
// 	};
// 	proto._removeValueListeners = function() {
// 		if(this._updateValueInterval) {
// 			clearInterval(this._updateValueInterval);
// 			delete this._updateValueInterval;
// 		}
// 	};
// 	proto.getCanvasImage = function() {
// 		return driver.getCanvasImage(this._getChrome(), this.getId());
// 	};
// 	proto.getUniqueSelector = function() {
// 		return driver.getUniqueSelector(this._getChrome(), this.getId()).then(function(rv) {
// 			return rv.result.value;
// 		});
// 	};
// 	proto.getInputValue = function() {
// 		return driver.getElementValue(this._getChrome(), this.getId());
// 	};
// 	/*
//
// 	proto._updateChildrenInitializedPromise = function() {
// 		var initializedPromises = Promise.all(_.pluck(this.children, '_self_initialized'));
// 		if(this.children.length > 0) {
// 			log.debug('Update children_initialized ' + this.getId() + ' to wait for ' + this.children.length + ' children');
// 		}
// 		this._children_initialized = initializedPromises.then(_.bind(function() {
// 			log.debug('Node ' + this.getId() + ' children initialized');
// 		}, this)).catch(function(err) {
// 			log.error(err);
// 		});//Promise.race(initializedPromises, timeoutPromise);
//
// 		return this._children_initialized;
// 	};
// 	*/
//
// 	proto._getFrame = function() {
// 		return this.frame;
// 	};
//
// 	proto.getParent = function() {
// 		return this._parent;
// 	};
// 	proto.setParent = function(parent) {
// 		this._parent = parent;
// 	};
//
// 	proto._initializeLongString = function() {
// 		var node = this._getNode(),
// 			nodeType = node.nodeType,
// 			nodeValue = node.nodeValue;
//
// 		return new Promise(_.bind(function(resolve, reject) {
// 			if(nodeType === NODE_CODE.TEXT_NODE && nodeValue && nodeValue.endsWith('…')) {
// 				var chrome = this._getChrome();
// 				chrome.DOM.getOuterHTML({
// 					nodeId: this.getId()
// 				}, _.bind(function(err, value) {
// 					if(err) {
// 						reject(value);
// 					} else {
// 						node.nodeValue = value.outerHTML;
// 						resolve(node.nodeValue);
// 					}
// 				}, this));
// 			} else {
// 				resolve(nodeValue);
// 			}
// 		}, this));
// 	}
//
// 	proto._getBaseURL = function() {
// 		var frame = this._getFrame();
// 		return frame.getURL();
// 	};
//
// 	proto._getTagName = function() {
// 		var node = this._getNode();
// 		return node.nodeName;
// 	};
//
// 	proto.getAttributesMap = function(shadow) {
// 		var node = this._getNode(),
// 			tagName = this._getTagName(),
// 			tagTransform = urlTransform[tagName.toLowerCase()]
// 			attributes = node.attributes,
// 			rv = {};
//
// 		if(attributes) {
// 			var len = attributes.length,
// 				i = 0;
// 			while(i < len) {
// 				var name = attributes[i],
// 					value = attributes[i+1],
// 					newValue = value;
//
// 				if(shadow) {
// 					var lcName = name.toLowerCase();
// 					if(lcName === 'onload' || lcName === 'onclick' ||
// 						lcName === 'onmouseover' || lcName === 'onmouseout' ||
// 						lcName === 'onmouseenter' || lcName === 'onmouseleave' ||
// 						lcName === 'action' || lcName === 'oncontextmenu' ||
// 						lcName === 'onfocus') {
// 						newValue = '';
// 					} else {
// 						if(tagTransform) {
// 							var attributeTransform = tagTransform[lcName];
// 							if(attributeTransform) {
// 								var url = this._getBaseURL();
// 								if(url) {
// 									newValue = attributeTransform.transform(value, url, this, shadow);
// 								} else {
// 									log.debug('no base url');
// 								}
// 							}
// 						}
// 					}
// 				}
//
// 				rv[name] = newValue;
// 				i+=2;
// 			}
//
// 			if(shadow) {
// 				var childFrame = this.getChildFrame();
// 				if(childFrame) {
// 					rv.src = transformIFrameURL(childFrame, shadow);
// 				}
// 			}
// 		}
// 		return rv;
// 	};
//
// 	proto.getNamespace = function() {
// 		return this._namespace;
// 	};
//
// 	proto.updateNamespace = function() {
// 		var nodeType = this.getNodeType();
// 		if(nodeType === NODE_CODE.ELEMENT_NODE) {
// 			return driver.getNamespace(this._getChrome(), this.getId()).then(function(result) {
// 				if(result.wasThrown) {
// 					return null;
// 				} else {
// 					return result.result.value;
// 				}
// 			}).then(_.bind(function(namespace) {
// 				return this._namespace = namespace;
// 			}, this));
// 		} else {
// 			return false;
// 		}
// 	};
//
// 	proto.initialize = function() {
// 		var inlineStylePromise = this._requestInlineStyle().then(_.bind(function(inlineStyle) {
// 				this._inlineStyle = inlineStyle.cssText;
// 			}, this)).catch(function(err) {
// 				if(!err.expected) {
// 					log.error(err);
// 				}
// 			});
//
// 		var node = this._getNode();
//
// 		if(node.frameId) {
// 			var page = this._getPage();
// 			var frameRoot = node.contentDocument;
// 			var frame = page.getFrame(node.frameId);
//
// 			frame.setRoot(frameRoot);
// 			frame.setDOMParent(this);
//
// 			this.childFrame = frame;
// 		} else {
// 			this.childFrame = false;
// 		}
//
// 		this._addValueListeners();
//
// 		var longStringInitialization = this._initializeLongString(),
// 			namespaceFetcher = this.updateNamespace();
//
// 		return Promise.all([inlineStylePromise, longStringInitialization, namespaceFetcher]);
// 	};
// 	proto.getChildFrame = function() {
// 		return this.childFrame;
// 	};
// 	proto.destroy = function() {
// 		this._removeValueListeners();
// 		_.each(this.children, function(child) {
// 			child.destroy();
// 		});
// 		this.emit('destroyed');
// 		this._destroyed = true;
// 		//log.debug('=== DESTROYED DOM STATE', this.getId(), ' ====');
// 	};
//
// 	proto.getId = function() {
// 		var node = this._getNode();
// 		return node.nodeId;
// 	};
//
// 	proto._setChildren = function(children) {
// 		_.each(this.children, function(child) {
// 			if(children.indexOf(child) < 0) {
// 				child.destroy();
// 			}
// 		});
//
// 		this.children = children;
// 		//this._updateChildrenInitializedPromise();
//
// 		_.each(this.children, function(child) {
// 			child.setParent(this);
// 		}, this);
// 		this.emit('childrenChanged', {
// 			children: children
// 		});
// 		return this;
// 	};
//
// 	proto._getNode = function() {
// 		return this.node;
// 	};
//
// 	proto._removeChild = function(child) {
// 		var index = _.indexOf(this.getChildren(), child);
// 		if(index >= 0) {
// 			this.children.splice(index, 1);
// 			//this._updateChildrenInitializedPromise();
// 			this.emit('childRemoved', {
// 				child: child
// 			});
// 			child.destroy();
// 		}
// 		return this;
// 	};
//
// 	proto._insertChild = function(child, previousNode) {
// 		if(previousNode) {
// 			var index = _.indexOf(this.children, previousNode);
// 			this.children.splice(index+1, 0, child);
// 		} else {
// 			this.children.unshift(child);
// 		}
// 		child.setParent(this);
//
// 		//this._updateChildrenInitializedPromise();
// 		this.emit('childAdded', {
// 			child: child,
// 			previousNode: previousNode
// 		});
// 	};
//
// 	proto._setAttribute = function(name, value) {
// 		var node = this._getNode(),
// 			attributes = node.attributes,
// 			found = false;
// 		if(!attributes) {
// 			log.error('Could not set node attributes', node);
// 			return;
// 		}
// 		for(var i = 0; i<attributes.length; i+=2) {
// 			if(attributes[i] === name) {
// 				attributes[i+1] = value;
// 				found = true;
// 				break;
// 			}
// 		}
// 		if(!found) {
// 			attributes.push(name, value);
// 		}
//
// 		this._notifyAttributeChange();
// 	};
//
// 	proto._removeAttribute = function(name) {
// 		var tagName = this._getTagName().toLowerCase();
//
// 		var node = this._getNode();
// 		var attributeIndex = _.indexOf(node.attributes, name);
// 		if(attributeIndex >= 0) {
// 			node.attributes.splice(attributeIndex, 2);
// 			this._notifyAttributeChange();
// 		}
// 	};
//
// 	proto._notifyAttributeChange = function() {
// 		this.emit('attributesChanged');
// 	};
//
// 	proto.getAttributes = function() {
// 		var node = this._getNode();
// 		return node.attributes;
// 	};
//
// 	proto._getChrome = function() {
// 		return this.chrome;
// 	};
//
// 	proto.getChildren = function() {
// 		return this.children;
// 	};
// 	proto.getDeepChildren = function(rv) {
// 		if(!rv) {
// 			rv = [];
// 		}
//
// 		rv.push.apply(rv, this.getChildren());
// 		_.each(this.getChildren(), function(child) {
// 			child.getDeepChildren(rv);
// 		});
//
// 		return rv;
// 	};
//
// 	proto.isCSSStyle = function() {
// 		return this._getTagName().toLowerCase() === 'style';
// 	};
//
// 	proto._setCharacterData = function(characterData) {
// 		var node = this._getNode();
// 		node.nodeValue = characterData;
//
// 		this.emit('nodeValueChanged', {
// 			value: this.getNodeValue()
// 		});
// 	};
//
// 	proto.isPasswordInput = function() {
// 		var node = this._getNode();
// 		if(node) {
// 			if(this._getTagName().toLowerCase() === 'input') {
// 				var attributesMap = this.getAttributesMap();
// 				return attributesMap['type'] == 'password';
//
// 			}
// 		}
// 		return false;
// 	};
//
// 	proto.getNodeValue = function() {
// 		var node = this._getNode(),
// 			parent = this.getParent();
// 		if(parent && parent.isCSSStyle()) {
// 			return processCSSURLs(node.nodeValue, this._getBaseURL(), this.getFrameId(), this.getTabId());
// 		} else {
// 			return node.nodeValue;
// 		}
// 	};
// 	proto.getNodeName = function() {
// 		var node = this._getNode();
// 		return node.nodeName;
// 	};
//
// 	proto._childCountUpdated = function(count) {
// 		var page = this._getPage();
// 		page.requestChildNodes(this.getId(), -1);
// 	};
//
// 	proto._getMatchedStyles = function() {
// 		var id = this.getId(),
// 			chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.CSS.getMatchedStylesForNode({
// 				nodeId: id
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
// 	proto._getCSSAnimations = function() {
// 		var id = this.getId(),
// 			chrome = this._getChrome();
//
// 		return new Promise(function(resolve, reject) {
// 			chrome.CSS.getCSSAnimationsForNode({
// 				nodeId: id
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
// 	proto.updateInlineStyle = function() {
// 		var oldInlineStyle = this.getInlineStyle();
// 		return this._requestInlineStyle().then(_.bind(function(inlineStyle) {
// 			this._inlineStyle = inlineStyle.cssText;
// 			if(inlineStyle !== oldInlineStyle) {
// 				this.emit('inlineStyleChanged', {
// 					inlineStyle: this._inlineStyle
// 				});
// 			}
// 		}, this));
// 	};
//
// 	proto.getNodeType = function() {
// 		var node = this._getNode();
// 		return node.nodeType;
// 	};
//
// 	proto._requestInlineStyle = function() {
// 		var node = this._getNode(),
// 			type = node.nodeType;
// 		if(type === 1) {
// 			var id = this.getId(),
// 				chrome = this._getChrome(),
// 				inlineStyle;
//
// 			return new Promise(_.bind(function(resolve, reject) {
// 				chrome.CSS.getInlineStylesForNode({
// 					nodeId: id
// 				}, _.bind(function(err, value) {
// 					if(this._destroyed) {
// 						var myError = new Error('Node ' + id + ' was destroyed');
// 						myError.expected = true;
// 						reject(myError);
// 					} else if(err) {
// 						//reject(new Error('Could not find node ' + id));
// 					} else {
// 						resolve(value.inlineStyle);
// 					}
// 				}, this));
// 			}, this)).then(_.bind(function(is) {
// 				inlineStyle = is;
// 				if(inlineStyle.cssText) {
// 					return this._getBaseURL();
// 				}
// 			}, this)).then(_.bind(function(url) {
// 				if(inlineStyle.cssText) {
// 					inlineStyle.cssText = processCSSURLs(inlineStyle.cssText, url, this.getFrameId(), this.getTabId());
// 				}
// 				return inlineStyle;
// 			}, this));
// 		} else {
// 			return new Promise(function(resolve, reject) {
// 				resolve({
// 					cssText: ''
// 				});
// 			});
// 		}
// 	};
//
// 	proto.getInlineStyle = function() {
// 		return this._inlineStyle;
// 	};
//
// 	proto._stringifySelf = function() {
// 		var MAX_TEXT_LENGTH = 50;
// 		var node = this._getNode(),
// 			type = this.getNodeType(),
// 			id = this.getId();
// 		if(type === NODE_CODE.DOCUMENT_NODE) {
// 			return '(' + id + ') ' + this.getNodeName();
// 		} else if(type === NODE_CODE.TEXT_NODE) {
// 			var text = this.getNodeValue().replace(/(\n|\t)/gi, '');
// 			if(text.length > MAX_TEXT_LENGTH) {
// 				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
// 			}
// 			return '(' + id + ') text: ' + text;
// 		} else if(type === NODE_CODE.DOCUMENT_TYPE_NODE) {
// 			return '(' + id + ') <' + this.getNodeName() + '>';
// 		} else if(type === NODE_CODE.ELEMENT_NODE) {
// 			var text = '(' + id + ') <' + this.getNodeName();
// 			var attributesMap = this.getAttributesMap();
// 			var style = this.getInlineStyle();
// 			if(style) {
// 				attributesMap.style = style;
// 			}
// 			_.each(attributesMap, function(val, name) {
// 				text += ' ' + name +  ' = "' + val + '"';
// 			});
// 			//for(var i = 0; i<node.attributes.length; i+=2) {
// 				//text += ' ' + node.attributes[i] +  ' = "' + node.attributes[i+1] + '"';
// 			//}
// 			text += '>';
// 			return text;
// 		} else if(type === NODE_CODE.COMMENT_NODE) {
// 			var text = '(' + id + ') <!-- ';
// 			text += this.getNodeValue().replace(/(\n|\t)/gi, '');
// 			if(text.length > MAX_TEXT_LENGTH) {
// 				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
// 			}
// 			text +=  ' -->';
// 			return text;
// 		} else {
// 			console.log(node);
// 		}
// 		return 'node';
// 	};
// 	proto.serialize = function() {
// 		var nodeType = this.getNodeType();
// 		var rv = {
// 			type: nodeType,
// 			name: this.getNodeName(),
// 			value: this.getNodeValue(),
// 			attributes: this.getAttributesMap(),
// 			children: _.map(this.getChildren(), function(child) {
// 				return child.serialize();
// 			}),
// 			inlineStyle: this.getInlineStyle()
// 		};
// 		return rv;
// 	};
//
// 	proto.print = function(level) {
// 		var str = '';
// 		if(!level) { level = 0; }
// 		for(var i = 0; i<level; i++) {
// 			str += '  ';
// 		}
//         var node = this._getNode(),
// 		type = node.nodeType,
// 		id = node.nodeId;
// 		str += this._stringifySelf();
// 		var childFrame = this.getChildFrame();
//
// 		if(childFrame) {
// 			str += ' ('+childFrame.getFrameId()+')';
// 		}
// 		console.log(str);
// 		_.each(this.getChildren(), function(child) {
// 			child.print(level+1);
// 		});
// 		/*if(childFrame) {
// 			childFrame.print(level+1);
// 		}*/
//
// 		return this;
// 	};
//
// 	proto.summarize = function() {
// 		var children = this.getChildren();
// 		if(children.length > 0) {
// 			return this.getId() + ':[' + _.map(children, function(child) { return child.summarize(); }).join(', ') + ']';
// 		} else {
// 			return this.getId();
// 		}
// 	};
//
// 	proto._getPage = function() {
// 		var frame = this._getFrame();
// 		return frame.getPage();
// 	};
// 	proto.getFrameId = function() {
// 		return this._getFrame().getFrameId();
// 	};
// 	proto.getTabId = function() {
// 		return this._getFrame().getTabId();
// 	};
// 	proto.getFrameStack = function() {
// 		var frame = this._getFrame();
// 		return frame.getFrameStack();
// 	};
// 	proto.querySelectorAll = function(selector) {
// 		return new Promise(_.bind(function(resolve, reject) {
// 				var chrome = this._getChrome();
// 				chrome.DOM.querySelectorAll({
// 					nodeId: this.getId(),
// 					selector: selector
// 				}, _.bind(function(err, value) {
// 					if(err) {
// 						reject(value);
// 					} else {
// 						resolve(value);
// 					}
// 				}, this));
// 		}, this));
// 	};
// }(DOMState));
//
// function transformIFrameURL(childFrame, shadow) {
// 	if(childFrame) {
// 		return URL.format({
// 			pathname: 'f',
// 			query: {
// 				u: shadow.getUserId(),
// 				i: childFrame.getFrameId(),
// 				t: childFrame.getTabId()
// 			}
// 		});
// 	} else {
// 		log.error('No child frame');
// 	}
// }
//
// module.exports = {
// 	DOMState: DOMState
// };
