import * as fs from 'fs';
import * as path from 'path';

export async function makeDirectoryRecursive(p:string):Promise<void> {
    const splitPath:string[] = path.relative(path.resolve('.'), p).split(path.sep);
    for(let i = 0; i<splitPath.length; i++) {
        const dirName:string = path.join(...splitPath.slice(0, i+1));
        if(!(await isDirectory(dirName))) {
            await makeDirectory(dirName);
        }
    }
};

export function makeDirectory(dirName:string):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.mkdir(dirName, (err) => {
            if(err) { reject(err); }
            else { resolve(); }
        });
    });
}
export function isDirectory(dirName:string):Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.access(dirName, fs.constants.F_OK | fs.constants.W_OK, (err) => {
            if(err) {
                resolve(false);
            } else {
                fs.stat(dirName, (err, stats) => {
                    if(err) { reject(err); }
                    else { resolve(stats.isDirectory()); }
                });
            }
        });
    });
}
export function readDirectory(dirName:string):Promise<Array<string>> {
    return new Promise<Array<string>>((resolve, reject) => {
        fs.readdir(dirName, (err, contents) => {
            if(err) {
                reject(err);
            } else {
                resolve(contents);
            }
        });
    });
};

export function readFileContents(filename:string):Promise<string> {
    return new Promise<string>(function(resolve, reject) {
        fs.readFile(filename, {
            encoding: 'utf8'
        }, function(err, data) {
            if (err) { reject(err); }
            else { resolve(data); }
        })
    }).catch((err) => {
        throw (err);
    });
}

export function writeFileContents(filename:string, contents:string):Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        fs.writeFile(filename, contents, (err) => {
            if (err) { reject(err); }
            else { resolve(); }
        });
    });
}
