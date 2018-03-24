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
const fs = require("fs");
const path = require("path");
function makeDirectoryRecursive(p) {
    return __awaiter(this, void 0, void 0, function* () {
        const splitPath = path.relative(path.resolve('.'), p).split(path.sep);
        for (let i = 0; i < splitPath.length; i++) {
            const dirName = path.join(...splitPath.slice(0, i + 1));
            if (!(yield isDirectory(dirName))) {
                yield makeDirectory(dirName);
            }
        }
    });
}
exports.makeDirectoryRecursive = makeDirectoryRecursive;
;
function makeDirectory(dirName) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirName, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.makeDirectory = makeDirectory;
function isDirectory(dirName) {
    return new Promise((resolve, reject) => {
        fs.access(dirName, fs.constants.F_OK | fs.constants.W_OK, (err) => {
            if (err) {
                resolve(false);
            }
            else {
                fs.stat(dirName, (err, stats) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(stats.isDirectory());
                    }
                });
            }
        });
    });
}
exports.isDirectory = isDirectory;
function readDirectory(dirName) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirName, (err, contents) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(contents);
            }
        });
    });
}
exports.readDirectory = readDirectory;
;
function readFileContents(filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, {
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
        throw (err);
    });
}
exports.readFileContents = readFileContents;
function writeFileContents(filename, contents) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(filename, contents, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.writeFileContents = writeFileContents;
