/// <reference path="index.d.ts" />

declare namespace CRI {
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
    interface DocumentUpdatedEvent { }
    interface SetChildNodesEvent {
        parentId:NodeID,
        nodes:Array<Node>
    }

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
    interface GetDocumentOptions {
        depth?:number,
        pierce?:boolean
    }
    interface GetDocumentResult {
        root:Node
    }
    interface RequestChildNodesOptions {
        nodeId:NodeID,
        depth?:number,
        pierce?:boolean
    }
    interface RequestChildNodesResult {
        frameId:FrameID,
        parentFrameId:FrameID
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
    interface DescribeNodeOptions {
        nodeId:NodeID,
        backendNodeID?:DOM.BackendNodeID,
        objectId?:Runtime.RemoteObjectID,
        depth?:number,
        pierce?:boolean
    }
    interface DescribeNodeResult {
        node:Node
    }
    interface ShadowRootPoppedParams {}
    interface ShadowRootPushedParams {}
    interface ShadowRootPoppedEvent {
        hostId:NodeID,
        rootId:NodeID
    }
    interface ShadowRootPushedEvent {
        hostId:NodeID,
        root:Node
    }
    interface DOM {
        getDocument:(params:GetDocumentOptions, callback:(err:any, value:GetDocumentResult)=>void) => void
        requestChildNodes:(params:RequestChildNodesOptions, callback:(err:any, value:RequestChildNodesResult)=>void) => void
        getOuterHTML:(params:GetOuterHTMLOptions, callback:(err:any, value:GetOuterHTMLResult)=>void) => void
        querySelectorAll:(params:QuerySelectorAllOptions, callback:(err:any, value:QuerySelectorAllResult)=>void) => void
        requestNode:(params:RequestNodeOptions, callback:(err:any, value:RequestNodeResult)=>void) => void
        resolveNode:(params:ResolveNodeOptions, callback:(err:any, value:ResolveNodeResult)=>void) => void
        describeNode:(params:DescribeNodeOptions, callback:(err:any, value:DescribeNodeResult)=>void) => void
        shadowRootPopped:(params:ShadowRootPoppedParams, callback:(value:ShadowRootPoppedEvent)=>void) => void
        shadowRootPushed:(params:ShadowRootPushedParams, callback:(value:ShadowRootPushedEvent)=>void) => void
    }
    namespace DOM {
        type BackendNodeID = number;
    }
}
