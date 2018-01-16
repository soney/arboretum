declare module 'chrome-remote-interface' {
    export enum TabType {
        'page'
    }
    export type TabID = string;
    export type FrameID = string;
    export interface TabInfo {
        description:string,
        devtoolsFrontendUrl:string,
        id:TabID,
        parentId:TabID,
        title:string,
        type:TabType,
        url:string,
        webSocketDebuggerUrl:string
    }
    interface ResourceTree {

    }
    export interface Page {
        getResourceTree:(options:any, callback:(err:any, resources:ResourceTree)=>any) => void
    }
    export interface Network {
    }
    interface ListTabsOptions {
        host:string,
        port:number,
        secure?:boolean
    }
    export function listTabs(options:ListTabsOptions, callback:(err:any, tabs:Array<TabInfo>)=>any):void

    interface BrowserVersion {
        protocolVersion:string,
        product:string,
        revision:string,
        userAgent:string,
        jsVersion:string
    }
    export interface Browser {
        close:()=>any,
        getVersion:()=>BrowserVersion
    }
}
