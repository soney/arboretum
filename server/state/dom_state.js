var _ = require('underscore'),
	URL = require('url'),
	util = require('util'),
	EventEmitter = require('events'),
	path = require('path'),
	log = require('loglevel'),
	urlTransform = require('../url_transform').urlTransform,
	driver = require('../hack_driver/hack_driver');
	processCSSURLs = require('../css_parser').processCSSURLs,
	NODE_CODE = require('../../utils/node_code'),
	Deferred = require('../../utils/deferred');

//log.setLevel('trace');

var DOMState = function(options) {
	this.node = options.node;
	this.chrome = options.chrome;
	this.frame = options.frame;

	this._parent = options.parent;

	this._namespace = null;
	this._superAttributes = {};
	this._attributes = {};
	this._inlineStyle = '';
	this.children = [];
	this._self_initialized = this.initialize().then(function() {
		console.log('done');
	}, function(err) {
		console.error(err.stack);
	});
	this._updateChildrenInitializedPromise();
	//this._initialized = Promise.all([this._self_initialized, this._children_initialized]);
};

(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto._updateChildrenInitializedPromise = function() {
		var initializedPromises = Promise.all(_.pluck(this.children, '_self_initialized'));

		var timeoutPromise = new Promise(function(resolve, reject) {
			setTimeout(function() {
				reject('Timed out');
			}, 1000);
		});
		this._children_initialized = Promise.race(initializedPromises, timeoutPromise);

		return this._children_initialized;
	};

	proto._getFrame = function() {
		return this.frame;
	};

	proto.getParent = function() {
		return this._parent;
	};
	proto.setParent = function(parent) {
		this._parent = parent;
	};

	proto._initializeLongString = function() {
		var node = this._getNode(),
			nodeType = node.nodeType,
			nodeValue = node.nodeValue;

		return new Promise(_.bind(function(resolve, reject) {
			if(nodeType === NODE_CODE.TEXT_NODE && nodeValue && nodeValue.endsWith('…')) {
				var chrome = this._getChrome();
				this.chrome.DOM.getOuterHTML({
					nodeId: this.node.nodeId
				}, _.bind(function(err, value) {
					if(err) {
						reject(value);
					} else {
						node.nodeValue = value.outerHTML;
						resolve(node.nodeValue);
					}
				}, this));
			} else {
				resolve(nodeValue);
			}
		}, this));
	}

	proto._initializeAttributesMap = function() {
		var node = this._getNode(),
			attributes = node.attributes,
			attrPromise,
			attrPromises = [];
		if(attributes) {
			var len = attributes.length,
				i = 0;
			while(i < len) {
				var name = attributes[i],
					value = attributes[i+1];

				this._attributes[name] = this._transformAttribute(value, name);
				i+=2;
			}
		}

		return Promise.all(attrPromises);
	};

	proto._transformAttribute = function(val, name) {
		if(name.toLowerCase() === 'onload' || name.toLowerCase() === 'onclick' ||
			name.toLowerCase() === 'onmouseover' || name.toLowerCase() === 'onmouseout' ||
			name.toLowerCase() === 'onmouseenter' || name.toLowerCase() === 'onmouseleave') {
			val = '';
		} else {
			var tagName = this._getTagName(),
				tagTransform = urlTransform[tagName.toLowerCase()];

			if(tagTransform) {
				var attributeTransform = tagTransform[name.toLowerCase()];
				if(attributeTransform) {
					var url = this._getBaseURL();
					if(url) {
						return attributeTransform.transform(val, url, this);
					} else {
						log.debug('no base url');
						return val;
					}
				}
			}
		}
		return val;
	};

	proto._getBaseURL = function() {
		var frame = this._getFrame();
		return frame.getURL();
	};

	proto._getTagName = function() {
		var node = this._getNode();
		return node.nodeName;
	};

	proto.getAttributesMap = function() {
		return _.extend({}, this._attributes, this._superAttributes);
	};

	proto.getNamespace = function() {
		return this._namespace;
	};

	proto.updateNamespace = function() {
		var nodeType = this.getNodeType();
		if(nodeType === NODE_CODE.ELEMENT_NODE) {
			return driver.getNamespace(this._getChrome(), this.getId()).then(function(result) {
				if(result.wasThrown) {
					return null;
				} else {
					return result.result.value;
				}
			}).then(_.bind(function(namespace) {
				return this._namespace = namespace;
			}, this));
		} else {
			return false;
		}
	};

	proto.initialize = function() {
		var inlineStylePromise = this._requestInlineStyle().then(_.bind(function(inlineStyle) {
				this._inlineStyle = inlineStyle.cssText;
			}, this));

		var node = this._getNode();

		if(node.frameId) {
			var page = this._getPage();
			var frameRoot = node.contentDocument;
			var frame = page.getFrame(node.frameId);

			frame.setRoot(frameRoot);

			this.childFrame = frame;
			this._superAttributes.src = transformIFrameURL(frame);
		} else {
			this.childFrame = false;
		}

		this._initializeAttributesMap();
		var longStringInitialization = this._initializeLongString(),
			namespaceFetcher = this.updateNamespace();

		return Promise.all([inlineStylePromise, longStringInitialization, namespaceFetcher]);
	};
	proto.getChildFrame = function() {
		return this.childFrame;
	};
	proto.destroy = function() {
		_.each(this.children, function(child) {
			child.destroy();
		});
		this.emit('destroyed');
		this.removeAllListeners();
		this._destroyed = true;
	};

	proto.getId = function() {
		var node = this._getNode();
		return node.nodeId;
	};

	proto._setChildren = function(children) {
		_.each(this.children, function(child) {
			if(children.indexOf(child) < 0) {
				child.destroy();
			}
		});

		this.children = children;
		this._updateChildrenInitializedPromise();

		_.each(this.children, function(child) {
			child.setParent(this);
		}, this);

		this.emit('childrenChanged', {
			children: children
		});
		return this;
	};

	proto._getNode = function() {
		return this.node;
	};

	proto._removeChild = function(child) {
		var index = _.indexOf(this.getChildren(), child);
		if(index >= 0) {
			this.children.splice(index, 1);
			this._updateChildrenInitializedPromise();
			this.emit('childRemoved', {
				child: child
			});
			child.destroy();
		}
		return this;
	};

	proto._insertChild = function(child, previousNode) {
		if(previousNode) {
			var index = _.indexOf(this.children, previousNode);
			this.children.splice(index+1, 0, child);
		} else {
			this.children.unshift(child);
		}
		child.setParent(this);

		this._updateChildrenInitializedPromise();
		this.emit('childAdded', {
			child: child,
			previousNode: previousNode
		});
	};

	proto._setAttribute = function(name, value) {
		var node = this._getNode(),
			attributes = node.attributes,
			found = false;
		if(!attributes) {
			log.error('Could not set node attributes', node);
			return;
		}
		for(var i = 0; i<attributes.length; i+=2) {
			if(attributes[i] === name) {
				attributes[i+1] = value;
				found = true;
				break;
			}
		}
		if(!found) {
			node.attributes.push(name, value);
		}

		this._attributes[name] = this._transformAttribute(value, name);
		this._notifyAttributeChange();
	};

	proto._removeAttribute = function(name) {
		var tagName = this._getTagName().toLowerCase();

		var node = this._getNode();
		var attributeIndex = _.indexOf(node.attributes, name);
		if(attributeIndex >= 0) {
			node.attributes.splice(attributeIndex, 2);
			delete this._attributes[name];
			this._notifyAttributeChange();
		}
	};

	proto._notifyAttributeChange = function() {
		this.emit('attributesChanged', this.getAttributesMap());
	};

	proto.getAttributes = function() {
		var node = this._getNode();
		return node.attributes;
	};

	proto._getChrome = function() {
		return this.chrome;
	};

	proto.getChildren = function() {
		return this.children;
	};

	proto.isCSSStyle = function() {
		return this._getTagName().toLowerCase() === 'style';
	};

	proto._setCharacterData = function(characterData) {
		var node = this._getNode();
		node.nodeValue = characterData;

		this.emit('nodeValueChanged', {
			value: this.getNodeValue()
		});
	};

	proto.getNodeValue = function() {
		var node = this._getNode(),
			parent = this.getParent();
		if(parent && parent.isCSSStyle()) {
			return processCSSURLs(node.nodeValue, this._getBaseURL(), this.getFrameId(), this.getTabId());
		} else {
			return node.nodeValue;
		}
	};
	proto.getNodeName = function() {
		var node = this._getNode();
		return node.nodeName;
	};

	proto._childCountUpdated = function(count) {
		var page = this._getPage();
		page.requestChildNodes(this.getId(), -1);
	};

	proto._getMatchedStyles = function() {
		var id = this.getId(),
			chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.CSS.getMatchedStylesForNode({
				nodeId: id
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto._getCSSAnimations = function() {
		var id = this.getId(),
			chrome = this._getChrome();

		return new Promise(function(resolve, reject) {
			chrome.CSS.getCSSAnimationsForNode({
				nodeId: id
			}, function(err, value) {
				if(err) {
					reject(value);
				} else {
					resolve(value);
				}
			});
		});
	};

	proto._updateInlineStyle = function() {
		var oldInlineStyle = this.getInlineStyle();
		this._requestInlineStyle().then(_.bind(function(inlineStyle) {
			this._inlineStyle = inlineStyle.cssText;
			if(inlineStyle !== oldInlineStyle) {
				this.emit('inlineStyleChanged', {
					inlineStyle: this._inlineStyle
				});
			}
		}, this));
	};

	proto.getNodeType = function() {
		var node = this._getNode();
		return node.nodeType;
	};

	proto._requestInlineStyle = function() {
		var node = this._getNode(),
			type = node.nodeType;
		if(type === 1) {
			var id = this.getId(),
				chrome = this._getChrome(),
				inlineStyle;

			return new Promise(function(resolve, reject) {
				chrome.CSS.getInlineStylesForNode({
					nodeId: id
				}, function(err, value) {
					if(this._destroyed) {
						reject(new Error('Node ' + id + ' was destroyed'));
					} else if(err) {
						reject(new Error('Could not find node ' + id));
					} else {
						resolve(value.inlineStyle);
					}
				});
			}).then(_.bind(function(is) {
				inlineStyle = is;
				if(inlineStyle.cssText) {
					return this._getBaseURL();
				}
			}, this)).then(_.bind(function(url) {
				if(inlineStyle.cssText) {
					inlineStyle.cssText = processCSSURLs(inlineStyle.cssText, url, this.getFrameId(), this.getTabId());
				}
				return inlineStyle;
			}, this));
		} else {
			return new Promise(function(resolve, reject) {
				resolve({
					cssText: ''
				});
			});
		}
	};

	proto.getInlineStyle = function() {
		return this._inlineStyle;
	};

	proto._stringifySelf = function() {
		var MAX_TEXT_LENGTH = 50;
		var node = this._getNode(),
			type = node.nodeType,
			id = node.nodeId;
		if(type === NODE_CODE.DOCUMENT_NODE) {
			return '(' + id + ') ' + node.nodeName;
		} else if(type === NODE_CODE.TEXT_NODE) {
			var text = node.nodeValue.replace(/(\n|\t)/gi, '');
			if(text.length > MAX_TEXT_LENGTH) {
				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
			}
			return '(' + id + ') text: ' + text;
		} else if(type === NODE_CODE.DOCUMENT_TYPE_NODE) {
			return '(' + id + ') <' + node.nodeName + '>';
		} else if(type === NODE_CODE.ELEMENT_NODE) {
			var text = '(' + id + ') <' + node.nodeName;
			var attributesMap = this.getAttributesMap();
			var style = this.getInlineStyle();
			if(style) {
				attributesMap.style = style;
			}
			_.each(attributesMap, function(val, name) {
				text += ' ' + name +  ' = "' + val + '"';
			});
			//for(var i = 0; i<node.attributes.length; i+=2) {
				//text += ' ' + node.attributes[i] +  ' = "' + node.attributes[i+1] + '"';
			//}
			text += '>';
			return text;
		} else if(type === NODE_CODE.COMMENT_NODE) {
			var text = '(' + id + ') <!-- ';
			text += node.nodeValue.replace(/(\n|\t)/gi, '');
			if(text.length > MAX_TEXT_LENGTH) {
				text = text.substr(0, MAX_TEXT_LENGTH) + '...';
			}
			text +=  ' -->';
			return text;
		} else {
			console.log(node);
		}
		return 'node';
	};

	proto.print = function(level) {
		var str = '';
		if(!level) { level = 0; }
		for(var i = 0; i<level; i++) {
			str += '  ';
		}
		str += this._stringifySelf();
		var childFrame = this.getChildFrame();

		if(childFrame) {
			str += ' ('+childFrame.getFrameId()+')';
		}
		console.log(str);

		if(childFrame) {
			childFrame.print(level+1);
		}
		_.each(this.getChildren(), function(child) {
			child.print(level+1);
		});

		return this;
	};

	proto.summarize = function() {
		var children = this.getChildren();
		if(children.length > 0) {
			return this.getId() + ':[' + _.map(children, function(child) { return child.summarize(); }).join(', ') + ']';
		} else {
			return this.getId();
		}
	};

	proto._getPage = function() {
		var frame = this._getFrame();
		return frame.getPage();
	};
	proto.getFrameId = function() {
		return this._getFrame().getFrameId();
	};
	proto.getTabId = function() {
		return this._getFrame().getTabId();
	};
}(DOMState));

function transformIFrameURL(childFrame) {
	if(childFrame) {
		return URL.format({
			pathname: 'f',
			query: {
				i: childFrame.getFrameId(),
				t: childFrame.getTabId()
			}
		});
	} else {
		log.error('No child frame');
	}
}

module.exports = {
	DOMState: DOMState
};