var colors = require('colors/safe'), _ = require('underscore'), log = require('loglevel');
module.exports = {
    setLevel: function () {
        return log.setLevel.apply(log, arguments);
    },
    getColoredLogger: function () {
        var c = colors;
        _.each(arguments, function (arg) {
            c = c[arg];
        });
        var rv = {};
        _.each(log, function (fn, fn_name) {
            rv[fn_name] = function () {
                return fn.apply(log, _.map(arguments, function (arg) {
                    return c(arg);
                }));
            };
        });
        return rv;
    }
};
