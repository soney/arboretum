import * as cri from 'chrome-remote-interface';

export interface BrowserDoc {
    tabs:  { [key:string]: CRI.TabID }
};

export interface ShareDBDOMNode {
    node: CRI.Node,
    childFrame: ShareDBFrame
};

export interface TabDoc {

};

export interface ShareDBFrame {

};

export interface ShareDBTab {

};
