function Deferred() {
	var instance = this;
	this._resolver = null;
	this._rejector = null;
	this._promise = new Promise(function(resolve, reject) {
		instance._resolver = resolve;
		instance._rejector = reject;
	});
}

(function(My) {
	var proto = My.prototype;
	proto.then = function(resolve, reject) {
		return this._promise.then(resolve, reject);
	};
	proto.resolve = function(resolution) {
		this._resolver.call(null, resolution);
		return this;
	};
	proto.reject = function(rejection) {
		this._rejector.call(null, rejection);
		return this;
	};
}(Deferred));

module.exports = Deferred;