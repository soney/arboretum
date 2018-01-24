interface EventEmitter {
    once:(event:string, callback:(err:any, data:any)=>void) => void;
    on:(event:string, callback:(err:any, data:any)=>void) => void;
}
declare namespace CRI {
    enum TabType {
        'page'
    }
    type NodeID = number;
    type StyleSheetID = string;
    type BackendNodeID = number;
    type ExecutionContextID = number;
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
        id:FrameID,
        parentId:FrameID,
        loaderId?:LoaderID,
        name?:string,
        url?:string,
        securityOrigin?:string,
        mimeType?:string,
        unreachableUrl?:string
    }
    interface InlineStyleInvalidatedEvent {
        nodeIds:Array<NodeID>
    }
    interface FrameAttachedEvent {
        frameId: FrameID,
        parentFrameId:FrameID,
        stack:StackTrace
    }
    interface FrameNavigatedEvent {
        frame: Frame
    }
    interface FrameDetachedEvent {
        frameId:FrameID
    }
    interface ExecutionContextEvent {
        context:ExecutionContextDescription
    }
    interface ExecutionContextAuxData {
        isDefault:boolean,
        frameId:FrameID
    }
    interface ExecutionContextDescription {
        id:ExecutionContextID,
        origin:string,
        name:string,
        auxData:ExecutionContextAuxData
    }

    interface GetResourceTreeOptions {}
    interface Page {
        enable:()=>void;
        disable:()=>void;
        getResourceTree:(options:GetResourceTreeOptions, callback:(err:any, resources:ResourceTree)=>any) => void;
        frameAttached:(callback:(FrameAttachedEvent)=>void) => void;
        frameDetached:(callback:(FrameDetachedEvent)=>void) => void;
        frameNavigated:(callback:(FrameNavigatedEvent)=>void) => void;
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
    interface GetDocumentOptions {
        depth?:number,
        pierce?:boolean
    }
    interface RequestChildNodesOptions {
        nodeId:NodeID,
        depth?:number,
        pierce?:boolean
    }
    interface GetDocumentResult {
        root:Node
    }
    interface RequestChildNodesResult {
        frameId:FrameID,
        parentFrameId:FrameID
    }
    interface SetChildNodesEvent {
        parentID:NodeID,
        nodes:Array<Node>
    }
    interface DOM {
        getDocument:(params:GetDocumentOptions, callback:(err:any, value:GetDocumentResult)=>void) => void
        requestChildNodes:(params:RequestChildNodesOptions, callback:(err:any, value:RequestChildNodesResult)=>void) => void
    }
    interface FrameResourceTree {
        frame:Frame,
        childFrames:Array<FrameResourceTree>,
        resources:Array<FrameResourceTree>
    }
    interface FrameTree {
        frame:Frame,
        childFrames:Array<FrameTree>
    }
    interface Node {
        nodeId:NodeID,
        parentId:NodeID,
        backendNodeId:BackendNodeID,
        nodeType:number,
        nodeName:string,
        localName:string,
        nodeValue:string,
        childNodeCount:number,
        children:Array<Node>,
        attributes:Array<string>,
        documentURL?:string,
        baseURL?:string,
        publicId?:string,
        systemId?:string,
        internalSubset?:string,
        xmlVersion?:string,
        name?:string,
        value?:string,
        pseudoType?:PseudoType,
        shadowRootType?:ShadowRootType,
        frameId?:FrameID,
        contentDocument?:Node,
        shadowRoots?:Array<Node>,
        templateContent?:Node,
        pseudoElements?:Array<Node>,
        importedDocument?:Node,
        distributedNodes?:Array<BackendNode>,
        isSVG?:boolean
    }
    interface Runtime {
        enable:()=>void,
        disable:()=>void,
        executionContextCreated:(callback:(event:ExecutionContextEvent)=>void) => void,
    }
    interface Initiator {
        type:string,
        stack:StackTrace,
        url:string,
        lineNumber:number
    }
    interface RequestWillBeSentEvent {
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
    interface ResponseReceivedEvent {
        requestId:RequestID,
        loaderId:LoaderID,
        timestamp:MonotonicTime,
        type:ResourceType,
        response:Response,
        frameId:FrameID
    }
    interface SetChildNodesResponse {
        parentId:NodeID,
        nodes:Array<Node>
    }
    interface Network {
        enable:()=>void,
        requestWillBeSent:(callback:(event:RequestWillBeSentEvent)=>void) => void,
        responseReceived:(callback:(event:ResponseReceivedEvent)=>void) => void
    }
    interface CSSProperty {
        name:string,
        value:string,
        important?:boolean,
        implicit?:boolean,
        text:string,
        parsedOk?:boolean,
        disabled?:boolean,
        range?:SourceRange
    }
    interface ShorthandEntry {
        name:string,
        value:string,
        important?:boolean
    }
    interface SourceRange {
        startLine:number,
        startColumn:number,
        endLine:number,
        endColumn:number
    }
    interface CSSStyle {
        styleSheetId:StyleSheetID,
        cssProperties:Array<CSSProperty>,
        shorthandEntries:Array<ShorthandEntry>,
        cssText:string,
        range:SourceRange
    }
    interface GetInlineStylesForNodeOptions {
        nodeId:NodeID
    }
    interface GetInlineStylesResponse {
        inlineStyle:CSSStyle,
        attributesStyle:CSSStyle
    }
    interface CSS {
        getInlineStylesForNode(options:GetInlineStylesForNodeOptions, callback:(err:any, data:CSSStyle)=>any):void
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
    function CRIFunction(options:CRIOptions):EventEmitter;
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
