import * as cri from 'chrome-remote-interface';

export interface BrowserDoc {
    tabs:  { [key:string]: CRI.TabID }
};

export interface ShareDBDOMNode {
    node: CRI.Node,
    childFrame: ShareDBFrame,
    inlineStyle:string,
    inputValue:string
};

export interface TabDoc {
    root:ShareDBDOMNode,
    id:CRI.TabID
};

export interface ShareDBFrame {

};
