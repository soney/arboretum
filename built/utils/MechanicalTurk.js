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
const _ = require("underscore");
const fs = require("fs");
const path_1 = require("path");
const MTurk = require("aws-sdk/clients/mturk");
const parse = require("xml-parser");
const dot = require("dot");
const PRODUCTION = 'https://mturk-requester.us-east-1.amazonaws.com';
const SANDBOX = 'https://mturk-requester-sandbox.us-east-1.amazonaws.com';
const REGION = 'us-east-1';
const API_VERSION = '2017-01-17';
class MechanicalTurkWorkerGroup {
    constructor(mturk, workers) {
        this.mturk = mturk;
        this.workers = workers;
    }
    ;
    add(worker) {
        this.workers.add(worker);
    }
    ;
    remove(worker) {
        this.workers.delete(worker);
    }
    ;
    clear() {
        this.workers.clear();
    }
    ;
    has(worker) {
        return this.workers.has(worker);
    }
    ;
    notify(Subject, MessageText) {
        return __awaiter(this, void 0, void 0, function* () {
            const WorkerIds = Array.from(this.workers.values()).map(w => w.getID());
            yield this.mturk.notifyWorkers({ WorkerIds, Subject, MessageText });
        });
    }
    ;
}
exports.MechanicalTurkWorkerGroup = MechanicalTurkWorkerGroup;
;
class MechanicalTurkWorker {
    constructor(mturk, workerId) {
        this.mturk = mturk;
        this.workerId = workerId;
    }
    ;
    getID() {
        return this.workerId;
    }
    ;
    createBlock(Reason) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.createWorkerBlock({ WorkerId: this.getID(), Reason });
        });
    }
    ;
    deleteBlock(Reason = '') {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.deleteWorkerBlock({ WorkerId: this.getID(), Reason });
        });
    }
    ;
    notify(Subject, MessageText) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.notifyWorkers({ WorkerIds: [this.getID()], Subject, MessageText });
        });
    }
    ;
}
exports.MechanicalTurkWorker = MechanicalTurkWorker;
;
class MechanicalTurkHIT {
    constructor(mturk, info) {
        this.mturk = mturk;
        this.info = info;
    }
    ;
    setInfo(info) {
        this.info = info;
    }
    ;
    getID() { return this.info.HITId; }
    ;
    getTitle() { return this.info.Title; }
    ;
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mturk.deleteHIT({ HITId: this.getID() });
        });
    }
    ;
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this.mturk.getRawHIT({ HITId: this.getID() });
            this.setInfo(info);
        });
    }
    ;
    listAssignments() {
        return __awaiter(this, void 0, void 0, function* () {
            const rawAssignments = yield this.mturk.listRawAssignmentsForHIT({ HITId: this.getID() });
            return rawAssignments.map((assignment) => this.mturk.createMechanicalTurkAssignment(this, assignment));
        });
    }
    ;
    updateExpiration(ExpireAt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.updateExpirationForHIT({ HITId: this.getID(), ExpireAt });
        });
    }
    ;
    updateReviewStatus(Revert = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.updateHITReviewStatus({ HITId: this.getID(), Revert });
        });
    }
    ;
    toString() {
        return `HIT ${this.getID()}`;
    }
    ;
}
exports.MechanicalTurkHIT = MechanicalTurkHIT;
;
class MechanicalTurkAssignment {
    constructor(mturk, hit, info) {
        this.mturk = mturk;
        this.hit = hit;
        this.info = info;
    }
    ;
    getID() { return this.info.AssignmentId; }
    ;
    getWorker() {
        return this.mturk.createMechanicalTurkWorker(this.info.WorkerId);
    }
    ;
    getStatus() { return this.info.AssignmentStatus; }
    ;
    getAnswerString() { return this.info.Answer; }
    ;
    approve(OverrideRejection = false, RequesterFeedback = '') {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.approveAssignment({ AssignmentId: this.getID(), OverrideRejection, RequesterFeedback });
        });
    }
    ;
    reject(RequesterFeedback) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mturk.approveAssignment({ AssignmentId: this.getID(), RequesterFeedback });
        });
    }
    ;
    getAnswers() {
        const data = parse(this.getAnswerString());
        const { root } = data;
        const result = new Map();
        root.children.forEach((child) => {
            const { name } = child;
            if (name === 'Answer') {
                const { children } = child;
                let identifier;
                let value;
                children.forEach((c) => {
                    const { name, content } = c;
                    if (name === 'QuestionIdentifier') {
                        identifier = content;
                    }
                    else {
                        value = content;
                    }
                });
                if (identifier && value) {
                    result.set(identifier, value);
                }
            }
        });
        return result;
    }
    ;
}
exports.MechanicalTurkAssignment = MechanicalTurkAssignment;
;
;
class MechanicalTurk {
    constructor(options) {
        this.templates = new Map();
        this.hitCache = new Map();
        this.assignmentCache = new Map();
        this.workerCache = new Map();
        this.options = _.extend({}, MechanicalTurk.DEFAULT_OPTIONS, options);
        const { configFileName } = this.options;
        this.mturk = this.loadConfigFile(configFileName).then((config) => {
            return new MTurk({
                region: REGION,
                endpoint: config.sandbox ? SANDBOX : PRODUCTION,
                accessKeyId: config.access,
                secretAccessKey: config.secret,
                apiVersion: API_VERSION
            });
        }, (err) => {
            throw new Error(`Could not read config file ${configFileName}. See mturk_creds.sample.json for an example format`);
        });
    }
    ;
    registerTemplate(name, templateString, templateSettings) {
        const tempFn = dot.template(templateString, templateSettings);
        this.templates.set(name, tempFn);
    }
    ;
    processTemplateFile(name, path, templateSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileContents = yield getFileContents(path_1.resolve(this.options.templateDirectory, path));
            this.registerTemplate(name, fileContents, templateSettings);
        });
    }
    ;
    createHITFromTemplate(templateName, templateArguments, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.templates.has(templateName)) {
                throw new Error(`Could not find template ${templateName}. Be sure you have called .registerTemplate(name, contents, settings?) or .processTemplateFile(name, path, settings?) beforehand.`);
            }
            const templateFn = this.templates.get(templateName);
            const questionContents = templateFn(templateArguments);
            return this.createHIT(_.extend({}, options, { Question: questionContents }));
        });
    }
    ;
    createMechanicalTurkHIT(info) {
        const { HITId } = info;
        let mturkHIT;
        if (this.hitCache.has(HITId)) {
            mturkHIT = this.hitCache.get(HITId);
            mturkHIT.setInfo(info);
        }
        else {
            mturkHIT = new MechanicalTurkHIT(this, info);
            this.hitCache.set(HITId, mturkHIT);
        }
        return mturkHIT;
    }
    ;
    createMechanicalTurkAssignment(hit, info) {
        const { AssignmentId } = info;
        let mturkAssignment;
        if (this.assignmentCache.has(AssignmentId)) {
            mturkAssignment = this.assignmentCache.get(AssignmentId);
        }
        else {
            mturkAssignment = new MechanicalTurkAssignment(this, hit, info);
            this.assignmentCache.set(AssignmentId, mturkAssignment);
        }
        return mturkAssignment;
    }
    ;
    createMechanicalTurkWorker(WorkerID) {
        let mturkWorker;
        if (this.workerCache.has(WorkerID)) {
            mturkWorker = this.workerCache.get(WorkerID);
        }
        else {
            mturkWorker = new MechanicalTurkWorker(this, WorkerID);
            this.workerCache.set(WorkerID, mturkWorker);
        }
        return mturkWorker;
    }
    ;
    loadConfigFile(fileName) {
        return fileExists(fileName).then((exists) => {
            if (exists) {
                return getFileContents(fileName);
            }
            else {
                throw new Error(`Could not find config file ${fileName}.`);
            }
        }).then((contents) => {
            return JSON.parse(contents);
        });
    }
    ;
    getAccountBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.getAccountBalance({}, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(parseFloat(data.AvailableBalance));
                    }
                });
            });
        });
    }
    ;
    createHIT(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.createHIT(options, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.createMechanicalTurkHIT(data.HIT));
                    }
                });
            });
        });
    }
    ;
    createHITFromFile(questionFileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const questionContents = yield getFileContents(questionFileName);
            return this.createHIT(_.extend({}, options, { Question: questionContents }));
        });
    }
    ;
    getRawHIT(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.getHIT(options, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data.HIT);
                    }
                });
            });
        });
    }
    ;
    getHIT(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const HITResult = yield this.getRawHIT(options);
            return this.createMechanicalTurkHIT(HITResult);
        });
    }
    ;
    deleteHIT(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            yield new Promise((resolve, reject) => {
                mturk.deleteHIT(options, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    listHITs(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.listHITs(options, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data.HITs.map((hit) => this.createMechanicalTurkHIT(hit)));
                    }
                });
            });
        });
    }
    ;
    listRawAssignmentsForHIT(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.listAssignmentsForHIT(options, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data.Assignments);
                    }
                });
            });
        });
    }
    ;
    approveAssignment(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.approveAssignment(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    rejectAssignment(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.rejectAssignment(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    updateExpirationForHIT(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.updateExpirationForHIT(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    updateHITReviewStatus(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.updateHITReviewStatus(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    createWorkerBlock(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.createWorkerBlock(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    deleteWorkerBlock(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.deleteWorkerBlock(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
    notifyWorkers(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const mturk = yield this.mturk;
            return new Promise((resolve, reject) => {
                mturk.notifyWorkers(params, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        });
    }
    ;
}
MechanicalTurk.DEFAULT_OPTIONS = {
    configFileName: path_1.join(__dirname, '..', 'mturk_creds.json'),
    templateDirectory: path_1.join(__dirname, '..', 'templates')
};
exports.MechanicalTurk = MechanicalTurk;
;
function fileExists(fileName) {
    return new Promise((resolve, reject) => {
        fs.access(fileName, fs.constants.R_OK, (err) => {
            if (err) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
function getFileContents(fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
;
