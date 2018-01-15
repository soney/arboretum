"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors = require("colors/safe");
const log = require("loglevel");
var level;
(function (level) {
    level[level["trace"] = 0] = "trace";
    level[level["debug"] = 1] = "debug";
    level[level["info"] = 2] = "info";
    level[level["warn"] = 3] = "warn";
    level[level["error"] = 4] = "error";
    level[level["silent"] = 5] = "silent";
})(level = exports.level || (exports.level = {}));
;
class ColoredLogger {
    constructor(...c) {
        this.l = colors;
        c.forEach((arg) => {
            this.l = this.l[arg];
        });
    }
    ;
    colorize(...a) {
        return a.map((x) => {
            return this.l(x);
        });
    }
    ;
    trace(...a) { console.log(...this.colorize(...a)); }
    ;
    debug(...a) { console.log(...this.colorize(...a)); }
    ;
    info(...a) { console.log(...this.colorize(...a)); }
    ;
    warn(...a) { console.log(...this.colorize(...a)); }
    ;
    error(...a) { console.log(...this.colorize(...a)); }
    ;
    silent(...a) { console.log(...this.colorize(...a)); }
    ;
}
;
function setLevel(l, persist) {
    log.setLevel(l, persist);
}
exports.setLevel = setLevel;
;
function getColoredLogger(...colors) {
    return new ColoredLogger(...colors);
}
exports.getColoredLogger = getColoredLogger;
;
