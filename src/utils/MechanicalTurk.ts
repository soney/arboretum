import * as _ from 'underscore';
import * as fs from 'fs';
import {join, resolve} from 'path';
import AWS = require('aws-sdk');
import MTurk = require('aws-sdk/clients/mturk');
import parse = require('xml-parser');
import dot = require('dot');

const PRODUCTION:string = 'https://mturk-requester.us-east-1.amazonaws.com';
const SANDBOX:string = 'https://mturk-requester-sandbox.us-east-1.amazonaws.com';
const REGION:string = 'us-east-1';
const API_VERSION:string = '2017-01-17';

export class MechanicalTurkWorkerGroup {
    constructor(private mturk:MechanicalTurk, private workers:Set<MechanicalTurkWorker>) { };
    public add(worker:MechanicalTurkWorker):void {
        this.workers.add(worker);
    };
    public remove(worker:MechanicalTurkWorker):void {
        this.workers.delete(worker);
    };
    public clear():void {
        this.workers.clear();
    };
    public has(worker:MechanicalTurkWorker):boolean {
        return this.workers.has(worker);
    };
    public async notify(Subject:string, MessageText:string):Promise<void> {
        const WorkerIds = Array.from(this.workers.values()).map(w => w.getID());
        await this.mturk.notifyWorkers({WorkerIds, Subject, MessageText});
    };
};

export class MechanicalTurkWorker {
    constructor(private mturk:MechanicalTurk, private workerId:string) {
    };
    public getID():string {
        return this.workerId;
    };
    public async createBlock(Reason:string):Promise<void> {
        await this.mturk.createWorkerBlock({WorkerId: this.getID(), Reason});
    };
    public async deleteBlock(Reason:string=''):Promise<void> {
        await this.mturk.deleteWorkerBlock({WorkerId: this.getID(), Reason});
    };
    public async notify(Subject:string, MessageText:string):Promise<void> {
        await this.mturk.notifyWorkers({WorkerIds: [this.getID()], Subject, MessageText});
    };
};

export class MechanicalTurkHIT {
    constructor(private mturk:MechanicalTurk, private info:MTurk.HIT) {
    };
    public setInfo(info:MTurk.HIT) {
        this.info = info;
    };
    public getID():string { return this.info.HITId; };
    public getTitle():string { return this.info.Title; };

    public async delete():Promise<void> {
        return this.mturk.deleteHIT({HITId: this.getID()});
    };
    public async refresh():Promise<void> {
        const info = await this.mturk.getRawHIT({HITId: this.getID()});
        this.setInfo(info);
    };
    public async listAssignments():Promise<Array<MechanicalTurkAssignment>> {
        const rawAssignments = await this.mturk.listRawAssignmentsForHIT({HITId: this.getID()});
        return rawAssignments.map((assignment:MTurk.Assignment) => this.mturk.createMechanicalTurkAssignment(this, assignment));
    };
    public async updateExpiration(ExpireAt:Date):Promise<void> {
        await this.mturk.updateExpirationForHIT({HITId: this.getID(), ExpireAt});
    };
    public async updateReviewStatus(Revert:boolean=false):Promise<void> {
        await this.mturk.updateHITReviewStatus({HITId: this.getID(), Revert});
    };
    public toString():string {
        return `HIT ${this.getID()}`;
    };
};
export class MechanicalTurkAssignment {
    constructor(private mturk:MechanicalTurk, private hit:MechanicalTurkHIT, private info:MTurk.Assignment) { };
    public getID():string { return this.info.AssignmentId; };
    public getWorker():MechanicalTurkWorker {
        return this.mturk.createMechanicalTurkWorker(this.info.WorkerId);
    };
    public getStatus():string { return this.info.AssignmentStatus; };
    public getAnswerString():string { return this.info.Answer; };
    public async approve(OverrideRejection:boolean = false, RequesterFeedback:string = ''):Promise<void> {
        await this.mturk.approveAssignment({ AssignmentId: this.getID(), OverrideRejection, RequesterFeedback });
    };
    public async reject(RequesterFeedback:string):Promise<void> {
        await this.mturk.approveAssignment({ AssignmentId: this.getID(), RequesterFeedback });
    };
    public getAnswers():Map<string, string> {
        const data = parse(this.getAnswerString());
        const {root} = data;
        const result:Map<string, string> = new Map<string, string>();
        root.children.forEach((child) => {
            const {name} = child;
            if(name === 'Answer') {
                const {children} = child;
                let identifier:string;
                let value:string;
                children.forEach((c) => {
                    const {name, content} = c;
                    if(name === 'QuestionIdentifier') {
                        identifier = content;
                    } else {
                        value = content;
                    }
                });
                if(identifier && value) {
                    result.set(identifier, value);
                }
            }
        });
        return result;
    };
};

export interface MechanicalTurkOptions {
    configFileName:string,
    templateDirectory:string
};

export class MechanicalTurk {
    private mturk:Promise<MTurk>;
    private templates:Map<string, dot.RenderFunction> = new Map<string, dot.RenderFunction>();
    private hitCache:Map<string, MechanicalTurkHIT> = new Map<string, MechanicalTurkHIT>();
    private assignmentCache:Map<string, MechanicalTurkAssignment> = new Map<string, MechanicalTurkAssignment>();
    private workerCache:Map<string, MechanicalTurkWorker> = new Map<string, MechanicalTurkWorker>();
    private options:MechanicalTurkOptions;
    private static DEFAULT_OPTIONS:MechanicalTurkOptions = {
        configFileName:join(__dirname, '..', 'mturk_creds.json'),
        templateDirectory:join(__dirname, '..', 'templates')
    };
    constructor(options?:MechanicalTurkOptions) {
        this.options = _.extend({}, MechanicalTurk.DEFAULT_OPTIONS, options);
        const {configFileName} = this.options;
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
    };
    public registerTemplate(name:string, templateString:string, templateSettings?:dot.TemplateSettings):void {
        const tempFn = dot.template(templateString, templateSettings);
        this.templates.set(name, tempFn);
    };
    public async processTemplateFile(name:string, path:string, templateSettings?:dot.TemplateSettings):Promise<void> {
        const fileContents:string = await getFileContents(resolve(this.options.templateDirectory, path));
        this.registerTemplate(name, fileContents, templateSettings);
    };
    public async createHITFromTemplate(templateName:string, templateArguments:{}, options:MTurk.CreateHITRequest):Promise<MechanicalTurkHIT> {
        if(!this.templates.has(templateName)) {
            throw new Error(`Could not find template ${templateName}. Be sure you have called .registerTemplate(name, contents, settings?) or .processTemplateFile(name, path, settings?) beforehand.`)
        }
        const templateFn = this.templates.get(templateName);
        const questionContents = templateFn(templateArguments);
        return this.createHIT(_.extend({}, options, {Question: questionContents}));
    };
    public createMechanicalTurkHIT(info:MTurk.HIT):MechanicalTurkHIT {
        const {HITId} = info;
        let mturkHIT:MechanicalTurkHIT;
        if(this.hitCache.has(HITId)) {
            mturkHIT = this.hitCache.get(HITId);
            mturkHIT.setInfo(info);
        } else {
            mturkHIT = new MechanicalTurkHIT(this, info);
            this.hitCache.set(HITId, mturkHIT);
        }
        return mturkHIT;
    };
    public createMechanicalTurkAssignment(hit:MechanicalTurkHIT, info:MTurk.Assignment):MechanicalTurkAssignment {
        const {AssignmentId} = info;
        let mturkAssignment:MechanicalTurkAssignment;
        if(this.assignmentCache.has(AssignmentId)) {
            mturkAssignment = this.assignmentCache.get(AssignmentId);
        } else {
            mturkAssignment = new MechanicalTurkAssignment(this, hit, info);
            this.assignmentCache.set(AssignmentId, mturkAssignment);
        }
        return mturkAssignment;
    };
    public createMechanicalTurkWorker(WorkerID:string):MechanicalTurkWorker {
        let mturkWorker:MechanicalTurkWorker;
        if(this.workerCache.has(WorkerID)) {
            mturkWorker = this.workerCache.get(WorkerID);
        } else {
            mturkWorker = new MechanicalTurkWorker(this, WorkerID);
            this.workerCache.set(WorkerID, mturkWorker);
        }
        return mturkWorker;
    };

    private loadConfigFile(fileName:string):Promise<{sandbox?:boolean, access:string, secret:string}> {
        return fileExists(fileName).then((exists:boolean) => {
            if(exists) {
                return getFileContents(fileName);
            } else {
                throw new Error(`Could not find config file ${fileName}.`);
            }
        }).then((contents:string) => {
            return JSON.parse(contents);
        });
    };

    public async getAccountBalance():Promise<number> {
        const mturk:MTurk = await this.mturk;
        return new Promise<number>((resolve, reject) => {
            mturk.getAccountBalance({}, (err, data) => {
                if(err) { reject(err); }
                else { resolve(parseFloat(data.AvailableBalance)); }
            });
        });
    };

    public async createHIT(options:MTurk.CreateHITRequest):Promise<MechanicalTurkHIT> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MechanicalTurkHIT>((resolve, reject) => {
            mturk.createHIT(options, (err, data) => {
                if(err) { reject(err); }
                else {
                    resolve(this.createMechanicalTurkHIT(data.HIT));
                }
            });
        });
    };
    public async createHITFromFile(questionFileName:string, options:MTurk.CreateHITRequest) {
        const questionContents = await getFileContents(questionFileName);
        return this.createHIT(_.extend({}, options, {Question: questionContents}));
    };
    public async getRawHIT(options:MTurk.GetHITRequest):Promise<MTurk.HIT> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.HIT>((resolve, reject) => {
            mturk.getHIT(options, (err, data) => {
                if(err) { reject(err); }
                else {
                    resolve(data.HIT);
                }
            });
        });
    };

    private async getHIT(options:MTurk.GetHITRequest):Promise<MechanicalTurkHIT> {
        const HITResult = await this.getRawHIT(options);
        return this.createMechanicalTurkHIT(HITResult);
    };

    public async deleteHIT(options:MTurk.DeleteHITRequest):Promise<void> {
        const mturk:MTurk = await this.mturk;
        await new Promise<MTurk.DeleteHITResponse>((resolve, reject) => {
            mturk.deleteHIT(options, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };

    public async listHITs(options:MTurk.ListHITsRequest={}):Promise<Array<MechanicalTurkHIT>> {
        const mturk:MTurk = await this.mturk;
        return new Promise<Array<MechanicalTurkHIT>>((resolve, reject) => {
            mturk.listHITs(options, (err, data) => {
                if(err) { reject(err); }
                else {
                    resolve(data.HITs.map((hit:MTurk.HIT) => this.createMechanicalTurkHIT(hit)));
                }
            });
        });
    };

    public async listRawAssignmentsForHIT(options:MTurk.ListAssignmentsForHITRequest):Promise<Array<MTurk.HIT>> {
        const mturk:MTurk = await this.mturk;
        return new Promise<Array<MTurk.HIT>>((resolve, reject) => {
            mturk.listAssignmentsForHIT(options, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data.Assignments); }
            });
        });
    };
    public async approveAssignment(params:MTurk.ApproveAssignmentRequest):Promise<MTurk.ApproveAssignmentResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.ApproveAssignmentResponse>((resolve, reject) => {
            mturk.approveAssignment(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
    public async rejectAssignment(params:MTurk.RejectAssignmentRequest):Promise<MTurk.RejectAssignmentResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.RejectAssignmentResponse>((resolve, reject) => {
            mturk.rejectAssignment(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
    public async updateExpirationForHIT(params:MTurk.UpdateExpirationForHITRequest):Promise<MTurk.UpdateExpirationForHITResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.UpdateExpirationForHITResponse>((resolve, reject) => {
            mturk.updateExpirationForHIT(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
    public async updateHITReviewStatus(params:MTurk.UpdateHITReviewStatusRequest):Promise<MTurk.UpdateHITReviewStatusResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.UpdateHITReviewStatusResponse>((resolve, reject) => {
            mturk.updateHITReviewStatus(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
    public async createWorkerBlock(params:MTurk.CreateWorkerBlockRequest):Promise<MTurk.CreateWorkerBlockResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.CreateWorkerBlockResponse>((resolve, reject) => {
            mturk.createWorkerBlock(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
    public async deleteWorkerBlock(params:MTurk.DeleteWorkerBlockRequest):Promise<MTurk.DeleteWorkerBlockResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.DeleteWorkerBlockResponse>((resolve, reject) => {
            mturk.deleteWorkerBlock(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
    public async notifyWorkers(params:MTurk.NotifyWorkersRequest):Promise<MTurk.NotifyWorkersResponse> {
        const mturk:MTurk = await this.mturk;
        return new Promise<MTurk.NotifyWorkersResponse>((resolve, reject) => {
            mturk.notifyWorkers(params, (err, data) => {
                if(err) { reject(err); }
                else { resolve(data); }
            });
        });
    };
};

function fileExists(fileName:string):Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.access(fileName, fs.R_OK, (err) => {
            if(err) { resolve(false); }
            else { resolve(true); }
        });
    });
}

function getFileContents(fileName:string):Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(fileName, 'utf8', (err, data) => {
            if(err) { reject(err); }
            else { resolve(data); }
        });
    });
};
