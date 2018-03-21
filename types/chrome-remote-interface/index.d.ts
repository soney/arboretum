/// <reference path="Browser.d.ts" />
/// <reference path="CSS.d.ts" />
/// <reference path="DOM.d.ts" />
/// <reference path="DOMDebugger.d.ts" />
/// <reference path="Network.d.ts" />
/// <reference path="Page.d.ts" />
/// <reference path="Runtime.d.ts" />
/// <reference path="Security.d.ts" />

interface EventEmitter {
    once:(event:string, callback:(err:any, data:any)=>void) => void;
    on:(event:string, callback:(err:any, data:any)=>void) => void;
    removeListener:(event:string, callback:(err:any, data:any)=>void) => void;
}
declare namespace CRI {
    enum TabType {
        'page'
    }
    type NodeType = number;
    type NodeID = number;
    type StyleSheetID = string;
    type ExecutionContextID = number;
    type TabID = string;
    type FrameID = string;
    type PseudoType = string;
    type RequestID = string;
    type InterceptionID = string;
    type UnserializableValue = string;
    type ErrorReason = string;
    type MonotonicTime = number;
    type ResourcePriority = string;
    type Headers = {};
    type ShadowRootType = 'user-agent' | 'open' | 'closed';
    type TransitionType = 'link' | 'typed' | 'auto_bookmark' | 'auto_subframe' | 'manual_subframe' | 'generated' | 'auto_toplevel' | 'form_submit' | 'reload' | 'keyword' | 'keyword_generated' | 'other';
    interface BackendNode {
        nodeType:number,
        nodeName:string,
        backendNodeId:DOM.BackendNodeID
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
    interface ExecutionContextCreatedEvent {
        context:ExecutionContextDescription
    }
    interface ObjectPreview {
        type:string,
        subtype:string,
        description:string,
        overflow:boolean,
        properties:Array<PropertyPreview>,
        entries:Array<EntryPreview>
    }
    interface PropertyPreview {
        name:string,
        type:string,
        value:string,
        valuePreview:ObjectPreview,
        subtype:string
    }
    interface CustomPreview {
        header:string,
        hasBody:boolean,
        formatterObjectId:Runtime.RemoteObjectID,
        bindRemoteObjectFunctionId:Runtime.RemoteObjectID,
        configObjectId:Runtime.RemoteObjectID
    }
    interface EntryPreview {
        key:ObjectPreview,
        value:ObjectPreview
    }
    interface InternalPropertyDescriptor {
        name:string,
        value:Runtime.RemoteObject
    }
    interface ExceptionDetails {
        exceptionId:number,
        text:string,
        lineNumber:number,
        columnNumber:number,
        scriptId:Runtime.ScriptID,
        url:string,
        stackTrace:StackTrace,
        exception:Runtime.RemoteObject,
        executionContextId:ExecutionContextID
    }
    interface GetPropertiesResult {}
    interface Frame {
        id:FrameID,
        parentId:FrameID,
        loaderId?:Network.LoaderID,
        name?:string,
        url?:string,
        securityOrigin?:string,
        mimeType?:string,
        unreachableUrl?:string
    }
    interface InlineStyleInvalidatedEvent {
        nodeIds:Array<NodeID>
    }
    interface ExecutionContextAuxData {
        isDefault:boolean,
        frameId:FrameID
    }
    interface ExecutionContextDescription {
        id:ExecutionContextID,
        origin:string,
        name:string,
        auxData:any
    }

    interface ListTabsOptions {
        host:string,
        port:number,
        secure?:boolean
    }

    interface Chrome extends EventEmitter {
        Page:Page,
        DOM:DOM,
        DOMDebugger:DOMDebugger,
        Runtime:Runtime,
        Network:Network,
        CSS:CSS,
        send:(command:string, params:any, callback:(err:any, value:any)=>void)=>void
        close:()=>void;
    }
    interface CallArgument {
        value:any,
        unserializableValue:UnserializableValue,
        objectId:Runtime.RemoteObjectID
    }
    interface Initiator {
        type:string,
        stack:StackTrace,
        url:string,
        lineNumber:number
    }
    interface LoadingFinishedEvent {
        requestId: RequestID,
        timestamp: MonotonicTime,
        encodedDataLength:number
    }
    interface LoadingFailedEvent {
        requestId: RequestID,
        timestamp: MonotonicTime,
        type:Page.ResourceType,
        errorText:string,
        canceled?:boolean,
        blockedReason?:Network.BlockedReason
    }

    interface SourceRange {
        startLine:number,
        startColumn:number,
        endLine:number,
        endColumn:number
    }
    interface Protocol {
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
        function Protocol(callback:(err:any,val:CRI.Protocol)=>void):void;
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
