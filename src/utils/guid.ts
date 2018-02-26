function s4():string {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

export function guid():string {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

export function guidIndex(id:string):number {
    let result:number = 0;
    for(let i = 0; i<id.length; i++) {
        result += id.charCodeAt(i);
    }
    return result;
};
