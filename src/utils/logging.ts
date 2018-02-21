import chalk from 'chalk';
import * as _ from 'underscore';
import * as log from 'loglevel';

export enum level { trace=0, debug, info, warn, error, silent};

class ColoredLogger {
	private l:(...s:string[]) => string;
	constructor(...c:string[]) {
		this.l = chalk;
		c.forEach((arg) => {
			this.l = this.l[arg];
		});
	};
	private colorize(...a:any[]):string[] {
		return a.map((x) => {
			return this.l(x);
		});
	};
	public trace(...a:any[]):void  { console.log(...this.colorize(...a)); };
	public debug(...a:any[]):void  { console.log(...this.colorize(...a)); };
	public info(...a:any[]):void   { console.log(...this.colorize(...a)); };
	public warn(...a:any[]):void   { console.log(...this.colorize(...a)); };
	public error(...a:any[]):void  { console.log(...this.colorize(...a)); };
	public silent(...a:any[]):void { console.log(...this.colorize(...a)); };
};


export function setLevel(l:level, persist:boolean):void {
	log.setLevel(l, persist);
};
export function getColoredLogger(...colors:string[]):ColoredLogger {
	return new ColoredLogger(...colors)
};
