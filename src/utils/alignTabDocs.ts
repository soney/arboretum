import {TabDoc, ShareDBDOMNode} from './state_interfaces';

export function alignTabDocs(doc1:TabDoc, doc2:TabDoc):[Map<CRI.NodeID, CRI.NodeID>, Map<CRI.NodeID, CRI.NodeID>] {
    const doc1ToDoc2:Map<CRI.NodeID, CRI.NodeID> = new Map<CRI.NodeID, CRI.NodeID>();
    const doc2ToDoc1:Map<CRI.NodeID, CRI.NodeID> = new Map<CRI.NodeID, CRI.NodeID>();

    const flatDoc1:Array<ShareDBDOMNode> = flatten(doc1);
    const flatDoc2:Array<ShareDBDOMNode> = flatten(doc2);

    const SAME_TYPE_VALUE             =  100;
    const SAME_TAG_VALUE              =  50;
    const SAME_VALUE_VALUE            =  5;
    const SAME_ATTRIBUTE_VALUE        =  2;
    const DIFFERENT_ATTRIBUTE_PENALTY = -2;
    const GAP_PENALTY                 = -2;
    const GAP = null;
    function similarityScore(node1:ShareDBDOMNode, node2:ShareDBDOMNode):number {
        let score:number = 0;
        if(node1.nodeType  === node2.nodeType)  { score += SAME_TYPE_VALUE; }
        if(node1.nodeName  === node2.nodeName)  { score += SAME_TAG_VALUE; }
        if(node1.nodeValue === node2.nodeValue) { score += SAME_VALUE_VALUE; }
        const node1Attributes = getAttributeMap(node1);
        const node2Attributes = getAttributeMap(node1);

        node1Attributes.forEach((value:string, key:string) => {
            if(node2Attributes.get(key) === value) {
                score += SAME_ATTRIBUTE_VALUE/2;
            } else {
                score += DIFFERENT_ATTRIBUTE_PENALTY/2;
            }
        });
        node2Attributes.forEach((value:string, key:string) => {
            if(node1Attributes.get(key) === value) {
                score += SAME_ATTRIBUTE_VALUE/2;
            } else {
                score += DIFFERENT_ATTRIBUTE_PENALTY/2;
            }
        });

        return score;
    }

    const [s1, s2] = computeAlignment(flatDoc1, flatDoc2, similarityScore, GAP_PENALTY, GAP);
    const count = s1.length;
    for(let i:number = 0; i<count; i++) {
        const item1:ShareDBDOMNode = s1[i];
        const item2:ShareDBDOMNode = s2[i];
        const item1NodeID = item1 ? item1.nodeId : null;
        const item2NodeID = item2 ? item2.nodeId : null;
        if(item1NodeID) { doc1ToDoc2.set(item1NodeID, item2NodeID); }
        if(item2NodeID) { doc2ToDoc1.set(item2NodeID, item1NodeID); }
    }

    return [doc1ToDoc2, doc2ToDoc1];
};

function repeat(e:any, times:number):any[] {
    const rv:any[] = [];
    for(let i = 0; i<times; i++) { rv.push(e); }
    return rv;
}

function computeAlignment<E>(seq1:E[], seq2:E[], similarityScore:(i1:E, i2:E)=>number, GAP_PENALTY:number, GAP:any=null):[Array<E>, Array<E>] {
    const seq1Len = seq1.length;
    const seq2Len = seq2.length;
    //m:seq1Len
    //n:seq2Len
    if(seq1Len === 0) { return [repeat(GAP, seq1Len), seq2]; }
    else if(seq2Len === 0) { return [seq1, repeat(GAP, seq1Len)]; }

    const scores:Matrix<number> = new Matrix<number>(seq1Len+1, seq2Len+1);

    function filteredMax(...seq:Array<number>):number {
        return Math.max(...seq.filter((s) => s!==null));
    }

    scores.set(0,0,0);
    for(let i = 1; i<=seq1Len; i++) { scores.set(i, 0, -1*i); }
    for(let j = 1; j<=seq2Len; j++) { scores.set(0, j, -1*j); }

    for(let i = 1; i<=seq1Len; i++) {
        for(let j = 1; j<=seq2Len; j++) {
            scores.set(i, j, Math.max(
                scores.get(i-1, j-1) + (similarityScore(seq1[i-1], seq2[j-1])),
                scores.get(i-1, j)   + GAP_PENALTY,
                scores.get(i,   j-1) + GAP_PENALTY
            ));
        }
    }

    let i:number = seq1Len;
    let j:number = seq2Len;
    const sq1:Array<E> = [];
    const sq2:Array<E> = [];
    do {
        const goup   = scores.get(i-1, j);
        const godiag = scores.get(i-1, j-1);
        const goleft = scores.get(i, j-1);

        const max = filteredMax(goup, godiag, goleft);

        switch(max) {
            case godiag:
                i--;
                j--;
                sq1.push(seq1[i]);
                sq2.push(seq2[j]);
                break;
            case goup:
                i--;
                sq1.push(seq1[i]);
                sq2.push(GAP);
                break;
            case goleft:
                j--;
                sq1.push(GAP);
                sq2.push(seq2[j]);
                break;
        }
    } while(i>0 && j>0);
    scores.destroy();

    return [sq1.reverse(), sq2.reverse()];
};

function flatten(doc:TabDoc):Array<ShareDBDOMNode> {
    const rv:Array<ShareDBDOMNode> = [doc.root];
    for(let i = 0; i<rv.length; i++) {
        const node:ShareDBDOMNode = rv[i];
        const {children, contentDocument} = node;
        rv.splice(i+1, 0, ...children);
        if(contentDocument) {
            rv.splice(i+1, 0, contentDocument);
        }
    }
    return rv;
}



function getAttributeMap(node:ShareDBDOMNode):Map<string, string> {
    const rv:Map<string,string> = new Map<string, string>();
    if(node.attributes) {
        for(let i = 0; i<node.attributes.length; i++) {
            const attribute:[string,string] = node.attributes[i];
            rv.set(attribute[0], attribute[1]);
        }
    }
    return rv;
}

/*

m by n Matrix

    a_{i,j}     n columns       -- j changes -->
m rows      ------------------------------------
  |         |   a_{1,1}   a_{1,2}   a_{1,3}, ...
  |         |   a_{2,1}   a_{2,2}   a_{2,3}, ...
 i changes  |   a_{3,1}   a_{3,2}   a_{3,3}, ...
  |         |     .         .          .
  |         |     .         .          .
  v         |     .         .          .
*/
class Matrix<E> {
    private contents:E[][] = [];
    //m rows
    //n cols
    constructor(private m:number, private n:number, initValue?:E) {
        for(let i = 0; i<m; i++) {
            this.contents[i] = [];
            for(let j=0; j<n; j++) {
                this.contents[i][j] = initValue;
            }
        }
    };
    // i:row, j:col
    public get(i:number, j:number):E {
        if(i<0 || j<0 || i>=this.m || j>=this.n)  { return null; }
        else { return this.contents[i][j]; }
    };
    // i:row, j:col
    public set(i:number, j:number, value:E):void { this.contents[i][j] = value; };
    // height
    public getM():number { return this.m; };
    // width
    public getN():number { return this.n; };
    public destroy():void { this.contents = null; }
    public setRowValue(row:number, value:E):void {
        for(let j = 0; j<this.n; j++) { this.contents[row][j] = value; }
    };
    public setColumnValue(col:number, value:E):void {
        for(let i = 0; i<this.m; i++) { this.contents[i][col] = value; }
    };
    public getRowValue(row:number):Array<E> {
        const rv:E[] = [];
        for(let j = 0; j<this.n; j++) { rv.push(this.contents[row][j]); }
        return rv;
    };
    public getColumnValue(col:number):Array<E> {
        const rv:E[] = [];
        for(let i = 0; i<this.m; i++) { rv.push(this.contents[i][col]); }
        return rv;
    };
    public print(gap = "  ", toString:((e:E)=>string)=((e)=>`${e}`)):void {
        function pad(str:string, len:number, alignRight:boolean=true, PAD:string=' '):string {
            let rv:string = str;
            while(rv.length < len) {
                rv = alignRight ? PAD+rv : rv+PAD;
            }
            return rv;
        };
        const colWidth = (col:number):number => {
            return Math.max(...this.getColumnValue(col).map((x) => toString(x).length));
        }
        for(let i = 0; i<this.m; i++) {
            const values:Array<string> = this.getRowValue(i).map((item:E, j) => {
                return pad(toString(item), colWidth(j));
            });
            console.log(values.join(gap));
        }
    };
}
