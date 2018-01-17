interface EventEmitter {
    once:(event:string, callback:(err:any, data:any)=>void) => void;
    on:(event:string, callback:(err:any, data:any)=>void) => void;
}
declare namespace CRI {
    enum TabType {
        'page'
    }
    type NodeID = number;
    type BackendNodeID = number;
    type TabID = string;
    type FrameID = string;
    type PseudoType = string;
    type LoaderID = string;
    type RequestID = string;
    type InterceptionID = string;
    type ErrorReason = string;
    type TimeSinceEpoch = number;
    type MonotonicTime = number;
    type Headers = any;
    type ShadowRootType = 'user-agent' | 'open' | 'closed';
    type ResourceType = 'Document' | 'Stylesheet' | 'Image' | 'Media' | 'Font' | 'Script' | 'TextTrack' | 'XHR' | 'Fetch' | 'EventSource' | 'WebSocket' | 'Manifest' | 'Other';
    interface BackendNode {
        nodeType:number,
        nodeName:string,
        backendNodeId:BackendNodeID
    }
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
    interface StackTrace {

    }
    interface ResourceTree {
    }
    interface Runtime {
        StackTrace:StackTrace
    }
    interface Frame {

    }
    type frameAttachedEvent = (frameId:FrameID, parentFrameId:FrameID, stack:StackTrace) => void;
    type frameDetachedEvent = (frameId:FrameID) => void;
    type frameNavigatedEvent = (frame:Frame) => void;
    interface Page {
        enable:()=>void;
        disable:()=>void;
        getResourceTree:(options:any, callback:(err:any, resources:ResourceTree)=>any) => void;
        frameAttached:(event:frameAttachedEvent)=>void;
        frameDetached:(event:frameDetachedEvent)=>void;
        frameNavigated:(event:frameNavigatedEvent)=>void;
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
    interface Chrome extends EventEmitter {
        Page:Page,
        DOM:DOM,
        Runtime:Runtime,
        Network:Network
    }
    interface getDocumentOptions {
        depth?:number,
        pierce?:boolean
    }
    interface DOM {
        getDocument:(params:getDocumentOptions, callback:(err:any, root:Node)=>void) => void
    }
    interface Node {
        nodeId:NodeID,
        parentId:NodeID,
        backendNodeId:BackendNodeID,
        nodeType:number,
        nodeName:string,
        localName:string,
        nodeValue:string,
        childNodeCoult:number,
        children:Array<Node>,
        attributes:Array<string>,
        documentURL:string,
        baseURL:string,
        publicId:string,
        systemId:string,
        internalSubset:string,
        xmlVersion:string,
        name:string,
        value:string,
        pseudoType:PseudoType,
        shadowRootType:ShadowRootType,
        frameId:FrameID,
        contentDocument:Node,
        shadowRoots:Array<Node>,
        templateContent:Node,
        pseudoElement:Array<Node>,
        importedDocument:Node,
        distributedNodes:Array<BackendNode>,
        isSVG:boolean
    }
    interface Runtime {
        enable:()=>void,
        disable:()=>void,
        executionContextCreated:(callback:(event:RequestWillBeSentCallback)=>void) => void,
    }
    interface Initiator {
        type:string,
        stack:StackTrace,
        url:string,
        lineNumber:number
    }
    interface RequestWillBeSentCallback {
        requestId:RequestID,
        loaderId:LoaderID,
        documentURL:string,
        request:Request,
        timestamp:MonotonicTime,
        wallTime:TimeSinceEpoch,
        initiator:Initiator,
        redirectResponse:Response,
        type:ResourceType,
        frameId:FrameID
    }
    interface ResponseReceivedCallback {
        requestId:RequestID,
        loaderId:LoaderID,
        timestamp:MonotonicTime,
        type:ResourceType,
        response:Response,
        frameId:FrameID
    }
    interface Network {
        enable:()=>void,
        requestWillBeSent:(callback:(event:RequestWillBeSentCallback)=>void) => void,
        responseReceived:(callback:(event:ResponseReceivedCallback)=>void) => void
    }
}

declare module 'chrome-remote-interface' {
    interface CRIOptions {
        chooseTab:CRI.TabInfo,
        host?:string,
        port?:number,
        secure?:boolean,
        protocol?:string,
        local?:boolean
    }
    function CRIFunction(options:CRIOptions):CRI.Chrome;
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
