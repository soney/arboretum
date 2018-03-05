export type CanvasImage = {data:Array<number>, width:number, height:number};

export interface BrowserDoc {
    tabs:  { [key:string]: CRI.TabInfo },
    selectedTab: CRI.TabID
};

export interface ShareDBDOMNode {
    // node: CRI.Node,
    nodeId: CRI.NodeID,
    nodeType: CRI.NodeType,
    nodeName: string,
    nodeValue: string,
    attributes:Array<[string,string]>,
    children: Array<ShareDBDOMNode>,
    contentDocument:ShareDBDOMNode,
    childFrame: ShareDBFrame,
    inlineStyle:string,
    inputValue:string,
    isSVG:boolean
    canvasData:ImageData
    // shadowRootType:CRI.ShadowRootType,
    // shadowRoots:Array<ShareDBDOMNode>,
};

export interface TabDoc {
    root:ShareDBDOMNode,
    id:CRI.TabID
};
export interface FrameDoc {
    frameID:CRI.FrameID,
    root:ShareDBDOMNode
}

export interface ShareDBFrame {
    frameID:CRI.FrameID,
    frame:CRI.Frame
};
