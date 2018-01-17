declare namespace CRI {
    enum TabType {
        'page'
    }
    export type TabID = string;
    export type FrameID = string;
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
    interface Chrome {
    }
}

declare module 'chrome-remote-interface' {
    function CRIFunction(options:any):CRI.Chrome;
    namespace CRIFunction {
        function listTabs(options:CRI.ListTabsOptions, callback:(err:any, tabs:Array<CRI.TabInfo>)=>any):void;
        function spawnTab();
        function closeTab();
        interface Protocol { }
        interface List { }
        interface New { }
        interface Activate { }
        interface Close { }
        interface Version { }
    }
    export = CRIFunction;
}
