var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	path = require('path'),
	fs = require('fs'),
	sprintf = require("sprintf-js").sprintf;
var log = require('../../utils/logging').getColoredLogger('red');

var SIMULATE_MOUSE_EVENT = readFile(path.join(__dirname, 'injectable_js', 'simulate_mouse_event.js'));
var GET_ELEMENT_VALUE = readFile(path.join(__dirname, 'injectable_js', 'get_element_value.js'));
var SET_ELEMENT_VALUE = readFile(path.join(__dirname, 'injectable_js', 'set_element_value.js'));
var GET_NAMESPCE = readFile(path.join(__dirname, 'injectable_js', 'get_namespace.js'));
var GET_CANVAS_IMAGE = readFile(path.join(__dirname, 'injectable_js', 'get_canvas_image_data.js'));
var GET_UNIQUE_SELECTOR = readFile(path.join(__dirname, 'injectable_js', 'get_unique_selector.js'));
var FOCUS_ELEMENT = readFile(path.join(__dirname, 'injectable_js', 'focus.js'));

function readShallowObject(chrome, objectId) {
	return getProperties(chrome, objectId, true).then(function(properties) {
		var rv = {};

		_.each(properties.result, function(prop) {
			var name = prop.name,
				value = prop.value;
			if(value && name !== '__proto__') {
				rv[name] = value.value;
			}
		});
		return rv;
	});
}

function callFNOnElement(chrome, fn_promise, nodeId, additional_args) {
	var objectId;
	var rv;
	var resolvedNodePromise = resolveNode(chrome, nodeId);
	return Promise.all([resolvedNodePromise, fn_promise]).then(function(vals) {
		var obj = vals[0],
			fnText = vals[1];

		var objInfo = obj.object;
		objectId = objInfo.objectId;

		return callFunctionOn(chrome, objectId, {
			functionDeclaration: sprintf('(%s)', fnText),
			arguments: [{
				objectId: objectId
			}].concat(additional_args||[])
		});
	}).then(function(x) {
		rv = x;
		return releaseObject(chrome, objectId);
	}).then(function() {
		return rv;
	}).catch(function(err) {
		console.error(err);
	});
}

function releaseObject(chrome, objectId) {
	return new Promise(function(resolve, reject) {
		chrome.Runtime.releaseObject({
			objectId: objectId
		}, function(err, val) {
			if(err) { reject(val);  }
			else 	{ resolve(val); }
		});
	});
}

function getProperties(chrome, objectId, ownProperties) {
	return new Promise(function(resolve, reject) {
		chrome.Runtime.getProperties({
			objectId: objectId,
			ownProperties: ownProperties!==false
		}, function(err, result) {
			if(err) {
				reject(result);
			} else {
				resolve(result);
			}
		});
	});
}

function getObjectProperty(chrome, objectId, property_name) {
	return callFunctionOn(chrome, objectId, {
		functionDeclaration: '(function() { return this.' + property_name + ';})',
		arguments: []
	});
}

function evaluate(chrome, context, options) {
	return new Promise(function(resolve, reject) {
		chrome.Runtime.evaluate(_.extend({
			contextId: context.id
		}, options), function(err, result) {
			if(err) {
				reject(result);
			} else {
				resolve(result);
			}
		});
	}).then(function(result) {
		return result;
	});
}

function callFunctionOn(chrome, remoteObjectId, options) {
	return new Promise(function(resolve, reject) {
		chrome.Runtime.callFunctionOn(_.extend({
			objectId: remoteObjectId
		}, options), function(err, result) {
			if(err) {
				reject(result);
			} else {
				resolve(result);
			}
		});
	});
}

function requestNode(chrome, objectId) {
	return new Promise(function(resolve, reject) {
		chrome.DOM.requestNode({
			objectId: objectId
		}, function(err, val) {
			if(err) {
				reject(val);
			} else {
				resovle(val);
			}
		});
	});
}

function resolveNode(chrome, nodeId) {
	return new Promise(function(resolve, reject) {
		chrome.DOM.resolveNode({
			nodeId: nodeId
		}, function(err, val) {
			if(err) {
				reject(val);
			} else {
				resolve(val);
			}
		});
	});
}

function readFile(filename) {
	return new Promise(function(resolve, reject) {
		fs.readFile(filename, { encoding: 'utf8' }, function(err, val) {
			if(err) { reject(err); }
			else { resolve(val); }
		});
	});
}

function typedArrayToArray(chrome, objectId) {
	return callFunctionOn(chrome, objectId, {
		functionDeclaration: '(function() { return Array.prototype.slice.call(this);})',
		arguments: [],
		returnByValue: true
	});
}

module.exports = {
	mouseEvent: function (chrome, nodeId, eventType) {
		return callFNOnElement(chrome, SIMULATE_MOUSE_EVENT, nodeId, [{value: eventType}]);
	},
	focus: function (chrome, nodeId) {
		return callFNOnElement(chrome, FOCUS_ELEMENT, nodeId);
	},
	getElementValue: function (chrome, nodeId) {
		return callFNOnElement(chrome, GET_ELEMENT_VALUE, nodeId).then(function(rv) {
			return rv.result.value;
		});
	},
	setElementValue: function(chrome, nodeId, value) {
		return callFNOnElement(chrome, SET_ELEMENT_VALUE, nodeId, [{value: value}]);
	},
	getNamespace: function(chrome, nodeId) {
		return callFNOnElement(chrome, GET_NAMESPCE, nodeId);
	},
	getUniqueSelector: function(chrome, nodeId) {
		return callFNOnElement(chrome, GET_UNIQUE_SELECTOR, nodeId);
	},
	getCanvasImage: function (chrome, nodeId) {
		return callFNOnElement(chrome, GET_CANVAS_IMAGE, nodeId).then(function(rv) {
			var result = rv.result,
				objectId = result.objectId;

			return Promise.all([
				getObjectProperty(chrome, objectId, 'data'),
				getObjectProperty(chrome, objectId, 'width'),
				getObjectProperty(chrome, objectId, 'height'),
				objectId
			]);
		}).then(function(property_values) {
			var dataObjectId = property_values[0].result.objectId;
			return Promise.all([typedArrayToArray(chrome, dataObjectId)].concat(_.rest(property_values, 1)).concat([dataObjectId]));
		}).then(function(property_values) {
			return Promise.all([{
					data: property_values[0].result.value,
					width: property_values[1].result.value,
					height: property_values[2].result.value
				},
				releaseObject(chrome, property_values[3]),
				releaseObject(chrome, property_values[4])
			]);
		}).then(function(values) {
			return values[0];
		}).catch(function(err) {
			console.error(err);
		});
	}
};
