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
    type ScriptID = string;
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
    type Headers = any;
    type ShadowRootType = 'user-agent' | 'open' | 'closed';
    type ResourceType = 'Document' | 'Stylesheet' | 'Image' | 'Media' | 'Font' | 'Script' | 'TextTrack' | 'XHR' | 'Fetch' | 'EventSource' | 'WebSocket' | 'Manifest' | 'Other';
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
    interface Runtime {
        StackTrace:StackTrace
        releaseObject:(options:ReleaseObjectOptions, callback:(err:any, result:ReleaseObjectResult)=>any) => void
        getProperties:(options:GetPropertiesOptions, callback:(err:any, result:GetPropertiesResult)=>any) => void
    }
    interface ReleaseObjectOptions {
        objectId:Runtime.RemoteObjectID
    }
    interface ReleaseObjectResult {}
    interface GetPropertiesOptions {
        objectId:Runtime.RemoteObjectID,
        ownProperties:boolean,
        accessorPropertiesOnly?:boolean,
        generatePreview?:boolean
    }
    interface GetPropertiesResult {
        result:Array<PropertyDescriptor>,
        internalProperties:Array<InternalPropertyDescriptor>,
        exceptionDetails:ExceptionDetails
    }
    interface PropertyDescriptor {
        name:string,
        value:Runtime.RemoteObject
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
        scriptId:ScriptID,
        url:string,
        stackTrace:StackTrace,
        exception:Runtime.RemoteObject,
        executionContextId:ExecutionContextID
    }
    interface GetPropertiesResult {}
    namespace Runtime {
    }
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

    interface GetResourceTreeOptions {}
    interface NavigateOptions {
        url:string,
        referrer?:string,
        transitionType?:TransitionType
    }
    namespace Page {
        interface NavigateResult {
            frameId:FrameID,
            loaderId:Network.LoaderID,
            errorText?:string
        }
    }
    interface GetFrameTreeOptions{}
    interface Page {
        enable:()=>void;
        disable:()=>void;
        getResourceTree:(options:GetResourceTreeOptions, callback:(err:any, resources:FrameResourceTree)=>any) => void;
        frameAttached:(callback:(FrameAttachedEvent)=>void) => void;
        frameDetached:(callback:(FrameDetachedEvent)=>void) => void;
        frameNavigated:(callback:(FrameNavigatedEvent)=>void) => void;
        navigate:(options:NavigateOptions, callback:(err:any, result:Page.NavigateResult)=>any) => void;
        getFrameTree:(options:GetFrameTreeOptions, callback:(err:any, result:FrameTree)=>void)=>void;
        getResourceContent:(params:GetResourceContentParams, callback:(err:any, data:GetResourceContentResponse)=>any) => void
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
        Network:Network,
        CSS:CSS,
        send:(command:string, params:any, callback:(err:any, value:any)=>void)=>void
        close:()=>void;
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
        parentId:NodeID,
        nodes:Array<Node>
    }
    interface GetOuterHTMLOptions {
        nodeId:NodeID,
        backendNodeId?:DOM.BackendNodeID,
        objectId?:Runtime.RemoteObjectID
    }
    interface GetOuterHTMLResult {
        outerHTML:string
    }
    interface QuerySelectorAllOptions {
        nodeId:NodeID,
        selector:string
    }
    interface QuerySelectorAllResult {
        nodeIds:Array<NodeID>
    }
    interface RequestNodeOptions {
        objectId:Runtime.RemoteObjectID
    }
    interface RequestNodeResult {
        nodeId:NodeID
    }
    interface ResolveNodeOptions {
        nodeId:NodeID,
        backendNodeId?:DOM.BackendNodeID,
        objectGroup?:string
    }
    interface ResolveNodeResult {
        object:Runtime.RemoteObject
    }
    interface DescribeNodeParams {
        nodeId:NodeID,
        backendNodeID?:DOM.BackendNodeID,
        objectId?:Runtime.RemoteObjectID,
        depth?:number,
        pierce?:boolean
    }
    interface DescribeNodeResult {
        node:Node
    }
    namespace DOM {
        type BackendNodeID = number;
    }
    interface DOM {
        getDocument:(params:GetDocumentOptions, callback:(err:any, value:GetDocumentResult)=>void) => void
        requestChildNodes:(params:RequestChildNodesOptions, callback:(err:any, value:RequestChildNodesResult)=>void) => void
        getOuterHTML:(params:GetOuterHTMLOptions, callback:(err:any, value:GetOuterHTMLResult)=>void) => void
        querySelectorAll:(params:QuerySelectorAllOptions, callback:(err:any, value:QuerySelectorAllResult)=>void) => void
        requestNode:(params:RequestNodeOptions, callback:(err:any, value:RequestNodeResult)=>void) => void
        resolveNode:(params:ResolveNodeOptions, callback:(err:any, value:ResolveNodeResult)=>void) => void
        describeNode:(params:DescribeNodeParams, callback:(err:any, value:DescribeNodeResult)=>void) => void
    }
    interface FrameResourceTree {
        frameTree:FrameTree
    }
    interface FrameResource {
        url:string,
        type:ResourceType,
        mimeType:string,
        lastModified:Network.TimeSinceEpoch,
        contentSize:number,
        failed:boolean,
        canceled:boolean
    }
    namespace Runtime {
        type RemoteObjectID = string;
        interface RemoteObject {
            type:string,
            subtype:string,
            className:string,
            value:any,
            unserializableValue:UnserializableValue,
            description:string,
            objectId:Runtime.RemoteObjectID,
            preview: ObjectPreview,
            customPreview: CustomPreview
        }
    }

    interface FrameTree {
        frame:Frame,
        childFrames:Array<FrameTree>,
        resources:Array<FrameResource>
    }
    interface Node {
        nodeId:NodeID,
        parentId:NodeID,
        backendNodeId:DOM.BackendNodeID,
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
    interface EvaluateParameters {
        expression:string,
        objectGroup?:string,
        includeCommandLineAPI?:boolean,
        silent?:boolean,
        contextId:ExecutionContextID,
        returnByValue?:boolean,
        generatePreview?:boolean,
        userGesture?:boolean,
        awaitPromise?:boolean
    }
    interface CallArgument {
        value:any,
        unserializableValue:UnserializableValue,
        objectId:Runtime.RemoteObjectID
    }
    interface EvaluateResult {
        result:Runtime.RemoteObject,
        exceptionDetails:ExceptionDetails
    }
    interface CallFunctionOnArguments {
        functionDeclaration:string,
        objectId:Runtime.RemoteObjectID,
        arguments:Array<CallArgument>,
        silent?:boolean,
        returnByValue?:boolean,
        generatePreview?:boolean,
        userGesture?:boolean,
        awaitPromise?:boolean,
        executionContextId:ExecutionContextID,
        objectGroup?:string
    }
    interface CallFunctionOnResult {
        result:Runtime.RemoteObject,
        exceptionDetails:ExceptionDetails
    }
    interface Runtime {
        enable:()=>void,
        disable:()=>void,
        executionContextCreated:(callback:(event:ExecutionContextCreatedEvent)=>void) => void,
        evaluate:(params:EvaluateParameters, callback:(err:any, result:EvaluateResult)=>void) => void,
        callFunctionOn:(params:CallFunctionOnArguments, callback:(err:any, result:CallFunctionOnResult)=>void) => void,
    }
    interface Initiator {
        type:string,
        stack:StackTrace,
        url:string,
        lineNumber:number
    }
    interface RequestWillBeSentEvent {
        requestId:RequestID,
        loaderId:Network.LoaderID,
        documentURL:string,
        request:Request,
        timestamp:MonotonicTime,
        wallTime:Network.TimeSinceEpoch,
        initiator:Initiator,
        redirectResponse:Response,
        type:ResourceType,
        frameId:FrameID
    }
    interface ResponseReceivedEvent {
        requestId:RequestID,
        loaderId:Network.LoaderID,
        timestamp:MonotonicTime,
        type:ResourceType,
        response:Response,
        frameId:FrameID
    }
    interface DocumentUpdatedEvent { }
    interface CharacterDataModifiedEvent {
        nodeId:NodeID,
        characterData:string
    }
    interface ChildNodeCountUpdatedEvent {
        nodeId:NodeID,
        childNodeCount:number
    }
    interface ChildNodeInsertedEvent {
        parentNodeId:NodeID,
        previousNodeId:NodeID,
        node:Node
    }
    interface ChildNodeRemovedEvent {
        parentNodeId:NodeID,
        nodeId:NodeID
    }
    interface SetChildNodesResponse {
        parentId:NodeID,
        nodes:Array<Node>
    }
    interface AttributeModifiedEvent {
        nodeId:NodeID,
        name:string,
        value:string
    }
    interface AttributeRemovedEvent {
        nodeId:NodeID,
        name:string
    }
    interface Network {
        enable:()=>void,
        requestWillBeSent:(callback:(event:RequestWillBeSentEvent)=>void) => void,
        responseReceived:(callback:(event:ResponseReceivedEvent)=>void) => void
        getResponseBody:(params:GetResponseBodyParams, callback:(err:any, data:GetResponseBodyResponse)=>any) => void
    }
    interface GetResponseBodyParams {
        requestId:RequestID
    }
    interface GetResponseBodyResponse {
        body:string,
        base64Encoded:boolean
    }
    interface GetResourceContentParams {
        frameId:FrameID,
        url:string
    }
    interface GetResourceContentResponse {
        content:string,
        base64Encoded:boolean
    }

    namespace Network {
        type LoaderID = string;
        type TimeSinceEpoch = number;
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
        getInlineStylesForNode(options:GetInlineStylesForNodeOptions, callback:(err:any, data:GetInlineStylesResponse)=>any):void
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
