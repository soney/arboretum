import * as cri from 'chrome-remote-interface';

export interface BrowserDoc {
    tabs:  { [key:string]: CRI.TabID }
};

export interface ShareDBDOMNode {
    node: CRI.Node,
    attributes:Array<string>,
    nodeValue: string,
    childNodeCount:number,
    children: Array<ShareDBDOMNode>,
    contentDocument:ShareDBDOMNode,
    childFrame: ShareDBFrame,
    inlineStyle:string,
    inputValue:string
};

export interface TabDoc {
    root:ShareDBDOMNode,
    id:CRI.TabID
};

export interface ShareDBFrame {
    frameID:CRI.FrameID,
    frame:CRI.Frame
};
