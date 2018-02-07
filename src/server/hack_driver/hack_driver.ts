import {join} from 'path';
import * as fs from 'fs';
import * as _ from 'underscore';

const SIMULATE_MOUSE_EVENT:Promise<string> = readFile(join(__dirname, 'injectable_js', 'simulate_mouse_event.js'));
const GET_ELEMENT_VALUE:Promise<string> = readFile(join(__dirname, 'injectable_js', 'get_element_value.js'));
const SET_ELEMENT_VALUE:Promise<string> = readFile(join(__dirname, 'injectable_js', 'set_element_value.js'));
const GET_NAMESPCE:Promise<string> = readFile(join(__dirname, 'injectable_js', 'get_namespace.js'));
const GET_CANVAS_IMAGE:Promise<string> = readFile(join(__dirname, 'injectable_js', 'get_canvas_image_data.js'));
const GET_UNIQUE_SELECTOR:Promise<string> = readFile(join(__dirname, 'injectable_js', 'get_unique_selector.js'));
const FOCUS_ELEMENT:Promise<string> = readFile(join(__dirname, 'injectable_js', 'focus.js'));

function readShallowObject(chrome:CRI.Chrome, objectId:CRI.Runtime.RemoteObjectID):Promise<any> {
	return getProperties(chrome, objectId, true).then((properties:CRI.GetPropertiesResult) => {
		const rv = {};
		_.each(properties.result, function(prop:any) {
			const {name, value} = prop;
			if(value && name !== '__proto__') {
				rv[name] = value.value;
			}
		});
		return rv;
	});
}

function callFNOnElement(chrome:CRI.Chrome, fn_promise:Promise<string>, nodeId:CRI.NodeID, additional_args?):Promise<CRI.CallFunctionOnResult> {
	let objectId, rv;
	const resolvedNodePromise = resolveNode(chrome, nodeId);
	return Promise.all([resolvedNodePromise, fn_promise]).then(function(vals) {
		const [obj, fnText] = vals;
		const {object} = obj;
		objectId = object.objectId;

		return callFunctionOn(chrome, objectId, {
			functionDeclaration: `(${fnText})`,
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

function releaseObject(chrome:CRI.Chrome, objectId:CRI.Runtime.RemoteObjectID):CRI.ReleaseObjectResult {
	return new Promise<CRI.ReleaseObjectResult>(function(resolve, reject) {
		chrome.Runtime.releaseObject({
			objectId: objectId
		}, function(err, val) {
			if(err) { reject(val);  }
			else 	{ resolve(val); }
		});
	});
}

function getProperties(chrome:CRI.Chrome, objectId:CRI.Runtime.RemoteObjectID, ownProperties:boolean):Promise<CRI.GetPropertiesResult> {
	return new Promise<CRI.GetPropertiesResult>(function(resolve, reject) {
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

function getObjectProperty(chrome:CRI.Chrome, objectId:CRI.Runtime.RemoteObjectID, property_name:string):Promise<CRI.CallFunctionOnResult> {
	return callFunctionOn(chrome, objectId, {
		functionDeclaration: `(function() { return this.${property_name}; })`,
		arguments: []
	});
}

function evaluate(chrome:CRI.Chrome, context:CRI.ExecutionContextDescription, options?:CRI.EvaluateParameters):Promise<CRI.EvaluateResult> {
	return new Promise<CRI.EvaluateResult>(function(resolve, reject) {
		chrome.Runtime.evaluate(_.extend({
			contextId: context.id
		}, options), function(err, result) {
			if(err) {
				reject(result);
			} else {
				resolve(result);
			}
		});
	}).catch((err) => {
		console.error(err);
		throw err;
	});
}

function callFunctionOn(chrome:CRI.Chrome, remoteObjectId:CRI.Runtime.RemoteObjectID, options):Promise<CRI.CallFunctionOnResult> {
	return new Promise<CRI.CallFunctionOnResult>(function(resolve, reject) {
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

function requestNode(chrome:CRI.Chrome, objectId:CRI.Runtime.RemoteObjectID):Promise<CRI.RequestNodeResult> {
	return new Promise<CRI.RequestNodeResult>(function(resolve, reject) {
		chrome.DOM.requestNode({
			objectId: objectId
		}, function(err, val) {
			if(err) {
				reject(val);
			} else {
				resolve(val);
			}
		});
	});
}

function resolveNode(chrome:CRI.Chrome, nodeId:CRI.NodeID):Promise<CRI.ResolveNodeResult> {
	return new Promise<CRI.ResolveNodeResult>((resolve, reject) => {
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

function readFile(filename:string):Promise<string> {
	return new Promise(function(resolve, reject) {
		fs.readFile(filename, { encoding: 'utf8' }, function(err, val) {
			if(err) { reject(err); }
			else { resolve(val); }
		});
	});
}

function typedArrayToArray(chrome:CRI.Chrome, objectId:CRI.Runtime.RemoteObjectID):Promise<CRI.CallFunctionOnResult> {
	return callFunctionOn(chrome, objectId, {
		functionDeclaration: '(function() { return Array.prototype.slice.call(this);})',
		arguments: [],
		returnByValue: true
	});
}


export function mouseEvent(chrome:CRI.Chrome, nodeId:CRI.NodeID, eventType:string):Promise<CRI.CallFunctionOnResult> {
	return callFNOnElement(chrome, SIMULATE_MOUSE_EVENT, nodeId, [{value: eventType}]);
};
export function focus(chrome:CRI.Chrome, nodeId:CRI.NodeID) {
	return callFNOnElement(chrome, FOCUS_ELEMENT, nodeId);
};
export function getElementValue(chrome:CRI.Chrome, nodeId:CRI.NodeID):Promise<string> {
	return callFNOnElement(chrome, GET_ELEMENT_VALUE, nodeId).then(function(rv) {
		return rv.result.value;
	});
};
export function setElementValue(chrome:CRI.Chrome, nodeId:CRI.NodeID, value:string):Promise<CRI.CallFunctionOnResult> {
	return callFNOnElement(chrome, SET_ELEMENT_VALUE, nodeId, [{value: value}]);
};
export function getNamespace(chrome:CRI.Chrome, nodeId:CRI.NodeID) {
	return callFNOnElement(chrome, GET_NAMESPCE, nodeId);
};
export function getUniqueSelector(chrome:CRI.Chrome, nodeId:CRI.NodeID):Promise<string> {
	return callFNOnElement(chrome, GET_UNIQUE_SELECTOR, nodeId).then((rv) => {
		return rv.result.value;
	});
};
export function getCanvasImage(chrome:CRI.Chrome, nodeId:CRI.NodeID):Promise<any> {
	return callFNOnElement(chrome, GET_CANVAS_IMAGE, nodeId).then((rv) => {
		const {result} = rv;
		const {objectId} = result;

		return Promise.all([
			getObjectProperty(chrome, objectId, 'data'),
			getObjectProperty(chrome, objectId, 'width'),
			getObjectProperty(chrome, objectId, 'height'),
			objectId
		]);
	}).then((property_values) => {
		var dataObjectId = property_values[0].result.objectId;
		return Promise.all([typedArrayToArray(chrome, dataObjectId), property_values[1], property_values[2], property_values[3], dataObjectId])
	}).then((property_values) => {
		return Promise.all([{
				data: property_values[0].result.value,
				width: property_values[1].result.value,
				height: property_values[2].result.value
			},
			releaseObject(chrome, property_values[3]),
			releaseObject(chrome, property_values[4])
		]);
	}).then((values) => {
		return values[0];
	}).catch((err) => {
		console.error(err);
	});
};
