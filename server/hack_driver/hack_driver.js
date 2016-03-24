var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	path = require('path'),
	fs = require('fs'),
	sprintf = require("sprintf-js").sprintf;
var log = require('../../utils/logging').getColoredLogger('red');

var SIMULATE_CLICK = readFile(path.join(__dirname, 'injectable_js', 'simulate_click.js'));
var GET_ELEMENT_VALUE = readFile(path.join(__dirname, 'injectable_js', 'get_element_value.js'));
var SET_ELEMENT_VALUE = readFile(path.join(__dirname, 'injectable_js', 'set_element_value.js'));
var GET_NAMESPCE = readFile(path.join(__dirname, 'injectable_js', 'get_namespace.js'));
var GET_CANVAS_IMAGE = readFile(path.join(__dirname, 'injectable_js', 'get_canvas_image_data.js'));

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
	});
}
function getNamespace(chrome, nodeId) {
	return callFNOnElement(chrome, GET_NAMESPCE, nodeId);
}

function click(chrome, nodeId) {
	return callFNOnElement(chrome, SIMULATE_CLICK, nodeId);
}

function getElementValue(chrome, nodeId) {
	return callFNOnElement(chrome, GET_ELEMENT_VALUE, nodeId);
}

function setElementValue(chrome, nodeId, value) {
	return callFNOnElement(chrome, SET_ELEMENT_VALUE, nodeId, [{value: value}]);
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

module.exports = {
	click: click,
	getNamespace: getNamespace,
	setElementValue: setElementValue
};
