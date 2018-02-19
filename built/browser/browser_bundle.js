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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),
/* 1 */
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
/* 2 */
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
const ReactDOM = __webpack_require__(3);
const nav_bar_1 = __webpack_require__(4);
const tabs_1 = __webpack_require__(5);
const sidebar_1 = __webpack_require__(7);
const electron_1 = __webpack_require__(30);
class Arboretum extends React.Component {
    constructor(props) {
        super(props);
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
        this.setSelectedTab = (selectedTab) => {
            this.setState({ selectedTab });
        };
        this.state = {
            selectedTab: null,
            showingSidebar: false,
            serverActive: false
        };
    }
    ;
    setServerActive(active) {
        return __awaiter(this, void 0, void 0, function* () {
            if (active) {
                electron_1.ipcRenderer.send('asynchronous-message', 'startServer');
            }
            else {
                return Promise.resolve({
                    shareURL: '',
                    activeURL: ''
                });
            }
        });
    }
    ;
    render() {
        return React.createElement("div", { className: "window" },
            React.createElement("header", { className: "toolbar toolbar-header" },
                React.createElement(tabs_1.ArboretumTabs, { onSelectTab: this.setSelectedTab, urls: ['http://www.umich.edu/'] }),
                React.createElement(nav_bar_1.ArboretumNavigationBar, { onBack: this.goBack, onForward: this.goForward, onReload: this.reload, onToggleSidebar: this.toggleSidebar, onNavigate: this.navigate })),
            React.createElement("div", { className: "window-content" },
                React.createElement("div", { className: "pane-group" },
                    React.createElement(sidebar_1.ArboretumSidebar, { setServerActive: this.setServerActive, isVisible: this.state.showingSidebar, serverActive: this.state.serverActive }),
                    React.createElement("div", { id: "browser-pane", className: "pane" },
                        React.createElement("div", { id: "content" }, this.state.selectedTab ? this.state.selectedTab.webViewEl : null)))));
    }
    ;
}
exports.Arboretum = Arboretum;
;
ReactDOM.render(React.createElement(Arboretum, null), document.getElementById('arboretum_main'));
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
/* 3 */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ }),
/* 4 */
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
        this.state = {
            urlText: ''
        };
    }
    ;
    render() {
        return React.createElement("div", { id: "navBar" },
            React.createElement("div", { className: "toolbar-actions" },
                React.createElement("div", { className: "btn-group" },
                    React.createElement("button", { onClick: this.backClicked, className: 'btn btn-default btn-mini', id: 'back' },
                        React.createElement("span", { className: 'icon icon-left-open-big' })),
                    React.createElement("button", { onClick: this.forwardClicked, className: 'btn btn-default btn-mini', id: 'forward' },
                        React.createElement("span", { className: 'icon icon-right-open-big' }))),
                React.createElement("div", { className: "btn-group" },
                    React.createElement("button", { onClick: this.reloadClicked, className: 'btn btn-default btn-mini', id: 'reload' },
                        React.createElement("span", { className: 'icon icon-ccw' })),
                    React.createElement("button", { onClick: this.toggleSidebarClicked, className: 'btn btn-default btn-mini', id: 'task' },
                        React.createElement("span", { className: 'icon icon-publish' })))),
            React.createElement("input", { value: this.state.urlText, onChange: this.handleURLChange, onKeyDown: this.urlKeyDown, id: 'url', type: "text", placeholder: "Enter URL or Term to Search" }));
    }
    ;
}
exports.ArboretumNavigationBar = ArboretumNavigationBar;
;
// import * as $ from 'jquery';
// import {remote} from 'electron';
// import * as URL from 'url';
// import {Arboretum} from '../browser_main';
//
// export class URLBar {
//     protected navBarEl:JQuery<HTMLElement> = $('#navBar');
//     protected backButtonEl:JQuery<HTMLElement> = $('#back', this.navBarEl);
//     protected forwardButtonEl:JQuery<HTMLElement> = $('#forward', this.navBarEl);
//     protected refreshStopButtonEl:JQuery<HTMLElement> = $('#reload', this.navBarEl);
//     protected urlInputEl:JQuery<HTMLElement> = $('#url', this.navBarEl);
//     protected requestButtonEl:JQuery<HTMLElement> = $('#task', this.navBarEl);
//     constructor(private arboretum:Arboretum) {
//         this.urlInputEl.on('keydown', (event) => {
//             if(event.which === 13) {
//                 const url:string = this.urlInputEl.val() + '';
//         		const parsedURL = URL.parse(url);
//         		if(!parsedURL.protocol) { parsedURL.protocol = 'http'; }
//                 const formattedURL = URL.format(parsedURL);
//
//                 this.arboretum.loadURL(formattedURL);
//             }
//         }).on('focus', function() {
//             $(this).select();
//         });
//         this.backButtonEl.on('click', (event) => {
//             this.arboretum.goBackPressed();
//             // arboretum.tabs.active.webView[0].goBack();
//         });
//
//         this.forwardButtonEl.on('click', (event) => {
//             this.arboretum.goForwardPressed();
//             // arboretum.tabs.active.webView[0].goForward();
//         });
//
//         this.refreshStopButtonEl.on('click', (event) => {
//             this.arboretum.refreshOrStopPressed();
//             // arboretum.tabs.active.webView[0].reload();
//         });
//
//         this.requestButtonEl.on('click', (event) => {
//             var scriptBar = $('#script_bar');
//
//             if(scriptBar.hasClass('visible')) {
//                 scriptBar.removeClass('visible');
//             } else {
//                 scriptBar.addClass('visible');
//             }
//         });
//     }
// }


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// import * as $ from 'jquery';
// import {Tab, TabID} from './tab';
// import {Arboretum} from '../browser_main';
//
// export class Tabs {
//     private activeTab:Tab;
//     private rootEl:JQuery<HTMLElement> = $('#content');
//     private addTabEl:JQuery<HTMLElement> = $('#addTab');
//     private tabsRowEl:JQuery<HTMLElement> = $('#tabsBar');
//     private tabs:Map<TabID, Tab> = new Map<TabID, Tab>();
//
//     constructor(private arboretum:Arboretum) {
//         this.addTabEl.on('click', () => {
//             this.createNew('', true);
//             // this.resize();
//         });
//     }
//     private createNew(url:string, isSelected:boolean=true):Tab {
//         const theTab = new Tab(url);
//         this.tabs.set(theTab.TabId, theTab);
//         if(isSelected) {
//             this.select(theTab);
//         }
//         return theTab;
//     }
//
//     public select(tab:Tab):void {
//         if(this.activeTab) {
//             this.activeTab.webView.removeClass('show');
//             this.activeTab.content.addClass('unselected');
//             this.activeTab.tab.removeClass('active')
//                            .addClass('not-active');
//         }
//         //arboretum.taskBar.tabs.selected = this.tabs.indexOf(tab);
//         this.activeTab = tab;
//         this.activeTab.webView.addClass('show');
//         this.activeTab.tab.addClass('active')
//                         .removeClass('not-active');
//         this.activeTab.content.removeClass('unselected');
//         document.title = $(this.activeTab[0]).children('.tab-title').text();
//     }
//
// }
Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const tab_1 = __webpack_require__(6);
const _ = __webpack_require__(1);
class ArboretumTabs extends React.Component {
    constructor(props) {
        super(props);
        this.tabCounter = 0;
        this.tabs = new Map();
        this.addTab = () => {
            const tabs = this.state.tabs.map((tab) => {
                return _.extend(tab, { selected: false });
            }).concat([{
                    id: this.tabCounter++,
                    url: 'http://www.umich.edu/',
                    selected: false
                }]);
            this.setState({ tabs });
        };
        this.selectTab = (selectedTab) => {
            if (selectedTab !== this.state.selectedTab) {
                this.tabs.forEach((t) => {
                    t.markSelected(t === selectedTab);
                });
                this.setState({ selectedTab });
                if (this.props.onSelectTab) {
                    this.props.onSelectTab(selectedTab);
                }
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
            this.setState({ tabs });
            this.selectTab(selectedTab);
        };
        this.tabRef = (el) => {
            if (el) {
                this.tabs.set(el.props.tabID, el);
                this.selectTab(el);
            }
        };
        this.state = {
            selectedTab: null,
            tabs: this.props.urls.map((url, index) => {
                return {
                    selected: index === 0,
                    id: this.tabCounter++,
                    url: url
                };
            })
        };
    }
    ;
    render() {
        const tabs = this.state.tabs.map((info, index) => React.createElement(tab_1.ArboretumTab, { ref: this.tabRef, selected: info.selected, key: info.id, tabID: info.id, startURL: info.url, onSelect: this.selectTab, onClose: this.closeTab }));
        return React.createElement("div", { id: "tabsBar", className: "tab-group" },
            React.createElement("div", { id: 'buttonSpacer', className: "tab-item tab-item-fixed" }, " "),
            tabs,
            React.createElement("div", { onClick: this.addTab, className: "tab-item tab-item-fixed", id: 'addTab' },
                React.createElement("span", { className: "icon icon-plus" })));
    }
    ;
}
exports.ArboretumTabs = ArboretumTabs;
;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// import {EventEmitter} from 'events';
// import {Arboretum} from '../browser_main';
//
// export type TabID = number;
//
//
// var cri = require('chrome-remote-interface');
//
// var NavStatus = {
//     START: 'START',
//     RECEIVING: 'RECEIVING',
//     STOP: 'STOP',
//     REDIRECT: 'REDIRECT',
//     FAIL: 'FAIL'
// };
//
// class Tab extends EventEmitter {
//     private static tabNum:number = 0;
//     private tabID:TabID;
//     private titleEl:JQuery<HTMLElement> = $('<span />', {text: 'New Tab', class: 'tab-title'});
//     private iconEl:JQuery<HTMLElement> = $('<span />', {class: 'tab-icon'});
//     private closeButtonEl:JQuery<HTMLElement> =  $('<span />', {class:'icon icon-cancel icon-close-tab'});
//     private webViewEl:JQuery<HTMLElement>;
//     private tabEl:JQuery<HTMLElement>;
//     private contentEl:JQuery<HTMLElement>;
//     constructor(private arboretum:Arboretum) {
//         super();
//         Tab.tabNum++;
//         this.tabID = Tab.tabNum;
//
//         this.webViewEl = $('<webview />', {src: 'http://www.umich.edu/',id:`wv${this.tabID}`});
//         this.tabEl = $('<div />', {class: 'tab-item', id: `li${this.tabID}`});
//         // this.tabLink = $('<a />', {class: 'clickableTab', href: '#tab'+tabNum});
//         this.contentEl = $('<div />', {id: `tab${this.tabID}`, class:'tab_content unselected'}).append(this.webViewEl);
//         // .appendTo(this.arboretum.tabs.root).append(this.webViewEl);
//
//         // this.tabLink.append(icon, title);
//         this.tabEl.append(this.iconEl, this.titleEl, this.closeButtonEl);
//         arboretum.tabs.addTab.before(this.tab);
//
//         this.closeButtonEl.on('click',() => {
//             $(`#tab${this.tabID}`).remove();
//             $(`#li${this.tabID}`).remove();
//             this.arboretum.removeTab(this.tabID);
//             if(this.arboretum.tabs.active === thisTab){
//                var tmp = thisTab.TabId-1;
//                var T = arboretum.tabs.tabs;
//                while(!T[tmp]){
//                     tmp--;
//                }
//                var NewSelectedTab = T[tmp];
//                arboretum.tabs.select(NewSelectedTab);
//             }
//         });
//         this.tabEl.on('click', () => {
//             this.arboretum.selectTab(thisTab);
//         });
//         //
//         // // Subscribing on own events
//         // this.on('Navigation:Status', (status) => {
//         //     this.status = lastStatus = status;
//         //     if(status === NavStatus.START || status === NavStatus.REDIRECT) {
//         //         this.iconEl.html('<paper-spinner class="request backward" active></paper-spinner>');
//         //     } else if(status === NavStatus.RECEIVING){
//         //         this.iconEl.html('<paper-spinner class="yellow" active></paper-spinner>');
//         //     } else if(status === NavStatus.STOP || status === NavStatus.FAIL) {
//         //         if(this.webViewEl[0].getURL() === lastURL && lastFavicon.length){
//         //             this.emit('Favicon:Render');
//         //         } else {
//         //             this.iconEl.html('');
//         //         }
//         //     }
//         // });
//         // this.on('Favicon:Render', () => {
//         //     this.iconEl.html(`<img class="tab-img" src="${lastFavicon}" />`);
//         // });
//         // this.on('Favicon:Update', (URL) => {
//         //     lastURL = this.webViewEl[0].getURL();
//         //     lastFavicon = URL;
//         //     this.favicon = URL;
//         //     if(lastStatus === NavStatus.STOP){
//         //         emit('Favicon:Render');
//         //     }
//         // });
//         // this.on('Title:Update', (titleVal) => {
//         //     title.text(titleVal);
//         //     if(arboretum.tabs.active == this)
//         //        document.title = titleVal;
//         // });
//         //
//         // // WebView Events
//         // this.emit('Navigation:Status', NavStatus.START);
//         // this.webViewEl.attr('src', URL);
//         // this.webViewEl.on('page-title-set', (e) => {
//         //     var event = e.originalEvent;
//         //     this.emit('Title:Update', this.getURL() === 'about:blank' ? 'New Tab' : event.title);
//         // });
//         // this.webView.on('did-start-loading', function() {
//         //     expecting = true;
//         //     this.emit('URL:Update', this.getURL());
//         //     this.emit('Navigation:Status', NavStatus.START);
//         // });
//         // this.webView.on('did-get-redirect-request', function(e) {
//         //     var event = e.originalEvent;
//         //     if(event.isMainFrame){
//         //         this.emit('URL:Update', event.newUrl);
//         //     }
//         // });
//         // this.webViewEl.on('did-stop-loading', () => {
//         //     expecting = false;
//         //     this.emit('Navigation:Status', NavStatus.STOP);
//         // });
//         // this.webViewEl.on('did-fail-load', (event) => {
//         //     this.emit('Navigation:Status', NavStatus.FAIL, {code: event.errorCode, description: event.errorDescription});
//         // });
//         // this.webViewEl.on('page-favicon-updated', (e) => {
//         //     var event = e.originalEvent;
//         //     this.emit('Favicon:Update', event.favicons[0]);
//         // });
//         // this.webViewEl.on('did-get-response-details', (e) => {
//         //     var event = e.originalEvent;
//         //
//         //     if(!expecting) return ;
//         //     expecting = false;
//         //     if(lastStatus !== NavStatus.STOP) {
//         //         this.emit('URL:Update', event.newUrl);
//         //         this.emit('Navigation:Status', NavStatus.RECEIVING);
//         //     }
//         // });
//         // // Listen on extra high-level events
//         // this.listen();
//     }
//     listen() {
//         // let oldURL = null;
//         // this.on('URL:Update', (url) => {
//         //     if(this !== this.arboretum.tabs.active) return void(oldURL = url);
//         //
//         //     if(arboretum.urlBar.urlInput.is(':focus')) {
//         //         if(oldURL === arboretum.urlBar.url) {
//         //             arboretum.urlBar.urlInput.val(url);
//         //         }
//         //     } else {
//         //         arboretum.urlBar.urlInput.val(url);
//         //         oldURL = url;
//         //     }
//         // });
//         //
//         // this.on('Navigation:Status', function(status) {
//         //     if(this !== arboretum.tabs.active) return ;
//         //     arboretum.urlBar.backButton.attr('disabled', !this.webView[0].canGoBack());
//         //     arboretum.urlBar.forwardButton.attr('disabled', !this.webView[0].canGoForward());
//         //     if(status === NavStatus.STOP) {
//         //         arboretum.urlBar.refreshStop.icon = 'refresh';
//         //     } else {
//         //         arboretum.urlBar.refreshStop.icon = 'close';
//         //     }
//         // });
//     }
// }
Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__(0);
const _ = __webpack_require__(1);
class ArboretumTab extends React.Component {
    constructor(props) {
        super(props);
        this.webViewRef = (el) => {
            if (el) {
                this.webView = el;
                this.webView.addEventListener('page-title-updated', (event) => {
                    const { title } = event;
                    this.setState({ title });
                });
                this.webView.addEventListener('load-commit', (event) => {
                    const { isMainFrame, url } = event;
                    if (isMainFrame) {
                        const loadedURL = url;
                        this.setState({ loadedURL });
                    }
                });
                this.webView.addEventListener('page-favicon-updated', (event) => {
                    const { favicons } = event;
                    const favIconURL = favicons[0];
                    this.setState({ favIconURL });
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
            favIconURL: null
        };
        this.webViewEl = React.createElement("webview", { ref: this.webViewRef, src: this.props.startURL });
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
//     private titleEl:JQuery<HTMLElement> = $('<span />', {text: 'New Tab', class: 'tab-title'});
//     private iconEl:JQuery<HTMLElement> = $('<span />', {class: 'tab-icon'});
//     private closeButtonEl:JQuery<HTMLElement> =  $('<span />', {class:'icon icon-cancel icon-close-tab'});
//     private webViewEl:JQuery<HTMLElement>;
//     private tabEl:JQuery<HTMLElement>;
//     private contentEl:JQuery<HTMLElement>;
//     constructor(private arboretum:Arboretum) {
//         super();
//         Tab.tabNum++;
//         this.tabID = Tab.tabNum;
//
//         this.webViewEl = $('<webview />', {src: 'http://www.umich.edu/',id:`wv${this.tabID}`});
//         this.tabEl = $('<div />', {class: 'tab-item', id: `li${this.tabID}`});


/***/ }),
/* 7 */
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
// import {Arboretum} from '../browser_main';
// import {Chat} from './chat';
// import * as Clipboard from 'clipboard';
// // import * as _toggles from 'jquery-toggles';
// import 'jquery-toggles';
//
//
// const API_KEY = 'FN0FXKCHSRapKomlD7JeF4AJQGNZPKf12Tvv9ebA';
// export class Sidebar {
//     private chat:Chat;
//     constructor(private arboretum:Arboretum) {
//         this.chat = new Chat(this.arboretum);
//         $('.sidebar .toggle').toggles({
//             clicker: $('.switch_label'),
//             width: 50
//         }).on('toggle', (event, isActive) => {
//             if (isActive) {
//                 this.startServer();
//             } else {
//                 this.stopServer();
//             }
//         });
//
//         $('#mturk_post').on('click', () => {
//             this.postToMTurk();
//         });
//
//         new Clipboard('#admin_copy');
//         new Clipboard('#share_copy');
//         $('.copy_area input').on('click', (event) => {
//             const target = $(event.target);
//             target.select();
//         });
//
//         this.chat.disable();
//
//         // this.startServer();
//     }
//
//     populateShareURLs() {
//         $('#share_url').val('loading...');
//         $('#admin_url').val('loading...');
//
//         this.getMyShortcut().then(function(url) {
//             $('#share_url').val(url.replace('http://', '')).prop('disabled', false);
//         });
//         this.getMyShortcut('/a').then(function(url) {
//             $('#admin_url').val(url.replace('http://', '')).prop('disabled', false);
//         });
//     }
//
//     startServer() {
//         this.chat.enable();
//         const {ipcRenderer} = require('electron');
//         ipcRenderer.send('asynchronous-message', 'startServer');
//         // this.populateShareURLs();
//         // remote.getCurrentWindow().emit('startServer', () => {
//         //     ipcRenderer.send('asynchronous-message','test');
//         //     this.chat.connect();
//         // });
//     }
//
//     private stopServer():void {
//         ipcRenderer.send('asynchronous-message', 'stopServer');
//         $('#share_url').val('').prop('disabled', true);
//         $('#admin_url').val('').prop('disabled', true);
//         this.chat.clear();
//         this.chat.disable();
//     }
//
//     postToMTurk() {
//         console.log($('#sandbox').is(":checked"));
//
//         remote.getCurrentWindow().emit('postHIT', {
//             share_url: 'http://'+$('#share_url').val(),
//             sandbox: $('#sandbox').is(":checked")
//         }, _.bind(() => {
//             console.log('posted!')
//         }, this));
//     }
//
//     private async getMyShortcut(address:string, path:string):Promise<string> {
//         const url = require('url');
//         return Sidebar.getIPAddress().then(function(ip) {
//             var myLink = url.format({
//                 protocol: 'http',
//                 hostname: ip,
//                 port: 3000,
//                 pathname: path || '/'
//             });
//             return Sidebar.getShortcut(myLink)
//         }).then(function(result) {
//             const shortcut = result.shortcut;
//             return url.format({
//                 protocol: 'http',
//                 hostname: 'arbor.site',
//                 pathname: shortcut
//             });
//         });
//     }
//
//     private static async getShortcut(url:string):Promise<string> {
//         return new Promise<string>((resolve, reject) => {
//             $.ajax({
//                 method: 'PUT',
//                 url: 'https://api.arbor.site',
//                 contentType: 'application/json',
//                 headers: {
//                     'x-api-key': API_KEY
//                 },
//                 data: JSON.stringify({
//                     target: url
//                 })
//             }).done((data) => {
//                 resolve(data);
//             }).fail((err) => {
//                 reject(err);
//             });
//         });
//     }
// }
const React = __webpack_require__(0);
const chat_1 = __webpack_require__(8);
const react_switch_1 = __webpack_require__(22);
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
                    const { shareURL, activeURL } = shareURLs;
                    this.setState({ shareURL, activeURL });
                }
                else {
                    this.setState({ shareURL: '', activeURL: '' });
                }
            }
        });
        this.state = {
            isVisible: this.props.isVisible,
            serverActive: this.props.serverActive,
            shareURL: '',
            activeURL: ''
        };
    }
    ;
    setVisible(isVisible) {
        this.setState({ isVisible });
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
                            React.createElement("input", { id: "share_url", value: "", "data-disabled": "true" }),
                            React.createElement("span", { ref: (el) => (el), "data-clipboard-target": "#share_url", id: "share_copy", className: "icon icon-clipboard" })),
                        React.createElement("td", { className: "copy_area" },
                            React.createElement("input", { id: "admin_url", value: "", "data-disabled": "true" }),
                            React.createElement("span", { ref: (el) => (el), "data-clipboard-target": "#admin_url", id: "admin_copy", className: "icon icon-clipboard" })),
                        React.createElement("td", null,
                            React.createElement("button", { id: "mturk_post", className: 'btn btn-default' },
                                React.createElement("span", { className: "icon icon-upload-cloud" }),
                                "\u00A0Post"),
                            React.createElement("br", null),
                            React.createElement("label", null,
                                React.createElement("input", { type: "checkbox", name: "sandbox", value: "sandbox", id: "sandbox", "data-checked": "checked" }),
                                " Sandbox"))))),
            React.createElement(chat_1.ArboretumChat, null));
    }
    ;
}
exports.ArboretumSidebar = ArboretumSidebar;
;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// import {ipcRenderer} from 'electron';
// import {Arboretum} from '../browser_main';
// import * as _ from 'underscore';
//
// export interface ChatCommand {
//     name:string,
//     description:string,
//     args?:Array<string>,
//     action:(...args:Array<string>)=>void
// };
//
// export class Chat {
//     private COMMANDS:Array<ChatCommand> = [{
//             name: 'clear',
//             description: 'Clear the chat window',
//             action: this.clear
//         }, {
//             name: 'title',
//             description: 'Set the title of the task (use ampersands before variable names, like *&var*)',
//             args: ['description'],
//             action: this.notifySetTitle
//         }, {
//             name: 'help',
//             description: 'Print out this message',
//             action: this.printCommandHelp
//         }, {
//             name: 'set',
//             description: 'Set a variable value',
//             args: ['var', 'val'],
//             action: this.notifySetVar
//         }, {
//             name: 'name',
//             args: ['name'],
//             description: 'Set your chat handle',
//             action: this.setName
//     }];
//
//     constructor(private arboretum:Arboretum) {
//         $('#chat-box').on('keydown', (event) => {
//             if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)) {
//                 event.preventDefault();
//                 $('#chat-form').submit();
//             }
//         });
//         $('#chat-form').on('submit', (event) => {
//             this.sendCurrentTextMessage();
//             event.preventDefault();
//         });
//         // enableChat();
//
//         $('#task').on('click', () => {
//             const script_bar = $('#script_bar');
//             const task_button = $('#task');
//             if (script_bar.is(':hidden')) {
//                 task_button.addClass('active');
//                 script_bar.show();
//             } else {
//                 task_button.removeClass('active');
//                 script_bar.hide();
//             }
//         });
//     }
//
//     private sendIPCMessage(message:string, data?:any):void {
//         return ipcRenderer.send(message, data);
//     };
//
//     private onIPCMessage(message_type:string, responder:(event:any)=>void, context:any=this):()=>void {
//         const func = _.bind(responder, context);
//         ipcRenderer.on.call(ipcRenderer, message_type, func);
//
//         return () => {
//             ipcRenderer.removeListener(message_type, func);
//         };
//     };
//
//     private notifySetVar(fullMessage:string):void {
// 		const trimmedMessage = fullMessage.trim();
// 		var spaceIndex = trimmedMessage.search(/\s/);
// 		if (spaceIndex < 0) {
// 			spaceIndex = fullMessage.length;
// 		}
// 		const name = trimmedMessage.slice(0, spaceIndex);
// 		const value = trimmedMessage.slice(spaceIndex + 1);
//
//         this.sendIPCMessage('chat-set-var', {
//             name: name,
//             value: value
//         });
//     };
//
//     private setVar(name:string, value:string):void {
//         console.log(name, value);
//     }
//     private setName(name:string):void {
// 		this.sendIPCMessage('chat-set-name', {
//             name: name
// 		});
//     }
//
//     private notifySetTitle(title:string):void {
// 		this.sendIPCMessage('chat-set-title', {
// 			value: title
// 		});
//     }
//
//     private setTitle(title:string):void {
//         $('#task-name').text(title);
//     };
//
//     private printCommandHelp(starterLine:string=''):void {
//         const commandDescriptions = this.COMMANDS.map((c) => {
//             let description = `**/${c.name}**`;
//             const args:string = (c.args || []).map((a) => {
//                 return `{${a}}`;
//             }).join(' ');
//             if (args.length > 0) {
//                 description = `${description} ${args}`;
//             }
//             description = `${description}: ${c.description}`;
//             return description;
//         });
//         const commandDescriptionString = `${starterLine}\n${commandDescriptions.join('\n')}`;
//         // this.addTextualChatMessage(false, commandDescriptionString, {
//         //     class: 'command'
//         // });
//     };
//
//     private doCommand(command:string, args:Array<string>):void {
//         const matchingCommands = this.COMMANDS.filter((c) => {
//             return c.name.toUpperCase() === command.toUpperCase();
//         });
//         // this.addTextualChatMessage(false, `/${command} ${args}`, {
//         //     class: 'command'
//         // });
//         if (matchingCommands.length === 0) {
//             this.printCommandHelp(`*/${command} * is not a recognized command`);
//         } else {
//             matchingCommands.forEach((c) => {
//                 c.action.apply(this, args);
//             });
//         }
//     };
//
//     private connect():void {
//         this.sendIPCMessage('chat-connect');
//         // this.removeChatMessageListener = this.onIPCMessage('chat-new-message', (event, data) => {
// 		// 	const {type, sender} = data;
// 		// 	if(type == 'textual') {
// 		// 		const {message} = data;
// 		// 		this.addTextualChatMessage(sender, message);
// 		// 	} else if(type == 'page') {
//         //         const {snippetID} = data;
//         //         this.addPageChatMessage(sender, snippetID);
// 		// 	} else {
//         //         console.log(data);
//         //     }
//         // });
//         // this.removeVarChangedListener = this.onIPCMessage('chat-var-changed', (event, data) => {
//         //     const {name, value} = data;
//         // });
//         // this.removeChatTitleChangedListener = this.onIPCMessage('chat-title-changed', (event, data) => {
//         //     const {value} = data;
//         //     this.setTitle(value);
//         // });
//         //
//         // this.removeChatParticipantsChangedListener = this.onIPCMessage('chat-participants-changed', (event, data) => {
//         //     const {participants} = data;
//         //     this.setParticipants(participants);
//         // });
//     }
//
//     // setParticipants(participants) {
// 	// 	var participantElements = _.map(participants, function(p) {
// 	// 		return $('<span />').html(p.avatar+'&nbsp;')
//     //         .append(p.handle)
//     //         .addClass('chat-avatar')
//     //         .attr({
//     //             title: p.handle
//     //         });
// 	// 	})
//     //     const chatParticipants = $('#chat-participants');
// 	// 	chatParticipants.children().remove();
// 	// 	chatParticipants.append.apply(chatParticipants, participantElements);
//     // }
//     //
//     // addChatMessage(element) {
//     //     const container = $('#chat-lines');
//     //     var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
//     //     container.append(element);
//     //     if (at_bottom) {
//     //         container.scrollTop(container.prop('scrollHeight'));
//     //     }
//     // }
//     //
//     // addTextualChatMessage(sender, message, options) {
//     //     const element = this.getTextualChatMessageElement(sender, message, options);
//     //     this.addChatMessage(element);
//     // }
//     //
//     // addPageChatMessage(sender, snippetID, options) {
//     //     const url = require('url');
//     //     const href = url.format({
//     //         protocol: 'http',
//     //         hostname: 'localhost',
//     //         port: 3000,
//     //         pathname: '/m',
//     //         query: { m: snippetID }
//     //     });
//     //     const element = this.getPageChatMessageElement(sender, href, options);
//     //     this.addChatMessage(element);
//     // }
//     //
//     private clear():void {
//         $('#chat-lines').children().remove();
//     }
//     private disable():void {
//         $('#chat-box').val('').prop('disabled', true).hide();
//         // this.setParticipants([]);
//         // if(this.removeChatMessageListener) {
//         //     this.removeChatMessageListener();
//         // }
//         // if(this.removeVarChangedListener) {
//         //     this.removeVarChangedListener();
//         // }
//         // if(this.removeChatTitleChangedListener) {
//         //     this.removeChatTitleChangedListener();
//         // }
//         // if(this.removeChatParticipantsChangedListener) {
//         //      this.removeChatParticipantsChangedListener()
//         // }
//         this.sendIPCMessage('chat-disconnect');
//     }
//
//     private enable():void {
//         $('#chat-box').prop('disabled', false).show();
//         this.printCommandHelp('Commands:')
//     }
//
//     // getSenderElements(sender, options) {
//     //     var rv = [];
//     //     options = _.extend({
//     //         color: ''
//     //     }, options);
//     //     if(sender) {
//     //         if(sender.avatar) {
//     //             rv.push($('<span />', {
//     //                 html: sender.avatar + "&nbsp;"
//     //             }));
//     //         }
//     //         rv.push($('<span />', {
//     //             class: 'from',
//     //             text: sender.handle,
//     //             style: 'color:' + options.color + ';'
//     //         }));
//     //     }
//     //     return rv;
//     // }
//     //
//     // getTextualChatMessageElement(sender, message, options) {
//     //     options = _.extend({
//     //         class: ''
//     //     }, options);
//     //
//     //     var rv = $('<li />', {
//     //         class: 'chat-line ' + options.class
//     //     });
//     //
//     //     var senderElements = this.getSenderElements(sender, options);
//     //     rv.append.apply(rv, senderElements);
//     //
//     //     rv.append($('<span />', {
//     //         class: 'message',
//     //         html: Chat.mdify(message)
//     //     }));
//     //     return rv;
//     // };
//
//     // private getPageChatMessageElement(sender, href:string, options?:{class:string}):JQuery<HTMLElement> {
//     //     options = _.extend({
//     //         class: ''
//     //     }, options);
//     //
//     //     const rv:JQuery<HTMLElement> = $('<li />', {
//     //         class: 'chat-line ' + options.class
//     //     });
//     //
//     //     const senderElements = this.getSenderElements(sender, options);
//     //     rv.append.apply(rv, senderElements);
//     //
//     //     rv.append($('<iframe />', {
//     //         attr: {
//     //             src: href,
//     //             class: 'snippet'
//     //         },
//     //         css: {
//     //         }
//     //     }));
//     //     return rv;
//     // };
//     //
//     private sendCurrentTextMessage():void {
//         let message:string = $('#chat-box').val() + '';
//         $('#chat-box').val('');
//         if (message) {
//             if (message[0] == '/') {
//                 let spaceIndex = message.search(/\s/);
//                 if (spaceIndex < 0) {
//                     spaceIndex = message.length;
//                 }
//
//                 const command = message.slice(1, spaceIndex);
//                 const args = message.slice(spaceIndex + 1);
//                 this.doCommand(command, args.split(' '));
//             } else {
//                 this.sendIPCMessage('chat-line', {
//                     message: message
//                 });
//             }
//         }
//     }
//
//     static mdify(message:string):string {
//         //  var tmp = document.createElement("DIV");
//         //  tmp.innerHTML = message;
//         //  var rv = tmp.textContent || tmp.innerText || "";
//         var rv = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
//         return rv.replace(/\*\*([^*]+)\*\*/g, "<b>$1<\/b>").replace(/\*([^*]+)\*/g, "<i>$1<\/i>");
//     }
const React = __webpack_require__(0);
const ENTER_KEY = 13;
class ArboretumChat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    ;
    render() {
        return React.createElement("div", { className: 'chat' },
            React.createElement("h6", { id: "task_title" },
                React.createElement("span", { className: "icon icon-chat" }),
                React.createElement("span", { id: 'task-name' }, "Chat")),
            React.createElement("div", { id: "chat-participants" }),
            React.createElement("ul", { id: "chat-lines" }),
            React.createElement("form", { id: "chat-form" },
                React.createElement("textarea", { id: "chat-box", className: "form-control", placeholder: "Send a message" })));
    }
    ;
}
exports.ArboretumChat = ArboretumChat;
;


/***/ }),
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 18 */
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
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),
/* 20 */
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
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var emptyFunction = __webpack_require__(18);

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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _propTypes = __webpack_require__(23);

var _propTypes2 = _interopRequireDefault(_propTypes);

var _icons = __webpack_require__(28);

var _getBackgroundColor = __webpack_require__(29);

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
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/**
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
  module.exports = __webpack_require__(24)(isValidElement, throwOnDirectAccess);
} else {
  // By explicitly using `prop-types` you are opting into new production behavior.
  // http://fb.me/prop-types-in-prod
  module.exports = __webpack_require__(27)();
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var emptyFunction = __webpack_require__(18);
var invariant = __webpack_require__(19);
var warning = __webpack_require__(21);
var assign = __webpack_require__(25);

var ReactPropTypesSecret = __webpack_require__(20);
var checkPropTypes = __webpack_require__(26);

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

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),
/* 25 */
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
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



if (process.env.NODE_ENV !== 'production') {
  var invariant = __webpack_require__(19);
  var warning = __webpack_require__(21);
  var ReactPropTypesSecret = __webpack_require__(20);
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

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var emptyFunction = __webpack_require__(18);
var invariant = __webpack_require__(19);
var ReactPropTypesSecret = __webpack_require__(20);

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
/* 28 */
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
/* 29 */
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
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__dirname) {var fs = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"fs\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()))
var path = __webpack_require__(31)

var pathFile = path.join(__dirname, 'path.txt')

if (fs.existsSync(pathFile)) {
  module.exports = path.join(__dirname, fs.readFileSync(pathFile, 'utf-8'))
} else {
  throw new Error('Electron failed to install correctly, please delete node_modules/electron and try installing again')
}

/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ })
/******/ ]);
//# sourceMappingURL=browser_bundle.js.map