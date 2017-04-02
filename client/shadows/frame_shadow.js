var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	ShadowDOM = require('./dom_shadow').ShadowDOM;

var log = require('../../utils/logging').getColoredLogger('green', 'bgBlack');

var ShadowFrame = function(options) {
	//domTree, socket) {
	this.options = options;
	this.domTree = options.frame;

	this._sentServerReady = false;
	log.debug('::: CREATED FRAME SHADOW ' + this._getDomTree().getFrameId() + ' :::');

	this._initialize();
};


// CROWD INPUT AGGREGATION VARS //
var AGGR_METHOD = 'vote';  // Alt: 'leader'
var EV_AGREE_THRESH = 0;
var INPUT_TIMEOUT_THRESH = 5000;
var INPUT_MAX_THRESH = 10;
var REEVAL_WINDOW_SIZE = 10;

var crowdInputStack = {};
var workerHistoryStack = {};
var globalHistoryStack = [];
var workerWeights = {};
var currentLeader = null;
////


(function(My) {
	util.inherits(My, EventEmitter);
	var proto = My.prototype;

	proto.sentServerReady = function() {
		return this._sentServerReady;
	};

	proto._onNodeReply = function(info) {
		var browserShadow = this.getBrowserShadow();
		browserShadow.nodeReply(this.getFrameId(), info);
	};

	proto._initialize = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		this.$_updateShadowTree = _.bind(this._updateShadowTree, this);
		this.$_highlightNode = _.bind(this._highlightNode, this);
		this.$_removeHighlight = _.bind(this._removeHighlight, this);
		this.$_onDeviceEvent = _.bind(this._onDeviceEvent, this);
		this.$_onNodeReply = _.bind(this._onNodeReply, this);

		this._addListeners();

		socket	.on('highlightNode', this.$_highlightNode)
				.on('removeHighlight', this.$_removeHighlight)
				.on('deviceEvent', this.$_onDeviceEvent)
				.on('nodeReply', this.$_onNodeReply);

		this._updateShadowTree(true);

		//this.on('updated', function() {
			//socket.emit('treeUpdated', this._shadowTree.serialize());
		//});
	};
	proto.getShadowTree = function() {
		return this._shadowTree;
	};
	proto._addListeners = function() {
		var domTree = this._getDomTree();
		domTree.on('rootInvalidated', this.$_updateShadowTree);
	};
	proto._onDeviceEvent = function(event) {
		var worker = event.userId;
		var evKey = event.id;

		//console.log("EVENT KEY (o  )=^=^=^> ", evKey);
		if (crowdInputStack[evKey] == undefined) {
			crowdInputStack[evKey] = [];
		}
		if (workerHistoryStack[worker] == undefined) {
			workerHistoryStack[worker] = [];
		}

		//console.log("PRECHECK INPUT: ", crowdInputStack, workerHistoryStack);
		var entryIdx = crowdInputStack[evKey].indexOf(worker);
		if (entryIdx < 0) {
			crowdInputStack[evKey].push(worker);
			workerHistoryStack[worker].push([evKey, (new Date).getTime()]);
			globalHistoryStack.push([worker, evKey]);
		} else {
			// Update the entry time for the data if there is already a record
			workerHistoryStack[worker][entryIdx][1] = (new Date).getTime();
		}

		//console.log("INPUT STACK(S): ", crowdInputStack, crowdInputStack[evKey], " ==> ", crowdInputStack[evKey].length, " // ", workerHistoryStack);

		// Helper func for clearing input from all stacks
		function removeInput(worker, idx) {
			var delIdx, delEvt;

			// Remove the input from the event tracker
			//console.log('++++ ', workerHistoryStack, " **", worker, idx, "** ", crowdInputStack);
			//console.log('++++A ', workerHistoryStack[worker]);
			//console.log('++++B ', workerHistoryStack[worker][idx]);
			//console.log('++++C ', workerHistoryStack[worker][idx][0]);
			curInput = crowdInputStack[workerHistoryStack[worker][idx][0]];
			//console.log('++++CUR_INPUT ', curInput, typeof curInput);
			delIdx = curInput.indexOf(worker);
			delEvt = workerHistoryStack[worker][idx][0];
			crowdInputStack[delEvt].splice(delIdx, 1);  // WSL-TODO: Check if this is deleting content properly
			if (crowdInputStack[delEvt].length == 0) {
				//console.log("EMPTY cIS - deleting:: ", crowdInputStack[delEvt], delEvt, workerHistoryStack[worker][idx], crowdInputStack[workerHistoryStack[worker][idx][0]]);
				delete crowdInputStack[delEvt];
				workerHistoryStack[worker].splice(idx,1);
			}
			if (crowdInputStack.length == 0) {
				delete crowdInputStack;
			}

			// Remove the stale worker input
			//console.log('===== ', workerHistoryStack[worker], crowdInputStack);
			delIdx = workerHistoryStack[worker].indexOf(idx);
			workerHistoryStack[worker].splice(delIdx, 1);
			if (workerHistoryStack[worker].length == 0) {
				//console.log("EMPTY wHS - deleting:: ", workerHistoryStack[worker], worker);
				delete workerHistoryStack[worker];
			}
			if (workerHistoryStack.length == 0) {
				delete workerHistoryStack;
			}

		}
		//


		//console.log("*****************************************\n*****************************************\n\n");
		// Update input tracking before eval -- check for input timeouts
		for (var i = 0; workerHistoryStack[worker] && i < workerHistoryStack[worker].length; i++) {
			//console.log("&& CHECKING ==> ", (new Date).getTime(), " - ", workerHistoryStack[worker][i][1], " = ", ((new Date).getTime() - workerHistoryStack[worker][i][1]), " > ", INPUT_TIMEOUT_THRESH);
			if ((new Date).getTime() - workerHistoryStack[worker][i][1] > INPUT_TIMEOUT_THRESH) {
				//console.log("SENDING:: ", worker, i);
				//TODO re-add
				//removeInput(worker, i);
				//i--;  // WSL-TODO: slicing breaks iteration?
			}
		}

		// WSL: DO WE NEED THIS?
		if (workerHistoryStack[worker]) {
			// Now that all the stale content has been removed, drop any input over the tracking-queue threshold
			for (var i = 0; i < workerHistoryStack[worker].length; i++) {
				if (i > INPUT_MAX_THRESH) {
					//console.log("SENDING2:: ", worker, i);
					//TODO re-add
					//removeInput(worker, i)
				}
			}
		}

		// WSL-NOTE: This is not a perfect rule. People could be voting for no-action for an extended period (or during a period of high spam rates)
		// If there is no active input from the leader, remove them from power (assume disconnect / inactive)
		if (workerHistoryStack && currentLeader && workerHistoryStack[currentLeader].length == 0) {
			currentLeader = null;
		}

		if (crowdInputStack && globalHistoryStack.length % REEVAL_WINDOW_SIZE == 0) {
			// WSL-TODO: recalculate leader scores here
			var aggrAnsVect = {};

			// Find the total number of inputs to use as a normalizing value
			var totalInputCount = 0;
			for (var key in crowdInputStack) {
				totalInputCount += crowdInputStack[key].length;
			}

			// Push normalized weights for each input
			for (var key in crowdInputStack) {
				aggrAnsVect[key] = crowdInputStack[key].length/totalInputCount;
			}

			// For each worker, computer a weight update value based on agreement with the aggregate answer
			// TODO: This.
			// NOTE: A worker's normalizing value is workerHistoryStack[worker].length
			// NOTE: A worker's input is the sum of the occurances of that input (can there ever be more than one? I didn't think so... ANS: no.) So it's hit/not-hit then.

		}

		var performAction = false;
		if (AGGR_METHOD == 'leader' && currentLeader) {
			if (currentLeader == worker) {
				performAction = true;
			}
		} else if (AGGR_METHOD == 'vote' || (AGGR_METHOD == 'leader' && !currentLeader)) {  // Use voting if selected, or no leader has been established
			//console.log("USING evKey:: ", crowdInputStack);
			if (crowdInputStack[evKey].length > EV_AGREE_THRESH) {
				performAction = true;
			}
		}

		// Perform the action in the event if correct
		if (performAction) {
			var frameState = this._getDomTree();
			frameState.onDeviceEvent(event);

			var browserShadow = this.getBrowserShadow();
			// var scriptRecorder = browserShadow.getScriptRecorder();
			// scriptRecorder.onDeviceEvent(frameState, event);
		}
	};
	proto._getDomTree = function() {
		return this.domTree;
	};
	proto._getSocket = function() {
		return this.options.socket;
	};
	proto.getFrameId = function() {
		return this._getDomTree().getFrameId();
	};
	proto._updateShadowTree = function(destroy) {
		this._sentServerReady = false;
		log.debug('Updating shadow tree ' + this.getFrameId());

		var domTree = this._getDomTree(),
			socket = this._getSocket();
		if(this._shadowTree && destroy) {
			this._shadowTree.destroy();
		}
		var node = domTree.getRoot();
		if(node) {
			var shadow = this._shadowTree = new ShadowDOM(_.extend({},
				this.options, {
					tree: node,
					state: this,
					parent: false
				}));

			shadow.isInitialized().then(_.bind(function() {
				this._sentServerReady = true;
				//log.debug('Server ready ' + node.getId());
				//socket.emit('serverReady', shadow.serialize());
				//console.log('server ready');

				//socket.emit('nodeInitialized', shadow.serialize());
			}, this));
		}
	};

	proto._removeListeners = function() {
		var domTree = this._getDomTree();
		domTree.removeListener('rootInvalidated', this.$_updateShadowTree);
	};

	proto.destroy = function() {
		var domTree = this._getDomTree(),
			socket = this._getSocket();

		if(this._shadowTree) {
			this._shadowTree.destroy();
		}

		this._removeListeners();

		socket.removeListener('highlightNode', this.$_highlightNode);
		socket.removeListener('removeHighlight', this.$_removeHighlight);
		socket.removeListener('deviceEvent', this.$_onDeviceEvent);
		socket.removeListener('nodeReply', this.$_onNodeReply);

		log.debug('::: DESTROYED FRAME SHADOW ' + this.getFrameId() + ' :::');
	};
	proto._highlightNode = function(info) {
		var nodeId = info.nodeId;
		domTree.highlight(nodeId);
	};
	proto._removeHighlight = function(info) {
		var nodeId = info.nodeId;
		domTree.removeHighlight(nodeId);
	};
	proto.getUserId = function() {
		return this.options.userId;
	};
	proto.getBrowserShadow = function() {
		return this.options.browserShadow;
	};
}(ShadowFrame));

module.exports = {
	ShadowFrame: ShadowFrame
};
