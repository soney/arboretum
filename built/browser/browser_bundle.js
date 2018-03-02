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
/******/ 	return __webpack_require__(__webpack_require__.s = 27);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var makeError = __webpack_require__(48);

function ShareDBError(code, message) {
  ShareDBError.super.call(this, message);
  this.code = code;
}

makeError(ShareDBError);

module.exports = ShareDBError;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {


exports.defaultType = __webpack_require__(14).type;

exports.map = {};

exports.register = function(type) {
  if (type.name) exports.map[type.name] = type;
  if (type.uri) exports.map[type.uri] = type;
};

exports.register(exports.defaultType);


/***/ }),
/* 3 */
/***/ (function(module, exports) {


exports.doNothing = doNothing;
function doNothing() {}

exports.hasKeys = function(object) {
  for (var key in object) return true;
  return false;
};


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var EventEmitter = __webpack_require__(47).EventEmitter;

exports.EventEmitter = EventEmitter;
exports.mixin = mixin;

function mixin(Constructor) {
  for (var key in EventEmitter.prototype) {
    Constructor.prototype[key] = EventEmitter.prototype[key];
  }
}


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (true) {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function() {
      return _;
    }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }
}.call(this));


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (process.env.NODE_ENV !== 'production') {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

// This contains the master OT functions for the database. They look like
// ot-types style operational transform functions, but they're a bit different.
// These functions understand versions and can deal with out of bound create &
// delete operations.

var types = __webpack_require__(2).map;

// Returns an error string on failure. Rockin' it C style.
exports.checkOp = function(op) {
  if (op == null || typeof op !== 'object') {
    return {code: 4004, message: 'Missing op'};
  }

  if (op.create != null) {
    if (typeof op.create !== 'object') {
      return {code: 4006, message: 'create data must be an object'};
    }
    var typeName = op.create.type;
    if (typeof typeName !== 'string') {
      return {code: 4007, message: 'Missing create type'};
    }
    var type = types[typeName];
    if (type == null || typeof type !== 'object') {
      return {code: 4008, message: 'Unknown type'};
    }

  } else if (op.del != null) {
    if (op.del !== true) return {code: 4009, message: 'del value must be true'};

  } else if (op.op == null) {
    return {code: 4010, message: 'Missing op, create, or del'};
  }

  if (op.src != null && typeof op.src !== 'string') {
    return {code: 4011, message: 'Invalid src'};
  }
  if (op.seq != null && typeof op.seq !== 'number') {
    return {code: 4012, message: 'Invalid seq'};
  }
  if (
    (op.src == null && op.seq != null) ||
    (op.src != null && op.seq == null)
  ) {
    return {code: 4013, message: 'Both src and seq must be set together'};
  }

  if (op.m != null && typeof op.m !== 'object') {
    return {code: 4014, message: 'op.m invalid'};
  }
};

// Takes in a string (type name or URI) and returns the normalized name (uri)
exports.normalizeType = function(typeName) {
  return types[typeName] && types[typeName].uri;
};

// This is the super apply function that takes in snapshot data (including the
// type) and edits it in-place. Returns an error or null for success.
exports.apply = function(snapshot, op) {
  if (typeof snapshot !== 'object') {
    return {code: 5002, message: 'Missing snapshot'};
  }
  if (snapshot.v != null && op.v != null && snapshot.v !== op.v) {
    return {code: 5003, message: 'Version mismatch'};
  }

  // Create operation
  if (op.create) {
    if (snapshot.type) return {code: 4016, message: 'Document already exists'};

    // The document doesn't exist, although it might have once existed
    var create = op.create;
    var type = types[create.type];
    if (!type) return {code: 4008, message: 'Unknown type'};

    try {
      snapshot.data = type.create(create.data);
      snapshot.type = type.uri;
      snapshot.v++;
    } catch (err) {
      return err;
    }

  // Delete operation
  } else if (op.del) {
    snapshot.data = undefined;
    snapshot.type = null;
    snapshot.v++;

  // Edit operation
  } else if (op.op) {
    var err = applyOpEdit(snapshot, op.op);
    if (err) return err;
    snapshot.v++;

  // No-op, and we don't have to do anything
  } else {
    snapshot.v++;
  }
};

function applyOpEdit(snapshot, edit) {
  if (!snapshot.type) return {code: 4015, message: 'Document does not exist'};

  if (typeof edit !== 'object') return {code: 5004, message: 'Missing op'};
  var type = types[snapshot.type];
  if (!type) return {code: 4008, message: 'Unknown type'};

  try {
    snapshot.data = type.apply(snapshot.data, edit);
  } catch (err) {
    return err;
  }
}

exports.transform = function(type, op, appliedOp) {
  // There are 16 cases this function needs to deal with - which are all the
  // combinations of create/delete/op/noop from both op and appliedOp
  if (op.v != null && op.v !== appliedOp.v) {
    return {code: 5006, message: 'Version mismatch'};
  }

  if (appliedOp.del) {
    if (op.create || op.op) {
      return {code: 4017, message: 'Document was deleted'};
    }
  } else if (
    (appliedOp.create && (op.op || op.create || op.del)) ||
    (appliedOp.op && op.create)
  ) {
    // If appliedOp.create is not true, appliedOp contains an op - which
    // also means the document exists remotely.
    return {code: 4018, message: 'Document was created remotely'};
  } else if (appliedOp.op && op.op) {
    // If we reach here, they both have a .op property.
    if (!type) return {code: 5005, message: 'Document does not exist'};

    if (typeof type === 'string') {
      type = types[type];
      if (!type) return {code: 4008, message: 'Unknown type'};
    }

    try {
      op.op = type.transform(op.op, appliedOp.op, 'left');
    } catch (err) {
      return err;
    }
  }

  if (op.v != null) op.v++;
};


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var json0 = __webpack_require__(14).type;

exports.projectSnapshot = projectSnapshot;
exports.projectOp = projectOp;
exports.isSnapshotAllowed = isSnapshotAllowed;
exports.isOpAllowed = isOpAllowed;


// Project a snapshot in place to only include specified fields
function projectSnapshot(fields, snapshot) {
  // Only json0 supported right now
  if (snapshot.type && snapshot.type !== json0.uri) {
    throw new Error(4023, 'Cannot project snapshots of type ' + snapshot.type);
  }
  snapshot.data = projectData(fields, snapshot.data);
}

function projectOp(fields, op) {
  if (op.create) {
    projectSnapshot(fields, op.create);
  }
  if (op.op) {
    op.op = projectEdit(fields, op.op);
  }
}

function projectEdit(fields, op) {
  // So, we know the op is a JSON op
  var result = [];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    var path = c.p;

    if (path.length === 0) {
      var newC = {p:[]};

      if (c.od !== undefined || c.oi !== undefined) {
        if (c.od !== undefined) {
          newC.od = projectData(fields, c.od);
        }
        if (c.oi !== undefined) {
          newC.oi = projectData(fields, c.oi);
        }
        result.push(newC);
      }
    } else {
      // The path has a first element. Just check it against the fields.
      if (fields[path[0]]) {
        result.push(c);
      }
    }
  }
  return result;
}

function isOpAllowed(knownType, fields, op) {
  if (op.create) {
    return isSnapshotAllowed(fields, op.create);
  }
  if (op.op) {
    if (knownType && knownType !== json0.uri) return false;
    return isEditAllowed(fields, op.op);
  }
  // Noop and del are both ok.
  return true;
}

// Basically, would the projected version of this data be the same as the original?
function isSnapshotAllowed(fields, snapshot) {
  if (snapshot.type && snapshot.type !== json0.uri) {
    return false;
  }
  if (snapshot.data == null) {
    return true;
  }
  // Data must be an object if not null
  if (typeof snapshot.data !== 'object' || Array.isArray(snapshot.data)) {
    return false;
  }
  for (var k in snapshot.data) {
    if (!fields[k]) return false;
  }
  return true;
}

function isEditAllowed(fields, op) {
  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p.length === 0) {
      return false;
    } else if (!fields[c.p[0]]) {
      return false;
    }
  }
  return true;
}

function projectData(fields, data) {
  // Return back null or undefined
  if (data == null) {
    return data;
  }
  // If data is not an object, the projected version just looks like null.
  if (typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  // Shallow copy of each field
  var result = {};
  for (var key in fields) {
    if (data.hasOwnProperty(key)) {
      result[key] = data[key];
    }
  }
  return result;
}


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var emptyFunction = __webpack_require__(6);

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  var printWarning = function printWarning(format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  warning = function warning(condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }

    if (format.indexOf('Failed Composite propType: ') === 0) {
      return; // Ignore CompositeComponent proptype check.
    }

    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = warning;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var Doc = __webpack_require__(13);
var Query = __webpack_require__(16);
var emitter = __webpack_require__(4);
var ShareDBError = __webpack_require__(1);
var types = __webpack_require__(2);
var util = __webpack_require__(3);

/**
 * Handles communication with the sharejs server and provides queries and
 * documents.
 *
 * We create a connection with a socket object
 *   connection = new sharejs.Connection(sockset)
 * The socket may be any object handling the websocket protocol. See the
 * documentation of bindToSocket() for details. We then wait for the connection
 * to connect
 *   connection.on('connected', ...)
 * and are finally able to work with shared documents
 *   connection.get('food', 'steak') // Doc
 *
 * @param socket @see bindToSocket
 */
module.exports = Connection;
function Connection(socket) {
  emitter.EventEmitter.call(this);

  // Map of collection -> id -> doc object for created documents.
  // (created documents MUST BE UNIQUE)
  this.collections = {};

  // Each query is created with an id that the server uses when it sends us
  // info about the query (updates, etc)
  this.nextQueryId = 1;

  // Map from query ID -> query object.
  this.queries = {};

  // A unique message number for the given id
  this.seq = 1;

  // Equals agent.clientId on the server
  this.id = null;

  // This direct reference from connection to agent is not used internal to
  // ShareDB, but it is handy for server-side only user code that may cache
  // state on the agent and read it in middleware
  this.agent = null;

  this.debug = false;

  this.bindToSocket(socket);
}
emitter.mixin(Connection);


/**
 * Use socket to communicate with server
 *
 * Socket is an object that can handle the websocket protocol. This method
 * installs the onopen, onclose, onmessage and onerror handlers on the socket to
 * handle communication and sends messages by calling socket.send(message). The
 * sockets `readyState` property is used to determine the initaial state.
 *
 * @param socket Handles the websocket protocol
 * @param socket.readyState
 * @param socket.close
 * @param socket.send
 * @param socket.onopen
 * @param socket.onclose
 * @param socket.onmessage
 * @param socket.onerror
 */
Connection.prototype.bindToSocket = function(socket) {
  if (this.socket) {
    this.socket.close();
    this.socket.onmessage = null;
    this.socket.onopen = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
  }

  this.socket = socket;

  // State of the connection. The correspoding events are emmited when this changes
  //
  // - 'connecting'   The connection is still being established, or we are still
  //                    waiting on the server to send us the initialization message
  // - 'connected'    The connection is open and we have connected to a server
  //                    and recieved the initialization message
  // - 'disconnected' Connection is closed, but it will reconnect automatically
  // - 'closed'       The connection was closed by the client, and will not reconnect
  // - 'stopped'      The connection was closed by the server, and will not reconnect
  this.state = (socket.readyState === 0 || socket.readyState === 1) ? 'connecting' : 'disconnected';

  // This is a helper variable the document uses to see whether we're
  // currently in a 'live' state. It is true if and only if we're connected
  this.canSend = false;

  var connection = this;

  socket.onmessage = function(event) {
    try {
      var data = (typeof event.data === 'string') ?
        JSON.parse(event.data) : event.data;
    } catch (err) {
      console.warn('Failed to parse message', event);
      return;
    }

    if (connection.debug) console.log('RECV', JSON.stringify(data));

    var request = {data: data};
    connection.emit('receive', request);
    if (!request.data) return;

    try {
      connection.handleMessage(request.data);
    } catch (err) {
      process.nextTick(function() {
        connection.emit('error', err);
      });
    }
  };

  socket.onopen = function() {
    connection._setState('connecting');
  };

  socket.onerror = function(err) {
    // This isn't the same as a regular error, because it will happen normally
    // from time to time. Your connection should probably automatically
    // reconnect anyway, but that should be triggered off onclose not onerror.
    // (onclose happens when onerror gets called anyway).
    connection.emit('connection error', err);
  };

  socket.onclose = function(reason) {
    // node-browserchannel reason values:
    //   'Closed' - The socket was manually closed by calling socket.close()
    //   'Stopped by server' - The server sent the stop message to tell the client not to try connecting
    //   'Request failed' - Server didn't respond to request (temporary, usually offline)
    //   'Unknown session ID' - Server session for client is missing (temporary, will immediately reestablish)

    if (reason === 'closed' || reason === 'Closed') {
      connection._setState('closed', reason);

    } else if (reason === 'stopped' || reason === 'Stopped by server') {
      connection._setState('stopped', reason);

    } else {
      connection._setState('disconnected', reason);
    }
  };
};

/**
 * @param {object} message
 * @param {String} message.a action
 */
Connection.prototype.handleMessage = function(message) {
  var err = null;
  if (message.error) {
    // wrap in Error object so can be passed through event emitters
    err = new Error(message.error.message);
    err.code = message.error.code;
    // Add the message data to the error object for more context
    err.data = message;
    delete message.error;
  }
  // Switch on the message action. Most messages are for documents and are
  // handled in the doc class.
  switch (message.a) {
    case 'init':
      // Client initialization packet
      if (message.protocol !== 1) {
        err = new ShareDBError(4019, 'Invalid protocol version');
        return this.emit('error', err);
      }
      if (types.map[message.type] !== types.defaultType) {
        err = new ShareDBError(4020, 'Invalid default type');
        return this.emit('error', err);
      }
      if (typeof message.id !== 'string') {
        err = new ShareDBError(4021, 'Invalid client id');
        return this.emit('error', err);
      }
      this.id = message.id;

      this._setState('connected');
      return;

    case 'qf':
      var query = this.queries[message.id];
      if (query) query._handleFetch(err, message.data, message.extra);
      return;
    case 'qs':
      var query = this.queries[message.id];
      if (query) query._handleSubscribe(err, message.data, message.extra);
      return;
    case 'qu':
      // Queries are removed immediately on calls to destroy, so we ignore
      // replies to query unsubscribes. Perhaps there should be a callback for
      // destroy, but this is currently unimplemented
      return;
    case 'q':
      // Query message. Pass this to the appropriate query object.
      var query = this.queries[message.id];
      if (!query) return;
      if (err) return query._handleError(err);
      if (message.diff) query._handleDiff(message.diff);
      if (message.hasOwnProperty('extra')) query._handleExtra(message.extra);
      return;

    case 'bf':
      return this._handleBulkMessage(message, '_handleFetch');
    case 'bs':
      return this._handleBulkMessage(message, '_handleSubscribe');
    case 'bu':
      return this._handleBulkMessage(message, '_handleUnsubscribe');

    case 'f':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleFetch(err, message.data);
      return;
    case 's':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleSubscribe(err, message.data);
      return;
    case 'u':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleUnsubscribe(err);
      return;
    case 'op':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleOp(err, message);
      return;

    default:
      console.warn('Ignoring unrecognized message', message);
  }
};

Connection.prototype._handleBulkMessage = function(message, method) {
  if (message.data) {
    for (var id in message.data) {
      var doc = this.getExisting(message.c, id);
      if (doc) doc[method](message.error, message.data[id]);
    }
  } else if (Array.isArray(message.b)) {
    for (var i = 0; i < message.b.length; i++) {
      var id = message.b[i];
      var doc = this.getExisting(message.c, id);
      if (doc) doc[method](message.error);
    }
  } else if (message.b) {
    for (var id in message.b) {
      var doc = this.getExisting(message.c, id);
      if (doc) doc[method](message.error);
    }
  } else {
    console.error('Invalid bulk message', message);
  }
};

Connection.prototype._reset = function() {
  this.seq = 1;
  this.id = null;
  this.agent = null;
};

// Set the connection's state. The connection is basically a state machine.
Connection.prototype._setState = function(newState, reason) {
  if (this.state === newState) return;

  // I made a state diagram. The only invalid transitions are getting to
  // 'connecting' from anywhere other than 'disconnected' and getting to
  // 'connected' from anywhere other than 'connecting'.
  if (
    (newState === 'connecting' && this.state !== 'disconnected' && this.state !== 'stopped' && this.state !== 'closed') ||
    (newState === 'connected' && this.state !== 'connecting')
  ) {
    var err = new ShareDBError(5007, 'Cannot transition directly from ' + this.state + ' to ' + newState);
    return this.emit('error', err);
  }

  this.state = newState;
  this.canSend = (newState === 'connected');

  if (newState === 'disconnected' || newState === 'stopped' || newState === 'closed') this._reset();

  // Group subscribes together to help server make more efficient calls
  this.startBulk();
  // Emit the event to all queries
  for (var id in this.queries) {
    var query = this.queries[id];
    query._onConnectionStateChanged();
  }
  // Emit the event to all documents
  for (var collection in this.collections) {
    var docs = this.collections[collection];
    for (var id in docs) {
      docs[id]._onConnectionStateChanged();
    }
  }
  this.endBulk();

  this.emit(newState, reason);
  this.emit('state', newState, reason);
};

Connection.prototype.startBulk = function() {
  if (!this.bulk) this.bulk = {};
};

Connection.prototype.endBulk = function() {
  if (this.bulk) {
    for (var collection in this.bulk) {
      var actions = this.bulk[collection];
      this._sendBulk('f', collection, actions.f);
      this._sendBulk('s', collection, actions.s);
      this._sendBulk('u', collection, actions.u);
    }
  }
  this.bulk = null;
};

Connection.prototype._sendBulk = function(action, collection, values) {
  if (!values) return;
  var ids = [];
  var versions = {};
  var versionsCount = 0;
  var versionId;
  for (var id in values) {
    var value = values[id];
    if (value == null) {
      ids.push(id);
    } else {
      versions[id] = value;
      versionId = id;
      versionsCount++;
    }
  }
  if (ids.length === 1) {
    var id = ids[0];
    this.send({a: action, c: collection, d: id});
  } else if (ids.length) {
    this.send({a: 'b' + action, c: collection, b: ids});
  }
  if (versionsCount === 1) {
    var version = versions[versionId];
    this.send({a: action, c: collection, d: versionId, v: version});
  } else if (versionsCount) {
    this.send({a: 'b' + action, c: collection, b: versions});
  }
};

Connection.prototype._sendAction = function(action, doc, version) {
  // Ensure the doc is registered so that it receives the reply message
  this._addDoc(doc);
  if (this.bulk) {
    // Bulk subscribe
    var actions = this.bulk[doc.collection] || (this.bulk[doc.collection] = {});
    var versions = actions[action] || (actions[action] = {});
    var isDuplicate = versions.hasOwnProperty(doc.id);
    versions[doc.id] = version;
    return isDuplicate;
  } else {
    // Send single doc subscribe message
    var message = {a: action, c: doc.collection, d: doc.id, v: version};
    this.send(message);
  }
};

Connection.prototype.sendFetch = function(doc) {
  return this._sendAction('f', doc, doc.version);
};

Connection.prototype.sendSubscribe = function(doc) {
  return this._sendAction('s', doc, doc.version);
};

Connection.prototype.sendUnsubscribe = function(doc) {
  return this._sendAction('u', doc);
};

Connection.prototype.sendOp = function(doc, op) {
  // Ensure the doc is registered so that it receives the reply message
  this._addDoc(doc);
  var message = {
    a: 'op',
    c: doc.collection,
    d: doc.id,
    v: doc.version,
    src: op.src,
    seq: op.seq
  };
  if (op.op) message.op = op.op;
  if (op.create) message.create = op.create;
  if (op.del) message.del = op.del;
  this.send(message);
};


/**
 * Sends a message down the socket
 */
Connection.prototype.send = function(message) {
  if (this.debug) console.log('SEND', JSON.stringify(message));

  this.emit('send', message);
  this.socket.send(JSON.stringify(message));
};


/**
 * Closes the socket and emits 'closed'
 */
Connection.prototype.close = function() {
  this.socket.close();
};

Connection.prototype.getExisting = function(collection, id) {
  if (this.collections[collection]) return this.collections[collection][id];
};


/**
 * Get or create a document.
 *
 * @param collection
 * @param id
 * @return {Doc}
 */
Connection.prototype.get = function(collection, id) {
  var docs = this.collections[collection] ||
    (this.collections[collection] = {});

  var doc = docs[id];
  if (!doc) {
    doc = docs[id] = new Doc(this, collection, id);
    this.emit('doc', doc);
  }

  return doc;
};


/**
 * Remove document from this.collections
 *
 * @private
 */
Connection.prototype._destroyDoc = function(doc) {
  var docs = this.collections[doc.collection];
  if (!docs) return;

  delete docs[doc.id];

  // Delete the collection container if its empty. This could be a source of
  // memory leaks if you slowly make a billion collections, which you probably
  // won't do anyway, but whatever.
  if (!util.hasKeys(docs)) {
    delete this.collections[doc.collection];
  }
};

Connection.prototype._addDoc = function(doc) {
  var docs = this.collections[doc.collection];
  if (!docs) {
    docs = this.collections[doc.collection] = {};
  }
  if (docs[doc.id] !== doc) {
    docs[doc.id] = doc;
  }
};

// Helper for createFetchQuery and createSubscribeQuery, below.
Connection.prototype._createQuery = function(action, collection, q, options, callback) {
  var id = this.nextQueryId++;
  var query = new Query(action, this, id, collection, q, options, callback);
  this.queries[id] = query;
  query.send();
  return query;
};

// Internal function. Use query.destroy() to remove queries.
Connection.prototype._destroyQuery = function(query) {
  delete this.queries[query.id];
};

// The query options object can contain the following fields:
//
// db: Name of the db for the query. You can attach extraDbs to ShareDB and
//   pick which one the query should hit using this parameter.

// Create a fetch query. Fetch queries are only issued once, returning the
// results directly into the callback.
//
// The callback should have the signature function(error, results, extra)
// where results is a list of Doc objects.
Connection.prototype.createFetchQuery = function(collection, q, options, callback) {
  return this._createQuery('qf', collection, q, options, callback);
};

// Create a subscribe query. Subscribe queries return with the initial data
// through the callback, then update themselves whenever the query result set
// changes via their own event emitter.
//
// If present, the callback should have the signature function(error, results, extra)
// where results is a list of Doc objects.
Connection.prototype.createSubscribeQuery = function(collection, q, options, callback) {
  return this._createQuery('qs', collection, q, options, callback);
};

Connection.prototype.hasPending = function() {
  return !!(
    this._firstDoc(hasPending) ||
    this._firstQuery(hasPending)
  );
};
function hasPending(object) {
  return object.hasPending();
}

Connection.prototype.hasWritePending = function() {
  return !!this._firstDoc(hasWritePending);
};
function hasWritePending(object) {
  return object.hasWritePending();
}

Connection.prototype.whenNothingPending = function(callback) {
  var doc = this._firstDoc(hasPending);
  if (doc) {
    // If a document is found with a pending operation, wait for it to emit
    // that nothing is pending anymore, and then recheck all documents again.
    // We have to recheck all documents, just in case another mutation has
    // been made in the meantime as a result of an event callback
    doc.once('nothing pending', this._nothingPendingRetry(callback));
    return;
  }
  var query = this._firstQuery(hasPending);
  if (query) {
    query.once('ready', this._nothingPendingRetry(callback));
    return;
  }
  // Call back when no pending operations
  process.nextTick(callback);
};
Connection.prototype._nothingPendingRetry = function(callback) {
  var connection = this;
  return function() {
    process.nextTick(function() {
      connection.whenNothingPending(callback);
    });
  };
};

Connection.prototype._firstDoc = function(fn) {
  for (var collection in this.collections) {
    var docs = this.collections[collection];
    for (var id in docs) {
      var doc = docs[id];
      if (fn(doc)) {
        return doc;
      }
    }
  }
};

Connection.prototype._firstQuery = function(fn) {
  for (var id in this.queries) {
    var query = this.queries[id];
    if (fn(query)) {
      return query;
    }
  }
};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

var emitter = __webpack_require__(4);
var ShareDBError = __webpack_require__(1);
var types = __webpack_require__(2);

/**
 * A Doc is a client's view on a sharejs document.
 *
 * It is is uniquely identified by its `id` and `collection`.  Documents
 * should not be created directly. Create them with connection.get()
 *
 *
 * Subscriptions
 * -------------
 *
 * We can subscribe a document to stay in sync with the server.
 *   doc.subscribe(function(error) {
 *     doc.subscribed // = true
 *   })
 * The server now sends us all changes concerning this document and these are
 * applied to our data. If the subscription was successful the initial
 * data and version sent by the server are loaded into the document.
 *
 * To stop listening to the changes we call `doc.unsubscribe()`.
 *
 * If we just want to load the data but not stay up-to-date, we call
 *   doc.fetch(function(error) {
 *     doc.data // sent by server
 *   })
 *
 *
 * Events
 * ------
 *
 * You can use doc.on(eventName, callback) to subscribe to the following events:
 * - `before op (op, source)` Fired before a partial operation is applied to the data.
 *   It may be used to read the old data just before applying an operation
 * - `op (op, source)` Fired after every partial operation with this operation as the
 *   first argument
 * - `create (source)` The document was created. That means its type was
 *   set and it has some initial data.
 * - `del (data, source)` Fired after the document is deleted, that is
 *   the data is null. It is passed the data before delteion as an
 *   arguments
 * - `load ()` Fired when a new snapshot is ingested from a fetch, subscribe, or query
 */

module.exports = Doc;
function Doc(connection, collection, id) {
  emitter.EventEmitter.call(this);

  this.connection = connection;

  this.collection = collection;
  this.id = id;

  this.version = null;
  this.type = null;
  this.data = undefined;

  // Array of callbacks or nulls as placeholders
  this.inflightFetch = [];
  this.inflightSubscribe = [];
  this.inflightUnsubscribe = [];
  this.pendingFetch = [];

  // Whether we think we are subscribed on the server. Synchronously set to
  // false on calls to unsubscribe and disconnect. Should never be true when
  // this.wantSubscribe is false
  this.subscribed = false;
  // Whether to re-establish the subscription on reconnect
  this.wantSubscribe = false;

  // The op that is currently roundtripping to the server, or null.
  //
  // When the connection reconnects, the inflight op is resubmitted.
  //
  // This has the same format as an entry in pendingOps
  this.inflightOp = null;

  // All ops that are waiting for the server to acknowledge this.inflightOp
  // This used to just be a single operation, but creates & deletes can't be
  // composed with regular operations.
  //
  // This is a list of {[create:{...}], [del:true], [op:...], callbacks:[...]}
  this.pendingOps = [];

  // The OT type of this document. An uncreated document has type `null`
  this.type = null;

  // The applyStack enables us to track any ops submitted while we are
  // applying an op incrementally. This value is an array when we are
  // performing an incremental apply and null otherwise. When it is an array,
  // all submitted ops should be pushed onto it. The `_otApply` method will
  // reset it back to null when all incremental apply loops are complete.
  this.applyStack = null;

  // Disable the default behavior of composing submitted ops. This is read at
  // the time of op submit, so it may be toggled on before submitting a
  // specifc op and toggled off afterward
  this.preventCompose = false;
}
emitter.mixin(Doc);

Doc.prototype.destroy = function(callback) {
  var doc = this;
  doc.whenNothingPending(function() {
    doc.connection._destroyDoc(doc);
    if (doc.wantSubscribe) {
      return doc.unsubscribe(callback);
    }
    if (callback) callback();
  });
};


// ****** Manipulating the document data, version and type.

// Set the document's type, and associated properties. Most of the logic in
// this function exists to update the document based on any added & removed API
// methods.
//
// @param newType OT type provided by the ottypes library or its name or uri
Doc.prototype._setType = function(newType) {
  if (typeof newType === 'string') {
    newType = types.map[newType];
  }

  if (newType) {
    this.type = newType;

  } else if (newType === null) {
    this.type = newType;
    // If we removed the type from the object, also remove its data
    this.data = undefined;

  } else {
    var err = new ShareDBError(4008, 'Missing type ' + newType);
    return this.emit('error', err);
  }
};

// Ingest snapshot data. This data must include a version, snapshot and type.
// This is used both to ingest data that was exported with a webpage and data
// that was received from the server during a fetch.
//
// @param snapshot.v    version
// @param snapshot.data
// @param snapshot.type
// @param callback
Doc.prototype.ingestSnapshot = function(snapshot, callback) {
  if (!snapshot) return callback && callback();

  if (typeof snapshot.v !== 'number') {
    var err = new ShareDBError(5008, 'Missing version in ingested snapshot. ' + this.collection + '.' + this.id);
    if (callback) return callback(err);
    return this.emit('error', err);
  }

  // If the doc is already created or there are ops pending, we cannot use the
  // ingested snapshot and need ops in order to update the document
  if (this.type || this.hasWritePending()) {
    // The version should only be null on a created document when it was
    // created locally without fetching
    if (this.version == null) {
      if (this.hasWritePending()) {
        // If we have pending ops and we get a snapshot for a locally created
        // document, we have to wait for the pending ops to complete, because
        // we don't know what version to fetch ops from. It is possible that
        // the snapshot came from our local op, but it is also possible that
        // the doc was created remotely (which would conflict and be an error)
        return callback && this.once('no write pending', callback);
      }
      // Otherwise, we've encounted an error state
      var err = new ShareDBError(5009, 'Cannot ingest snapshot in doc with null version. ' + this.collection + '.' + this.id);
      if (callback) return callback(err);
      return this.emit('error', err);
    }
    // If we got a snapshot for a version further along than the document is
    // currently, issue a fetch to get the latest ops and catch us up
    if (snapshot.v > this.version) return this.fetch(callback);
    return callback && callback();
  }

  // Ignore the snapshot if we are already at a newer version. Under no
  // circumstance should we ever set the current version backward
  if (this.version > snapshot.v) return callback && callback();

  this.version = snapshot.v;
  var type = (snapshot.type === undefined) ? types.defaultType : snapshot.type;
  this._setType(type);
  this.data = (this.type && this.type.deserialize) ?
    this.type.deserialize(snapshot.data) :
    snapshot.data;
  this.emit('load');
  callback && callback();
};

Doc.prototype.whenNothingPending = function(callback) {
  if (this.hasPending()) {
    this.once('nothing pending', callback);
    return;
  }
  callback();
};

Doc.prototype.hasPending = function() {
  return !!(
    this.inflightOp ||
    this.pendingOps.length ||
    this.inflightFetch.length ||
    this.inflightSubscribe.length ||
    this.inflightUnsubscribe.length ||
    this.pendingFetch.length
  );
};

Doc.prototype.hasWritePending = function() {
  return !!(this.inflightOp || this.pendingOps.length);
};

Doc.prototype._emitNothingPending = function() {
  if (this.hasWritePending()) return;
  this.emit('no write pending');
  if (this.hasPending()) return;
  this.emit('nothing pending');
};

// **** Helpers for network messages

Doc.prototype._emitResponseError = function(err, callback) {
  if (callback) {
    callback(err);
    this._emitNothingPending();
    return;
  }
  this._emitNothingPending();
  this.emit('error', err);
};

Doc.prototype._handleFetch = function(err, snapshot) {
  var callback = this.inflightFetch.shift();
  if (err) return this._emitResponseError(err, callback);
  this.ingestSnapshot(snapshot, callback);
  this._emitNothingPending();
};

Doc.prototype._handleSubscribe = function(err, snapshot) {
  var callback = this.inflightSubscribe.shift();
  if (err) return this._emitResponseError(err, callback);
  // Indicate we are subscribed only if the client still wants to be. In the
  // time since calling subscribe and receiving a response from the server,
  // unsubscribe could have been called and we might already be unsubscribed
  // but not have received the response. Also, because requests from the
  // client are not serialized and may take different async time to process,
  // it is possible that we could hear responses back in a different order
  // from the order originally sent
  if (this.wantSubscribe) this.subscribed = true;
  this.ingestSnapshot(snapshot, callback);
  this._emitNothingPending();
};

Doc.prototype._handleUnsubscribe = function(err) {
  var callback = this.inflightUnsubscribe.shift();
  if (err) return this._emitResponseError(err, callback);
  if (callback) callback();
  this._emitNothingPending();
};

Doc.prototype._handleOp = function(err, message) {
  if (err) {
    if (this.inflightOp) {
      // The server has rejected submission of the current operation. If we get
      // an error code 4002 "Op submit rejected", this was done intentionally
      // and we should roll back but not return an error to the user.
      if (err.code === 4002) err = null;
      return this._rollback(err);
    }
    return this.emit('error', err);
  }

  if (this.inflightOp &&
      message.src === this.inflightOp.src &&
      message.seq === this.inflightOp.seq) {
    // The op has already been applied locally. Just update the version
    // and pending state appropriately
    this._opAcknowledged(message);
    return;
  }

  if (this.version == null || message.v > this.version) {
    // This will happen in normal operation if we become subscribed to a
    // new document via a query. It can also happen if we get an op for
    // a future version beyond the version we are expecting next. This
    // could happen if the server doesn't publish an op for whatever reason
    // or because of a race condition. In any case, we can send a fetch
    // command to catch back up.
    //
    // Fetch only sends a new fetch command if no fetches are inflight, which
    // will act as a natural debouncing so we don't send multiple fetch
    // requests for many ops received at once.
    this.fetch();
    return;
  }

  if (message.v < this.version) {
    // We can safely ignore the old (duplicate) operation.
    return;
  }

  if (this.inflightOp) {
    var transformErr = transformX(this.inflightOp, message);
    if (transformErr) return this._hardRollback(transformErr);
  }

  for (var i = 0; i < this.pendingOps.length; i++) {
    var transformErr = transformX(this.pendingOps[i], message);
    if (transformErr) return this._hardRollback(transformErr);
  }

  this.version++;
  this._otApply(message, false);
  return;
};

// Called whenever (you guessed it!) the connection state changes. This will
// happen when we get disconnected & reconnect.
Doc.prototype._onConnectionStateChanged = function() {
  if (this.connection.canSend) {
    this.flush();
    this._resubscribe();
  } else {
    if (this.inflightOp) {
      this.pendingOps.unshift(this.inflightOp);
      this.inflightOp = null;
    }
    this.subscribed = false;
    if (this.inflightFetch.length || this.inflightSubscribe.length) {
      this.pendingFetch = this.pendingFetch.concat(this.inflightFetch, this.inflightSubscribe);
      this.inflightFetch.length = 0;
      this.inflightSubscribe.length = 0;
    }
    if (this.inflightUnsubscribe.length) {
      var callbacks = this.inflightUnsubscribe;
      this.inflightUnsubscribe = [];
      callEach(callbacks);
    }
  }
};

Doc.prototype._resubscribe = function() {
  var callbacks = this.pendingFetch;
  this.pendingFetch = [];

  if (this.wantSubscribe) {
    if (callbacks.length) {
      this.subscribe(function(err) {
        callEach(callbacks, err);
      });
      return;
    }
    this.subscribe();
    return;
  }

  if (callbacks.length) {
    this.fetch(function(err) {
      callEach(callbacks, err);
    });
  }
};

// Request the current document snapshot or ops that bring us up to date
Doc.prototype.fetch = function(callback) {
  if (this.connection.canSend) {
    var isDuplicate = this.connection.sendFetch(this);
    pushActionCallback(this.inflightFetch, isDuplicate, callback);
    return;
  }
  this.pendingFetch.push(callback);
};

// Fetch the initial document and keep receiving updates
Doc.prototype.subscribe = function(callback) {
  this.wantSubscribe = true;
  if (this.connection.canSend) {
    var isDuplicate = this.connection.sendSubscribe(this);
    pushActionCallback(this.inflightSubscribe, isDuplicate, callback);
    return;
  }
  this.pendingFetch.push(callback);
};

// Unsubscribe. The data will stay around in local memory, but we'll stop
// receiving updates
Doc.prototype.unsubscribe = function(callback) {
  this.wantSubscribe = false;
  // The subscribed state should be conservative in indicating when we are
  // subscribed on the server. We'll actually be unsubscribed some time
  // between sending the message and hearing back, but we cannot know exactly
  // when. Thus, immediately mark us as not subscribed
  this.subscribed = false;
  if (this.connection.canSend) {
    var isDuplicate = this.connection.sendUnsubscribe(this);
    pushActionCallback(this.inflightUnsubscribe, isDuplicate, callback);
    return;
  }
  if (callback) process.nextTick(callback);
};

function pushActionCallback(inflight, isDuplicate, callback) {
  if (isDuplicate) {
    var lastCallback = inflight.pop();
    inflight.push(function(err) {
      lastCallback && lastCallback(err);
      callback && callback(err);
    });
  } else {
    inflight.push(callback);
  }
}


// Operations //

// Send the next pending op to the server, if we can.
//
// Only one operation can be in-flight at a time. If an operation is already on
// its way, or we're not currently connected, this method does nothing.
Doc.prototype.flush = function() {
  // Ignore if we can't send or we are already sending an op
  if (!this.connection.canSend || this.inflightOp) return;

  // Send first pending op unless paused
  if (!this.paused && this.pendingOps.length) {
    this._sendOp();
  }
};

// Helper function to set op to contain a no-op.
function setNoOp(op) {
  delete op.op;
  delete op.create;
  delete op.del;
}

// Transform server op data by a client op, and vice versa. Ops are edited in place.
function transformX(client, server) {
  // Order of statements in this function matters. Be especially careful if
  // refactoring this function

  // A client delete op should dominate if both the server and the client
  // delete the document. Thus, any ops following the client delete (such as a
  // subsequent create) will be maintained, since the server op is transformed
  // to a no-op
  if (client.del) return setNoOp(server);

  if (server.del) {
    return new ShareDBError(4017, 'Document was deleted');
  }
  if (server.create) {
    return new ShareDBError(4018, 'Document alredy created');
  }

  // Ignore no-op coming from server
  if (!server.op) return;

  // I believe that this should not occur, but check just in case
  if (client.create) {
    return new ShareDBError(4018, 'Document already created');
  }

  // They both edited the document. This is the normal case for this function -
  // as in, most of the time we'll end up down here.
  //
  // You should be wondering why I'm using client.type instead of this.type.
  // The reason is, if we get ops at an old version of the document, this.type
  // might be undefined or a totally different type. By pinning the type to the
  // op data, we make sure the right type has its transform function called.
  if (client.type.transformX) {
    var result = client.type.transformX(client.op, server.op);
    client.op = result[0];
    server.op = result[1];
  } else {
    var clientOp = client.type.transform(client.op, server.op, 'left');
    var serverOp = client.type.transform(server.op, client.op, 'right');
    client.op = clientOp;
    server.op = serverOp;
  }
};

/**
 * Applies the operation to the snapshot
 *
 * If the operation is create or delete it emits `create` or `del`. Then the
 * operation is applied to the snapshot and `op` and `after op` are emitted.
 * If the type supports incremental updates and `this.incremental` is true we
 * fire `op` after every small operation.
 *
 * This is the only function to fire the above mentioned events.
 *
 * @private
 */
Doc.prototype._otApply = function(op, source) {
  if (op.op) {
    if (!this.type) {
      var err = new ShareDBError(4015, 'Cannot apply op to uncreated document. ' + this.collection + '.' + this.id);
      return this.emit('error', err);
    }

    // Iteratively apply multi-component remote operations and rollback ops
    // (source === false) for the default JSON0 OT type. It could use
    // type.shatter(), but since this code is so specific to use cases for the
    // JSON0 type and ShareDB explicitly bundles the default type, we might as
    // well write it this way and save needing to iterate through the op
    // components twice.
    //
    // Ideally, we would not need this extra complexity. However, it is
    // helpful for implementing bindings that update DOM nodes and other
    // stateful objects by translating op events directly into corresponding
    // mutations. Such bindings are most easily written as responding to
    // individual op components one at a time in order, and it is important
    // that the snapshot only include updates from the particular op component
    // at the time of emission. Eliminating this would require rethinking how
    // such external bindings are implemented.
    if (!source && this.type === types.defaultType && op.op.length > 1) {
      if (!this.applyStack) this.applyStack = [];
      var stackLength = this.applyStack.length;
      for (var i = 0; i < op.op.length; i++) {
        var component = op.op[i];
        var componentOp = {op: [component]};
        // Transform componentOp against any ops that have been submitted
        // sychronously inside of an op event handler since we began apply of
        // our operation
        for (var j = stackLength; j < this.applyStack.length; j++) {
          var transformErr = transformX(this.applyStack[j], componentOp);
          if (transformErr) return this._hardRollback(transformErr);
        }
        // Apply the individual op component
        this.emit('before op', componentOp.op, source);
        this.data = this.type.apply(this.data, componentOp.op);
        this.emit('op', componentOp.op, source);
      }
      // Pop whatever was submitted since we started applying this op
      this._popApplyStack(stackLength);
      return;
    }

    // The 'before op' event enables clients to pull any necessary data out of
    // the snapshot before it gets changed
    this.emit('before op', op.op, source);
    // Apply the operation to the local data, mutating it in place
    this.data = this.type.apply(this.data, op.op);
    // Emit an 'op' event once the local data includes the changes from the
    // op. For locally submitted ops, this will be synchronously with
    // submission and before the server or other clients have received the op.
    // For ops from other clients, this will be after the op has been
    // committed to the database and published
    this.emit('op', op.op, source);
    return;
  }

  if (op.create) {
    this._setType(op.create.type);
    this.data = (this.type.deserialize) ?
      (this.type.createDeserialized) ?
        this.type.createDeserialized(op.create.data) :
        this.type.deserialize(this.type.create(op.create.data)) :
      this.type.create(op.create.data);
    this.emit('create', source);
    return;
  }

  if (op.del) {
    var oldData = this.data;
    this._setType(null);
    this.emit('del', oldData, source);
    return;
  }
};


// ***** Sending operations

// Actually send op to the server.
Doc.prototype._sendOp = function() {
  // Wait until we have a src id from the server
  var src = this.connection.id;
  if (!src) return;

  // When there is no inflightOp, send the first item in pendingOps. If
  // there is inflightOp, try sending it again
  if (!this.inflightOp) {
    // Send first pending op
    this.inflightOp = this.pendingOps.shift();
  }
  var op = this.inflightOp;
  if (!op) {
    var err = new ShareDBError(5010, 'No op to send on call to _sendOp');
    return this.emit('error', err);
  }

  // Track data for retrying ops
  op.sentAt = Date.now();
  op.retries = (op.retries == null) ? 0 : op.retries + 1;

  // The src + seq number is a unique ID representing this operation. This tuple
  // is used on the server to detect when ops have been sent multiple times and
  // on the client to match acknowledgement of an op back to the inflightOp.
  // Note that the src could be different from this.connection.id after a
  // reconnect, since an op may still be pending after the reconnection and
  // this.connection.id will change. In case an op is sent multiple times, we
  // also need to be careful not to override the original seq value.
  if (op.seq == null) op.seq = this.connection.seq++;

  this.connection.sendOp(this, op);

  // src isn't needed on the first try, since the server session will have the
  // same id, but it must be set on the inflightOp in case it is sent again
  // after a reconnect and the connection's id has changed by then
  if (op.src == null) op.src = src;
};


// Queues the operation for submission to the server and applies it locally.
//
// Internal method called to do the actual work for submit(), create() and del().
// @private
//
// @param op
// @param [op.op]
// @param [op.del]
// @param [op.create]
// @param [callback] called when operation is submitted
Doc.prototype._submit = function(op, source, callback) {
  // Locally submitted ops must always have a truthy source
  if (!source) source = true;

  // The op contains either op, create, delete, or none of the above (a no-op).
  if (op.op) {
    if (!this.type) {
      var err = new ShareDBError(4015, 'Cannot submit op. Document has not been created. ' + this.collection + '.' + this.id);
      if (callback) return callback(err);
      return this.emit('error', err);
    }
    // Try to normalize the op. This removes trailing skip:0's and things like that.
    if (this.type.normalize) op.op = this.type.normalize(op.op);
  }

  this._pushOp(op, callback);
  this._otApply(op, source);

  // The call to flush is delayed so if submit() is called multiple times
  // synchronously, all the ops are combined before being sent to the server.
  var doc = this;
  process.nextTick(function() {
    doc.flush();
  });
};

Doc.prototype._pushOp = function(op, callback) {
  if (this.applyStack) {
    // If we are in the process of incrementally applying an operation, don't
    // compose the op and push it onto the applyStack so it can be transformed
    // against other components from the op or ops being applied
    this.applyStack.push(op);
  } else {
    // If the type supports composes, try to compose the operation onto the
    // end of the last pending operation.
    var composed = this._tryCompose(op);
    if (composed) {
      composed.callbacks.push(callback);
      return;
    }
  }
  // Push on to the pendingOps queue of ops to submit if we didn't compose
  op.type = this.type;
  op.callbacks = [callback];
  this.pendingOps.push(op);
};

Doc.prototype._popApplyStack = function(to) {
  if (to > 0) {
    this.applyStack.length = to;
    return;
  }
  // Once we have completed the outermost apply loop, reset to null and no
  // longer add ops to the applyStack as they are submitted
  var op = this.applyStack[0];
  this.applyStack = null;
  if (!op) return;
  // Compose the ops added since the beginning of the apply stack, since we
  // had to skip compose when they were originally pushed
  var i = this.pendingOps.indexOf(op);
  if (i === -1) return;
  var ops = this.pendingOps.splice(i);
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    var composed = this._tryCompose(op);
    if (composed) {
      composed.callbacks = composed.callbacks.concat(op.callbacks);
    } else {
      this.pendingOps.push(op);
    }
  }
};

// Try to compose a submitted op into the last pending op. Returns the
// composed op if it succeeds, undefined otherwise
Doc.prototype._tryCompose = function(op) {
  if (this.preventCompose) return;

  // We can only compose into the last pending op. Inflight ops have already
  // been sent to the server, so we can't modify them
  var last = this.pendingOps[this.pendingOps.length - 1];
  if (!last) return;

  // Compose an op into a create by applying it. This effectively makes the op
  // invisible, as if the document were created including the op originally
  if (last.create && op.op) {
    last.create.data = this.type.apply(last.create.data, op.op);
    return last;
  }

  // Compose two ops into a single op if supported by the type. Types that
  // support compose must be able to compose any two ops together
  if (last.op && op.op && this.type.compose) {
    last.op = this.type.compose(last.op, op.op);
    return last;
  }
};

// *** Client OT entrypoints.

// Submit an operation to the document.
//
// @param operation handled by the OT type
// @param options  {source: ...}
// @param [callback] called after operation submitted
//
// @fires before op, op, after op
Doc.prototype.submitOp = function(component, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  var op = {op: component};
  var source = options && options.source;
  this._submit(op, source, callback);
};

// Create the document, which in ShareJS semantics means to set its type. Every
// object implicitly exists in the database but has no data and no type. Create
// sets the type of the object and can optionally set some initial data on the
// object, depending on the type.
//
// @param data  initial
// @param type  OT type
// @param options  {source: ...}
// @param callback  called when operation submitted
Doc.prototype.create = function(data, type, options, callback) {
  if (typeof type === 'function') {
    callback = type;
    options = null;
    type = null;
  } else if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (!type) {
    type = types.defaultType.uri;
  }
  if (this.type) {
    var err = new ShareDBError(4016, 'Document already exists');
    if (callback) return callback(err);
    return this.emit('error', err);
  }
  var op = {create: {type: type, data: data}};
  var source = options && options.source;
  this._submit(op, source, callback);
};

// Delete the document. This creates and submits a delete operation to the
// server. Deleting resets the object's type to null and deletes its data. The
// document still exists, and still has the version it used to have before you
// deleted it (well, old version +1).
//
// @param options  {source: ...}
// @param callback  called when operation submitted
Doc.prototype.del = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (!this.type) {
    var err = new ShareDBError(4015, 'Document does not exist');
    if (callback) return callback(err);
    return this.emit('error', err);
  }
  var op = {del: true};
  var source = options && options.source;
  this._submit(op, source, callback);
};


// Stops the document from sending any operations to the server.
Doc.prototype.pause = function() {
  this.paused = true;
};

// Continue sending operations to the server
Doc.prototype.resume = function() {
  this.paused = false;
  this.flush();
};


// *** Receiving operations

// This is called when the server acknowledges an operation from the client.
Doc.prototype._opAcknowledged = function(message) {
  if (this.inflightOp.create) {
    this.version = message.v;

  } else if (message.v !== this.version) {
    // We should already be at the same version, because the server should
    // have sent all the ops that have happened before acknowledging our op
    console.warn('Invalid version from server. Expected: ' + this.version + ' Received: ' + message.v, message);

    // Fetching should get us back to a working document state
    return this.fetch();
  }

  // The op was committed successfully. Increment the version number
  this.version++;

  this._clearInflightOp();
};

Doc.prototype._rollback = function(err) {
  // The server has rejected submission of the current operation. Invert by
  // just the inflight op if possible. If not possible to invert, cancel all
  // pending ops and fetch the latest from the server to get us back into a
  // working state, then call back
  var op = this.inflightOp;

  if (op.op && op.type.invert) {
    op.op = op.type.invert(op.op);

    // Transform the undo operation by any pending ops.
    for (var i = 0; i < this.pendingOps.length; i++) {
      var transformErr = transformX(this.pendingOps[i], op);
      if (transformErr) return this._hardRollback(transformErr);
    }

    // ... and apply it locally, reverting the changes.
    //
    // This operation is applied to look like it comes from a remote source.
    // I'm still not 100% sure about this functionality, because its really a
    // local op. Basically, the problem is that if the client's op is rejected
    // by the server, the editor window should update to reflect the undo.
    this._otApply(op, false);

    this._clearInflightOp(err);
    return;
  }

  this._hardRollback(err);
};

Doc.prototype._hardRollback = function(err) {
  // Cancel all pending ops and reset if we can't invert
  var op = this.inflightOp;
  var pending = this.pendingOps;
  this._setType(null);
  this.version = null;
  this.inflightOp = null;
  this.pendingOps = [];

  // Fetch the latest from the server to get us back into a working state
  var doc = this;
  this.fetch(function() {
    var called = op && callEach(op.callbacks, err);
    for (var i = 0; i < pending.length; i++) {
      callEach(pending[i].callbacks, err);
    }
    if (err && !called) return doc.emit('error', err);
  });
};

Doc.prototype._clearInflightOp = function(err) {
  var called = callEach(this.inflightOp.callbacks, err);

  this.inflightOp = null;
  this.flush();
  this._emitNothingPending();

  if (err && !called) return this.emit('error', err);
};

function callEach(callbacks, err) {
  var called = false;
  for (var i = 0; i < callbacks.length; i++) {
    var callback = callbacks[i];
    if (callback) {
      callback(err);
      called = true;
    }
  }
  return called;
}


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

// Only the JSON type is exported, because the text type is deprecated
// otherwise. (If you want to use it somewhere, you're welcome to pull it out
// into a separate module that json0 can depend on).

module.exports = {
  type: __webpack_require__(49)
};


/***/ }),
/* 15 */
/***/ (function(module, exports) {

// These methods let you build a transform function from a transformComponent
// function for OT types like JSON0 in which operations are lists of components
// and transforming them requires N^2 work. I find it kind of nasty that I need
// this, but I'm not really sure what a better solution is. Maybe I should do
// this automatically to types that don't have a compose function defined.

// Add transform and transformX functions for an OT type which has
// transformComponent defined.  transformComponent(destination array,
// component, other component, side)
module.exports = bootstrapTransform
function bootstrapTransform(type, transformComponent, checkValidOp, append) {
  var transformComponentX = function(left, right, destLeft, destRight) {
    transformComponent(destLeft, left, right, 'left');
    transformComponent(destRight, right, left, 'right');
  };

  var transformX = type.transformX = function(leftOp, rightOp) {
    checkValidOp(leftOp);
    checkValidOp(rightOp);
    var newRightOp = [];

    for (var i = 0; i < rightOp.length; i++) {
      var rightComponent = rightOp[i];

      // Generate newLeftOp by composing leftOp by rightComponent
      var newLeftOp = [];
      var k = 0;
      while (k < leftOp.length) {
        var nextC = [];
        transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);
        k++;

        if (nextC.length === 1) {
          rightComponent = nextC[0];
        } else if (nextC.length === 0) {
          for (var j = k; j < leftOp.length; j++) {
            append(newLeftOp, leftOp[j]);
          }
          rightComponent = null;
          break;
        } else {
          // Recurse.
          var pair = transformX(leftOp.slice(k), nextC);
          for (var l = 0; l < pair[0].length; l++) {
            append(newLeftOp, pair[0][l]);
          }
          for (var r = 0; r < pair[1].length; r++) {
            append(newRightOp, pair[1][r]);
          }
          rightComponent = null;
          break;
        }
      }

      if (rightComponent != null) {
        append(newRightOp, rightComponent);
      }
      leftOp = newLeftOp;
    }
    return [leftOp, newRightOp];
  };

  // Transforms op with specified type ('left' or 'right') by otherOp.
  type.transform = function(op, otherOp, type) {
    if (!(type === 'left' || type === 'right'))
      throw new Error("type must be 'left' or 'right'");

    if (otherOp.length === 0) return op;

    if (op.length === 1 && otherOp.length === 1)
      return transformComponent([], op[0], otherOp[0], type);

    if (type === 'left')
      return transformX(op, otherOp)[0];
    else
      return transformX(otherOp, op)[1];
  };
};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var emitter = __webpack_require__(4);

// Queries are live requests to the database for particular sets of fields.
//
// The server actively tells the client when there's new data that matches
// a set of conditions.
module.exports = Query;
function Query(action, connection, id, collection, query, options, callback) {
  emitter.EventEmitter.call(this);

  // 'qf' or 'qs'
  this.action = action;

  this.connection = connection;
  this.id = id;
  this.collection = collection;

  // The query itself. For mongo, this should look something like {"data.x":5}
  this.query = query;

  // A list of resulting documents. These are actual documents, complete with
  // data and all the rest. It is possible to pass in an initial results set,
  // so that a query can be serialized and then re-established
  this.results = null;
  if (options && options.results) {
    this.results = options.results;
    delete options.results;
  }
  this.extra = undefined;

  // Options to pass through with the query
  this.options = options;

  this.callback = callback;
  this.ready = false;
  this.sent = false;
}
emitter.mixin(Query);

Query.prototype.hasPending = function() {
  return !this.ready;
};

// Helper for subscribe & fetch, since they share the same message format.
//
// This function actually issues the query.
Query.prototype.send = function() {
  if (!this.connection.canSend) return;

  var message = {
    a: this.action,
    id: this.id,
    c: this.collection,
    q: this.query
  };
  if (this.options) {
    message.o = this.options;
  }
  if (this.results) {
    // Collect the version of all the documents in the current result set so we
    // don't need to be sent their snapshots again.
    var results = [];
    for (var i = 0; i < this.results.length; i++) {
      var doc = this.results[i];
      results.push([doc.id, doc.version]);
    }
    message.r = results;
  }

  this.connection.send(message);
  this.sent = true;
};

// Destroy the query object. Any subsequent messages for the query will be
// ignored by the connection.
Query.prototype.destroy = function(callback) {
  if (this.connection.canSend && this.action === 'qs') {
    this.connection.send({a: 'qu', id: this.id});
  }
  this.connection._destroyQuery(this);
  // There is a callback for consistency, but we don't actually wait for the
  // server's unsubscribe message currently
  if (callback) process.nextTick(callback);
};

Query.prototype._onConnectionStateChanged = function() {
  if (this.connection.canSend && !this.sent) {
    this.send();
  } else {
    this.sent = false;
  }
};

Query.prototype._handleFetch = function(err, data, extra) {
  // Once a fetch query gets its data, it is destroyed.
  this.connection._destroyQuery(this);
  this._handleResponse(err, data, extra);
};

Query.prototype._handleSubscribe = function(err, data, extra) {
  this._handleResponse(err, data, extra);
};

Query.prototype._handleResponse = function(err, data, extra) {
  var callback = this.callback;
  this.callback = null;
  if (err) return this._finishResponse(err, callback);
  if (!data) return this._finishResponse(null, callback);

  var query = this;
  var wait = 1;
  var finish = function(err) {
    if (err) return query._finishResponse(err, callback);
    if (--wait) return;
    query._finishResponse(null, callback);
  };

  if (Array.isArray(data)) {
    wait += data.length;
    this.results = this._ingestSnapshots(data, finish);
    this.extra = extra;

  } else {
    for (var id in data) {
      wait++;
      var snapshot = data[id];
      var doc = this.connection.get(snapshot.c || this.collection, id);
      doc.ingestSnapshot(snapshot, finish);
    }
  }

  finish();
};

Query.prototype._ingestSnapshots = function(snapshots, finish) {
  var results = [];
  for (var i = 0; i < snapshots.length; i++) {
    var snapshot = snapshots[i];
    var doc = this.connection.get(snapshot.c || this.collection, snapshot.d);
    doc.ingestSnapshot(snapshot, finish);
    results.push(doc);
  }
  return results;
};

Query.prototype._finishResponse = function(err, callback) {
  this.emit('ready');
  this.ready = true;
  if (err) {
    this.connection._destroyQuery(this);
    if (callback) return callback(err);
    return this.emit('error', err);
  }
  if (callback) callback(null, this.results, this.extra);
};

Query.prototype._handleError = function(err) {
  this.emit('error', err);
};

Query.prototype._handleDiff = function(diff) {
  // We need to go through the list twice. First, we'll ingest all the new
  // documents. After that we'll emit events and actually update our list.
  // This avoids race conditions around setting documents to be subscribed &
  // unsubscribing documents in event callbacks.
  for (var i = 0; i < diff.length; i++) {
    var d = diff[i];
    if (d.type === 'insert') d.values = this._ingestSnapshots(d.values);
  }

  for (var i = 0; i < diff.length; i++) {
    var d = diff[i];
    switch (d.type) {
      case 'insert':
        var newDocs = d.values;
        Array.prototype.splice.apply(this.results, [d.index, 0].concat(newDocs));
        this.emit('insert', newDocs, d.index);
        break;
      case 'remove':
        var howMany = d.howMany || 1;
        var removed = this.results.splice(d.index, howMany);
        this.emit('remove', removed, d.index);
        break;
      case 'move':
        var howMany = d.howMany || 1;
        var docs = this.results.splice(d.from, howMany);
        Array.prototype.splice.apply(this.results, [d.to, 0].concat(docs));
        this.emit('move', docs, d.from, d.to);
        break;
    }
  }

  this.emit('changed', this.results);
};

Query.prototype._handleExtra = function(extra) {
  this.extra = extra;
  this.emit('extra', extra);
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (true) {
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
            return async;
        }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var hat = __webpack_require__(53);
var util = __webpack_require__(3);
var types = __webpack_require__(2);

/**
 * Agent deserializes the wire protocol messages received from the stream and
 * calls the corresponding functions on its Agent. It uses the return values
 * to send responses back. Agent also handles piping the operation streams
 * provided by a Agent.
 *
 * @param {Backend} backend
 * @param {Duplex} stream connection to a client
 */
function Agent(backend, stream) {
  this.backend = backend;
  this.stream = stream;

  this.clientId = hat();
  this.connectTime = Date.now();

  // We need to track which documents are subscribed by the client. This is a
  // map of collection -> id -> stream
  this.subscribedDocs = {};

  // Map from queryId -> emitter
  this.subscribedQueries = {};

  // We need to track this manually to make sure we don't reply to messages
  // after the stream was closed.
  this.closed = false;

  // For custom use in middleware. The agent is a convenient place to cache
  // session state in memory. It is in memory only as long as the session is
  // active, and it is passed to each middleware call
  this.custom = {};

  // Initialize the remote client by sending it its agent Id.
  this.send({
    a: 'init',
    protocol: 1,
    id: this.clientId,
    type: types.defaultType.uri
  });
}
module.exports = Agent;

// Close the agent with the client.
Agent.prototype.close = function(err) {
  if (err) {
    console.warn('Agent closed due to error', this.clientId, err.stack || err);
  }
  if (this.closed) return;
  // This will end the writable stream and emit 'finish'
  this.stream.end();
};

Agent.prototype._cleanup = function() {
  this.closed = true;

  // Clean up doc subscription streams
  for (var collection in this.subscribedDocs) {
    var docs = this.subscribedDocs[collection];
    for (var id in docs) {
      var stream = docs[id];
      stream.destroy();
    }
  }
  this.subscribedDocs = {};

  // Clean up query subscription streams
  for (var id in this.subscribedQueries) {
    var emitter = this.subscribedQueries[id];
    emitter.destroy();
  }
  this.subscribedQueries = {};
};

/**
 * Passes operation data received on stream to the agent stream via
 * _sendOp()
 */
Agent.prototype._subscribeToStream = function(collection, id, stream) {
  if (this.closed) return stream.destroy();

  var streams = this.subscribedDocs[collection] || (this.subscribedDocs[collection] = {});

  // If already subscribed to this document, destroy the previously subscribed stream
  var previous = streams[id];
  if (previous) previous.destroy();
  streams[id] = stream;

  var agent = this;
  stream.on('data', function(data) {
    if (data.error) {
      // Log then silently ignore errors in a subscription stream, since these
      // may not be the client's fault, and they were not the result of a
      // direct request by the client
      console.error('Doc subscription stream error', collection, id, data.error);
      return;
    }
    if (agent._isOwnOp(collection, data)) return;
    agent._sendOp(collection, id, data);
  });
  stream.on('end', function() {
    // The op stream is done sending, so release its reference
    var streams = agent.subscribedDocs[collection];
    if (!streams) return;
    delete streams[id];
    if (util.hasKeys(streams)) return;
    delete agent.subscribedDocs[collection];
  });
};

Agent.prototype._subscribeToQuery = function(emitter, queryId, collection, query) {
  var previous = this.subscribedQueries[queryId];
  if (previous) previous.destroy();
  this.subscribedQueries[queryId] = emitter;

  var agent = this;
  emitter.onExtra = function(extra) {
    agent.send({a: 'q', id: queryId, extra: extra});
  };

  emitter.onDiff = function(diff) {
    for (var i = 0; i < diff.length; i++) {
      var item = diff[i];
      if (item.type === 'insert') {
        item.values = getResultsData(item.values);
      }
    }
    // Consider stripping the collection out of the data we send here
    // if it matches the query's collection.
    agent.send({a: 'q', id: queryId, diff: diff});
  };

  emitter.onError = function(err) {
    // Log then silently ignore errors in a subscription stream, since these
    // may not be the client's fault, and they were not the result of a
    // direct request by the client
    console.error('Query subscription stream error', collection, query, err);
  };

  emitter.onOp = function(op) {
    var id = op.d;
    if (agent._isOwnOp(collection, op)) return;
    agent._sendOp(collection, id, op);
  };

  emitter._open();
};

Agent.prototype._isOwnOp = function(collection, op) {
  // Detect ops from this client on the same projection. Since the client sent
  // these in, the submit reply will be sufficient and we can silently ignore
  // them in the streams for subscribed documents or queries
  return (this.clientId === op.src) && (collection === (op.i || op.c));
};

Agent.prototype.send = function(message) {
  // Quietly drop replies if the stream was closed
  if (this.closed) return;

  this.backend.emit('send', this, message);
  this.stream.write(message);
};

Agent.prototype._sendOp = function(collection, id, op) {
  var message = {
    a: 'op',
    c: collection,
    d: id,
    v: op.v,
    src: op.src,
    seq: op.seq
  };
  if (op.op) message.op = op.op;
  if (op.create) message.create = op.create;
  if (op.del) message.del = true;

  this.send(message);
};

Agent.prototype._sendOps = function(collection, id, ops) {
  for (var i = 0; i < ops.length; i++) {
    this._sendOp(collection, id, ops[i]);
  }
};

Agent.prototype._reply = function(request, err, message) {
  if (err) {
    if (typeof err === 'string') {
      request.error = {
        code: 4001,
        message: err
      };
    } else {
      if (err.stack) {
        console.warn(err.stack);
      }
      request.error = {
        code: err.code,
        message: err.message
      };
    }
    this.send(request);
    return;
  }
  if (!message) message = {};

  message.a = request.a;
  if (request.id) {
    message.id = request.id;
  } else {
    if (request.c) message.c = request.c;
    if (request.d) message.d = request.d;
    if (request.b && !message.data) message.b = request.b;
  }

  this.send(message);
};

// Start processing events from the stream
Agent.prototype._open = function() {
  if (this.closed) return;
  this.backend.agentsCount++;
  if (!this.stream.isServer) this.backend.remoteAgentsCount++;

  var agent = this;
  this.stream.on('data', function(chunk) {
    if (agent.closed) return;

    if (typeof chunk !== 'object') {
      var err = {code: 4000, message: 'Received non-object message'};
      return agent.close(err);
    }

    var request = {data: chunk};
    agent.backend.trigger('receive', agent, request, function(err) {
      var callback = function(err, message) {
        agent._reply(request.data, err, message);
      };
      if (err) return callback(err);
      agent._handleMessage(request.data, callback);
    });
  });

  this.stream.on('end', function() {
    agent.backend.agentsCount--;
    if (!agent.stream.isServer) agent.backend.remoteAgentsCount--;
    agent._cleanup();
  });
};

// Check a request to see if its valid. Returns an error if there's a problem.
Agent.prototype._checkRequest = function(request) {
  if (request.a === 'qf' || request.a === 'qs' || request.a === 'qu') {
    // Query messages need an ID property.
    if (typeof request.id !== 'number') return 'Missing query ID';
  } else if (request.a === 'op' || request.a === 'f' || request.a === 's' || request.a === 'u') {
    // Doc-based request.
    if (request.c != null && typeof request.c !== 'string') return 'Invalid collection';
    if (request.d != null && typeof request.d !== 'string') return 'Invalid id';

    if (request.a === 'op') {
      if (request.v != null && (typeof request.v !== 'number' || request.v < 0)) return 'Invalid version';
    }
  } else if (request.a === 'bf' || request.a === 'bs' || request.a === 'bu') {
    // Bulk request
    if (request.c != null && typeof request.c !== 'string') return 'Invalid collection';
    if (typeof request.b !== 'object') return 'Invalid bulk subscribe data';
  }
};

// Handle an incoming message from the client
Agent.prototype._handleMessage = function(request, callback) {
  try {
    var errMessage = this._checkRequest(request);
    if (errMessage) return callback({code: 4000, message: errMessage});

    switch (request.a) {
      case 'qf':
        return this._queryFetch(request.id, request.c, request.q, getQueryOptions(request), callback);
      case 'qs':
        return this._querySubscribe(request.id, request.c, request.q, getQueryOptions(request), callback);
      case 'qu':
        return this._queryUnsubscribe(request.id, callback);
      case 'bf':
        return this._fetchBulk(request.c, request.b, callback);
      case 'bs':
        return this._subscribeBulk(request.c, request.b, callback);
      case 'bu':
        return this._unsubscribeBulk(request.c, request.b, callback);
      case 'f':
        return this._fetch(request.c, request.d, request.v, callback);
      case 's':
        return this._subscribe(request.c, request.d, request.v, callback);
      case 'u':
        return this._unsubscribe(request.c, request.d, callback);
      case 'op':
        var op = this._createOp(request);
        if (!op) return callback({code: 4000, message: 'Invalid op message'});
        return this._submit(request.c, request.d, op, callback);
      default:
        callback({code: 4000, message: 'Invalid or unknown message'});
    }
  } catch (err) {
    callback(err);
  }
};
function getQueryOptions(request) {
  var results = request.r;
  var ids, fetch, fetchOps;
  if (results) {
    ids = [];
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      var id = result[0];
      var version = result[1];
      ids.push(id);
      if (version == null) {
        if (fetch) {
          fetch.push(id);
        } else {
          fetch = [id];
        }
      } else {
        if (!fetchOps) fetchOps = {};
        fetchOps[id] = version;
      }
    }
  }
  var options = request.o || {};
  options.ids = ids;
  options.fetch = fetch;
  options.fetchOps = fetchOps;
  return options;
}

Agent.prototype._queryFetch = function(queryId, collection, query, options, callback) {
  // Fetch the results of a query once
  var agent = this;
  this.backend.queryFetch(this, collection, query, options, function(err, results, extra) {
    if (err) return callback(err);
    var message = {
      data: getResultsData(results),
      extra: extra
    };
    callback(null, message);
  });
};

Agent.prototype._querySubscribe = function(queryId, collection, query, options, callback) {
  // Subscribe to a query. The client is sent the query results and its
  // notified whenever there's a change
  var agent = this;
  var wait = 1;
  var message;
  function finish(err) {
    if (err) return callback(err);
    if (--wait) return;
    callback(null, message);
  }
  if (options.fetch) {
    wait++;
    this.backend.fetchBulk(this, collection, options.fetch, function(err, snapshotMap) {
      if (err) return finish(err);
      message = {data: getMapData(snapshotMap)};
      finish();
    });
  }
  if (options.fetchOps) {
    wait++;
    this._fetchBulkOps(collection, options.fetchOps, finish);
  }
  this.backend.querySubscribe(this, collection, query, options, function(err, emitter, results, extra) {
    if (err) return finish(err);
    if (this.closed) return emitter.destroy();

    agent._subscribeToQuery(emitter, queryId, collection, query);
    // No results are returned when ids are passed in as an option. Instead,
    // want to re-poll the entire query once we've established listeners to
    // emit any diff in results
    if (!results) {
      emitter.queryPoll(finish);
      return;
    }
    message = {
      data: getResultsData(results),
      extra: extra
    };
    finish();
  });
};

function getResultsData(results) {
  var items = [];
  for (var i = 0; i < results.length; i++) {
    var result = results[i];
    var item = getSnapshotData(result);
    item.d = result.id;
    items.push(item);
  }
  return items;
}

function getMapData(snapshotMap) {
  var data = {};
  for (var id in snapshotMap) {
    data[id] = getSnapshotData(snapshotMap[id]);
  }
  return data;
}

function getSnapshotData(snapshot) {
  var data = {
    v: snapshot.v,
    data: snapshot.data
  };
  if (types.defaultType !== types.map[snapshot.type]) {
    data.type = snapshot.type;
  }
  return data;
}

Agent.prototype._queryUnsubscribe = function(queryId, callback) {
  var emitter = this.subscribedQueries[queryId];
  if (emitter) {
    emitter.destroy();
    delete this.subscribedQueries[queryId];
  }
  process.nextTick(callback);
};

Agent.prototype._fetch = function(collection, id, version, callback) {
  if (version == null) {
    // Fetch a snapshot
    this.backend.fetch(this, collection, id, function(err, snapshot) {
      if (err) return callback(err);
      callback(null, {data: getSnapshotData(snapshot)});
    });
  } else {
    // It says fetch on the tin, but if a version is specified the client
    // actually wants me to fetch some ops
    this._fetchOps(collection, id, version, callback);
  }
};

Agent.prototype._fetchOps = function(collection, id, version, callback) {
  var agent = this;
  this.backend.getOps(this, collection, id, version, null, function(err, ops) {
    if (err) return callback(err);
    agent._sendOps(collection, id, ops);
    callback();
  });
};

Agent.prototype._fetchBulk = function(collection, versions, callback) {
  if (Array.isArray(versions)) {
    this.backend.fetchBulk(this, collection, versions, function(err, snapshotMap) {
      if (err) return callback(err);
      callback(null, {data: getMapData(snapshotMap)});
    });
  } else {
    this._fetchBulkOps(collection, versions, callback);
  }
};

Agent.prototype._fetchBulkOps = function(collection, versions, callback) {
  var agent = this;
  this.backend.getOpsBulk(this, collection, versions, null, function(err, opsMap) {
    if (err) return callback(err);
    for (var id in opsMap) {
      var ops = opsMap[id];
      agent._sendOps(collection, id, ops);
    }
    callback();
  });
};

Agent.prototype._subscribe = function(collection, id, version, callback) {
  // If the version is specified, catch the client up by sending all ops
  // since the specified version
  var agent = this;
  this.backend.subscribe(this, collection, id, version, function(err, stream, snapshot) {
    if (err) return callback(err);
    agent._subscribeToStream(collection, id, stream);
    // Snapshot is returned only when subscribing from a null version.
    // Otherwise, ops will have been pushed into the stream
    if (snapshot) {
      callback(null, {data: getSnapshotData(snapshot)});
    } else {
      callback();
    }
  });
};

Agent.prototype._subscribeBulk = function(collection, versions, callback) {
  var agent = this;
  this.backend.subscribeBulk(this, collection, versions, function(err, streams, snapshotMap) {
    if (err) return callback(err);
    for (var id in streams) {
      agent._subscribeToStream(collection, id, streams[id]);
    }
    if (snapshotMap) {
      callback(null, {data: getMapData(snapshotMap)});
    } else {
      callback();
    }
  });
};

Agent.prototype._unsubscribe = function(collection, id, callback) {
  // Unsubscribe from the specified document. This cancels the active
  // stream or an inflight subscribing state
  var docs = this.subscribedDocs[collection];
  var stream = docs && docs[id];
  if (stream) stream.destroy();
  process.nextTick(callback);
};

Agent.prototype._unsubscribeBulk = function(collection, ids, callback) {
  var docs = this.subscribedDocs[collection];
  if (!docs) return process.nextTick(callback);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var stream = docs[id];
    if (stream) stream.destroy();
  }
  process.nextTick(callback);
};

Agent.prototype._submit = function(collection, id, op, callback) {
  var agent = this;
  this.backend.submit(this, collection, id, op, null, function(err, ops) {
    // Message to acknowledge the op was successfully submitted
    var ack = {src: op.src, seq: op.seq, v: op.v};
    if (err) {
      // Occassional 'Op already submitted' errors are expected to happen as
      // part of normal operation, since inflight ops need to be resent after
      // disconnect. In this case, ack the op so the client can proceed
      if (err.code === 4001) return callback(null, ack);
      return callback(err);
    }

    // Reply with any operations that the client is missing.
    agent._sendOps(collection, id, ops);
    callback(null, ack);
  });
};

function CreateOp(src, seq, v, create) {
  this.src = src;
  this.seq = seq;
  this.v = v;
  this.create = create;
  this.m = null;
}
function EditOp(src, seq, v, op) {
  this.src = src;
  this.seq = seq;
  this.v = v;
  this.op = op;
  this.m = null;
}
function DeleteOp(src, seq, v, del) {
  this.src = src;
  this.seq = seq;
  this.v = v;
  this.del = del;
  this.m = null;
}
// Normalize the properties submitted
Agent.prototype._createOp = function(request) {
  // src can be provided if it is not the same as the current agent,
  // such as a resubmission after a reconnect, but it usually isn't needed
  var src = request.src || this.clientId;
  if (request.op) {
    return new EditOp(src, request.seq, request.v, request.op);
  } else if (request.create) {
    return new CreateOp(src, request.seq, request.v, request.create);
  } else if (request.del) {
    return new DeleteOp(src, request.seq, request.v, request.del);
  }
};


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

var DB = __webpack_require__(20);

// In-memory ShareDB database
//
// This adapter is not appropriate for production use. It is intended for
// testing and as an API example for people implementing database adaptors. It
// is fully functional, except it stores all documents & operations forever in
// memory. As such, memory usage will grow without bound, it doesn't scale
// across multiple node processes and you'll lose all your data if the server
// restarts. Query APIs are adapter specific. Use with care.

function MemoryDB(options) {
  if (!(this instanceof MemoryDB)) return new MemoryDB(options);
  DB.call(this, options);

  // Map from collection name -> doc id -> doc snapshot ({v:, type:, data:})
  this.docs = {};

  // Map from collection name -> doc id -> list of operations. Operations
  // don't store their version - instead their version is simply the index in
  // the list.
  this.ops = {};

  this.closed = false;
};
module.exports = MemoryDB;

MemoryDB.prototype = Object.create(DB.prototype);

MemoryDB.prototype.close = function(callback) {
  this.closed = true;
  if (callback) callback();
};

// Persists an op and snapshot if it is for the next version. Calls back with
// callback(err, succeeded)
MemoryDB.prototype.commit = function(collection, id, op, snapshot, options, callback) {
  var db = this;
  if (typeof callback !== 'function') throw new Error('Callback required');
  process.nextTick(function() {
    var version = db._getVersionSync(collection, id);
    if (snapshot.v !== version + 1) {
      var succeeded = false;
      return callback(null, succeeded);
    }
    var err = db._writeOpSync(collection, id, op);
    if (err) return callback(err);
    err = db._writeSnapshotSync(collection, id, snapshot);
    if (err) return callback(err);
    var succeeded = true;
    callback(null, succeeded);
  });
};

// Get the named document from the database. The callback is called with (err,
// snapshot). A snapshot with a version of zero is returned if the docuemnt
// has never been created in the database.
MemoryDB.prototype.getSnapshot = function(collection, id, fields, options, callback) {
  var includeMetadata = (fields && fields.$submit) || (options && options.metadata);
  var db = this;
  if (typeof callback !== 'function') throw new Error('Callback required');
  process.nextTick(function() {
    var snapshot = db._getSnapshotSync(collection, id, includeMetadata);
    callback(null, snapshot);
  });
};

// Get operations between [from, to) noninclusively. (Ie, the range should
// contain start but not end).
//
// If end is null, this function should return all operations from start onwards.
//
// The operations that getOps returns don't need to have a version: field.
// The version will be inferred from the parameters if it is missing.
//
// Callback should be called as callback(error, [list of ops]);
MemoryDB.prototype.getOps = function(collection, id, from, to, options, callback) {
  var includeMetadata = options && options.metadata;
  var db = this;
  if (typeof callback !== 'function') throw new Error('Callback required');
  process.nextTick(function() {
    var opLog = db._getOpLogSync(collection, id);
    if (to == null) {
      to = opLog.length;
    }
    var ops = clone(opLog.slice(from, to));
    if (!includeMetadata) {
      for (var i = 0; i < ops.length; i++) {
        delete ops[i].m;
      }
    }
    callback(null, ops);
  });
};

// The memory database query function returns all documents in a collection
// regardless of query by default
MemoryDB.prototype.query = function(collection, query, fields, options, callback) {
  var includeMetadata = options && options.metadata;
  var db = this;
  if (typeof callback !== 'function') throw new Error('Callback required');
  process.nextTick(function() {
    var collectionDocs = db.docs[collection];
    var snapshots = [];
    for (var id in collectionDocs || {}) {
      var snapshot = db._getSnapshotSync(collection, id, includeMetadata);
      snapshots.push(snapshot);
    }
    try {
      var result = db._querySync(snapshots, query, options);
      callback(null, result.snapshots, result.extra);
    } catch (err) {
      callback(err);
    }
  });
};

// For testing, it may be useful to implement the desired query
// language by defining this function. Returns an object with
// two properties:
// - snapshots: array of query result snapshots
// - extra: (optional) other types of results, such as counts
MemoryDB.prototype._querySync = function(snapshots, query, options) {
  return {snapshots: snapshots};
};

MemoryDB.prototype._writeOpSync = function(collection, id, op) {
  var opLog = this._getOpLogSync(collection, id);
  // This will write an op in the log at its version, which should always be
  // the next item in the array under normal operation
  opLog[op.v] = clone(op);
};

// Create, update, and delete snapshots. For creates and updates, a snapshot
// object will be passed in with a type property. If there is no type property,
// it should be considered a delete
MemoryDB.prototype._writeSnapshotSync = function(collection, id, snapshot) {
  var collectionDocs = this.docs[collection] || (this.docs[collection] = {});
  if (!snapshot.type) {
    delete collectionDocs[id];
  } else {
    collectionDocs[id] = clone(snapshot);
  }
};

MemoryDB.prototype._getSnapshotSync = function(collection, id, includeMetadata) {
  var collectionDocs = this.docs[collection];
  // We need to clone the snapshot, because ShareDB assumes each call to
  // getSnapshot returns a new object
  var doc = collectionDocs && collectionDocs[id];
  var snapshot;
  if (doc) {
    var data = clone(doc.data);
    var meta = (includeMetadata) ? clone(doc.m) : undefined;
    snapshot = new MemorySnapshot(id, doc.v, doc.type, data, meta);
  } else {
    var version = this._getVersionSync(collection, id);
    snapshot = new MemorySnapshot(id, version, null, undefined);
  }
  return snapshot;
};

// `id`, and `v` should be on every returned snapshot
function MemorySnapshot(id, version, type, data, meta) {
  this.id = id;
  this.v = version;
  this.type = type;
  this.data = data;
  if (meta) this.m = meta;
}

MemoryDB.prototype._getOpLogSync = function(collection, id) {
  var collectionOps = this.ops[collection] || (this.ops[collection] = {});
  return collectionOps[id] || (collectionOps[id] = []);
};

MemoryDB.prototype._getVersionSync = function(collection, id) {
  var collectionOps = this.ops[collection];
  return (collectionOps && collectionOps[id] && collectionOps[id].length) || 0;
};

function clone(obj) {
  return (obj === undefined) ? undefined : JSON.parse(JSON.stringify(obj));
}


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

var async = __webpack_require__(17);
var ShareDBError = __webpack_require__(1);

function DB(options) {
  // pollDebounce is the minimum time in ms between query polls
  this.pollDebounce = options && options.pollDebounce;
}
module.exports = DB;

DB.prototype.projectsSnapshots = false;
DB.prototype.disableSubscribe = false;

DB.prototype.close = function(callback) {
  if (callback) callback();
};

DB.prototype.commit = function(collection, id, op, snapshot, options, callback) {
  callback(new ShareDBError(5011, 'commit DB method unimplemented'));
};

DB.prototype.getSnapshot = function(collection, id, fields, options, callback) {
  callback(new ShareDBError(5012, 'getSnapshot DB method unimplemented'));
};

DB.prototype.getSnapshotBulk = function(collection, ids, fields, options, callback) {
  var results = {};
  var db = this;
  async.each(ids, function(id, eachCb) {
    db.getSnapshot(collection, id, fields, options, function(err, snapshot) {
      if (err) return eachCb(err);
      results[id] = snapshot;
      eachCb();
    });
  }, function(err) {
    if (err) return callback(err);
    callback(null, results);
  });
};

DB.prototype.getOps = function(collection, id, from, to, options, callback) {
  callback(new ShareDBError(5013, 'getOps DB method unimplemented'));
};

DB.prototype.getOpsToSnapshot = function(collection, id, from, snapshot, options, callback) {
  var to = snapshot.v;
  this.getOps(collection, id, from, to, options, callback);
};

DB.prototype.getOpsBulk = function(collection, fromMap, toMap, options, callback) {
  var results = {};
  var db = this;
  async.forEachOf(fromMap, function(from, id, eachCb) {
    var to = toMap && toMap[id];
    db.getOps(collection, id, from, to, options, function(err, ops) {
      if (err) return eachCb(err);
      results[id] = ops;
      eachCb();
    });
  }, function(err) {
    if (err) return callback(err);
    callback(null, results);
  });
};

DB.prototype.getCommittedOpVersion = function(collection, id, snapshot, op, options, callback) {
  this.getOpsToSnapshot(collection, id, 0, snapshot, options, function(err, ops) {
    if (err) return callback(err);
    for (var i = ops.length; i--;) {
      var item = ops[i];
      if (op.src === item.src && op.seq === item.seq) {
        return callback(null, item.v);
      }
    }
    callback();
  });
};

DB.prototype.query = function(collection, query, fields, options, callback) {
  callback(new ShareDBError(4022, 'query DB method unimplemented'));
};

DB.prototype.queryPoll = function(collection, query, options, callback) {
  var fields = {};
  this.query(collection, query, fields, options, function(err, snapshots, extra) {
    if (err) return callback(err);
    var ids = [];
    for (var i = 0; i < snapshots.length; i++) {
      ids.push(snapshots[i].id);
    }
    callback(null, ids, extra);
  });
};

DB.prototype.queryPollDoc = function(collection, id, query, options, callback) {
  callback(new ShareDBError(5014, 'queryPollDoc DB method unimplemented'));
};

DB.prototype.canPollDoc = function() {
  return false;
};

DB.prototype.skipPoll = function() {
  return false;
};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var PubSub = __webpack_require__(22);

// In-memory ShareDB pub/sub
//
// This is a fully functional implementation. Since ShareDB does not require
// persistence of pub/sub state, it may be used in production environments
// requiring only a single stand alone server process. Additionally, it is
// easy to swap in an external pub/sub adapter if/when additional server
// processes are desired. No pub/sub APIs are adapter specific.

function MemoryPubSub(options) {
  if (!(this instanceof MemoryPubSub)) return new MemoryPubSub(options);
  PubSub.call(this, options);
}
module.exports = MemoryPubSub;

MemoryPubSub.prototype = Object.create(PubSub.prototype);

MemoryPubSub.prototype._subscribe = function(channel, callback) {
  if (callback) process.nextTick(callback);
};

MemoryPubSub.prototype._unsubscribe = function(channel, callback) {
  if (callback) process.nextTick(callback);
};

MemoryPubSub.prototype._publish = function(channels, data, callback) {
  var pubsub = this;
  process.nextTick(function() {
    for (var i = 0; i < channels.length; i++) {
      var channel = channels[i];
      if (pubsub.subscribed[channel]) {
        pubsub._emit(channel, data);
      }
    }
    if (callback) callback();
  });
};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var OpStream = __webpack_require__(54);
var ShareDBError = __webpack_require__(1);
var util = __webpack_require__(3);

function PubSub(options) {
  this.prefix = options && options.prefix;
  this.nextStreamId = 1;
  this.streamsCount = 0;
  // Maps channel -> id -> stream
  this.streams = {};
  // State for tracking subscriptions. We track this.subscribed separately from
  // the streams, since the stream gets added synchronously, and the subscribe
  // isn't complete until the callback returns from Redis
  // Maps channel -> true
  this.subscribed = {};
}
module.exports = PubSub;

PubSub.prototype.close = function(callback) {
  for (var channel in this.streams) {
    var map = this.streams[channel];
    for (var id in map) {
      map[id].destroy();
    }
  }
  if (callback) callback();
};

PubSub.prototype._subscribe = function(channel, callback) {
  callback(new ShareDBError(5015, '_subscribe PubSub method unimplemented'));
};

PubSub.prototype._unsubscribe = function(channel, callback) {
  callback(new ShareDBError(5016, '_unsubscribe PubSub method unimplemented'));
};

PubSub.prototype._publish = function(channels, data, callback) {
  callback(new ShareDBError(5017, '_publish PubSub method unimplemented'));
};

PubSub.prototype.subscribe = function(channel, callback) {
  if (this.prefix) {
    channel = this.prefix + ' ' + channel;
  }

  var pubsub = this;
  if (this.subscribed[channel]) {
    process.nextTick(function() {
      var stream = pubsub._createStream(channel);
      callback(null, stream);
    });
    return;
  }
  this._subscribe(channel, function(err) {
    if (err) return callback(err);
    pubsub.subscribed[channel] = true;
    var stream = pubsub._createStream(channel);
    callback(null, stream);
  });
};

PubSub.prototype.publish = function(channels, data, callback) {
  if (this.prefix) {
    for (var i = 0; i < channels.length; i++) {
      channels[i] = this.prefix + ' ' + channels[i];
    }
  }
  this._publish(channels, data, callback);
};

PubSub.prototype._emit = function(channel, data) {
  var channelStreams = this.streams[channel];
  if (channelStreams) {
    for (var id in channelStreams) {
      var copy = shallowCopy(data);
      channelStreams[id].pushOp(copy.c, copy.d, copy);
    }
  }
};

PubSub.prototype._createStream = function(channel) {
  var stream = new OpStream();
  var pubsub = this;
  stream.once('close', function() {
    pubsub._removeStream(channel, stream);
  });

  this.streamsCount++;
  var map = this.streams[channel] || (this.streams[channel] = {});
  stream.id = this.nextStreamId++;
  map[stream.id] = stream;

  return stream;
};

PubSub.prototype._removeStream = function(channel, stream) {
  var map = this.streams[channel];
  if (!map) return;

  this.streamsCount--;
  delete map[stream.id];

  // Cleanup if this was the last subscribed stream for the channel
  if (util.hasKeys(map)) return;
  delete this.streams[channel];
  // Synchronously clear subscribed state. We won't actually be unsubscribed
  // until some unkown time in the future. If subscribe is called in this
  // period, we want to send a subscription message and wait for it to
  // complete before we can count on being subscribed again
  delete this.subscribed[channel];

  this._unsubscribe(channel, function(err) {
    if (err) throw err;
  });
};

function shallowCopy(object) {
  var out = {};
  for (var key in object) {
    out[key] = object[key];
  }
  return out;
}


/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var arraydiff = __webpack_require__(55);
var deepEquals = __webpack_require__(56);
var ShareDBError = __webpack_require__(1);
var util = __webpack_require__(3);

function QueryEmitter(request, stream, ids, extra) {
  this.backend = request.backend;
  this.agent = request.agent;
  this.db = request.db;
  this.index = request.index;
  this.query = request.query;
  this.collection = request.collection;
  this.fields = request.fields;
  this.options = request.options;
  this.snapshotProjection = request.snapshotProjection;
  this.stream = stream;
  this.ids = ids;
  this.extra = extra;

  this.skipPoll = this.options.skipPoll || util.doNothing;
  this.canPollDoc = this.db.canPollDoc(this.collection, this.query);
  this.pollDebounce =
    (typeof this.options.pollDebounce === 'number') ? this.options.pollDebounce :
    (typeof this.db.pollDebounce === 'number') ? this.db.pollDebounce : 0;
  this.pollInterval =
    (typeof this.options.pollInterval === 'number') ? this.options.pollInterval :
    (typeof this.db.pollInterval === 'number') ? this.db.pollInterval : 0;

  this._polling = false;
  this._pendingPoll = null;
  this._pollDebounceId = null;
  this._pollIntervalId = null;
}
module.exports = QueryEmitter;

// Start processing events from the stream
QueryEmitter.prototype._open = function() {
  var emitter = this;
  this._defaultCallback = function(err) {
    if (err) emitter.onError(err);
  };
  emitter.stream.on('data', function(data) {
    if (data.error) {
      return emitter.onError(data.error);
    }
    emitter._update(data);
  });
  emitter.stream.on('end', function() {
    emitter.destroy();
  });
  // Make sure we start polling if pollInterval is being used
  this._flushPoll();
};

QueryEmitter.prototype.destroy = function() {
  clearTimeout(this._pollDebounceId);
  clearTimeout(this._pollIntervalId);
  this.stream.destroy();
};

QueryEmitter.prototype._emitTiming = function(action, start) {
  this.backend.emit('timing', action, Date.now() - start, this);
};

QueryEmitter.prototype._update = function(op) {
  var id = op.d;

  // Check if the op's id matches the query before updating the query results
  // and send it through immediately if it does. The current snapshot
  // (including the op) for a newly matched document will get sent in the
  // insert diff, so we don't need to send the op that caused the doc to
  // match. If the doc already exists in the client and isn't otherwise
  // subscribed, the client will need to request the op when it receives the
  // snapshot from the query to bring itself up to date.
  //
  // The client may see the result of the op get reflected before the query
  // results update. This might prove janky in some cases, since a doc could
  // get deleted before it is removed from the results, for example. However,
  // it will mean that ops which don't end up changing the results are
  // received sooner even if query polling takes a while.
  //
  // Alternatively, we could send the op message only after the query has
  // updated, and it would perhaps be ideal to send in the same message to
  // avoid the user seeing transitional states where the doc is updated but
  // the results order is not.
  //
  // We should send the op even if it is the op that causes the document to no
  // longer match the query. If client-side filters are applied to the model
  // to figure out which documents to render in a list, we will want the op
  // that removed the doc from the query to cause the client-side computed
  // list to update.
  if (this.ids.indexOf(id) !== -1) {
    this.onOp(op);
  }

  // Ignore if the database or user function says we don't need to poll
  try {
    if (this.db.skipPoll(this.collection, id, op, this.query)) return this._defaultCallback();
    if (this.skipPoll(this.collection, id, op, this.query)) return this._defaultCallback();
  } catch (err) {
    return this._defaultCallback(err);
  }
  if (this.canPollDoc) {
    // We can query against only the document that was modified to see if the
    // op has changed whether or not it matches the results
    this.queryPollDoc(id, this._defaultCallback);
  } else {
    // We need to do a full poll of the query, because the query uses limits,
    // sorts, or something special
    this.queryPoll(this._defaultCallback);
  }
};

QueryEmitter.prototype._flushPoll = function() {
  // Don't send another polling query at the same time or within the debounce
  // timeout. This function will be called again once the poll that is
  // currently in progress or the pollDebounce timeout completes
  if (this._polling || this._pollDebounceId) return;

  // If another polling event happened while we were polling, call poll again,
  // as the results may have changed
  if (this._pendingPoll) {
    this.queryPoll();

  // If a pollInterval is specified, poll if the query doesn't get polled in
  // the time of the interval
  } else if (this.pollInterval) {
    var emitter = this;
    this._pollIntervalId = setTimeout(function() {
      emitter._pollIntervalId = null;
      emitter.queryPoll(emitter._defaultCallback);
    }, this.pollInterval);
  }
};

QueryEmitter.prototype.queryPoll = function(callback) {
  var emitter = this;

  // Only run a single polling check against mongo at a time per emitter. This
  // matters for two reasons: First, one callback could return before the
  // other. Thus, our result diffs could get out of order, and the clients
  // could end up with results in a funky order and the wrong results being
  // mutated in the query. Second, only having one query executed
  // simultaneously per emitter will act as a natural adaptive rate limiting
  // in case the db is under load.
  //
  // This isn't neccessary for the document polling case, since they operate
  // on a given id and won't accidentally modify the wrong doc. Also, those
  // queries should be faster and are less likely to be the same, so there is
  // less benefit to possible load reduction.
  if (this._polling || this._pollDebounceId) {
    if (this._pendingPoll) {
      this._pendingPoll.push(callback);
    } else {
      this._pendingPoll = [callback];
    }
    return;
  }
  this._polling = true;
  var pending = this._pendingPoll;
  this._pendingPoll = null;
  if (this.pollDebounce) {
    this._pollDebounceId = setTimeout(function() {
      emitter._pollDebounceId = null;
      emitter._flushPoll();
    }, this.pollDebounce);
  }
  clearTimeout(this._pollIntervalId);

  var start = Date.now();
  this.db.queryPoll(this.collection, this.query, this.options, function(err, ids, extra) {
    if (err) return emitter._finishPoll(err, callback, pending);
    emitter._emitTiming('queryEmitter.poll', start);

    // Be nice to not have to do this in such a brute force way
    if (!deepEquals(emitter.extra, extra)) {
      emitter.extra = extra;
      emitter.onExtra(extra);
    }

    var idsDiff = arraydiff(emitter.ids, ids);
    if (idsDiff.length) {
      emitter.ids = ids;
      var inserted = getInserted(idsDiff);
      if (inserted.length) {
        emitter.db.getSnapshotBulk(emitter.collection, inserted, emitter.fields, null, function(err, snapshotMap) {
          if (err) return emitter._finishPoll(err, callback, pending);
          emitter.backend._sanitizeSnapshotBulk(emitter.agent, emitter.snapshotProjection, emitter.collection, snapshotMap, function(err) {
            if (err) return emitter._finishPoll(err, callback, pending);
            emitter._emitTiming('queryEmitter.pollGetSnapshotBulk', start);
            var diff = mapDiff(idsDiff, snapshotMap);
            emitter.onDiff(diff);
            emitter._finishPoll(err, callback, pending);
          });
        });
      } else {
        emitter.onDiff(idsDiff);
        emitter._finishPoll(err, callback, pending);
      }
    } else {
      emitter._finishPoll(err, callback, pending);
    }
  });
};
QueryEmitter.prototype._finishPoll = function(err, callback, pending) {
  this._polling = false;
  if (callback) callback(err);
  if (pending) {
    for (var i = 0; i < pending.length; i++) {
      callback = pending[i];
      if (callback) callback(err);
    }
  }
  this._flushPoll();
};

QueryEmitter.prototype.queryPollDoc = function(id, callback) {
  var emitter = this;
  var start = Date.now();
  this.db.queryPollDoc(this.collection, id, this.query, this.options, function(err, matches) {
    if (err) return callback(err);
    emitter._emitTiming('queryEmitter.pollDoc', start);

    // Check if the document was in the previous results set
    var i = emitter.ids.indexOf(id);

    if (i === -1 && matches) {
      // Add doc to the collection. Order isn't important, so we'll just whack
      // it at the end
      var index = emitter.ids.push(id) - 1;
      // We can get the result to send to the client async, since there is a
      // delay in sending to the client anyway
      emitter.db.getSnapshot(emitter.collection, id, emitter.fields, null, function(err, snapshot) {
        if (err) return callback(err);
        emitter.backend._sanitizeSnapshot(emitter.agent, emitter.snapshotProjection, emitter.collection, id, snapshot, function(err) {
          if (err) return callback(err);
          var values = [snapshot];
          emitter.onDiff([new arraydiff.InsertDiff(index, values)]);
          emitter._emitTiming('queryEmitter.pollDocGetSnapshot', start);
          callback();
        });
      });
      return;
    }

    if (i !== -1 && !matches) {
      emitter.ids.splice(i, 1);
      emitter.onDiff([new arraydiff.RemoveDiff(i, 1)]);
      return callback();
    }

    callback();
  });
};

// Clients must assign each of these functions syncronously after constructing
// an instance of QueryEmitter. The instance is subscribed to an op stream at
// construction time, and does not buffer emitted events. Diff events assume
// all messages are received and applied in order, so it is critical that none
// are dropped.
QueryEmitter.prototype.onError =
QueryEmitter.prototype.onDiff =
QueryEmitter.prototype.onExtra =
QueryEmitter.prototype.onOp = function() {
  throw new ShareDBError(5018, 'Required QueryEmitter listener not assigned');
};

function getInserted(diff) {
  var inserted = [];
  for (var i = 0; i < diff.length; i++) {
    var item = diff[i];
    if (item instanceof arraydiff.InsertDiff) {
      for (var j = 0; j < item.values.length; j++) {
        inserted.push(item.values[j]);
      }
    }
  }
  return inserted;
}

function mapDiff(idsDiff, snapshotMap) {
  var diff = [];
  for (var i = 0; i < idsDiff.length; i++) {
    var item = idsDiff[i];
    if (item instanceof arraydiff.InsertDiff) {
      var values = [];
      for (var j = 0; j < item.values.length; j++) {
        var id = item.values[j];
        values.push(snapshotMap[id]);
      }
      diff.push(new arraydiff.InsertDiff(item.index, values));
    } else {
      diff.push(item);
    }
  }
  return diff;
}


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var ot = __webpack_require__(9);
var projections = __webpack_require__(10);

function SubmitRequest(backend, agent, index, id, op, options) {
  this.backend = backend;
  this.agent = agent;
  // If a projection, rewrite the call into a call against the collection
  var projection = backend.projections[index];
  this.index = index;
  this.projection = projection;
  this.collection = (projection) ? projection.target : index;
  this.id = id;
  this.op = op;
  this.options = options;

  this.start = Date.now();
  this._addOpMeta();

  // Set as this request is sent through middleware
  this.action = null;
  // For custom use in middleware
  this.custom = {};

  this.suppressPublish = backend.suppressPublish;
  this.maxRetries = backend.maxSubmitRetries;
  this.retries = 0;

  // return values
  this.snapshot = null;
  this.ops = [];
  this.channels = null;
}
module.exports = SubmitRequest;

SubmitRequest.prototype.submit = function(callback) {
  var request = this;
  var backend = this.backend;
  var collection = this.collection;
  var id = this.id;
  var op = this.op;
  // Send a special projection so that getSnapshot knows to return all fields.
  // With a null projection, it strips document metadata
  var fields = {$submit: true};

  backend.db.getSnapshot(collection, id, fields, null, function(err, snapshot) {
    if (err) return callback(err);

    request.snapshot = snapshot;
    request._addSnapshotMeta();

    if (op.v == null) {

      if (op.create && snapshot.type && op.src) {
        // If the document was already created by another op, we will return a
        // 'Document already exists' error in response and fail to submit this
        // op. However, this could also happen in the case that the op was
        // already committed and the create op was simply resent. In that
        // case, we should return a non-fatal 'Op already submitted' error. We
        // must get the past ops and check their src and seq values to
        // differentiate.
        backend.db.getCommittedOpVersion(collection, id, snapshot, op, null, function(err, version) {
          if (err) return callback(err);
          if (version == null) {
            callback(request.alreadyCreatedError());
          } else {
            op.v = version;
            callback(request.alreadySubmittedError());
          }
        });
        return;
      }

      // Submitting an op with a null version means that it should get the
      // version from the latest snapshot. Generally this will mean the op
      // won't be transformed, though transform could be called on it in the
      // case of a retry from a simultaneous submit
      op.v = snapshot.v;
    }

    if (op.v === snapshot.v) {
      // The snapshot hasn't changed since the op's base version. Apply
      // without transforming the op
      return request.apply(callback);
    }

    if (op.v > snapshot.v) {
      // The op version should be from a previous snapshot, so it should never
      // never exceed the current snapshot's version
      return callback(request.newerVersionError());
    }

    // Transform the op up to the current snapshot version, then apply
    var from = op.v;
    backend.db.getOpsToSnapshot(collection, id, from, snapshot, null, function(err, ops) {
      if (err) return callback(err);

      if (ops.length !== snapshot.v - from) {
        return callback(request.missingOpsError());
      }

      err = request._transformOp(ops);
      if (err) return callback(err);

      if (op.v !== snapshot.v) {
        // This shouldn't happen, but is just a final sanity check to make
        // sure we have transformed the op to the current snapshot version
        return callback(request.versionAfterTransformError());
      }

      request.apply(callback);
    });
  });
};

SubmitRequest.prototype.apply = function(callback) {
  // If we're being projected, verify that the op is allowed
  var projection = this.projection;
  if (projection && !projections.isOpAllowed(this.snapshot.type, projection.fields, this.op)) {
    return callback(this.projectionError());
  }

  // Always set the channels before each attempt to apply. If the channels are
  // modified in a middleware and we retry, we want to reset to a new array
  this.channels = this.backend.getChannels(this.collection, this.id);

  var request = this;
  this.backend.trigger('apply', this.agent, this, function(err) {
    if (err) return callback(err);

    // Apply the submitted op to the snapshot
    err = ot.apply(request.snapshot, request.op);
    if (err) return callback(err);

    request.commit(callback);
  });
};

SubmitRequest.prototype.commit = function(callback) {
  var request = this;
  var backend = this.backend;
  backend.trigger('commit', this.agent, this, function(err) {
    if (err) return callback(err);

    // Try committing the operation and snapshot to the database atomically
    backend.db.commit(request.collection, request.id, request.op, request.snapshot, request.options, function(err, succeeded) {
      if (err) return callback(err);
      if (!succeeded) {
        // Between our fetch and our call to commit, another client committed an
        // operation. We expect this to be relatively infrequent but normal.
        return request.retry(callback);
      }
      if (!request.suppressPublish) {
        var op = request.op;
        op.c = request.collection;
        op.d = request.id;
        op.m = undefined;
        // Needed for agent to detect if it can ignore sending the op back to
        // the client that submitted it in subscriptions
        if (request.collection !== request.index) op.i = request.index;
        backend.pubsub.publish(request.channels, op);
      }
      callback();
    });
  });
};

SubmitRequest.prototype.retry = function(callback) {
  this.retries++;
  if (this.maxRetries != null && this.retries > this.maxRetries) {
    return callback(this.maxRetriesError());
  }
  this.backend.emit('timing', 'submit.retry', Date.now() - this.start, this);
  this.submit(callback);
};

SubmitRequest.prototype._transformOp = function(ops) {
  var type = this.snapshot.type;
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];

    if (this.op.src && this.op.src === op.src && this.op.seq === op.seq) {
      // The op has already been submitted. There are a variety of ways this
      // can happen in normal operation, such as a client resending an
      // unacknowledged operation at reconnect. It's important we don't apply
      // the same op twice
      return this.alreadySubmittedError();
    }

    if (this.op.v !== op.v) {
      return this.versionDuringTransformError();
    }

    var err = ot.transform(type, this.op, op);
    if (err) return err;
    this.ops.push(op);
  }
};

SubmitRequest.prototype._addOpMeta = function() {
  this.op.m = {
    ts: this.start
  };
  if (this.op.create) {
    // Consistently store the full URI of the type, not just its short name
    this.op.create.type = ot.normalizeType(this.op.create.type);
  }
};

SubmitRequest.prototype._addSnapshotMeta = function() {
  var meta = this.snapshot.m || (this.snapshot.m = {});
  if (this.op.create) {
    meta.ctime = this.start;
  } else if (this.op.del) {
    this.op.m.data = this.snapshot.data;
  }
  meta.mtime = this.start;
};

// Non-fatal client errors:
SubmitRequest.prototype.alreadySubmittedError = function() {
  return {code: 4001, message: 'Op already submitted'};
};
SubmitRequest.prototype.rejectedError = function() {
  return {code: 4002, message: 'Op submit rejected'};
};
// Fatal client errors:
SubmitRequest.prototype.alreadyCreatedError = function() {
  return {code: 4010, message: 'Invalid op submitted. Document already created'};
};
SubmitRequest.prototype.newerVersionError = function() {
  return {code: 4011, message: 'Invalid op submitted. Op version newer than current snapshot'};
};
SubmitRequest.prototype.projectionError = function() {
  return {code: 4012, message: 'Invalid op submitted. Operation invalid in projected collection'};
};
// Fatal internal errors:
SubmitRequest.prototype.missingOpsError = function() {
  return {code: 5001, message: 'Op submit failed. DB missing ops needed to transform it up to the current snapshot version'};
};
SubmitRequest.prototype.versionDuringTransformError = function() {
  return {code: 5002, message: 'Op submit failed. Versions mismatched during op transform'};
};
SubmitRequest.prototype.versionAfterTransformError = function() {
  return {code: 5003, message: 'Op submit failed. Op version mismatches snapshot after op transform'};
};
SubmitRequest.prototype.maxRetriesError = function() {
  return {code: 5004, message: 'Op submit failed. Maximum submit retries exceeded'};
};


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const ReactDOM = __webpack_require__(28);
const arboretum_1 = __webpack_require__(29);
__webpack_require__(61);
ReactDOM.render(React.createElement(arboretum_1.Arboretum, { serverState: "active", urls: ['file:///home/soney/code/arboretum/test/simple_frame_contents.html'] }), document.getElementById('arboretum_main'));


/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

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
const React = __webpack_require__(0);
const nav_bar_1 = __webpack_require__(30);
const tab_1 = __webpack_require__(31);
const sidebar_1 = __webpack_require__(32);
const electron_1 = __webpack_require__(43);
const url = __webpack_require__(44);
const _ = __webpack_require__(5);
const ShareDBDoc_1 = __webpack_require__(45);
const ArboretumChat_1 = __webpack_require__(58);
class Arboretum extends React.Component {
    constructor(props) {
        super(props);
        this.tabCounter = 0;
        this.tabs = new Map();
        this.goBack = () => {
            const { selectedTab } = this.state;
            if (selectedTab) {
                selectedTab.goBack();
            }
        };
        this.goForward = () => {
            const { selectedTab } = this.state;
            if (selectedTab) {
                selectedTab.goForward();
            }
        };
        this.reload = () => {
            const { selectedTab } = this.state;
            if (selectedTab) {
                selectedTab.reload();
            }
        };
        this.toggleSidebar = () => {
        };
        this.navigate = (url) => {
            const { selectedTab } = this.state;
            if (selectedTab) {
                selectedTab.navigate(url);
            }
        };
        this.navBarRef = (el) => {
            this.navBar = el;
            this.updateNavBarState();
        };
        this.setServerActive = (active) => __awaiter(this, void 0, void 0, function* () {
            let shareURL, adminURL;
            if (active) {
                const { hostname, port } = yield this.sendIPCMessage('startServer');
                const fullShareURL = url.format({ protocol: 'http', hostname, port });
                const fullAdminURL = url.format({ protocol: 'http', hostname, port, pathname: '/admin' });
                const wsAddress = url.format({ protocol: 'ws', hostname, port });
                this.socket = new WebSocket(wsAddress);
                this.sdb = new ShareDBDoc_1.SDB(true, this.socket);
                this.chat = new ArboretumChat_1.ArboretumChat(this.sdb);
                if (this.sidebar) {
                    this.sidebar.setSDB(this.sdb);
                    this.sidebar.setChat(this.chat);
                }
                this.chat.addUser('Admin');
                [shareURL, adminURL] = yield Promise.all([
                    this.getShortcut(fullShareURL), this.getShortcut(fullAdminURL)
                ]);
            }
            else {
                if (this.sidebar) {
                    this.sidebar.setSDB(null);
                    this.sidebar.setChat(null);
                }
                if (this.sdb) {
                    yield this.sdb.close();
                    this.sdb = null;
                }
                if (this.socket) {
                    this.socket.close();
                    this.socket = null;
                }
                if (this.chat) {
                    this.chat = null;
                }
                yield this.sendIPCMessage('stopServer');
                [shareURL, adminURL] = ['', ''];
            }
            if (this.sidebar) {
                this.sidebar.setState({ shareURL, adminURL });
            }
            this.setState({ shareURL, adminURL });
            return { shareURL, adminURL };
        });
        this.sendMessage = (message) => {
            if (this.chat) {
                this.chat.addTextMessage(message);
            }
        };
        this.selectedTabURLChanged = (url) => { this.updateNavBarState(); };
        this.selectedTabLoadingChanged = (isLoading) => { this.updateNavBarState(); };
        this.selectedTabCanGoBackChanged = (canGoBack) => { this.updateNavBarState(); };
        this.selectedTabCanGoForwardChanged = (canGoForward) => { this.updateNavBarState(); };
        this.selectedTabPageTitleChanged = (title) => {
            if (!title) {
                title = 'Arboretum';
            }
            document.title = title;
        };
        this.addTab = () => {
            const tabs = this.state.tabs.map((tab) => {
                return _.extend(tab, { selected: false });
            }).concat([{
                    id: this.tabCounter++,
                    url: 'http://www.cmu.edu/',
                    selected: false
                }]);
            this.setState({ tabs }, () => {
                this.updateWebViews();
            });
        };
        this.selectTab = (selectedTab) => {
            if (selectedTab !== this.state.selectedTab) {
                this.tabs.forEach((t) => {
                    const isSelected = t === selectedTab;
                    t.markSelected(isSelected);
                    if (t.webView) {
                        t.webView.setAttribute('class', isSelected ? '' : 'hidden');
                    }
                });
                const activeWebViewEl = selectedTab ? selectedTab.webViewEl : null;
                this.setState({ selectedTab, activeWebViewEl }, () => {
                    this.updateNavBarState();
                    if (this.state.selectedTab) {
                        this.selectedTabPageTitleChanged(selectedTab.state.title);
                    }
                });
            }
        };
        this.closeTab = (tab) => {
            let selectedTab = this.state.selectedTab;
            if (tab === this.state.selectedTab) {
                const tabIndex = this.state.tabs.map((t) => t.id).indexOf(tab.props.tabID);
                if (this.state.tabs.length === 1) {
                    selectedTab = null;
                }
                else if (tabIndex === this.state.tabs.length - 1) {
                    selectedTab = this.tabs.get(this.state.tabs[tabIndex - 1].id);
                }
                else {
                    selectedTab = this.tabs.get(this.state.tabs[tabIndex + 1].id);
                }
            }
            this.tabs.delete(tab.props.tabID);
            const tabs = this.state.tabs.filter((tabInfo) => tabInfo.id !== tab.props.tabID);
            this.setState({ tabs }, () => {
                this.selectTab(selectedTab);
                this.updateWebViews();
            });
        };
        this.tabRef = (el) => {
            if (el) {
                this.tabs.set(el.props.tabID, el);
                this.selectTab(el);
                this.updateWebViews();
            }
        };
        this.tabIsLoadingChanged = (tab, isLoading) => {
            if (tab === this.state.selectedTab) {
                this.selectedTabLoadingChanged(isLoading);
            }
        };
        this.tabCanGoBackChanged = (tab, canGoBack) => {
            if (tab === this.state.selectedTab) {
                this.selectedTabCanGoBackChanged(canGoBack);
            }
        };
        this.tabCanGoForwardChanged = (tab, canGoForward) => {
            if (tab === this.state.selectedTab) {
                this.selectedTabCanGoBackChanged(canGoForward);
            }
        };
        this.tabURLChanged = (tab, url) => {
            if (tab === this.state.selectedTab) {
                this.selectedTabURLChanged(url);
            }
        };
        this.pageTitleChanged = (tab, title) => {
            if (tab === this.state.selectedTab) {
                this.selectedTabPageTitleChanged(title);
            }
        };
        this.sidebarRef = (sidebar) => {
            this.sidebar = sidebar;
            this.setServerActive(this.state.serverActive);
        };
        this.state = {
            tabs: this.props.urls.map((url, index) => {
                return {
                    selected: index === 0,
                    id: this.tabCounter++,
                    url: url
                };
            }),
            webViews: [],
            selectedTab: null,
            showingSidebar: false,
            serverActive: this.props.serverState === "active",
            activeWebViewEl: null,
            shareURL: '',
            adminURL: ''
        };
        this.updateWebViews();
    }
    ;
    updateNavBarState() {
        const { selectedTab } = this.state;
        if (selectedTab && this.navBar) {
            const { canGoBack, canGoForward, isLoading, loadedURL } = selectedTab.state;
            this.navBar.setState({ canGoBack, canGoForward, isLoading });
            if (!this.navBar.state.urlBarFocused) {
                this.navBar.setState({ urlText: loadedURL });
            }
        }
    }
    ;
    sendIPCMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_1.ipcRenderer.send('asynchronous-message', message);
            const reply = yield new Promise((resolve, reject) => {
                electron_1.ipcRenderer.once('asynchronous-reply', (event, data) => {
                    resolve(data);
                });
            });
            return reply;
        });
    }
    ;
    getShortcut(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return url;
        });
    }
    ;
    postTask(sandbox) {
        console.log('post task', sandbox);
    }
    ;
    updateWebViews() {
        const webViews = this.state.tabs.map((tab) => {
            const { id } = tab;
            if (this.tabs.has(id)) {
                const arboretumTab = this.tabs.get(id);
                return arboretumTab.webViewEl;
            }
            else {
                return null;
            }
        });
        this.setState({ webViews });
    }
    ;
    render() {
        const tabs = this.state.tabs.map((info, index) => React.createElement(tab_1.ArboretumTab, { ref: this.tabRef, selected: info.selected, key: info.id, tabID: info.id, startURL: info.url, onSelect: this.selectTab, onClose: this.closeTab, pageTitleChanged: this.pageTitleChanged, urlChanged: this.tabURLChanged, isLoadingChanged: this.tabIsLoadingChanged, canGoBackChanged: this.tabCanGoBackChanged, canGoForwardChanged: this.tabCanGoForwardChanged }));
        return React.createElement("div", { className: "window" },
            React.createElement("header", { className: "toolbar toolbar-header" },
                React.createElement("div", { id: "tabsBar", className: "tab-group" },
                    React.createElement("div", { id: 'buttonSpacer', className: "tab-item tab-item-fixed" }, " "),
                    tabs,
                    React.createElement("div", { onClick: this.addTab, className: "tab-item tab-item-fixed", id: 'addTab' },
                        React.createElement("span", { className: "icon icon-plus" }))),
                React.createElement(nav_bar_1.ArboretumNavigationBar, { ref: this.navBarRef, onBack: this.goBack, onForward: this.goForward, onReload: this.reload, onToggleSidebar: this.toggleSidebar, onNavigate: this.navigate })),
            React.createElement("div", { className: "window-content" },
                React.createElement("div", { className: "pane-group" },
                    React.createElement(sidebar_1.ArboretumSidebar, { shareURL: this.state.shareURL, adminURL: this.state.adminURL, ref: this.sidebarRef, onSendMessage: this.sendMessage, setServerActive: this.setServerActive, isVisible: this.state.showingSidebar, serverActive: this.state.serverActive, onPostTask: this.postTask }),
                    React.createElement("div", { id: "browser-pane", className: "pane" },
                        React.createElement("div", { id: "content" }, this.state.webViews)))));
    }
    ;
}
exports.Arboretum = Arboretum;
;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const ENTER_KEY = 13;
class ArboretumNavigationBar extends React.Component {
    constructor(props) {
        super(props);
        this.handleURLChange = (event) => {
            this.setState({ urlText: event.target.value });
        };
        this.backClicked = () => {
            if (this.props.onBack) {
                this.props.onBack();
            }
        };
        this.forwardClicked = () => {
            if (this.props.onForward) {
                this.props.onForward();
            }
        };
        this.reloadClicked = () => {
            if (this.props.onReload) {
                this.props.onReload();
            }
        };
        this.toggleSidebarClicked = () => {
            if (this.props.onToggleSidebar) {
                this.props.onToggleSidebar();
            }
        };
        this.urlKeyDown = (event) => {
            const { keyCode } = event;
            if (keyCode === ENTER_KEY) {
                const { urlText } = this.state;
                if (this.props.onNavigate) {
                    this.props.onNavigate(urlText);
                }
            }
        };
        this.onURLBarFocus = (event) => {
            this.setState({ urlBarFocused: true });
        };
        this.onURLBarBlur = (event) => {
            this.setState({ urlBarFocused: false });
        };
        this.state = {
            urlText: '',
            canGoBack: false,
            canGoForward: false,
            isLoading: false,
            urlBarFocused: false
        };
    }
    ;
    render() {
        return React.createElement("div", { id: "navBar" },
            React.createElement("div", { className: "toolbar-actions" },
                React.createElement("div", { className: "btn-group" },
                    React.createElement("button", { disabled: !this.state.canGoBack, onClick: this.backClicked, className: 'btn btn-default btn-mini', id: 'back' },
                        React.createElement("span", { className: 'icon icon-left-open-big' })),
                    React.createElement("button", { disabled: !this.state.canGoForward, onClick: this.forwardClicked, className: 'btn btn-default btn-mini', id: 'forward' },
                        React.createElement("span", { className: 'icon icon-right-open-big' }))),
                React.createElement("div", { className: "btn-group" },
                    React.createElement("button", { onClick: this.reloadClicked, className: 'btn btn-default btn-mini', id: 'reload' },
                        React.createElement("span", { className: `icon ${this.state.isLoading ? 'icon-cancel' : 'icon-ccw'}` })),
                    React.createElement("button", { onClick: this.toggleSidebarClicked, className: 'btn btn-default btn-mini', id: 'task' },
                        React.createElement("span", { className: 'icon icon-publish' })))),
            React.createElement("input", { value: this.state.urlText, onChange: this.handleURLChange, onKeyDown: this.urlKeyDown, onFocus: this.onURLBarFocus, onBlur: this.onURLBarBlur, id: 'url', type: "text", placeholder: "Enter URL or Term to Search" }));
    }
    ;
}
exports.ArboretumNavigationBar = ArboretumNavigationBar;
;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const _ = __webpack_require__(5);
class ArboretumTab extends React.Component {
    constructor(props) {
        super(props);
        this.webViewRef = (el) => {
            if (el) {
                this.webView = el;
                this.webView.addEventListener('page-title-updated', (event) => {
                    const { title } = event;
                    this.setState({ title });
                    if (this.props.pageTitleChanged) {
                        this.props.pageTitleChanged(this, title);
                    }
                });
                this.webView.addEventListener('load-commit', (event) => {
                    const { isMainFrame, url } = event;
                    if (isMainFrame) {
                        const loadedURL = url;
                        if (this.props.urlChanged) {
                            this.props.urlChanged(this, url);
                        }
                        this.setState({ loadedURL });
                    }
                });
                this.webView.addEventListener('page-favicon-updated', (event) => {
                    const { favicons } = event;
                    const favIconURL = favicons[0];
                    this.setState({ favIconURL });
                });
                this.webView.addEventListener('did-start-loading', (event) => {
                    this.setState({ isLoading: true });
                    if (this.props.isLoadingChanged) {
                        this.props.isLoadingChanged(this, true);
                    }
                });
                this.webView.addEventListener('did-stop-loading', (event) => {
                    this.setState({ isLoading: false });
                    if (this.props.isLoadingChanged) {
                        this.props.isLoadingChanged(this, false);
                    }
                });
            }
        };
        this.onSelect = (event) => {
            if (this.props.onSelect) {
                this.props.onSelect(this);
            }
        };
        this.onClose = (event) => {
            event.stopPropagation(); // don't send a select event
            if (this.props.onClose) {
                this.props.onClose(this);
            }
        };
        this.state = {
            title: this.props.startURL,
            selected: this.props.selected,
            loadedURL: this.props.startURL,
            favIconURL: null,
            canGoBack: false,
            canGoForward: false,
            isLoading: false
        };
        this.webViewEl = React.createElement("webview", { id: `${this.props.tabID}`, key: this.props.tabID, ref: this.webViewRef, src: this.props.startURL });
    }
    ;
    markSelected(selected = true) {
        this.setState(_.extend(this.state, { selected }));
    }
    ;
    goBack() {
        this.webView.goBack();
    }
    ;
    goForward() {
        this.webView.goForward();
    }
    ;
    reload() {
        if (this.webView.isLoading()) {
            this.webView.stop();
        }
        else {
            this.webView.reload();
        }
    }
    ;
    navigate(url, options) {
        this.webView.loadURL(url, options);
    }
    ;
    render() {
        return React.createElement("div", { onClick: this.onSelect, className: `tab-item ${this.state.selected ? 'active' : 'not-active'}` },
            React.createElement("span", { onClick: this.onClose, className: 'icon icon-cancel icon-close-tab' }),
            React.createElement("span", { className: 'tab-icon' }, this.state.favIconURL ?
                React.createElement("img", { className: 'tab-img', src: this.state.favIconURL }) : null),
            React.createElement("span", { className: 'tab-title' }, this.state.title));
    }
    ;
}
exports.ArboretumTab = ArboretumTab;
;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

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
const React = __webpack_require__(0);
const chat_1 = __webpack_require__(33);
const Clipboard = __webpack_require__(34);
const react_switch_1 = __webpack_require__(35);
const ENTER_KEY = 13;
;
class ArboretumSidebar extends React.Component {
    constructor(props) {
        super(props);
        this.handleServerSwitchChange = (serverActive) => __awaiter(this, void 0, void 0, function* () {
            this.setState({ serverActive });
            if (this.props.setServerActive) {
                const shareURLs = yield this.props.setServerActive(serverActive);
                if (serverActive) {
                    const { shareURL, adminURL } = shareURLs;
                    this.setState({ shareURL, adminURL });
                }
                else {
                    this.setState({ shareURL: '', adminURL: '' });
                }
            }
        });
        this.sendMessage = (message) => {
            if (this.props.onSendMessage) {
                this.props.onSendMessage(message);
            }
        };
        this.postToMTurk = () => {
            if (this.props.onPostTask) {
                this.props.onPostTask(this.state.sandbox);
            }
        };
        this.onSandboxChange = (event) => {
            this.setState({ sandbox: event.target.checked });
        };
        this.adminURLRef = (el) => {
            if (el) {
                new Clipboard(el);
            }
        };
        this.shareURLRef = (el) => {
            if (el) {
                new Clipboard(el);
            }
        };
        this.chatBoxRef = (chatbox) => {
            this.chatbox = chatbox;
        };
        this.state = {
            isVisible: this.props.isVisible,
            serverActive: this.props.serverActive,
            shareURL: this.props.shareURL,
            adminURL: this.props.adminURL,
            sandbox: true
        };
    }
    ;
    setVisible(isVisible) {
        this.setState({ isVisible });
    }
    ;
    setSDB(sdb) {
        if (this.chatbox) {
            this.chatbox.setSDB(sdb);
        }
    }
    ;
    setChat(chat) {
        if (this.chatbox) {
            this.chatbox.setChat(chat);
        }
    }
    ;
    render() {
        return React.createElement("div", { className: 'sidebar' },
            React.createElement("table", { id: "server-controls" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("td", null,
                            React.createElement("h5", { className: "nav-group-title" }, "Server")),
                        React.createElement("td", null,
                            React.createElement("h5", { className: "nav-group-title" }, "Share URL")),
                        React.createElement("td", null,
                            React.createElement("h5", { className: "nav-group-title" }, "Admin URL")),
                        React.createElement("td", null,
                            React.createElement("h5", { className: "nav-group-title" }, "MTurk")))),
                React.createElement("tbody", null,
                    React.createElement("tr", { id: "control_content" },
                        React.createElement("td", null,
                            React.createElement(react_switch_1.default, { height: 24, width: 48, onChange: this.handleServerSwitchChange, checked: this.state.serverActive })),
                        React.createElement("td", { className: "copy_area" },
                            React.createElement("input", { ref: this.shareURLRef, value: this.state.shareURL, id: "share_url", "data-disabled": "true" }),
                            React.createElement("span", { ref: (el) => (el), "data-clipboard-target": "#share_url", id: "share_copy", className: "icon icon-clipboard" })),
                        React.createElement("td", { className: "copy_area" },
                            React.createElement("input", { ref: this.adminURLRef, value: this.state.adminURL, id: "admin_url", "data-disabled": "true" }),
                            React.createElement("span", { "data-clipboard-target": "#admin_url", id: "admin_copy", className: "icon icon-clipboard" })),
                        React.createElement("td", null,
                            React.createElement("button", { onClick: this.postToMTurk, id: "mturk_post", className: 'btn btn-default' },
                                React.createElement("span", { className: "icon icon-upload-cloud" }),
                                "\u00A0Post"),
                            React.createElement("br", null),
                            React.createElement("label", null,
                                React.createElement("input", { type: "checkbox", name: "sandbox", value: "sandbox", id: "sandbox", checked: this.state.sandbox, onChange: this.onSandboxChange }),
                                " Sandbox"))))),
            React.createElement(chat_1.ArboretumChatBox, { ref: this.chatBoxRef, onSendMessage: this.sendMessage }));
    }
    ;
}
exports.ArboretumSidebar = ArboretumSidebar;
;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

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
const React = __webpack_require__(0);
const ENTER_KEY = 13;
class ArboretumChatBox extends React.Component {
    constructor(props) {
        super(props);
        this.updateMessagesState = () => __awaiter(this, void 0, void 0, function* () {
            const messages = yield this.chat.getMessages();
            this.setState({ messages });
        });
        this.updateUsersState = () => __awaiter(this, void 0, void 0, function* () {
            const users = yield this.chat.getUsers();
            this.setState({ users });
        });
        this.chatKeyDown = (event) => {
            const { keyCode, ctrlKey, altKey, metaKey, shiftKey } = event;
            if (keyCode === ENTER_KEY && !(ctrlKey || altKey || metaKey || shiftKey)) {
                event.preventDefault();
                const { chatText } = this.state;
                if (chatText !== '') {
                    if (this.props.onSendMessage) {
                        this.props.onSendMessage(chatText);
                    }
                    this.setState({ chatText: '' });
                }
            }
        };
        this.onTextareaChange = (event) => {
            this.setState({ chatText: event.target.value });
        };
        this.state = {
            chatText: this.props.chatText || '',
            messages: [],
            users: []
        };
    }
    ;
    setChat(chat) {
        this.chat = chat;
        if (this.chat) {
            this.chat.messageAdded(this.updateMessagesState);
            this.chat.userJoined(this.updateUsersState);
            this.chat.userNotPresent(this.updateUsersState);
            this.chat.ready(() => {
                this.updateMessagesState();
                this.updateUsersState();
            });
        }
    }
    ;
    setSDB(sdb) {
        this.sdb = sdb;
    }
    ;
    //https://stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react
    scrollToBottom() {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }
    ;
    componentDidMount() {
        this.scrollToBottom();
    }
    ;
    componentDidUpdate() {
        this.scrollToBottom();
    }
    ;
    render() {
        const messages = this.state.messages.map((m) => {
            const senderStyle = { color: m.sender.color };
            return React.createElement("li", { className: 'chat-line' },
                React.createElement("span", { style: senderStyle, className: 'from' }, m.sender.displayName),
                React.createElement("span", { className: 'message' }, m.content));
        });
        let meUserID;
        if (this.chat) {
            const meUser = this.chat.getMe();
            if (meUser) {
                meUserID = meUser.id;
            }
        }
        const users = this.state.users.map((u) => {
            const isMe = u.id === meUserID;
            const style = { color: u.color };
            return React.createElement("span", { key: u.id, className: `participant ${isMe ? 'me' : ''}`, style: style }, u.displayName);
        });
        return React.createElement("div", { className: 'chat' },
            React.createElement("h6", { id: "task_title" },
                React.createElement("span", { className: "icon icon-chat" }),
                React.createElement("span", { id: 'task-name' }, "Chat")),
            React.createElement("div", { id: "chat-participants" }, users),
            React.createElement("ul", { id: "chat-lines" },
                messages,
                React.createElement("li", { style: { float: "left", clear: "both" }, ref: (el) => { this.messagesEnd = el; } })),
            React.createElement("form", { id: "chat-form" },
                React.createElement("textarea", { id: "chat-box", className: "form-control", placeholder: "Send a message", onChange: this.onTextareaChange, onKeyDown: this.chatKeyDown, value: this.state.chatText })));
    }
    ;
}
exports.ArboretumChatBox = ArboretumChatBox;
;


/***/ }),
/* 34 */
/***/ (function(module, exports) {

module.exports = require("clipboard");

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _propTypes = __webpack_require__(36);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _icons = __webpack_require__(41);

var _getBackgroundColor = __webpack_require__(42);

var _getBackgroundColor2 = _interopRequireDefault(_getBackgroundColor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Switch = function (_Component) {
  _inherits(Switch, _Component);

  function Switch(props) {
    _classCallCheck(this, Switch);

    var _this = _possibleConstructorReturn(this, (Switch.__proto__ || Object.getPrototypeOf(Switch)).call(this, props));

    _initialiseProps.call(_this);

    var height = props.height,
        width = props.width,
        handleDiameter = props.handleDiameter,
        checked = props.checked;

    _this.handleDiameter = handleDiameter || height - 2;
    _this.checkedPos = Math.max(width - height, width - (height + _this.handleDiameter) / 2);
    _this.uncheckedPos = Math.max(0, (height - _this.handleDiameter) / 2);
    _this.state = {
      pos: checked ? _this.checkedPos : _this.uncheckedPos,
      startX: null,
      isDragging: false,
      hasOutline: false
    };
    return _this;
  }

  _createClass(Switch, [{
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(_ref) {
      var checked = _ref.checked;

      var pos = checked ? this.checkedPos : this.uncheckedPos;
      this.setState({ pos: pos });
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          checked = _props.checked,
          disabled = _props.disabled,
          className = _props.className,
          offColor = _props.offColor,
          onColor = _props.onColor,
          offHandleColor = _props.offHandleColor,
          onHandleColor = _props.onHandleColor,
          checkedIcon = _props.checkedIcon,
          uncheckedIcon = _props.uncheckedIcon,
          boxShadow = _props.boxShadow,
          activeBoxShadow = _props.activeBoxShadow,
          height = _props.height,
          width = _props.width,
          id = _props.id,
          ariaLabelledby = _props["aria-labelledby"],
          ariaLabel = _props["aria-label"];
      var _state = this.state,
          pos = _state.pos,
          isDragging = _state.isDragging,
          hasOutline = _state.hasOutline;


      var rootStyle = {
        position: "relative",
        display: "inline-block",
        opacity: disabled ? 0.5 : 1,
        borderRadius: height / 2,
        WebkitTransition: "opacity 0.25s",
        MozTransition: "opacity 0.25s",
        transition: "opacity 0.25s",
        touchAction: "none",
        WebkitTapHighlightColor: "rgba(0, 0, 0, 0)",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none"
      };

      var backgroundStyle = {
        height: height,
        width: width,
        margin: Math.max(0, (this.handleDiameter - height) / 2),
        position: "relative",
        background: (0, _getBackgroundColor2.default)(pos, this.checkedPos, this.uncheckedPos, offColor, onColor),
        borderRadius: height / 2,
        cursor: disabled ? "default" : "pointer",
        WebkitTransition: isDragging ? null : "background 0.25s",
        MozTransition: isDragging ? null : "background 0.25s",
        transition: isDragging ? null : "background 0.25s"
      };

      var checkedIconStyle = {
        height: height,
        width: Math.min(height * 1.5, width - (this.handleDiameter + height) / 2 + 1),
        position: "relative",
        opacity: (pos - this.uncheckedPos) / (this.checkedPos - this.uncheckedPos),
        pointerEvents: "none",
        WebkitTransition: isDragging ? null : "opacity 0.25s",
        MozTransition: isDragging ? null : "opacity 0.25s",
        transition: isDragging ? null : "opacity 0.25s"
      };

      var uncheckedIconStyle = {
        height: height,
        width: Math.min(height * 1.5, width - (this.handleDiameter + height) / 2 + 1),
        position: "absolute",
        opacity: 1 - (pos - this.uncheckedPos) / (this.checkedPos - this.uncheckedPos),
        right: 0,
        top: 0,
        pointerEvents: "none",
        WebkitTransition: isDragging ? null : "opacity 0.25s",
        MozTransition: isDragging ? null : "opacity 0.25s",
        transition: isDragging ? null : "opacity 0.25s"
      };

      var handleStyle = {
        height: this.handleDiameter,
        width: this.handleDiameter,
        background: (0, _getBackgroundColor2.default)(pos, this.checkedPos, this.uncheckedPos, offHandleColor, onHandleColor),
        cursor: disabled ? "default" : "pointer",
        display: "inline-block",
        borderRadius: "50%",
        position: "absolute",
        transform: "translateX(" + pos + "px)",
        top: Math.max(0, (height - this.handleDiameter) / 2),
        outline: 0,
        boxShadow: hasOutline ? activeBoxShadow : boxShadow,
        border: 0,
        WebkitTransition: isDragging ? null : "background-color 0.25s, transform 0.25s, box-shadow 0.15s",
        MozTransition: isDragging ? null : "background-color 0.25s, transform 0.25s, box-shadow 0.15s",
        transition: isDragging ? null : "background-color 0.25s, transform 0.25s, box-shadow 0.15s"
      };

      return _react2.default.createElement(
        "div",
        { className: className, style: rootStyle },
        _react2.default.createElement(
          "div",
          {
            className: "react-switch-bg",
            style: backgroundStyle,
            onClick: disabled ? null : this.handleClick
          },
          checkedIcon && _react2.default.createElement(
            "div",
            { style: checkedIconStyle },
            checkedIcon
          ),
          uncheckedIcon && _react2.default.createElement(
            "div",
            { style: uncheckedIconStyle },
            uncheckedIcon
          )
        ),
        _react2.default.createElement("div", {
          className: "react-switch-handle",
          role: "checkbox",
          tabIndex: disabled ? null : 0,
          onMouseDown: disabled ? null : this.handleMouseDown,
          onTouchStart: disabled ? null : this.handleTouchStart,
          onTouchMove: disabled ? null : this.handleTouchMove,
          onTouchEnd: disabled ? null : this.handleTouchEnd,
          onTouchCancel: disabled ? null : this.handleTouchCancel,
          onKeyDown: this.handleKeyDown,
          onFocus: function onFocus() {
            return _this2.setState({ hasOutline: true });
          },
          onBlur: function onBlur() {
            return _this2.setState({ hasOutline: false });
          },
          style: handleStyle,
          id: id,
          "aria-checked": checked,
          "aria-disabled": disabled,
          "aria-labelledby": ariaLabelledby,
          "aria-label": ariaLabel
        })
      );
    }
  }]);

  return Switch;
}(_react.Component);

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.handleDragStart = function (clientX) {
    _this3.setState({ startX: clientX, hasOutline: true });
  };

  this.handleDrag = function (clientX) {
    var startX = _this3.state.startX;
    var checked = _this3.props.checked;

    var startPos = checked ? _this3.checkedPos : _this3.uncheckedPos;
    var newPos = startPos + clientX - startX;
    var pos = Math.min(_this3.checkedPos, Math.max(_this3.uncheckedPos, newPos));
    _this3.setState({ pos: pos, isDragging: true });
  };

  this.handleDragStop = function (event) {
    var _state2 = _this3.state,
        pos = _state2.pos,
        isDragging = _state2.isDragging;
    var _props2 = _this3.props,
        checked = _props2.checked,
        onChange = _props2.onChange,
        id = _props2.id;

    // Simulate clicking the handle

    if (!isDragging) {
      _this3.setState({ startX: null, hasOutline: false });
      onChange(!checked, event, id);
      return;
    }
    if (checked) {
      if (pos > (_this3.checkedPos + _this3.uncheckedPos) / 2) {
        _this3.setState({
          pos: _this3.checkedPos,
          startX: null,
          isDragging: false,
          hasOutline: false
        });
        return;
      }
      _this3.setState({ startX: null, isDragging: false, hasOutline: false });
      onChange(false, event, id);
      return;
    }
    if (pos < (_this3.checkedPos + _this3.uncheckedPos) / 2) {
      _this3.setState({
        pos: _this3.uncheckedPos,
        startX: null,
        isDragging: false,
        hasOutline: false
      });
      return;
    }
    _this3.setState({ startX: null, isDragging: false, hasOutline: false });
    onChange(true, event, id);
  };

  this.handleMouseDown = function (event) {
    // Ignore right click and scroll
    if (typeof event.button === "number" && event.button !== 0) {
      return;
    }

    _this3.handleDragStart(event.clientX);
    document.addEventListener("mousemove", _this3.handleMouseMove);
    document.addEventListener("mouseup", _this3.handleMouseUp);
  };

  this.handleMouseMove = function (event) {
    event.preventDefault();
    _this3.handleDrag(event.clientX);
  };

  this.handleMouseUp = function (event) {
    _this3.handleDragStop(event);
    document.removeEventListener("mousemove", _this3.handleMouseMove);
    document.removeEventListener("mouseup", _this3.handleMouseUp);
  };

  this.handleTouchStart = function (event) {
    _this3.handleDragStart(event.touches[0].clientX);
  };

  this.handleTouchMove = function (event) {
    _this3.handleDrag(event.touches[0].clientX);
  };

  this.handleTouchEnd = function (event) {
    event.preventDefault();
    _this3.handleDragStop(event);
  };

  this.handleTouchCancel = function () {
    _this3.setState({ startX: null, hasOutline: false });
  };

  this.handleClick = function (event) {
    var _props3 = _this3.props,
        checked = _props3.checked,
        onChange = _props3.onChange,
        id = _props3.id;

    onChange(!checked, event, id);
  };

  this.handleKeyDown = function (event) {
    var _props4 = _this3.props,
        checked = _props4.checked,
        onChange = _props4.onChange,
        id = _props4.id;
    var isDragging = _this3.state.isDragging;
    // Trigger change on spacebar and enter keys (in violation of wai-aria spec).

    if ((event.keyCode === 32 || event.keyCode === 13) && !isDragging) {
      event.preventDefault();
      onChange(!checked, event, id);
    }
  };
};

Switch.propTypes = {
  checked: _propTypes2.default.bool.isRequired,
  onChange: _propTypes2.default.func.isRequired,
  disabled: _propTypes2.default.bool,
  offColor: _propTypes2.default.string,
  onColor: _propTypes2.default.string,
  offHandleColor: _propTypes2.default.string,
  onHandleColor: _propTypes2.default.string,
  handleDiameter: _propTypes2.default.number,
  uncheckedIcon: _propTypes2.default.oneOfType([_propTypes2.default.bool, _propTypes2.default.element]),
  checkedIcon: _propTypes2.default.oneOfType([_propTypes2.default.bool, _propTypes2.default.element]),
  boxShadow: _propTypes2.default.string,
  activeBoxShadow: _propTypes2.default.string,
  height: _propTypes2.default.number,
  width: _propTypes2.default.number,
  className: _propTypes2.default.string,
  id: _propTypes2.default.string,
  "aria-labelledby": _propTypes2.default.string,
  "aria-label": _propTypes2.default.string
};

Switch.defaultProps = {
  disabled: false,
  offColor: "#888",
  onColor: "#080",
  offHandleColor: "#fff",
  onHandleColor: "#fff",
  handleDiameter: null,
  uncheckedIcon: _icons.uncheckedIcon,
  checkedIcon: _icons.checkedIcon,
  boxShadow: null,
  activeBoxShadow: "0px 0px 2px 3px #33bbff",
  height: 28,
  width: 56,
  className: null,
  id: null,
  "aria-labelledby": null,
  "aria-label": null
};

exports.default = Switch;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (process.env.NODE_ENV !== 'production') {
  var REACT_ELEMENT_TYPE = (typeof Symbol === 'function' &&
    Symbol.for &&
    Symbol.for('react.element')) ||
    0xeac7;

  var isValidElement = function(object) {
    return typeof object === 'object' &&
      object !== null &&
      object.$$typeof === REACT_ELEMENT_TYPE;
  };

  // By explicitly using `prop-types` you are opting into new development behavior.
  // http://fb.me/prop-types-in-prod
  var throwOnDirectAccess = true;
  module.exports = __webpack_require__(37)(isValidElement, throwOnDirectAccess);
} else {
  // By explicitly using `prop-types` you are opting into new production behavior.
  // http://fb.me/prop-types-in-prod
  module.exports = __webpack_require__(40)();
}


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var emptyFunction = __webpack_require__(6);
var invariant = __webpack_require__(7);
var warning = __webpack_require__(11);
var assign = __webpack_require__(38);

var ReactPropTypesSecret = __webpack_require__(8);
var checkPropTypes = __webpack_require__(39);

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message) {
    this.message = message;
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (process.env.NODE_ENV !== 'production') {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          invariant(
            false,
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            warning(
              false,
              'You are manually calling a React.PropTypes validation ' +
              'function for the `%s` prop on `%s`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.',
              propFullName,
              componentName
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunction.thatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOf, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues);
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (propValue.hasOwnProperty(key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        warning(
          false,
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received %s at index %s.',
          getPostfixForTypeWarning(checker),
          i
        );
        return emptyFunction.thatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret) == null) {
          return null;
        }
      }

      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (!checker) {
          continue;
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from
      // props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



if (process.env.NODE_ENV !== 'production') {
  var invariant = __webpack_require__(7);
  var warning = __webpack_require__(11);
  var ReactPropTypesSecret = __webpack_require__(8);
  var loggedTypeFailures = {};
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (process.env.NODE_ENV !== 'production') {
    for (var typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          invariant(typeof typeSpecs[typeSpecName] === 'function', '%s: %s type `%s` is invalid; it must be a function, usually from ' + 'the `prop-types` package, but received `%s`.', componentName || 'React class', location, typeSpecName, typeof typeSpecs[typeSpecName]);
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error);
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          warning(false, 'Failed %s type: %s%s', location, error.message, stack != null ? stack : '');
        }
      }
    }
  }
}

module.exports = checkPropTypes;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var emptyFunction = __webpack_require__(6);
var invariant = __webpack_require__(7);
var ReactPropTypesSecret = __webpack_require__(8);

module.exports = function() {
  function shim(props, propName, componentName, location, propFullName, secret) {
    if (secret === ReactPropTypesSecret) {
      // It is still safe when called from React.
      return;
    }
    invariant(
      false,
      'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
      'Use PropTypes.checkPropTypes() to call them. ' +
      'Read more at http://fb.me/use-check-prop-types'
    );
  };
  shim.isRequired = shim;
  function getShim() {
    return shim;
  };
  // Important!
  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
  var ReactPropTypes = {
    array: shim,
    bool: shim,
    func: shim,
    number: shim,
    object: shim,
    string: shim,
    symbol: shim,

    any: shim,
    arrayOf: getShim,
    element: shim,
    instanceOf: getShim,
    node: shim,
    objectOf: getShim,
    oneOf: getShim,
    oneOfType: getShim,
    shape: getShim,
    exact: getShim
  };

  ReactPropTypes.checkPropTypes = emptyFunction;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkedIcon = exports.uncheckedIcon = undefined;

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var uncheckedIcon = exports.uncheckedIcon = _react2.default.createElement(
  "svg",
  {
    viewBox: "-2 -5 14 20",
    height: "100%",
    width: "100%",
    style: { position: "absolute", top: 0 }
  },
  _react2.default.createElement("path", {
    /* eslint-disable max-len */
    d: "M9.9 2.12L7.78 0 4.95 2.828 2.12 0 0 2.12l2.83 2.83L0 7.776 2.123 9.9 4.95 7.07 7.78 9.9 9.9 7.776 7.072 4.95 9.9 2.12"
    /* eslint-eable max-len */
    , fill: "#fff",
    fillRule: "evenodd"
  })
); /*
   The MIT License (MIT)
   
   Copyright (c) 2015 instructure-react
   
   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:
   
   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.
   
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
   */

var checkedIcon = exports.checkedIcon = _react2.default.createElement(
  "svg",
  {
    height: "100%",
    width: "100%",
    viewBox: "-2 -5 17 21",
    style: { position: "absolute", top: 0 }
  },
  _react2.default.createElement("path", {
    d: "M11.264 0L5.26 6.004 2.103 2.847 0 4.95l5.26 5.26 8.108-8.107L11.264 0",
    fill: "#fff",
    fillRule: "evenodd"
  })
);

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getBackgroundColor;
function createBackgroundColor(pos, checkedPos, uncheckedPos, offColor, onColor) {
  var relativePos = (pos - uncheckedPos) / (checkedPos - uncheckedPos);
  if (relativePos === 0) {
    return offColor;
  }
  if (relativePos === 1) {
    return onColor;
  }

  var newColor = "#";
  for (var i = 1; i < 6; i += 2) {
    var offComponent = parseInt(offColor.substr(i, 2), 16);
    var onComponent = parseInt(onColor.substr(i, 2), 16);
    var weightedValue = Math.round((1 - relativePos) * offComponent + relativePos * onComponent);
    var newComponent = weightedValue.toString(16);
    if (newComponent.length === 1) {
      newComponent = "0" + newComponent;
    }
    newColor += newComponent;
  }
  return newColor;
}

function convertShorthandColor(color) {
  if (color.length === 7) {
    return color;
  }
  var sixDigitColor = "#";
  for (var i = 1; i < 4; i += 1) {
    sixDigitColor += color[i] + color[i];
  }
  return sixDigitColor;
}

function getBackgroundColor(pos, checkedPos, uncheckedPos, offColor, onColor) {
  var sixDigitOffColor = convertShorthandColor(offColor);
  var sixDigitOnColor = convertShorthandColor(onColor);
  return createBackgroundColor(pos, checkedPos, uncheckedPos, sixDigitOffColor, sixDigitOnColor);
}

/***/ }),
/* 43 */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),
/* 44 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

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
const ShareDBClient = __webpack_require__(46);
const ShareDB = __webpack_require__(51);
class SDB {
    constructor(client, connection) {
        this.docs = new Map();
        if (client) {
            this.connection = new ShareDBClient.Connection(connection);
        }
        else {
            this.share = new ShareDB();
            this.connection = this.share.connect();
        }
    }
    ;
    getDocIdentifier(collectionName, documentID) {
        return [collectionName, documentID];
    }
    ;
    listen(stream) {
        this.share.listen(stream);
    }
    ;
    get(collectionName, documentID) {
        const docIdentifier = this.getDocIdentifier(collectionName, documentID);
        let sdbDoc;
        if (this.docs.has(docIdentifier)) {
            sdbDoc = this.docs.get(docIdentifier);
        }
        else {
            const doc = this.connection.get(collectionName, documentID);
            sdbDoc = new SDBDoc(docIdentifier, doc, this);
            this.docs.set(docIdentifier, sdbDoc);
        }
        return sdbDoc;
    }
    ;
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                this.share.close(() => {
                    resolve(null);
                });
            });
        });
    }
    ;
    deleteDoc(doc) {
        this.docs.delete(doc.docIdentifier);
    }
    ;
}
exports.SDB = SDB;
;
class SDBDoc {
    constructor(docIdentifier, doc, sdb) {
        this.docIdentifier = docIdentifier;
        this.doc = doc;
        this.sdb = sdb;
    }
    ;
    traverse(path) {
        let x = this.getData();
        for (let i = 0; i < path.length; i++) {
            x = x[path[i]];
        }
        return x;
    }
    ;
    submitObjectReplaceOp(p, oi, od = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, oi, od };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitObjectInsertOp(p, oi) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, oi };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitObjectDeleteOp(p, od = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, od };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListReplaceOp(p, li, ld = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, li, ld };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListInsertOp(p, li) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, li };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListDeleteOp(p, ld = this.traverse(p)) {
        return __awaiter(this, void 0, void 0, function* () {
            const op = { p, ld };
            return yield this.submitOp([op]);
        });
    }
    ;
    submitListPushOp(p, ...items) {
        return __awaiter(this, void 0, void 0, function* () {
            const arr = this.traverse(p);
            const previousLength = arr.length;
            const ops = items.map((x, i) => {
                const op = { p: p.concat(i), li: x };
                return op;
            });
            return yield this.submitOp(ops);
        });
    }
    ;
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.doc.fetch((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.doc);
                    }
                });
            });
        });
    }
    ;
    create(data, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.doc.create(data, type, options, () => {
                    resolve(this.doc);
                });
            });
        });
    }
    ;
    del(source = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                this.doc.del({ source }, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
            this.sdb.deleteDoc(this);
        });
    }
    ;
    subscribe(callback) {
        this.doc.subscribe((err) => {
            if (err) {
                throw (err);
            }
            callback(null, null, this.doc.data);
        });
        const onOpFunc = (op, source) => {
            callback(op, source, this.doc.data);
        };
        this.doc.on('op', onOpFunc);
        return () => {
            this.doc.removeListener('op', onOpFunc);
        };
    }
    ;
    submitOp(op, source = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                this.doc.submitOp(op, { source }, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    ;
    createIfEmpty(data, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.fetch();
            if (doc.type === null) {
                return this.create(data, type, options);
            }
            else {
                return doc;
            }
        });
    }
    ;
    getData() {
        return this.doc.data;
    }
    ;
    destroy() {
        this.doc.destroy();
        this.sdb.deleteDoc(this);
    }
    ;
}
exports.SDBDoc = SDBDoc;
;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

exports.Connection = __webpack_require__(12);
exports.Doc = __webpack_require__(13);
exports.Error = __webpack_require__(1);
exports.Query = __webpack_require__(16);
exports.types = __webpack_require__(2);


/***/ }),
/* 47 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// ISC @ Julien Fontanet



// ===================================================================

var defineProperty = Object.defineProperty

// -------------------------------------------------------------------

var captureStackTrace = Error.captureStackTrace
if (!captureStackTrace) {
  captureStackTrace = function captureStackTrace (error) {
    var container = new Error()

    defineProperty(error, 'stack', {
      configurable: true,
      get: function getStack () {
        var stack = container.stack

        // Replace property with value for faster future accesses.
        defineProperty(this, 'stack', {
          value: stack
        })

        return stack
      },
      set: function setStack (stack) {
        defineProperty(error, 'stack', {
          configurable: true,
          value: stack,
          writable: true
        })
      }
    })
  }
}

// -------------------------------------------------------------------

function BaseError (message) {
  if (message) {
    defineProperty(this, 'message', {
      configurable: true,
      value: message,
      writable: true
    })
  }

  var cname = this.constructor.name
  if (
    cname &&
    cname !== this.name
  ) {
    defineProperty(this, 'name', {
      configurable: true,
      value: cname,
      writable: true
    })
  }

  captureStackTrace(this, this.constructor)
}

BaseError.prototype = Object.create(Error.prototype, {
  // See: https://github.com/JsCommunity/make-error/issues/4
  constructor: {
    configurable: true,
    value: BaseError,
    writable: true
  }
})

// -------------------------------------------------------------------

// Sets the name of a function if possible (depends of the JS engine).
var setFunctionName = (function () {
  function setFunctionName (fn, name) {
    return defineProperty(fn, 'name', {
      configurable: true,
      value: name
    })
  }
  try {
    var f = function () {}
    setFunctionName(f, 'foo')
    if (f.name === 'foo') {
      return setFunctionName
    }
  } catch (_) {}
})()

// -------------------------------------------------------------------

function makeError (constructor, super_) {
  if (super_ == null || super_ === Error) {
    super_ = BaseError
  } else if (typeof super_ !== 'function') {
    throw new TypeError('super_ should be a function')
  }

  var name
  if (typeof constructor === 'string') {
    name = constructor
    constructor = function () { super_.apply(this, arguments) }

    // If the name can be set, do it once and for all.
    if (setFunctionName) {
      setFunctionName(constructor, name)
      name = null
    }
  } else if (typeof constructor !== 'function') {
    throw new TypeError('constructor should be either a string or a function')
  }

  // Also register the super constructor also as `constructor.super_` just
  // like Node's `util.inherits()`.
  constructor.super_ = constructor['super'] = super_

  var properties = {
    constructor: {
      configurable: true,
      value: constructor,
      writable: true
    }
  }

  // If the name could not be set on the constructor, set it on the
  // prototype.
  if (name != null) {
    properties.name = {
      configurable: true,
      value: name,
      writable: true
    }
  }
  constructor.prototype = Object.create(super_.prototype, properties)

  return constructor
}
exports = module.exports = makeError
exports.BaseError = BaseError


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

/*
 This is the implementation of the JSON OT type.

 Spec is here: https://github.com/josephg/ShareJS/wiki/JSON-Operations

 Note: This is being made obsolete. It will soon be replaced by the JSON2 type.
*/

/**
 * UTILITY FUNCTIONS
 */

/**
 * Checks if the passed object is an Array instance. Can't use Array.isArray
 * yet because its not supported on IE8.
 *
 * @param obj
 * @returns {boolean}
 */
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) == '[object Array]';
};

/**
 * Checks if the passed object is an Object instance.
 * No function call (fast) version
 *
 * @param obj
 * @returns {boolean}
 */
var isObject = function(obj) {
  return (!!obj) && (obj.constructor === Object);
};

/**
 * Clones the passed object using JSON serialization (which is slow).
 *
 * hax, copied from test/types/json. Apparently this is still the fastest way
 * to deep clone an object, assuming we have browser support for JSON.  @see
 * http://jsperf.com/cloning-an-object/12
 */
var clone = function(o) {
  return JSON.parse(JSON.stringify(o));
};

/**
 * JSON OT Type
 * @type {*}
 */
var json = {
  name: 'json0',
  uri: 'http://sharejs.org/types/JSONv0'
};

// You can register another OT type as a subtype in a JSON document using
// the following function. This allows another type to handle certain
// operations instead of the builtin JSON type.
var subtypes = {};
json.registerSubtype = function(subtype) {
  subtypes[subtype.name] = subtype;
};

json.create = function(data) {
  // Null instead of undefined if you don't pass an argument.
  return data === undefined ? null : clone(data);
};

json.invertComponent = function(c) {
  var c_ = {p: c.p};

  // handle subtype ops
  if (c.t && subtypes[c.t]) {
    c_.t = c.t;
    c_.o = subtypes[c.t].invert(c.o);
  }

  if (c.si !== void 0) c_.sd = c.si;
  if (c.sd !== void 0) c_.si = c.sd;
  if (c.oi !== void 0) c_.od = c.oi;
  if (c.od !== void 0) c_.oi = c.od;
  if (c.li !== void 0) c_.ld = c.li;
  if (c.ld !== void 0) c_.li = c.ld;
  if (c.na !== void 0) c_.na = -c.na;

  if (c.lm !== void 0) {
    c_.lm = c.p[c.p.length-1];
    c_.p = c.p.slice(0,c.p.length-1).concat([c.lm]);
  }

  return c_;
};

json.invert = function(op) {
  var op_ = op.slice().reverse();
  var iop = [];
  for (var i = 0; i < op_.length; i++) {
    iop.push(json.invertComponent(op_[i]));
  }
  return iop;
};

json.checkValidOp = function(op) {
  for (var i = 0; i < op.length; i++) {
    if (!isArray(op[i].p)) throw new Error('Missing path');
  }
};

json.checkList = function(elem) {
  if (!isArray(elem))
    throw new Error('Referenced element not a list');
};

json.checkObj = function(elem) {
  if (!isObject(elem)) {
    throw new Error("Referenced element not an object (it was " + JSON.stringify(elem) + ")");
  }
};

// helper functions to convert old string ops to and from subtype ops
function convertFromText(c) {
  c.t = 'text0';
  var o = {p: c.p.pop()};
  if (c.si != null) o.i = c.si;
  if (c.sd != null) o.d = c.sd;
  c.o = [o];
}

function convertToText(c) {
  c.p.push(c.o[0].p);
  if (c.o[0].i != null) c.si = c.o[0].i;
  if (c.o[0].d != null) c.sd = c.o[0].d;
  delete c.t;
  delete c.o;
}

json.apply = function(snapshot, op) {
  json.checkValidOp(op);

  op = clone(op);

  var container = {
    data: snapshot
  };

  for (var i = 0; i < op.length; i++) {
    var c = op[i];

    // convert old string ops to use subtype for backwards compatibility
    if (c.si != null || c.sd != null)
      convertFromText(c);

    var parent = null;
    var parentKey = null;
    var elem = container;
    var key = 'data';

    for (var j = 0; j < c.p.length; j++) {
      var p = c.p[j];

      parent = elem;
      parentKey = key;
      elem = elem[key];
      key = p;

      if (parent == null)
        throw new Error('Path invalid');
    }

    // handle subtype ops
    if (c.t && c.o !== void 0 && subtypes[c.t]) {
      elem[key] = subtypes[c.t].apply(elem[key], c.o);

    // Number add
    } else if (c.na !== void 0) {
      if (typeof elem[key] != 'number')
        throw new Error('Referenced element not a number');

      elem[key] += c.na;
    }

    // List replace
    else if (c.li !== void 0 && c.ld !== void 0) {
      json.checkList(elem);
      // Should check the list element matches c.ld
      elem[key] = c.li;
    }

    // List insert
    else if (c.li !== void 0) {
      json.checkList(elem);
      elem.splice(key,0, c.li);
    }

    // List delete
    else if (c.ld !== void 0) {
      json.checkList(elem);
      // Should check the list element matches c.ld here too.
      elem.splice(key,1);
    }

    // List move
    else if (c.lm !== void 0) {
      json.checkList(elem);
      if (c.lm != key) {
        var e = elem[key];
        // Remove it...
        elem.splice(key,1);
        // And insert it back.
        elem.splice(c.lm,0,e);
      }
    }

    // Object insert / replace
    else if (c.oi !== void 0) {
      json.checkObj(elem);

      // Should check that elem[key] == c.od
      elem[key] = c.oi;
    }

    // Object delete
    else if (c.od !== void 0) {
      json.checkObj(elem);

      // Should check that elem[key] == c.od
      delete elem[key];
    }

    else {
      throw new Error('invalid / missing instruction in op');
    }
  }

  return container.data;
};

// Helper to break an operation up into a bunch of small ops.
json.shatter = function(op) {
  var results = [];
  for (var i = 0; i < op.length; i++) {
    results.push([op[i]]);
  }
  return results;
};

// Helper for incrementally applying an operation to a snapshot. Calls yield
// after each op component has been applied.
json.incrementalApply = function(snapshot, op, _yield) {
  for (var i = 0; i < op.length; i++) {
    var smallOp = [op[i]];
    snapshot = json.apply(snapshot, smallOp);
    // I'd just call this yield, but thats a reserved keyword. Bah!
    _yield(smallOp, snapshot);
  }

  return snapshot;
};

// Checks if two paths, p1 and p2 match.
var pathMatches = json.pathMatches = function(p1, p2, ignoreLast) {
  if (p1.length != p2.length)
    return false;

  for (var i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i] && (!ignoreLast || i !== p1.length - 1))
      return false;
  }

  return true;
};

json.append = function(dest,c) {
  c = clone(c);

  if (dest.length === 0) {
    dest.push(c);
    return;
  }

  var last = dest[dest.length - 1];

  // convert old string ops to use subtype for backwards compatibility
  if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
    convertFromText(c);
    convertFromText(last);
  }

  if (pathMatches(c.p, last.p)) {
    // handle subtype ops
    if (c.t && last.t && c.t === last.t && subtypes[c.t]) {
      last.o = subtypes[c.t].compose(last.o, c.o);

      // convert back to old string ops
      if (c.si != null || c.sd != null) {
        var p = c.p;
        for (var i = 0; i < last.o.length - 1; i++) {
          c.o = [last.o.pop()];
          c.p = p.slice();
          convertToText(c);
          dest.push(c);
        }

        convertToText(last);
      }
    } else if (last.na != null && c.na != null) {
      dest[dest.length - 1] = {p: last.p, na: last.na + c.na};
    } else if (last.li !== undefined && c.li === undefined && c.ld === last.li) {
      // insert immediately followed by delete becomes a noop.
      if (last.ld !== undefined) {
        // leave the delete part of the replace
        delete last.li;
      } else {
        dest.pop();
      }
    } else if (last.od !== undefined && last.oi === undefined && c.oi !== undefined && c.od === undefined) {
      last.oi = c.oi;
    } else if (last.oi !== undefined && c.od !== undefined) {
      // The last path component inserted something that the new component deletes (or replaces).
      // Just merge them.
      if (c.oi !== undefined) {
        last.oi = c.oi;
      } else if (last.od !== undefined) {
        delete last.oi;
      } else {
        // An insert directly followed by a delete turns into a no-op and can be removed.
        dest.pop();
      }
    } else if (c.lm !== undefined && c.p[c.p.length - 1] === c.lm) {
      // don't do anything
    } else {
      dest.push(c);
    }
  } else {
    // convert string ops back
    if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
      convertToText(c);
      convertToText(last);
    }

    dest.push(c);
  }
};

json.compose = function(op1,op2) {
  json.checkValidOp(op1);
  json.checkValidOp(op2);

  var newOp = clone(op1);

  for (var i = 0; i < op2.length; i++) {
    json.append(newOp,op2[i]);
  }

  return newOp;
};

json.normalize = function(op) {
  var newOp = [];

  op = isArray(op) ? op : [op];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p == null) c.p = [];

    json.append(newOp,c);
  }

  return newOp;
};

// Returns the common length of the paths of ops a and b
json.commonLengthForOps = function(a, b) {
  var alen = a.p.length;
  var blen = b.p.length;
  if (a.na != null || a.t)
    alen++;

  if (b.na != null || b.t)
    blen++;

  if (alen === 0) return -1;
  if (blen === 0) return null;

  alen--;
  blen--;

  for (var i = 0; i < alen; i++) {
    var p = a.p[i];
    if (i >= blen || p !== b.p[i])
      return null;
  }

  return alen;
};

// Returns true if an op can affect the given path
json.canOpAffectPath = function(op, path) {
  return json.commonLengthForOps({p:path}, op) != null;
};

// transform c so it applies to a document with otherC applied.
json.transformComponent = function(dest, c, otherC, type) {
  c = clone(c);

  var common = json.commonLengthForOps(otherC, c);
  var common2 = json.commonLengthForOps(c, otherC);
  var cplength = c.p.length;
  var otherCplength = otherC.p.length;

  if (c.na != null || c.t)
    cplength++;

  if (otherC.na != null || otherC.t)
    otherCplength++;

  // if c is deleting something, and that thing is changed by otherC, we need to
  // update c to reflect that change for invertibility.
  if (common2 != null && otherCplength > cplength && c.p[common2] == otherC.p[common2]) {
    if (c.ld !== void 0) {
      var oc = clone(otherC);
      oc.p = oc.p.slice(cplength);
      c.ld = json.apply(clone(c.ld),[oc]);
    } else if (c.od !== void 0) {
      var oc = clone(otherC);
      oc.p = oc.p.slice(cplength);
      c.od = json.apply(clone(c.od),[oc]);
    }
  }

  if (common != null) {
    var commonOperand = cplength == otherCplength;

    // backward compatibility for old string ops
    var oc = otherC;
    if ((c.si != null || c.sd != null) && (otherC.si != null || otherC.sd != null)) {
      convertFromText(c);
      oc = clone(otherC);
      convertFromText(oc);
    }

    // handle subtype ops
    if (oc.t && subtypes[oc.t]) {
      if (c.t && c.t === oc.t) {
        var res = subtypes[c.t].transform(c.o, oc.o, type);

        if (res.length > 0) {
          // convert back to old string ops
          if (c.si != null || c.sd != null) {
            var p = c.p;
            for (var i = 0; i < res.length; i++) {
              c.o = [res[i]];
              c.p = p.slice();
              convertToText(c);
              json.append(dest, c);
            }
          } else {
            c.o = res;
            json.append(dest, c);
          }
        }

        return dest;
      }
    }

    // transform based on otherC
    else if (otherC.na !== void 0) {
      // this case is handled below
    } else if (otherC.li !== void 0 && otherC.ld !== void 0) {
      if (otherC.p[common] === c.p[common]) {
        // noop

        if (!commonOperand) {
          return dest;
        } else if (c.ld !== void 0) {
          // we're trying to delete the same element, -> noop
          if (c.li !== void 0 && type === 'left') {
            // we're both replacing one element with another. only one can survive
            c.ld = clone(otherC.li);
          } else {
            return dest;
          }
        }
      }
    } else if (otherC.li !== void 0) {
      if (c.li !== void 0 && c.ld === undefined && commonOperand && c.p[common] === otherC.p[common]) {
        // in li vs. li, left wins.
        if (type === 'right')
          c.p[common]++;
      } else if (otherC.p[common] <= c.p[common]) {
        c.p[common]++;
      }

      if (c.lm !== void 0) {
        if (commonOperand) {
          // otherC edits the same list we edit
          if (otherC.p[common] <= c.lm)
            c.lm++;
          // changing c.from is handled above.
        }
      }
    } else if (otherC.ld !== void 0) {
      if (c.lm !== void 0) {
        if (commonOperand) {
          if (otherC.p[common] === c.p[common]) {
            // they deleted the thing we're trying to move
            return dest;
          }
          // otherC edits the same list we edit
          var p = otherC.p[common];
          var from = c.p[common];
          var to = c.lm;
          if (p < to || (p === to && from < to))
            c.lm--;

        }
      }

      if (otherC.p[common] < c.p[common]) {
        c.p[common]--;
      } else if (otherC.p[common] === c.p[common]) {
        if (otherCplength < cplength) {
          // we're below the deleted element, so -> noop
          return dest;
        } else if (c.ld !== void 0) {
          if (c.li !== void 0) {
            // we're replacing, they're deleting. we become an insert.
            delete c.ld;
          } else {
            // we're trying to delete the same element, -> noop
            return dest;
          }
        }
      }

    } else if (otherC.lm !== void 0) {
      if (c.lm !== void 0 && cplength === otherCplength) {
        // lm vs lm, here we go!
        var from = c.p[common];
        var to = c.lm;
        var otherFrom = otherC.p[common];
        var otherTo = otherC.lm;
        if (otherFrom !== otherTo) {
          // if otherFrom == otherTo, we don't need to change our op.

          // where did my thing go?
          if (from === otherFrom) {
            // they moved it! tie break.
            if (type === 'left') {
              c.p[common] = otherTo;
              if (from === to) // ugh
                c.lm = otherTo;
            } else {
              return dest;
            }
          } else {
            // they moved around it
            if (from > otherFrom) c.p[common]--;
            if (from > otherTo) c.p[common]++;
            else if (from === otherTo) {
              if (otherFrom > otherTo) {
                c.p[common]++;
                if (from === to) // ugh, again
                  c.lm++;
              }
            }

            // step 2: where am i going to put it?
            if (to > otherFrom) {
              c.lm--;
            } else if (to === otherFrom) {
              if (to > from)
                c.lm--;
            }
            if (to > otherTo) {
              c.lm++;
            } else if (to === otherTo) {
              // if we're both moving in the same direction, tie break
              if ((otherTo > otherFrom && to > from) ||
                  (otherTo < otherFrom && to < from)) {
                if (type === 'right') c.lm++;
              } else {
                if (to > from) c.lm++;
                else if (to === otherFrom) c.lm--;
              }
            }
          }
        }
      } else if (c.li !== void 0 && c.ld === undefined && commonOperand) {
        // li
        var from = otherC.p[common];
        var to = otherC.lm;
        p = c.p[common];
        if (p > from) c.p[common]--;
        if (p > to) c.p[common]++;
      } else {
        // ld, ld+li, si, sd, na, oi, od, oi+od, any li on an element beneath
        // the lm
        //
        // i.e. things care about where their item is after the move.
        var from = otherC.p[common];
        var to = otherC.lm;
        p = c.p[common];
        if (p === from) {
          c.p[common] = to;
        } else {
          if (p > from) c.p[common]--;
          if (p > to) c.p[common]++;
          else if (p === to && from > to) c.p[common]++;
        }
      }
    }
    else if (otherC.oi !== void 0 && otherC.od !== void 0) {
      if (c.p[common] === otherC.p[common]) {
        if (c.oi !== void 0 && commonOperand) {
          // we inserted where someone else replaced
          if (type === 'right') {
            // left wins
            return dest;
          } else {
            // we win, make our op replace what they inserted
            c.od = otherC.oi;
          }
        } else {
          // -> noop if the other component is deleting the same object (or any parent)
          return dest;
        }
      }
    } else if (otherC.oi !== void 0) {
      if (c.oi !== void 0 && c.p[common] === otherC.p[common]) {
        // left wins if we try to insert at the same place
        if (type === 'left') {
          json.append(dest,{p: c.p, od:otherC.oi});
        } else {
          return dest;
        }
      }
    } else if (otherC.od !== void 0) {
      if (c.p[common] == otherC.p[common]) {
        if (!commonOperand)
          return dest;
        if (c.oi !== void 0) {
          delete c.od;
        } else {
          return dest;
        }
      }
    }
  }

  json.append(dest,c);
  return dest;
};

__webpack_require__(15)(json, json.transformComponent, json.checkValidOp, json.append);

/**
 * Register a subtype for string operations, using the text0 type.
 */
var text = __webpack_require__(50);

json.registerSubtype(text);
module.exports = json;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

// DEPRECATED!
//
// This type works, but is not exported. Its included here because the JSON0
// embedded string operations use this library.


// A simple text implementation
//
// Operations are lists of components. Each component either inserts or deletes
// at a specified position in the document.
//
// Components are either:
//  {i:'str', p:100}: Insert 'str' at position 100 in the document
//  {d:'str', p:100}: Delete 'str' at position 100 in the document
//
// Components in an operation are executed sequentially, so the position of components
// assumes previous components have already executed.
//
// Eg: This op:
//   [{i:'abc', p:0}]
// is equivalent to this op:
//   [{i:'a', p:0}, {i:'b', p:1}, {i:'c', p:2}]

var text = module.exports = {
  name: 'text0',
  uri: 'http://sharejs.org/types/textv0',
  create: function(initial) {
    if ((initial != null) && typeof initial !== 'string') {
      throw new Error('Initial data must be a string');
    }
    return initial || '';
  }
};

/** Insert s2 into s1 at pos. */
var strInject = function(s1, pos, s2) {
  return s1.slice(0, pos) + s2 + s1.slice(pos);
};

/** Check that an operation component is valid. Throws if its invalid. */
var checkValidComponent = function(c) {
  if (typeof c.p !== 'number')
    throw new Error('component missing position field');

  if ((typeof c.i === 'string') === (typeof c.d === 'string'))
    throw new Error('component needs an i or d field');

  if (c.p < 0)
    throw new Error('position cannot be negative');
};

/** Check that an operation is valid */
var checkValidOp = function(op) {
  for (var i = 0; i < op.length; i++) {
    checkValidComponent(op[i]);
  }
};

/** Apply op to snapshot */
text.apply = function(snapshot, op) {
  var deleted;

  checkValidOp(op);
  for (var i = 0; i < op.length; i++) {
    var component = op[i];
    if (component.i != null) {
      snapshot = strInject(snapshot, component.p, component.i);
    } else {
      deleted = snapshot.slice(component.p, component.p + component.d.length);
      if (component.d !== deleted)
        throw new Error("Delete component '" + component.d + "' does not match deleted text '" + deleted + "'");

      snapshot = snapshot.slice(0, component.p) + snapshot.slice(component.p + component.d.length);
    }
  }
  return snapshot;
};

/**
 * Append a component to the end of newOp. Exported for use by the random op
 * generator and the JSON0 type.
 */
var append = text._append = function(newOp, c) {
  if (c.i === '' || c.d === '') return;

  if (newOp.length === 0) {
    newOp.push(c);
  } else {
    var last = newOp[newOp.length - 1];

    if (last.i != null && c.i != null && last.p <= c.p && c.p <= last.p + last.i.length) {
      // Compose the insert into the previous insert
      newOp[newOp.length - 1] = {i:strInject(last.i, c.p - last.p, c.i), p:last.p};

    } else if (last.d != null && c.d != null && c.p <= last.p && last.p <= c.p + c.d.length) {
      // Compose the deletes together
      newOp[newOp.length - 1] = {d:strInject(c.d, last.p - c.p, last.d), p:c.p};

    } else {
      newOp.push(c);
    }
  }
};

/** Compose op1 and op2 together */
text.compose = function(op1, op2) {
  checkValidOp(op1);
  checkValidOp(op2);
  var newOp = op1.slice();
  for (var i = 0; i < op2.length; i++) {
    append(newOp, op2[i]);
  }
  return newOp;
};

/** Clean up an op */
text.normalize = function(op) {
  var newOp = [];

  // Normalize should allow ops which are a single (unwrapped) component:
  // {i:'asdf', p:23}.
  // There's no good way to test if something is an array:
  // http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
  // so this is probably the least bad solution.
  if (op.i != null || op.p != null) op = [op];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p == null) c.p = 0;

    append(newOp, c);
  }

  return newOp;
};

// This helper method transforms a position by an op component.
//
// If c is an insert, insertAfter specifies whether the transform
// is pushed after the insert (true) or before it (false).
//
// insertAfter is optional for deletes.
var transformPosition = function(pos, c, insertAfter) {
  // This will get collapsed into a giant ternary by uglify.
  if (c.i != null) {
    if (c.p < pos || (c.p === pos && insertAfter)) {
      return pos + c.i.length;
    } else {
      return pos;
    }
  } else {
    // I think this could also be written as: Math.min(c.p, Math.min(c.p -
    // otherC.p, otherC.d.length)) but I think its harder to read that way, and
    // it compiles using ternary operators anyway so its no slower written like
    // this.
    if (pos <= c.p) {
      return pos;
    } else if (pos <= c.p + c.d.length) {
      return c.p;
    } else {
      return pos - c.d.length;
    }
  }
};

// Helper method to transform a cursor position as a result of an op.
//
// Like transformPosition above, if c is an insert, insertAfter specifies
// whether the cursor position is pushed after an insert (true) or before it
// (false).
text.transformCursor = function(position, op, side) {
  var insertAfter = side === 'right';
  for (var i = 0; i < op.length; i++) {
    position = transformPosition(position, op[i], insertAfter);
  }

  return position;
};

// Transform an op component by another op component. Asymmetric.
// The result will be appended to destination.
//
// exported for use in JSON type
var transformComponent = text._tc = function(dest, c, otherC, side) {
  //var cIntersect, intersectEnd, intersectStart, newC, otherIntersect, s;

  checkValidComponent(c);
  checkValidComponent(otherC);

  if (c.i != null) {
    // Insert.
    append(dest, {i:c.i, p:transformPosition(c.p, otherC, side === 'right')});
  } else {
    // Delete
    if (otherC.i != null) {
      // Delete vs insert
      var s = c.d;
      if (c.p < otherC.p) {
        append(dest, {d:s.slice(0, otherC.p - c.p), p:c.p});
        s = s.slice(otherC.p - c.p);
      }
      if (s !== '')
        append(dest, {d: s, p: c.p + otherC.i.length});

    } else {
      // Delete vs delete
      if (c.p >= otherC.p + otherC.d.length)
        append(dest, {d: c.d, p: c.p - otherC.d.length});
      else if (c.p + c.d.length <= otherC.p)
        append(dest, c);
      else {
        // They overlap somewhere.
        var newC = {d: '', p: c.p};

        if (c.p < otherC.p)
          newC.d = c.d.slice(0, otherC.p - c.p);

        if (c.p + c.d.length > otherC.p + otherC.d.length)
          newC.d += c.d.slice(otherC.p + otherC.d.length - c.p);

        // This is entirely optional - I'm just checking the deleted text in
        // the two ops matches
        var intersectStart = Math.max(c.p, otherC.p);
        var intersectEnd = Math.min(c.p + c.d.length, otherC.p + otherC.d.length);
        var cIntersect = c.d.slice(intersectStart - c.p, intersectEnd - c.p);
        var otherIntersect = otherC.d.slice(intersectStart - otherC.p, intersectEnd - otherC.p);
        if (cIntersect !== otherIntersect)
          throw new Error('Delete ops delete different text in the same region of the document');

        if (newC.d !== '') {
          newC.p = transformPosition(newC.p, otherC);
          append(dest, newC);
        }
      }
    }
  }

  return dest;
};

var invertComponent = function(c) {
  return (c.i != null) ? {d:c.i, p:c.p} : {i:c.d, p:c.p};
};

// No need to use append for invert, because the components won't be able to
// cancel one another.
text.invert = function(op) {
  // Shallow copy & reverse that sucka.
  op = op.slice().reverse();
  for (var i = 0; i < op.length; i++) {
    op[i] = invertComponent(op[i]);
  }
  return op;
};

__webpack_require__(15)(text, transformComponent, checkValidOp, append);


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var Backend = __webpack_require__(52);
module.exports = Backend;

Backend.Agent = __webpack_require__(18);
Backend.Backend = Backend;
Backend.DB = __webpack_require__(20);
Backend.Error = __webpack_require__(1);
Backend.MemoryDB = __webpack_require__(19);
Backend.MemoryPubSub = __webpack_require__(21);
Backend.ot = __webpack_require__(9);
Backend.projections = __webpack_require__(10);
Backend.PubSub = __webpack_require__(22);
Backend.QueryEmitter = __webpack_require__(25);
Backend.SubmitRequest = __webpack_require__(26);
Backend.types = __webpack_require__(2);


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

var async = __webpack_require__(17);
var Agent = __webpack_require__(18);
var Connection = __webpack_require__(12);
var emitter = __webpack_require__(4);
var MemoryDB = __webpack_require__(19);
var MemoryPubSub = __webpack_require__(21);
var ot = __webpack_require__(9);
var projections = __webpack_require__(10);
var QueryEmitter = __webpack_require__(25);
var StreamSocket = __webpack_require__(57);
var SubmitRequest = __webpack_require__(26);

function Backend(options) {
  if (!(this instanceof Backend)) return new Backend(options);
  emitter.EventEmitter.call(this);

  if (!options) options = {};
  this.db = options.db || new MemoryDB();
  this.pubsub = options.pubsub || new MemoryPubSub();
  // This contains any extra databases that can be queried
  this.extraDbs = options.extraDbs || {};

  // Map from projected collection -> {type, fields}
  this.projections = {};

  this.suppressPublish = !!options.suppressPublish;
  this.maxSubmitRetries = options.maxSubmitRetries || null;

  // Map from event name to a list of middleware
  this.middleware = {};

  // The number of open agents for monitoring and testing memory leaks
  this.agentsCount = 0;
  this.remoteAgentsCount = 0;
}
module.exports = Backend;
emitter.mixin(Backend);

Backend.prototype.close = function(callback) {
  var wait = 3;
  var backend = this;
  function finish(err) {
    if (err) {
      if (callback) return callback(err);
      return backend.emit('error', err);
    }
    if (--wait) return;
    if (callback) callback();
  }
  this.pubsub.close(finish);
  this.db.close(finish);
  for (var name in this.extraDbs) {
    wait++;
    this.extraDbs[name].close(finish);
  }
  finish();
};

Backend.prototype.connect = function(connection, req) {
  var socket = new StreamSocket();
  if (connection) {
    connection.bindToSocket(socket);
  } else {
    connection = new Connection(socket);
  }
  socket._open();
  var agent = this.listen(socket.stream, req);
  // Store a reference to the agent on the connection for convenience. This is
  // not used internal to ShareDB, but it is handy for server-side only user
  // code that may cache state on the agent and read it in middleware
  connection.agent = agent;
  return connection;
};

/** A client has connected through the specified stream. Listen for messages.
 *
 * The optional second argument (req) is an initial request which is passed
 * through to any connect() middleware. This is useful for inspecting cookies
 * or an express session or whatever on the request object in your middleware.
 *
 * (The agent is available through all middleware)
 */
Backend.prototype.listen = function(stream, req) {
  var agent = new Agent(this, stream);
  this.trigger('connect', agent, {stream: stream, req: req}, function(err) {
    if (err) return agent.close(err);
    agent._open();
  });
  return agent;
};

Backend.prototype.addProjection = function(name, collection, fields) {
  if (this.projections[name]) {
    throw new Error('Projection ' + name + ' already exists');
  }

  for (var key in fields) {
    if (fields[key] !== true) {
      throw new Error('Invalid field ' + key + ' - fields must be {somekey: true}. Subfields not currently supported.');
    }
  }

  this.projections[name] = {
    target: collection,
    fields: fields
  };
};

/**
 * Add middleware to an action or array of actions
 */
Backend.prototype.use = function(action, fn) {
  if (Array.isArray(action)) {
    for (var i = 0; i < action.length; i++) {
      this.use(action[i], fn);
    }
    return;
  }
  var fns = this.middleware[action] || (this.middleware[action] = []);
  fns.push(fn);
  return this;
};

/**
 * Passes request through the middleware stack
 *
 * Middleware may modify the request object. After all middleware have been
 * invoked we call `callback` with `null` and the modified request. If one of
 * the middleware resturns an error the callback is called with that error.
 */
Backend.prototype.trigger = function(action, agent, request, callback) {
  request.action = action;
  request.agent = agent;
  request.backend = this;

  var fns = this.middleware[action];
  if (!fns) return callback();

  // Copying the triggers we'll fire so they don't get edited while we iterate.
  fns = fns.slice();
  var next = function(err) {
    if (err) return callback(err);
    var fn = fns.shift();
    if (!fn) return callback();
    fn(request, next);
  };
  next();
};

// Submit an operation on the named collection/docname. op should contain a
// {op:}, {create:} or {del:} field. It should probably contain a v: field (if
// it doesn't, it defaults to the current version).
Backend.prototype.submit = function(agent, index, id, op, options, callback) {
  var err = ot.checkOp(op);
  if (err) return callback(err);
  var request = new SubmitRequest(this, agent, index, id, op, options);
  var backend = this;
  backend.trigger('submit', agent, request, function(err) {
    if (err) return callback(err);
    request.submit(function(err) {
      if (err) return callback(err);
      backend.trigger('after submit', agent, request, function(err) {
        if (err) return callback(err);
        backend._sanitizeOps(agent, request.projection, request.collection, id, request.ops, function(err) {
          if (err) return callback(err);
          backend.emit('timing', 'submit.total', Date.now() - request.start, request);
          callback(err, request.ops);
        });
      });
    });
  });
};

Backend.prototype._sanitizeOp = function(agent, projection, collection, id, op, callback) {
  if (projection) {
    try {
      projections.projectOp(projection.fields, op);
    } catch (err) {
      return callback(err);
    }
  }
  this.trigger('op', agent, {collection: collection, id: id, op: op}, callback);
};
Backend.prototype._sanitizeOps = function(agent, projection, collection, id, ops, callback) {
  var backend = this;
  async.each(ops, function(op, eachCb) {
    backend._sanitizeOp(agent, projection, collection, id, op, eachCb);
  }, callback);
};
Backend.prototype._sanitizeOpsBulk = function(agent, projection, collection, opsMap, callback) {
  var backend = this;
  async.forEachOf(opsMap, function(ops, id, eachCb) {
    backend._sanitizeOps(agent, projection, collection, id, ops, eachCb);
  }, callback);
};

Backend.prototype._sanitizeSnapshot = function(agent, projection, collection, id, snapshot, callback) {
  if (projection) {
    try {
      projections.projectSnapshot(projection.fields, snapshot);
    } catch (err) {
      return callback(err);
    }
  }
  this.trigger('doc', agent, {collection: collection, id: id, snapshot: snapshot}, callback);
};
Backend.prototype._sanitizeSnapshots = function(agent, projection, collection, snapshots, callback) {
  var backend = this;
  async.each(snapshots, function(snapshot, eachCb) {
    backend._sanitizeSnapshot(agent, projection, collection, snapshot.id, snapshot, eachCb);
  }, callback);
};
Backend.prototype._sanitizeSnapshotBulk = function(agent, projection, collection, snapshotMap, callback) {
  var backend = this;
  async.forEachOf(snapshotMap, function(snapshot, id, eachCb) {
    backend._sanitizeSnapshot(agent, projection, collection, id, snapshot, eachCb);
  }, callback);
};

Backend.prototype._getSnapshotProjection = function(db, projection) {
  return (db.projectsSnapshots) ? null : projection;
};

// Non inclusive - gets ops from [from, to). Ie, all relevant ops. If to is
// not defined (null or undefined) then it returns all ops.
Backend.prototype.getOps = function(agent, index, id, from, to, callback) {
  var start = Date.now();
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var backend = this;
  var request = {
    agent: agent,
    index: index,
    collection: collection,
    id: id,
    from: from,
    to: to
  };
  backend.db.getOps(collection, id, from, to, null, function(err, ops) {
    if (err) return callback(err);
    backend._sanitizeOps(agent, projection, collection, id, ops, function(err) {
      if (err) return callback(err);
      backend.emit('timing', 'getOps', Date.now() - start, request);
      callback(err, ops);
    });
  });
};

Backend.prototype.getOpsBulk = function(agent, index, fromMap, toMap, callback) {
  var start = Date.now();
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var backend = this;
  var request = {
    agent: agent,
    index: index,
    collection: collection,
    fromMap: fromMap,
    toMap: toMap
  };
  backend.db.getOpsBulk(collection, fromMap, toMap, null, function(err, opsMap) {
    if (err) return callback(err);
    backend._sanitizeOpsBulk(agent, projection, collection, opsMap, function(err) {
      if (err) return callback(err);
      backend.emit('timing', 'getOpsBulk', Date.now() - start, request);
      callback(err, opsMap);
    });
  });
};

Backend.prototype.fetch = function(agent, index, id, callback) {
  var start = Date.now();
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var fields = projection && projection.fields;
  var backend = this;
  var request = {
    agent: agent,
    index: index,
    collection: collection,
    id: id
  };
  backend.db.getSnapshot(collection, id, fields, null, function(err, snapshot) {
    if (err) return callback(err);
    var snapshotProjection = backend._getSnapshotProjection(backend.db, projection);
    backend._sanitizeSnapshot(agent, snapshotProjection, collection, id, snapshot, function(err) {
      if (err) return callback(err);
      backend.emit('timing', 'fetch', Date.now() - start, request);
      callback(null, snapshot);
    });
  });
};

Backend.prototype.fetchBulk = function(agent, index, ids, callback) {
  var start = Date.now();
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var fields = projection && projection.fields;
  var backend = this;
  var request = {
    agent: agent,
    index: index,
    collection: collection,
    ids: ids
  };
  backend.db.getSnapshotBulk(collection, ids, fields, null, function(err, snapshotMap) {
    if (err) return callback(err);
    var snapshotProjection = backend._getSnapshotProjection(backend.db, projection);
    backend._sanitizeSnapshotBulk(agent, snapshotProjection, collection, snapshotMap, function(err) {
      if (err) return callback(err);
      backend.emit('timing', 'fetchBulk', Date.now() - start, request);
      callback(null, snapshotMap);
    });
  });
};

// Subscribe to the document from the specified version or null version
Backend.prototype.subscribe = function(agent, index, id, version, callback) {
  var start = Date.now();
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var channel = this.getDocChannel(collection, id);
  var backend = this;
  var request = {
    agent: agent,
    index: index,
    collection: collection,
    id: id,
    version: version
  };
  backend.pubsub.subscribe(channel, function(err, stream) {
    if (err) return callback(err);
    stream.initProjection(backend, agent, projection);
    if (version == null) {
      // Subscribing from null means that the agent doesn't have a document
      // and needs to fetch it as well as subscribing
      backend.fetch(agent, index, id, function(err, snapshot) {
        if (err) return callback(err);
        backend.emit('timing', 'subscribe.snapshot', Date.now() - start, request);
        callback(null, stream, snapshot);
      });
    } else {
      backend.db.getOps(collection, id, version, null, null, function(err, ops) {
        if (err) return callback(err);
        stream.pushOps(collection, id, ops);
        backend.emit('timing', 'subscribe.ops', Date.now() - start, request);
        callback(null, stream);
      });
    }
  });
};

Backend.prototype.subscribeBulk = function(agent, index, versions, callback) {
  var start = Date.now();
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var backend = this;
  var streams = {};
  var doFetch = Array.isArray(versions);
  var ids = (doFetch) ? versions : Object.keys(versions);
  var request = {
    agent: agent,
    index: index,
    collection: collection,
    versions: versions
  };
  async.each(ids, function(id, eachCb) {
    var channel = backend.getDocChannel(collection, id);
    backend.pubsub.subscribe(channel, function(err, stream) {
      if (err) return eachCb(err);
      stream.initProjection(backend, agent, projection);
      streams[id] = stream;
      eachCb();
    });
  }, function(err) {
    if (err) {
      destroyStreams(streams);
      return callback(err);
    }
    if (doFetch) {
      // If an array of ids, get current snapshots
      backend.fetchBulk(agent, index, ids, function(err, snapshotMap) {
        if (err) {
          destroyStreams(streams);
          return callback(err);
        }
        backend.emit('timing', 'subscribeBulk.snapshot', Date.now() - start, request);
        callback(null, streams, snapshotMap);
      });
    } else {
      // If a versions map, get ops since requested versions
      backend.db.getOpsBulk(collection, versions, null, null, function(err, opsMap) {
        if (err) {
          destroyStreams(streams);
          return callback(err);
        }
        for (var id in opsMap) {
          var ops = opsMap[id];
          streams[id].pushOps(collection, id, ops);
        }
        backend.emit('timing', 'subscribeBulk.ops', Date.now() - start, request);
        callback(null, streams);
      });
    }
  });
};
function destroyStreams(streams) {
  for (var id in streams) {
    streams[id].destroy();
  }
}

Backend.prototype.queryFetch = function(agent, index, query, options, callback) {
  var start = Date.now();
  var backend = this;
  backend._triggerQuery(agent, index, query, options, function(err, request) {
    if (err) return callback(err);
    backend._query(agent, request, function(err, snapshots, extra) {
      if (err) return callback(err);
      backend.emit('timing', 'queryFetch', Date.now() - start, request);
      callback(null, snapshots, extra);
    });
  });
};

// Options can contain:
// db: The name of the DB (if the DB is specified in the otherDbs when the backend instance is created)
// skipPoll: function(collection, id, op, query) {return true or false; }
//  this is a syncronous function which can be used as an early filter for
//  operations going through the system to reduce the load on the DB.
// pollDebounce: Minimum delay between subsequent database polls. This is
//  used to batch updates to reduce load on the database at the expense of
//  liveness
Backend.prototype.querySubscribe = function(agent, index, query, options, callback) {
  var start = Date.now();
  var backend = this;
  backend._triggerQuery(agent, index, query, options, function(err, request) {
    if (err) return callback(err);
    if (request.db.disableSubscribe) {
      return callback({code: 4002, message: 'DB does not support subscribe'});
    }
    backend.pubsub.subscribe(request.channel, function(err, stream) {
      if (err) return callback(err);
      stream.initProjection(backend, agent, request.projection);
      if (options.ids) {
        var queryEmitter = new QueryEmitter(request, stream, options.ids);
        backend.emit('timing', 'querySubscribe.reconnect', Date.now() - start, request);
        callback(null, queryEmitter);
        return;
      }
      // Issue query on db to get our initial results
      backend._query(agent, request, function(err, snapshots, extra) {
        if (err) {
          stream.destroy();
          return callback(err);
        }
        var ids = pluckIds(snapshots);
        var queryEmitter = new QueryEmitter(request, stream, ids, extra);
        backend.emit('timing', 'querySubscribe.initial', Date.now() - start, request);
        callback(null, queryEmitter, snapshots, extra);
      });
    });
  });
};

Backend.prototype._triggerQuery = function(agent, index, query, options, callback) {
  var projection = this.projections[index];
  var collection = (projection) ? projection.target : index;
  var fields = projection && projection.fields;
  var request = {
    index: index,
    collection: collection,
    projection: projection,
    fields: fields,
    channel: this.getCollectionChannel(collection),
    query: query,
    options: options,
    db: null,
    snapshotProjection: null,
  };
  var backend = this;
  backend.trigger('query', agent, request, function(err) {
    if (err) return callback(err);
    // Set the DB reference for the request after the middleware trigger so
    // that the db option can be changed in middleware
    request.db = (options.db) ? backend.extraDbs[options.db] : backend.db;
    if (!request.db) return callback({code: 4003, message: 'DB not found'});
    request.snapshotProjection = backend._getSnapshotProjection(request.db, projection);
    callback(null, request);
  });
};

Backend.prototype._query = function(agent, request, callback) {
  var backend = this;
  request.db.query(request.collection, request.query, request.fields, request.options, function(err, snapshots, extra) {
    if (err) return callback(err);
    backend._sanitizeSnapshots(agent, request.snapshotProjection, request.collection, snapshots, function(err) {
      callback(err, snapshots, extra);
    });
  });
};

Backend.prototype.getCollectionChannel = function(collection) {
  return collection;
};

Backend.prototype.getDocChannel = function(collection, id) {
  return collection + '.' + id;
};

Backend.prototype.getChannels = function(collection, id) {
  return [
    this.getCollectionChannel(collection),
    this.getDocChannel(collection, id)
  ];
};

function pluckIds(snapshots) {
  var ids = [];
  for (var i = 0; i < snapshots.length; i++) {
    ids.push(snapshots[i].id);
  }
  return ids;
}


/***/ }),
/* 53 */
/***/ (function(module, exports) {

var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) bits += expandBy;
                else throw new Error('too many ID collisions, use more bits')
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

var inherits = __webpack_require__(23).inherits;
var Readable = __webpack_require__(24).Readable;
var util = __webpack_require__(3);

// Stream of operations. Subscribe returns one of these
function OpStream() {
  Readable.call(this, {objectMode: true});

  this.id = null;
  this.backend = null;
  this.agent = null;
  this.projection = null;

  this.open = true;
}
module.exports = OpStream;

inherits(OpStream, Readable);

// This function is for notifying us that the stream is empty and needs data.
// For now, we'll just ignore the signal and assume the reader reads as fast
// as we fill it. I could add a buffer in this function, but really I don't
// think that is any better than the buffer implementation in nodejs streams
// themselves.
OpStream.prototype._read = util.doNothing;

OpStream.prototype.initProjection = function(backend, agent, projection) {
  this.backend = backend;
  this.agent = agent;
  this.projection = projection;
};

OpStream.prototype.pushOp = function(collection, id, op) {
  if (this.backend) {
    var stream = this;
    this.backend._sanitizeOp(this.agent, this.projection, collection, id, op, function(err) {
      if (!stream.open) return;
      stream.push(err ? {error: err} : op);
    });
  } else {
    // Ignore any messages after unsubscribe
    if (!this.open) return;
    this.push(op);
  }
};

OpStream.prototype.pushOps = function(collection, id, ops) {
  for (var i = 0; i < ops.length; i++) {
    this.pushOp(collection, id, ops[i]);
  }
};

OpStream.prototype.destroy = function() {
  if (!this.open) return;
  this.open = false;

  this.push(null);
  this.emit('close');
};


/***/ }),
/* 55 */
/***/ (function(module, exports) {

module.exports = arrayDiff;

// Based on some rough benchmarking, this algorithm is about O(2n) worst case,
// and it can compute diffs on random arrays of length 1024 in about 34ms,
// though just a few changes on an array of length 1024 takes about 0.5ms

arrayDiff.InsertDiff = InsertDiff;
arrayDiff.RemoveDiff = RemoveDiff;
arrayDiff.MoveDiff = MoveDiff;

function InsertDiff(index, values) {
  this.index = index;
  this.values = values;
}
InsertDiff.prototype.type = 'insert';
InsertDiff.prototype.toJSON = function() {
  return {
    type: this.type,
    index: this.index,
    values: this.values
  };
};

function RemoveDiff(index, howMany) {
  this.index = index;
  this.howMany = howMany;
}
RemoveDiff.prototype.type = 'remove';
RemoveDiff.prototype.toJSON = function() {
  return {
    type: this.type,
    index: this.index,
    howMany: this.howMany
  };
};

function MoveDiff(from, to, howMany) {
  this.from = from;
  this.to = to;
  this.howMany = howMany;
}
MoveDiff.prototype.type = 'move';
MoveDiff.prototype.toJSON = function() {
  return {
    type: this.type,
    from: this.from,
    to: this.to,
    howMany: this.howMany
  };
};

function strictEqual(a, b) {
  return a === b;
}

function arrayDiff(before, after, equalFn) {
  if (!equalFn) equalFn = strictEqual;

  // Find all items in both the before and after array, and represent them
  // as moves. Many of these "moves" may end up being discarded in the last
  // pass if they are from an index to the same index, but we don't know this
  // up front, since we haven't yet offset the indices.
  //
  // Also keep a map of all the indices accounted for in the before and after
  // arrays. These maps are used next to create insert and remove diffs.
  var beforeLength = before.length;
  var afterLength = after.length;
  var moves = [];
  var beforeMarked = {};
  var afterMarked = {};
  for (var beforeIndex = 0; beforeIndex < beforeLength; beforeIndex++) {
    var beforeItem = before[beforeIndex];
    for (var afterIndex = 0; afterIndex < afterLength; afterIndex++) {
      if (afterMarked[afterIndex]) continue;
      if (!equalFn(beforeItem, after[afterIndex])) continue;
      var from = beforeIndex;
      var to = afterIndex;
      var howMany = 0;
      do {
        beforeMarked[beforeIndex++] = afterMarked[afterIndex++] = true;
        howMany++;
      } while (
        beforeIndex < beforeLength &&
        afterIndex < afterLength &&
        equalFn(before[beforeIndex], after[afterIndex]) &&
        !afterMarked[afterIndex]
      );
      moves.push(new MoveDiff(from, to, howMany));
      beforeIndex--;
      break;
    }
  }

  // Create a remove for all of the items in the before array that were
  // not marked as being matched in the after array as well
  var removes = [];
  for (beforeIndex = 0; beforeIndex < beforeLength;) {
    if (beforeMarked[beforeIndex]) {
      beforeIndex++;
      continue;
    }
    var index = beforeIndex;
    var howMany = 0;
    while (beforeIndex < beforeLength && !beforeMarked[beforeIndex++]) {
      howMany++;
    }
    removes.push(new RemoveDiff(index, howMany));
  }

  // Create an insert for all of the items in the after array that were
  // not marked as being matched in the before array as well
  var inserts = [];
  for (var afterIndex = 0; afterIndex < afterLength;) {
    if (afterMarked[afterIndex]) {
      afterIndex++;
      continue;
    }
    var index = afterIndex;
    var howMany = 0;
    while (afterIndex < afterLength && !afterMarked[afterIndex++]) {
      howMany++;
    }
    var values = after.slice(index, index + howMany);
    inserts.push(new InsertDiff(index, values));
  }

  var insertsLength = inserts.length;
  var removesLength = removes.length;
  var movesLength = moves.length;
  var i, j;

  // Offset subsequent removes and moves by removes
  var count = 0;
  for (i = 0; i < removesLength; i++) {
    var remove = removes[i];
    remove.index -= count;
    count += remove.howMany;
    for (j = 0; j < movesLength; j++) {
      var move = moves[j];
      if (move.from >= remove.index) move.from -= remove.howMany;
    }
  }

  // Offset moves by inserts
  for (i = insertsLength; i--;) {
    var insert = inserts[i];
    var howMany = insert.values.length;
    for (j = movesLength; j--;) {
      var move = moves[j];
      if (move.to >= insert.index) move.to -= howMany;
    }
  }

  // Offset the to of moves by later moves
  for (i = movesLength; i-- > 1;) {
    var move = moves[i];
    if (move.to === move.from) continue;
    for (j = i; j--;) {
      var earlier = moves[j];
      if (earlier.to >= move.to) earlier.to -= move.howMany;
      if (earlier.to >= move.from) earlier.to += move.howMany;
    }
  }

  // Only output moves that end up having an effect after offsetting
  var outputMoves = [];

  // Offset the from of moves by earlier moves
  for (i = 0; i < movesLength; i++) {
    var move = moves[i];
    if (move.to === move.from) continue;
    outputMoves.push(move);
    for (j = i + 1; j < movesLength; j++) {
      var later = moves[j];
      if (later.from >= move.from) later.from -= move.howMany;
      if (later.from >= move.to) later.from += move.howMany;
    }
  }

  return removes.concat(outputMoves, inserts);
}


/***/ }),
/* 56 */
/***/ (function(module, exports) {

var pSlice = Array.prototype.slice;
var Object_keys = typeof Object.keys === 'function'
    ? Object.keys
    : function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }
;

var deepEqual = module.exports = function (actual, expected) {
  // enforce Object.is +0 !== -0
  if (actual === 0 && expected === 0) {
    return areZerosEqual(actual, expected);

  // 7.1. All identical values are equivalent, as determined by ===.
  } else if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  } else if (isNumberNaN(actual)) {
    return isNumberNaN(expected);

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function isNumberNaN(value) {
  // NaN === NaN -> false
  return typeof value == 'number' && value !== value;
}

function areZerosEqual(zeroA, zeroB) {
  // (1 / +0|0) -> Infinity, but (1 / -0) -> -Infinity and (Infinity !== -Infinity)
  return (1 / zeroA) === (1 / zeroB);
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;

  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b);
  }
  try {
    var ka = Object_keys(a),
        kb = Object_keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

var Duplex = __webpack_require__(24).Duplex;
var inherits = __webpack_require__(23).inherits;
var util = __webpack_require__(3);

function StreamSocket() {
  this.readyState = 0;
  this.stream = new ServerStream(this);
}
module.exports = StreamSocket;

StreamSocket.prototype._open = function() {
  if (this.readyState !== 0) return;
  this.readyState = 1;
  this.onopen();
};
StreamSocket.prototype.close = function(reason) {
  if (this.readyState === 3) return;
  this.readyState = 3;
  // Signal data writing is complete. Emits the 'end' event
  this.stream.push(null);
  this.onclose(reason || 'closed');
};
StreamSocket.prototype.send = function(data) {
  // Data is an object
  this.stream.push(JSON.parse(data));
};
StreamSocket.prototype.onmessage = util.doNothing;
StreamSocket.prototype.onclose = util.doNothing;
StreamSocket.prototype.onerror = util.doNothing;
StreamSocket.prototype.onopen = util.doNothing;


function ServerStream(socket) {
  Duplex.call(this, {objectMode: true});

  this.socket = socket;

  this.on('error', function(error) {
    console.warn('ShareDB client message stream error', error);
    socket.close('stopped');
  });

  // The server ended the writable stream. Triggered by calling stream.end()
  // in agent.close()
  this.on('finish', function() {
    socket.close('stopped');
  });
}
inherits(ServerStream, Duplex);

ServerStream.prototype.isServer = true;

ServerStream.prototype._read = util.doNothing;

ServerStream.prototype._write = function(chunk, encoding, callback) {
  var socket = this.socket;
  process.nextTick(function() {
    if (socket.readyState !== 1) return;
    socket.onmessage({data: JSON.stringify(chunk)});
    callback();
  });
};


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

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
const TypedEventEmitter_1 = __webpack_require__(59);
const guid_1 = __webpack_require__(60);
const _ = __webpack_require__(5);
exports.userColors = [
    ['#A80000', '#B05E0D', '#C19C00', '#107C10', '#038387', '#004E8C', '#5C126B']
];
var TypingStatus;
(function (TypingStatus) {
    TypingStatus[TypingStatus["IDLE"] = 0] = "IDLE";
    TypingStatus[TypingStatus["ACTIVE"] = 1] = "ACTIVE";
    TypingStatus[TypingStatus["IDLE_TYPED"] = 2] = "IDLE_TYPED";
})(TypingStatus = exports.TypingStatus || (exports.TypingStatus = {}));
;
;
;
;
;
;
;
;
;
;
class ArboretumChat extends TypedEventEmitter_1.TypedEventEmitter {
    constructor(sdb) {
        super();
        this.sdb = sdb;
        this.userJoined = this.registerEvent();
        this.userNotPresent = this.registerEvent();
        this.userTypingStatusChanged = this.registerEvent();
        this.messageAdded = this.registerEvent();
        this.ready = this.registerEvent();
        this.doc = this.sdb.get('arboretum', 'chat');
        this.initialized = this.initializeDoc();
        this.initialized.catch((err) => {
            console.error(err);
        });
    }
    ;
    initializeDoc() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.doc.createIfEmpty({
                users: [],
                messages: [],
                colors: _.shuffle(_.sample(exports.userColors))
            });
            this.doc.subscribe((op, source, data) => {
                if (op) {
                    const opInfo = op[0];
                    const { p, li } = opInfo;
                    if (p[0] === 'users') {
                        if (p.length === 2 && li) {
                            this.emit(this.userJoined, {
                                user: li
                            });
                        }
                        else if (p.length === 3 && p[2] === 'present') {
                            const userIndex = p[1];
                            const user = this.doc.getData().users[userIndex];
                            this.emit(this.userNotPresent, { user });
                        }
                    }
                    else if (p[0] === 'messages') {
                        this.emit(this.messageAdded, {
                            message: li
                        });
                    }
                }
                else {
                    this.emit(this.ready);
                }
            });
        });
    }
    ;
    getMe() {
        return this.meUser;
    }
    ;
    getColor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const { colors } = data;
            const index = guid_1.guidIndex(id) % colors.length;
            return colors[index];
        });
    }
    ;
    addUser(displayName, isMe = true, present = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = guid_1.guid();
            const color = yield this.getColor(id);
            const user = { id, color, displayName, present, typing: TypingStatus.IDLE };
            yield this.initialized;
            const data = this.doc.getData();
            yield this.doc.submitOp([{ p: ['users', data.users.length], li: user }]);
            if (isMe) {
                this.meUser = user;
            }
            return user;
        });
    }
    ;
    addTextMessage(content, sender = this.getMe()) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const timestamp = (new Date()).getTime();
            const data = this.doc.getData();
            const message = { sender, timestamp, content };
            yield this.doc.submitOp([{ p: ['messages', data.messages.length], li: message }]);
        });
    }
    ;
    getUserIndex(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            for (let i = 0; i < data.users.length; i++) {
                const u = data.users[i];
                if (user.id === u.id) {
                    return i;
                }
            }
            return -1;
        });
    }
    ;
    markUserNotPresent(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const userIndex = yield this.getUserIndex(user);
            const oldValue = data.users[userIndex].present;
            yield this.doc.submitOp([{ p: ['users', userIndex, 'present'], od: oldValue, oi: false }]);
        });
    }
    ;
    setUserTypingStatus(user, typingStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const userIndex = yield this.getUserIndex(user);
            const oldValue = data.users[userIndex].typing;
            yield this.doc.submitOp([{ p: ['users', userIndex, 'typing'], od: oldValue, oi: typingStatus }]);
        });
    }
    ;
    getMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            return data.messages;
        });
    }
    ;
    getUsers(onlyPresent = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            const data = this.doc.getData();
            const { users } = data;
            if (onlyPresent) {
                return users.filter((u) => u.present);
            }
            else {
                return users;
            }
        });
    }
    ;
}
ArboretumChat.userCounter = 1;
exports.ArboretumChat = ArboretumChat;
;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/******************************************************************************
 * The MIT License (MIT)                                                      *
 *                                                                            *
 * Copyright (c) 2016 Simon "Tenry" Burchert                                  *
 *                                                                            *
 * Permission is hereby granted, free of charge, to any person obtaining a    *
 * copy of this software and associated documentation files (the "Software"), *
 * to deal in the Software without restriction, including without limitation  *
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,   *
 * and/or sell copies of the Software, and to permit persons to whom the      *
 * Software is furnished to do so, subject to the following conditions:       *
 *                                                                            *
 * The above copyright notice and this permission notice shall be included in *
 * all copies or substantial portions of the Software.                        *
 *                                                                            *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,   *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL    *
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING    *
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER        *
 * EALINGS IN THE SOFTWARE.                                                   *
 ******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
class TypedEventEmitter {
    constructor() {
        this.eventListeners = new Map();
    }
    ;
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [listener]);
        }
        else {
            this.eventListeners.get(event).push(listener);
        }
        return new TypedListener(this, event, listener);
    }
    ;
    once(event, baseListener) {
        const listener = (...args) => {
            const rv = baseListener(...args);
            this.removeListener(event, listener);
            return rv;
        };
        return this.on(event, listener);
    }
    ;
    addListener(event, listener) {
        return this.on(event, listener);
    }
    ;
    removeListener() {
        if (arguments.length == 0) {
            this.eventListeners.clear();
        }
        else if (arguments.length == 1 && typeof arguments[0] == 'object') {
            const id = arguments[0];
            this.removeListener(id.event, id.listener);
        }
        else if (arguments.length >= 1) {
            let event = arguments[0];
            let listener = arguments[1];
            if (this.eventListeners.has(event)) {
                const listeners = this.eventListeners.get(event);
                let idx;
                while (!listener || (idx = listeners.indexOf(listener)) != -1) {
                    listeners.splice(idx, 1);
                }
            }
        }
    }
    ;
    /**
     * Emit event. Calls all bound listeners with args.
     */
    emit(event, ...args) {
        if (this.eventListeners.has(event)) {
            for (let listener of this.eventListeners.get(event)) {
                listener(...args);
            }
        }
    }
    ;
    /**
     * @typeparam T The event handler signature.
     */
    registerEvent() {
        const eventBinder = (handler) => {
            return this.addListener(eventBinder, handler);
        };
        return eventBinder;
    }
    ;
}
exports.TypedEventEmitter = TypedEventEmitter;
;
class TypedListener {
    constructor(owner, event, listener, unbindWhenRun = false) {
        this.owner = owner;
        this.event = event;
        this.listener = listener;
        this.unbindWhenRun = unbindWhenRun;
    }
    ;
    unbind() {
        this.owner.removeListener(this);
    }
    ;
}
exports.TypedListener = TypedListener;
;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}
;
function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
exports.guid = guid;
;
function guidIndex(id) {
    let result = 0;
    for (let i = 0; i < id.length; i++) {
        result += id.charCodeAt(i);
    }
    return result;
}
exports.guidIndex = guidIndex;
;


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(62);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(64)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {
	module.hot.accept("!!../../../node_modules/css-loader/index.js??ref--2-1!../../../node_modules/sass-loader/lib/loader.js??ref--2-2!./browser.scss", function() {
		var newContent = require("!!../../../node_modules/css-loader/index.js??ref--2-1!../../../node_modules/sass-loader/lib/loader.js??ref--2-2!./browser.scss");

		if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];

		var locals = (function(a, b) {
			var key, idx = 0;

			for(key in a) {
				if(!b || a[key] !== b[key]) return false;
				idx++;
			}

			for(key in b) idx--;

			return idx === 0;
		}(content.locals, newContent.locals));

		if(!locals) throw new Error('Aborting CSS HMR due to changed css-modules locals.');

		update(newContent);
	});

	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(63)(true);
// imports


// module
exports.push([module.i, "#buttonSpacer {\n  width: 70px;\n  /*border-bottom: 1px solid #AAA;*/\n  /*background: linear-gradient(to bottom, #BBB 80%, #AAA);*/ }\n\n#tabsBar {\n  display: flex;\n  flex-direction: row;\n  font-size: 13px;\n  font-family: sans-serif;\n  margin: 0px;\n  /*padding: 0px 0px 0px 70px;*/\n  padding: 0px;\n  box-sizing: border-box;\n  -webkit-user-select: none;\n  -webkit-app-region: drag;\n  color: #777;\n  /*height: 23px;*/\n  box-sizing: border-box; }\n  #tabsBar #addTab {\n    display: inline-block;\n    margin: 0;\n    background: linear-gradient(to bottom, #BBB 80%, #AAA); }\n\n/*#tabsBar #addTab:hover {\n    color: #fff;\n    background: rgb(99, 190, 229);\n}\n\n#addTab i {\n    font-size: 12.5px\n}*/\n#tabs {\n  display: flex;\n  flex: 1;\n  padding: 0px;\n  margin: 0px;\n  overflow: hidden; }\n\n.tab {\n  flex: 1;\n  display: flex;\n  border-left: 1px solid #AAA;\n  /*border: 1px solid black;*/\n  list-style: none;\n  white-space: nowrap;\n  /*font-size: 3em;*/\n  border-bottom: 1px solid #aaa;\n  color: #BBB;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n.tab:last-child {\n  border-right: 1px solid #AAA; }\n\n.tab.not-selected {\n  background: linear-gradient(to bottom, #BBB 80%, #AAA); }\n\n.tab.not-selected .closeTab {\n  color: #999; }\n\n.tab.selected {\n  /*background: linear-gradient(to bottom, #e5e5e5 90%, #ddd);*/\n  border-bottom: none;\n  color: #777; }\n\n.tab .tab-img {\n  opacity: 0.4; }\n\n.tab.selected .tab-img {\n  opacity: 1.0;\n  flex: 2; }\n\n.tab-img {\n  height: 18px;\n  max-width: 28px;\n  margin: 2px;\n  margin-right: 2px;\n  display: none; }\n\n.tab-title {\n  /*flex: 1;*/\n  /*padding: 5px 0px 4px 3px;*/ }\n\n.closeTab {\n  /*float: right;*/\n  /*color: red;*/\n  /*text-shadow: 0 0 1px rgba(50, 1, 1, 1);*/\n  padding: 5px; }\n\n.closeTab i {\n  font-size: 12.5px; }\n\n.closeTab:hover {\n  background: #f57777;\n  color: #FFF; }\n\n.tab .tab-title {\n  /*font-size: 5em;*/\n  color: #777;\n  text-overflow: ellipsis;\n  overflow: hidden; }\n\n.tab.selected .tab-title {\n  color: #555; }\n\ntable#server-controls {\n  flex-shrink: 0; }\n  table#server-controls .nav-group-title {\n    padding: 0px; }\n  table#server-controls thead td {\n    text-align: center; }\n  table#server-controls td {\n    padding-left: 5px;\n    padding-right: 0px;\n    margin: auto;\n    vertical-align: top; }\n  table#server-controls tr:active {\n    color: inherit;\n    background-color: inherit;\n    /* color: #fff; */\n    /* background-color: #116cd6; */ }\n  table#server-controls #control_content td {\n    padding-bottom: 0px; }\n  table#server-controls label {\n    margin-bottom: 0px;\n    padding-bottom: 0px; }\n\n.sidebar {\n  width: 350px;\n  height: 100%;\n  display: flex;\n  flex-direction: column; }\n  .sidebar .chat {\n    flex-grow: 1;\n    display: flex;\n    flex-direction: column; }\n\n#chat-box {\n  resize: vertical;\n  flex-grow: 1; }\n\n#chat-form {\n  padding: 10px;\n  flex-shrink: 0; }\n  #chat-form .form-actions {\n    text-align: right; }\n\n.copy_area input {\n  background-color: #FAFAFA;\n  border: 1px solid #CCC;\n  padding: 2px;\n  font-size: 0.9em;\n  text-align: center;\n  width: 90px; }\n\n.copy_area .copy_area .icon {\n  cursor: pointer;\n  color: #AAA; }\n  .copy_area .copy_area .icon:hover {\n    color: #999; }\n\n.chat-avatar {\n  /*font-size: 2em;*/\n  cursor: default;\n  padding: 3px; }\n\n#chat-lines {\n  padding: 10px;\n  flex-grow: 2;\n  overflow-y: auto;\n  overflow-x: hidden;\n  word-wrap: break-word;\n  margin: 0px;\n  border-top: 1px solid #EEE;\n  border-bottom: 1px solid #EEE;\n  white-space: pre-line;\n  /*order: 1;*/ }\n  #chat-lines .from {\n    font-weight: bold;\n    color: navy; }\n  #chat-lines .from::after {\n    content: \": \"; }\n  #chat-lines li {\n    list-style-type: none; }\n  #chat-lines .chat-line {\n    list-style-type: none;\n    margin-top: 2px;\n    padding-top: 2px;\n    margin-bottom: 2px;\n    padding-bottom: 2px;\n    border-bottom: 1px solid #EEE;\n    color: #555; }\n    #chat-lines .chat-line.command {\n      color: #AAA; }\n    #chat-lines .chat-line .snippet {\n      border: 1px solid #AAA;\n      width: 100%; }\n\n#chat-participants {\n  padding-left: 10px;\n  padding-right: 10px;\n  margin-top: 2px;\n  padding-top: 2px;\n  margin-bottom: 2px;\n  padding-bottom: 2px;\n  border-bottom: 1px solid #CCC;\n  flex-shrink: 0; }\n  #chat-participants .participant {\n    font-weight: bold; }\n    #chat-participants .participant.me {\n      text-decoration: underline overline; }\n\n#task_title {\n  color: #999;\n  padding: 10px;\n  margin: 0px;\n  margin-top: 0px;\n  margin-bottom: 0px;\n  flex-shrink: 0; }\n\n#task-name {\n  padding-left: 5px; }\n\n#browser-pane {\n  border-left: none; }\n\n#navBar {\n  display: flex; }\n  #navBar input#url {\n    flex: 1;\n    /*margin: 4px 2px 3px 2px;*/\n    /*font-size: 12px;*/\n    /*padding: 0px 0px 0px 0px;*/\n    padding: 3px;\n    /*height: 100%;*/\n    /*height: 20px;*/\n    box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.2);\n    border: 0px;\n    border-left: 1px solid #bbb;\n    border-top-left-radius: 3px;\n    border-bottom-left-radius: 3px;\n    color: #808080;\n    outline: 0;\n    background: #FFF;\n    /*font-weight: lighter;*/ }\n\nhtml {\n  height: 100%; }\n  html .unselected {\n    display: none; }\n  html #content {\n    height: 100%;\n    overflow: hidden; }\n  html .tab_content {\n    height: 100%; }\n  html webview {\n    display: inline-flex;\n    width: 100%;\n    height: 100%; }\n    html webview.hidden {\n      display: none; }\n", "", {"version":3,"sources":["/home/soney/code/arboretum/src/browser/css/src/browser/css/browser-tabs.scss","/home/soney/code/arboretum/src/browser/css/src/browser/css/browser-sidebar.scss","/home/soney/code/arboretum/src/browser/css/src/browser/css/browser-navbar.scss","/home/soney/code/arboretum/src/browser/css/src/browser/css/browser.scss"],"names":[],"mappings":"AAAA;EACI,YAAW;EACX,kCAAkC;EAClC,2DAA2D,EAC9D;;AAED;EACI,cAAa;EACb,oBAAmB;EACnB,gBAAe;EACf,wBAAuB;EACvB,YAAW;EACX,8BAA8B;EAC9B,aAAY;EACZ,uBAAsB;EACtB,0BAAyB;EACzB,yBAAwB;EAExB,YAAW;EACX,iBAAiB;EACjB,uBAAsB,EAMzB;EApBD;IAgBQ,sBAAqB;IACrB,UAAS;IACT,uDAAsD,EACzD;;AAIL;;;;;;;GAOG;AAEH;EACI,cAAa;EACb,QAAO;EACP,aAAY;EACZ,YAAW;EACX,iBAAgB,EACnB;;AAED;EACI,QAAO;EACP,cAAa;EACb,4BAA2B;EAC3B,4BAA4B;EAC5B,iBAAgB;EAChB,oBAAmB;EACnB,mBAAmB;EACnB,8BAA6B;EAC7B,YAAW;EACX,iBAAgB;EAChB,wBAAuB,EAC1B;;AACD;EACI,6BAA4B,EAC/B;;AACD;EACI,uDAAsD,EACzD;;AACD;EACI,YAAW,EACd;;AACD;EACI,8DAA8D;EAC9D,oBAAmB;EACnB,YAAW,EACd;;AAED;EACI,aAAY,EACf;;AACD;EACI,aAAY;EACZ,QAAO,EACV;;AAED;EACI,aAAY;EACZ,gBAAe;EACf,YAAW;EACX,kBAAiB;EACjB,cAAa,EAChB;;AAED;EACI,YAAY;EACZ,6BAA6B,EAChC;;AAED;EACI,iBAAiB;EACjB,eAAe;EACf,2CAA2C;EAC3C,aAAY,EACf;;AAED;EACI,kBACJ,EAAE;;AAEF;EACI,oBAA8B;EAC9B,YAAW,EACd;;AAGD;EACI,mBAAmB;EACnB,YAAW;EACX,wBAAuB;EACvB,iBAAgB,EACnB;;AACD;EACI,YAAW,EACd;;ACxHD;EACI,eAAc,EA6BjB;EA9BD;IAGQ,aAAY,EACf;EAJL;IAMQ,mBAAkB,EACrB;EAPL;IAUQ,kBAAiB;IACjB,mBAAkB;IAClB,aAAY;IACZ,oBAAmB,EACtB;EAdL;IAiBY,eAAc;IACd,0BAAyB;IACzB,kBAAkB;IAClB,gCAAgC,EACnC;EArBT;IAwBQ,oBAAmB,EACtB;EAzBL;IA2BQ,mBAAkB;IAClB,oBAAmB,EACtB;;AAIL;EACI,aAAY;EACZ,aAAY;EACZ,cAAa;EACb,uBAAsB,EAMzB;EAVD;IAMQ,aAAY;IACZ,cAAa;IACb,uBAAsB,EACzB;;AAIL;EACI,iBAAgB;EAChB,aAAY,EACf;;AAED;EACI,cAAa;EACb,eAAc,EAIjB;EAND;IAIQ,kBAAiB,EACpB;;AAGL;EAEQ,0BAAyB;EACzB,uBAAsB;EACtB,aAAW;EACX,iBAAgB;EAChB,mBAAkB;EAClB,YAAW,EACd;;AARL;EAUQ,gBAAe;EACf,YAAW,EAId;EAfL;IAaY,YAAW,EACd;;AAIT;EACI,mBAAmB;EACnB,gBAAe;EACf,aAAY,EACf;;AAED;EACI,cAAa;EACb,aAAY;EACZ,iBAAgB;EAChB,mBAAkB;EAClB,sBAAqB;EACrB,YAAW;EACX,2BAA0B;EAC1B,8BAA6B;EAC7B,sBAAqB;EACrB,aAAa,EA2BhB;EArCD;IAYQ,kBAAiB;IACjB,YAAW,EACd;EAdL;IAgBQ,cAAa,EAChB;EAjBL;IAmBQ,sBAAqB,EACxB;EApBL;IAsBQ,sBAAqB;IACrB,gBAAe;IACf,iBAAgB;IAChB,mBAAkB;IAClB,oBAAmB;IACnB,8BAA6B;IAC7B,YAAW,EAQd;IApCL;MA8BY,YAAW,EACd;IA/BT;MAiCY,uBAAsB;MACtB,YAAW,EACd;;AAIT;EACI,mBAAkB;EAClB,oBAAmB;EACnB,gBAAe;EACf,iBAAgB;EAChB,mBAAkB;EAClB,oBAAmB;EACnB,8BAA6B;EAC7B,eAAa,EAOhB;EAfD;IAUQ,kBAAiB,EAIpB;IAdL;MAYY,oCAAmC,EACtC;;AAGT;EACI,YAAW;EACX,cAAa;EACb,YAAW;EACX,gBAAe;EACf,mBAAkB;EAClB,eAAc,EACjB;;AAED;EACI,kBAAiB,EACpB;;AAED;EACI,kBAAiB,EACpB;;ACzJD;EACI,cAAa,EAmBhB;EApBD;IAGQ,QAAO;IACP,4BAA4B;IAC5B,oBAAoB;IACpB,6BAA6B;IAC7B,aAAY;IACZ,iBAAiB;IACjB,iBAAiB;IACjB,iDAAgD;IAChD,YAAW;IACX,4BAA2B;IAC3B,4BAA2B;IAC3B,+BAA8B;IAC9B,eAAc;IACd,WAAU;IACV,iBAAgB;IAChB,yBAAyB,EAC5B;;AChBL;EACI,aAAY,EAwBf;EAzBD;IAIQ,cAAa,EAChB;EALL;IAOQ,aAAY;IACZ,iBAAgB,EACnB;EATL;IAaQ,aAAY,EACf;EAdL;IAiBQ,qBAAoB;IACpB,YAAW;IACX,aAAY,EAKf;IAxBL;MAsBY,cAAY,EACf","file":"browser.scss","sourcesContent":["#buttonSpacer {\n    width: 70px;\n    /*border-bottom: 1px solid #AAA;*/\n    /*background: linear-gradient(to bottom, #BBB 80%, #AAA);*/\n}\n\n#tabsBar {\n    display: flex;\n    flex-direction: row;\n    font-size: 13px;\n    font-family: sans-serif;\n    margin: 0px;\n    /*padding: 0px 0px 0px 70px;*/\n    padding: 0px;\n    box-sizing: border-box;\n    -webkit-user-select: none;\n    -webkit-app-region: drag;\n\n    color: #777;\n    /*height: 23px;*/\n    box-sizing: border-box;\n    #addTab {\n        display: inline-block;\n        margin: 0;\n        background: linear-gradient(to bottom, #BBB 80%, #AAA);\n    }\n}\n\n\n/*#tabsBar #addTab:hover {\n    color: #fff;\n    background: rgb(99, 190, 229);\n}\n\n#addTab i {\n    font-size: 12.5px\n}*/\n\n#tabs {\n    display: flex;\n    flex: 1;\n    padding: 0px;\n    margin: 0px;\n    overflow: hidden;\n}\n\n.tab {\n    flex: 1;\n    display: flex;\n    border-left: 1px solid #AAA;\n    /*border: 1px solid black;*/\n    list-style: none;\n    white-space: nowrap;\n    /*font-size: 3em;*/\n    border-bottom: 1px solid #aaa;\n    color: #BBB;\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n.tab:last-child {\n    border-right: 1px solid #AAA;\n}\n.tab.not-selected {\n    background: linear-gradient(to bottom, #BBB 80%, #AAA);\n}\n.tab.not-selected .closeTab {\n    color: #999;\n}\n.tab.selected {\n    /*background: linear-gradient(to bottom, #e5e5e5 90%, #ddd);*/\n    border-bottom: none;\n    color: #777;\n}\n\n.tab .tab-img {\n    opacity: 0.4;\n}\n.tab.selected .tab-img {\n    opacity: 1.0;\n    flex: 2;\n}\n\n.tab-img {\n    height: 18px;\n    max-width: 28px;\n    margin: 2px;\n    margin-right: 2px;\n    display: none;\n}\n\n.tab-title {\n    /*flex: 1;*/\n    /*padding: 5px 0px 4px 3px;*/\n}\n\n.closeTab {\n    /*float: right;*/\n    /*color: red;*/\n    /*text-shadow: 0 0 1px rgba(50, 1, 1, 1);*/\n    padding: 5px;\n}\n\n.closeTab i {\n    font-size: 12.5px\n}\n\n.closeTab:hover {\n    background: rgb(245, 119, 119);\n    color: #FFF;\n}\n\n\n.tab .tab-title {\n    /*font-size: 5em;*/\n    color: #777;\n    text-overflow: ellipsis;\n    overflow: hidden;\n}\n.tab.selected .tab-title {\n    color: #555;\n}\n","table#server-controls {\n    flex-shrink: 0;\n    .nav-group-title {\n        padding: 0px;\n    }\n    thead td {\n        text-align: center;\n    }\n\n    td {\n        padding-left: 5px;\n        padding-right: 0px;\n        margin: auto;\n        vertical-align: top;\n    }\n    tr {\n        &:active {\n            color: inherit;\n            background-color: inherit;\n            /* color: #fff; */\n            /* background-color: #116cd6; */\n        }\n    }\n    #control_content td {\n        padding-bottom: 0px;\n    }\n    label {\n        margin-bottom: 0px;\n        padding-bottom: 0px;\n    }\n}\n\n\n.sidebar {\n    width: 350px;\n    height: 100%;\n    display: flex;\n    flex-direction: column;\n    .chat {\n        flex-grow: 1;\n        display: flex;\n        flex-direction: column;\n    }\n}\n\n\n#chat-box {\n    resize: vertical;\n    flex-grow: 1;\n}\n\n#chat-form {\n    padding: 10px;\n    flex-shrink: 0;\n    .form-actions {\n        text-align: right;\n    }\n}\n\n.copy_area {\n    input {\n        background-color: #FAFAFA;\n        border: 1px solid #CCC;\n        padding:2px;\n        font-size: 0.9em;\n        text-align: center;\n        width: 90px;\n    }\n    .copy_area .icon {\n        cursor: pointer;\n        color: #AAA;\n        &:hover {\n            color: #999;\n        }\n    }\n}\n\n.chat-avatar {\n    /*font-size: 2em;*/\n    cursor: default;\n    padding: 3px;\n}\n\n#chat-lines {\n    padding: 10px;\n    flex-grow: 2;\n    overflow-y: auto;\n    overflow-x: hidden;\n    word-wrap: break-word;\n    margin: 0px;\n    border-top: 1px solid #EEE;\n    border-bottom: 1px solid #EEE;\n    white-space: pre-line;\n    /*order: 1;*/\n    .from {\n        font-weight: bold;\n        color: navy;\n    }\n    .from::after {\n        content: \": \";\n    }\n    li {\n        list-style-type: none;\n    }\n    .chat-line {\n        list-style-type: none;\n        margin-top: 2px;\n        padding-top: 2px;\n        margin-bottom: 2px;\n        padding-bottom: 2px;\n        border-bottom: 1px solid #EEE;\n        color: #555;\n        &.command {\n            color: #AAA;\n        }\n        .snippet {\n            border: 1px solid #AAA;\n            width: 100%;\n        }\n    }\n}\n\n#chat-participants {\n    padding-left: 10px;\n    padding-right: 10px;\n    margin-top: 2px;\n    padding-top: 2px;\n    margin-bottom: 2px;\n    padding-bottom: 2px;\n    border-bottom: 1px solid #CCC;\n    flex-shrink:0;\n    .participant {\n        font-weight: bold;\n        &.me {\n            text-decoration: underline overline;\n        }\n    }\n}\n#task_title {\n    color: #999;\n    padding: 10px;\n    margin: 0px;\n    margin-top: 0px;\n    margin-bottom: 0px;\n    flex-shrink: 0;\n}\n\n#task-name {\n    padding-left: 5px;\n}\n\n#browser-pane {\n    border-left: none;\n}\n","#navBar {\n    display: flex;\n    input#url {\n        flex: 1;\n        /*margin: 4px 2px 3px 2px;*/\n        /*font-size: 12px;*/\n        /*padding: 0px 0px 0px 0px;*/\n        padding: 3px;\n        /*height: 100%;*/\n        /*height: 20px;*/\n        box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.2);\n        border: 0px;\n        border-left: 1px solid #bbb;\n        border-top-left-radius: 3px;\n        border-bottom-left-radius: 3px;\n        color: #808080;\n        outline: 0;\n        background: #FFF;\n        /*font-weight: lighter;*/\n    }\n}\n","@import \"./browser-tabs\";\n@import \"./browser-sidebar\";\n@import \"./browser-navbar\";\nhtml {\n    height: 100%;\n\n    .unselected {\n        display: none;\n    }\n    #content {\n        height: 100%;\n        overflow: hidden;\n    }\n\n\n    .tab_content {\n        height: 100%;\n    }\n\n    webview {\n        display: inline-flex;\n        width: 100%;\n        height: 100%;\n\n        &.hidden {\n            display:none;\n        }\n    }\n}\n"],"sourceRoot":""}]);

// exports


/***/ }),
/* 63 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getTarget = function (target) {
  return document.querySelector(target);
};

var getElement = (function (fn) {
	var memo = {};

	return function(target) {
                // If passing function in options, then use it for resolve "head" element.
                // Useful for Shadow Root style i.e
                // {
                //   insertInto: function () { return document.querySelector("#foo").shadowRoot }
                // }
                if (typeof target === 'function') {
                        return target();
                }
                if (typeof memo[target] === "undefined") {
			var styleTarget = getTarget.call(this, target);
			// Special case to return head of iframe instead of iframe itself
			if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[target] = styleTarget;
		}
		return memo[target]
	};
})();

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(65);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton && typeof options.singleton !== "boolean") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
        if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 65 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ })
/******/ ]);
//# sourceMappingURL=browser_bundle.js.map