/// <reference path="index.d.ts" />

declare namespace CRI {
    interface BrowserVersion {
        protocolVersion:string,
        product:string,
        revision:string,
        userAgent:string,
        jsVersion:string
    }
    interface Browser {
        close:()=>any,
        getVersion:()=>BrowserVersion
    }
}
