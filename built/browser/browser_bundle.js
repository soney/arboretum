/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(1);
const ReactDOM = __webpack_require__(2);
;
exports.Hello = (props) => React.createElement("h1", null,
    "Hello from ",
    props.compiler,
    " and ",
    props.framework,
    "!");
ReactDOM.render(React.createElement(exports.Hello, { compiler: "TypeScript", framework: "React" }), document.getElementById('example'));
// import * as path from 'path';
// import {ipcRenderer, remote, BrowserWindow} from 'electron';
// import {Tabs} from './ts/tabs';
// import {URLBar} from './ts/url_bar';
// import {Sidebar} from './ts/sidebar';
// var $ = require('jquery'),
//     _ = require('underscore');
// require('jquery-ui');
// var path = require('path');
// export class Arboretum {
// private browserWindow:BrowserWindow;
// private tabs:Tabs = new Tabs(this);
// private urlBar:URLBar = new URLBar(this);
// private sidebar:Sidebar = new Sidebar(this);
// constructor() {
//     this.browserWindow = remote.getCurrentWindow();
//     this.listen();
//     this.tabs.createNew(`file://${path.resolve('test/simple.html')}`, true);
// };
// public loadURL(url:string):void {
//     this.tabs.active.webView[0].loadURL(formattedURL);
// };
// public goBack():void {
// };
//
// listen() {
//     const {ipcRenderer} = require('electron');
//     ipcRenderer.send('asynchronous-message','test');
//     $(window).on('keydown', (e) => {
//         if(e.which === 82 && (e.ctrlKey || e.metaKey)) { // CTRL + ALT + R
//             if(e.altKey){
//               location.reload();
//             }
//             else{
//               e.preventDefault();
//               window.arboretum.urlBar.refreshStop.click();
//             }
//         } else if((e.which === 73 && e.ctrlKey && e.shiftKey) || e.which === 123) { // F12 OR CTRL + SHIFT + I
//             var activeTab = this.tabs.active;
//             // if(activeTab) {
//             //     if(activeTab.WebView.isDevToolsOpened()) {
//             //         activeTab.WebView.closeDevTools();
//             //     } else {
//             //         activeTab.WebView.openDevTools();
//             //     }
//             // }
//         } else if(e.which === 76 && (e.ctrlKey || e.metaKey)) {
//             window.arboretum.urlBar.urlInput.focus();
//         } else if((e.which === 9 && (e.ctrlKey || e.metaKey)) ||( e.which === 9)) {
//             e.preventDefault();
//             let tabs = window.arboretum.tabs.tabs;
//             let selectedKey = window.arboretum.tabs.active.TabId;
//             let Keys = Object.keys(tabs);
//             let i = Keys.indexOf(selectedKey.toString());
//             i++;
//             if(i+1 > Keys.length)
//                i = 0;
//             window.arboretum.tabs.select(tabs[Keys[i]]);
//         } else if(e.which === 78 && (e.ctrlKey || e.metaKey)) {
//            e.preventDefault();
//            const {ipcRenderer} = require('electron');
//            console.log(ipcRenderer);
//            ipcRenderer.send('New-Window','test');
//         }
//
//     });
//     ipcRenderer.on('asynchronous-reply',function(arg) {
//        window.arboretum.tabs.createNew('',true);
//     });
//     ipcRenderer.on('TabRefId',function(event,arg) {
//        var keys = Object.keys(window.arboretum.tabs.tabs).map(Number);
//        var maxKey = Math.max.apply(Math,keys);
//        window.arboretum.tabs.tabs[maxKey].RefId = arg;
//     });
//     ipcRenderer.on('closeTab',function(event,arg) {
//       var theKey = _.find(Object.keys(window.arboretum.tabs.tabs),function(key) {
//          return window.arboretum.tabs.tabs[key].RefId == arg;
//       });
//       window.arboretum.tabs.tabs[theKey].closeButton.click();
//     });
// }
// }
//
// $(function() {
//      new Arboretum();
// });


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ })
/******/ ]);
//# sourceMappingURL=browser_bundle.js.map