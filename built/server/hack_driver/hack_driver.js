"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs = require("fs");
const _ = require("underscore");
const SIMULATE_MOUSE_EVENT = readFile(path_1.join(__dirname, 'injectable_js', 'simulate_mouse_event.js'));
const GET_ELEMENT_VALUE = readFile(path_1.join(__dirname, 'injectable_js', 'get_element_value.js'));
const SET_ELEMENT_VALUE = readFile(path_1.join(__dirname, 'injectable_js', 'set_element_value.js'));
const GET_NAMESPCE = readFile(path_1.join(__dirname, 'injectable_js', 'get_namespace.js'));
const GET_CANVAS_IMAGE = readFile(path_1.join(__dirname, 'injectable_js', 'get_canvas_image_data.js'));
const GET_UNIQUE_SELECTOR = readFile(path_1.join(__dirname, 'injectable_js', 'get_unique_selector.js'));
const FOCUS_ELEMENT = readFile(path_1.join(__dirname, 'injectable_js', 'focus.js'));
function readShallowObject(chrome, objectId) {
    return getProperties(chrome, objectId, true).then((properties) => {
        const rv = {};
        _.each(properties.result, function (prop) {
            const { name, value } = prop;
            if (value && name !== '__proto__') {
                rv[name] = value.value;
            }
        });
        return rv;
    });
}
function callFNOnElement(chrome, fn_promise, nodeId, additional_args) {
    let objectId, rv;
    const resolvedNodePromise = resolveNode(chrome, nodeId);
    return Promise.all([resolvedNodePromise, fn_promise]).then(function (vals) {
        const [obj, fnText] = vals;
        const { object } = obj;
        objectId = object.objectId;
        return callFunctionOn(chrome, objectId, {
            functionDeclaration: `(${fnText})`,
            arguments: [{
                    objectId: objectId
                }].concat(additional_args || [])
        });
    }).then(function (x) {
        rv = x;
        return releaseObject(chrome, objectId);
    }).then(function () {
        return rv;
    }).catch(function (err) {
        console.error(err);
    });
}
function releaseObject(chrome, objectId) {
    return new Promise(function (resolve, reject) {
        chrome.Runtime.releaseObject({
            objectId
        }, function (err, val) {
            if (err) {
                reject(val);
            }
            else {
                resolve(val);
            }
        });
    });
}
function getProperties(chrome, objectId, ownProperties) {
    return new Promise(function (resolve, reject) {
        chrome.Runtime.getProperties({
            objectId: objectId,
            ownProperties: ownProperties !== false
        }, function (err, result) {
            if (err) {
                reject(result);
            }
            else {
                resolve(result);
            }
        });
    });
}
function getObjectProperty(chrome, objectId, property_name) {
    return callFunctionOn(chrome, objectId, {
        functionDeclaration: `(function() { return this.${property_name}; })`,
        arguments: []
    });
}
function evaluate(chrome, context, options) {
    return new Promise(function (resolve, reject) {
        chrome.Runtime.evaluate(_.extend({
            contextId: context.id
        }, options), function (err, result) {
            if (err) {
                reject(result);
            }
            else {
                resolve(result);
            }
        });
    }).catch((err) => {
        console.error(err);
        throw err;
    });
}
function callFunctionOn(chrome, remoteObjectId, options) {
    return new Promise(function (resolve, reject) {
        chrome.Runtime.callFunctionOn(_.extend({
            objectId: remoteObjectId
        }, options), function (err, result) {
            if (err) {
                reject(result);
            }
            else {
                resolve(result);
            }
        });
    });
}
function requestNode(chrome, objectId) {
    return new Promise(function (resolve, reject) {
        chrome.DOM.requestNode({
            objectId: objectId
        }, function (err, val) {
            if (err) {
                reject(val);
            }
            else {
                resolve(val);
            }
        });
    });
}
function resolveNode(chrome, nodeId) {
    return new Promise((resolve, reject) => {
        chrome.DOM.resolveNode({
            nodeId: nodeId
        }, function (err, val) {
            if (err) {
                reject(val);
            }
            else {
                resolve(val);
            }
        });
    });
}
function readFile(filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, { encoding: 'utf8' }, function (err, val) {
            if (err) {
                reject(err);
            }
            else {
                resolve(val);
            }
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
function mouseEvent(chrome, nodeId, eventType) {
    return callFNOnElement(chrome, SIMULATE_MOUSE_EVENT, nodeId, [{ value: eventType }]);
}
exports.mouseEvent = mouseEvent;
;
function focus(chrome, nodeId) {
    return callFNOnElement(chrome, FOCUS_ELEMENT, nodeId);
}
exports.focus = focus;
;
function getElementValue(chrome, nodeId) {
    return callFNOnElement(chrome, GET_ELEMENT_VALUE, nodeId).then(function (rv) {
        return rv.result.value;
    });
}
exports.getElementValue = getElementValue;
;
function setElementValue(chrome, nodeId, value) {
    return callFNOnElement(chrome, SET_ELEMENT_VALUE, nodeId, [{ value: value }]);
}
exports.setElementValue = setElementValue;
;
function getNamespace(chrome, nodeId) {
    return callFNOnElement(chrome, GET_NAMESPCE, nodeId);
}
exports.getNamespace = getNamespace;
;
function getUniqueSelector(chrome, nodeId) {
    return callFNOnElement(chrome, GET_UNIQUE_SELECTOR, nodeId).then((rv) => {
        return rv.result.value;
    });
}
exports.getUniqueSelector = getUniqueSelector;
;
function getCanvasImage(chrome, nodeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { result } = yield callFNOnElement(chrome, GET_CANVAS_IMAGE, nodeId);
            const { objectId } = result;
            const propertyValues = yield Promise.all(['data', 'width', 'height'].map((p) => getObjectProperty(chrome, objectId, p)));
            const [dataResult, widthResult, heightResult] = propertyValues;
            const dataResultArray = yield typedArrayToArray(chrome, dataResult.result.objectId);
            const data = dataResultArray.result.value;
            const width = widthResult.result.value;
            const height = heightResult.result.value;
            yield Promise.all([dataResult, dataResultArray, widthResult, heightResult].map((x) => __awaiter(this, void 0, void 0, function* () {
                if (x.result.objectId) {
                    yield releaseObject(chrome, x.result.objectId);
                }
            })));
            return { data, width, height };
        }
        catch (err) {
            console.error(err);
            console.error(err.stack);
        }
    });
}
exports.getCanvasImage = getCanvasImage;
;
