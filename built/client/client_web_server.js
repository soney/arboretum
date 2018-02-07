"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs_1 = require("fs");
const path_1 = require("path");
const http_1 = require("http");
const WebSocket = require("ws");
const WebSocketJSONStream = require("websocket-json-stream");
const ShareDB = require("sharedb");
const request = require("request");
const _ = require("underscore");
// import * as socket from 'socket.io';
// var express = require('express'),
// 	path = require('path'),
// 	request = require('request'),
// 	ShadowBrowser = require('./shadows/browser_shadow').ShadowBrowser,
// 	ScriptServer = require('./scripts/script_server').ScriptServer,
// 	Task = require('./task').Task,
// 	_ = require('underscore'),
// 	http = require('http'),
// 	fs = require('fs')
// 	WebSocket = require('ws'),
// 	WebSocketJSONStream = require('websocket-json-stream'),
// 	ShareDB = require('sharedb');
const clientPagesDirectory = path_1.join(__dirname, 'client_pages');
// share.listen(stream);
require('ssl-root-cas').inject();
function createWebServer(browserState, chatServer, PORT = 3000) {
    return new Promise((resolve, reject) => {
        const app = express();
        app.all('/', function (req, res, next) {
            setClientOptions({
                userId: createRandomUserID()
            }).then(function (contents) {
                res.send(contents);
            });
        })
            .use('/', express.static(clientPagesDirectory))
            .all('/f', function (req, res, next) {
            var frameId = req.query.i, tabId = req.query.t, userId = req.query.u, taskId = req.query.k;
            setClientOptions({
                userId: userId,
                frameId: frameId,
                viewType: 'mirror'
            }).then(function (contents) {
                res.send(contents);
            });
        })
            .use('/f', express.static(clientPagesDirectory))
            .all('/a', function (req, res, next) {
            setClientOptions({
                viewType: 'admin'
            }).then(function (contents) {
                res.send(contents);
            });
        })
            .use('/a', express.static(clientPagesDirectory))
            .all('/m', function (req, res, next) {
            var messageId = req.query.m;
            setClientOptions({
                viewType: 'message',
                messageId: messageId
            }).then(function (contents) {
                res.send(contents);
            });
        })
            .use('/m', express.static(clientPagesDirectory))
            .all('/r', function (req, res, next) {
            var url = req.query.l, tabId = req.query.t, frameId = req.query.f;
            browserState.requestResource(url, frameId, tabId).then(function (resourceInfo) {
                var content = resourceInfo.content;
                res.set('Content-Type', resourceInfo.mimeType);
                if (resourceInfo.base64Encoded) {
                    var bodyBuffer = new Buffer(content, 'base64');
                    res.send(bodyBuffer);
                }
                else {
                    res.send(content);
                }
            }, function (err) {
                req.pipe(request[req.method.toLowerCase().replace('del', 'delete')](url))
                    .pipe(res);
                /*
                var baseURL = pageState.getURL();
                var headers = _.extend({}, req.headers, {
                    referer: baseURL
                });
                var newRequest = request({
                    method: req.method,
                    uri: url,
                    headers: headers,
                    timeout: 5000
                }).on('error', function(err) {
                    next();
                }).pipe(res);
                */
            });
        });
        var server = http_1.createServer(app);
        var ws = new WebSocket.Server({ server: server });
        const stream = new WebSocketJSONStream(ws);
        const share = new ShareDB({
            db: new ShareDB.MemoryDB()
        });
        server.listen(PORT);
        return app;
    }).then((server) => {
        // var io = socket(server);
        // var shadowBrowsers = {}
        // var tasks = {};
        // var currTaskID = 0;
        // const EVENT_TYPES = ['chat-new-message', 'chat-title-changed', 'chat-var-changed'];
        // EVENT_TYPES.forEach(function(eventType) {
        // 	chatServer.on(eventType, function(data) {
        // 		io.emit.call(io, eventType, data);
        // 	})
        // }, this);
        // io.on('connection', function (socket) {
        // 	socket.once('scriptReady', function(clientOptions) {
        // 		var task = getTask(clientOptions.taskId);
        //
        // 		var scriptServer = new ScriptServer({
        // 			socket: socket,
        // 			browserState: browserState, task: task,
        // 			tasks: tasks
        // 		});
        // 		socket.once('disconnect', function() {
        // 			scriptServer.destroy();
        // 		});
        // 	});
        //
        // 	socket.once('clientReady', function(clientOptions) {
        // 		var shadowBrowser;
        // 		var task = getTask(clientOptions.taskId);
        // 		var messageId = clientOptions.messageId;
        //
        // 		if(clientOptions.frameId) {
        // 			shadowBrowser = shadowBrowsers[clientOptions.userId];
        // 		} else if(clientOptions.viewType == 'message' && messageId) {
        // 			shadowBrowser = new ShadowBrowser({
        // 				browserState: browserState,
        // 				socket: socket,
        // 				clientOptions: clientOptions,
        // 				visibleElements: chatServer.getVisibleNodes(messageId)
        // 				// task: task
        // 			});
        //
        // 			shadowBrowsers[clientOptions.userId] = shadowBrowser;
        // 			// shadowBrowser.setVisibleElements(chatServer.getVisibleNodeIDs(messageId));
        // 		} else if(clientOptions.viewType === 'admin') { // is the root
        // 			chatServer.onSocketAdminChatConnect(socket);
        // 		} else { // is the root
        // 			shadowBrowser = new ShadowBrowser({
        // 								browserState: browserState,
        // 								socket: socket,
        // 								clientOptions: clientOptions
        // 								// task: task
        // 							});
        // 			shadowBrowsers[clientOptions.userId] = shadowBrowser;
        // 			chatServer.onSocketChatConnect(socket, shadowBrowser);
        //
        // 			// shadowBrowser.on('nodeReply', function(info) {
        // 			// 	var outputBrowsers = _	.chain(shadowBrowsers)
        // 			// 							.values()
        // 			// 							.filter(function(browser) {
        // 			// 								return browser.isOutput()
        // 			// 							})
        // 			// 							.value();
        // 			// 	_.each(outputBrowsers, function(browser) {
        // 			// 		browser.setVisibleElements(info.nodeIds);
        // 			// 	});
        // 			// });
        // 		}
        //
        // 		if(shadowBrowser) {
        // 			shadowBrowser.addClient(_.extend({
        // 				socket: socket
        // 			}, clientOptions)).then(function(shadow) {
        // 				socket.once('disconnect', function() {
        // 					shadow.destroy();
        // 				});
        // 			}).catch(function(err) {
        // 				console.error(err);
        // 				console.error(err.stack);
        // 			});
        // 		} else {
        // 			// console.error('Seeking browser for non-user');
        // 		}
        // 	});
        // });
        // return {
        // 	server: server,
        // 	io: io,
        // 	port: PORT
        // };
    });
}
exports.createWebServer = createWebServer;
;
function createRandomUserID() {
    return Math.round(100 * Math.random());
}
;
function processFile(filename) {
    return new Promise((resolve, reject) => {
        fs_1.readFile(filename, {
            encoding: 'utf8'
        }, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    }).catch((err) => {
        console.error(err);
        throw (err);
    });
}
function setClientOptions(options) {
    return processFile(path_1.join(__dirname, 'client_pages', 'index.html')).then((contents) => {
        _.each(options, function (val, key) {
            contents = contents.replace(`${key}: false`, `key: '${val}'`);
        });
        return contents;
    }).catch((err) => {
        console.error(err);
        throw (err);
    });
}
