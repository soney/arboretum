declare module 'chrome-remote-interface' {
    function cri(options:any):Chrome;
    export = cri;
    interface Chrome {

    }
    enum TabType {
        'page'
    }
    type TabID = string;
    type FrameID = string;
    interface TabInfo {
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
    interface Page {
        getResourceTree:(options:any, callback:(err:any, resources:ResourceTree)=>any) => void
    }
    interface Network {
    }
    interface ListTabsOptions {
        host:string,
        port:number,
        secure?:boolean
    }
    function listTabs(options:ListTabsOptions, callback:(err:any, tabs:Array<TabInfo>)=>any):void

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
