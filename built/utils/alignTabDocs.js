"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function alignTabDocs(doc1, doc2) {
    const doc1ToDoc2 = new Map();
    const doc2ToDoc1 = new Map();
    const flatDoc1 = flatten(doc1);
    const flatDoc2 = flatten(doc2);
    const SAME_TYPE_VALUE = 100;
    const SAME_TAG_VALUE = 50;
    const SAME_VALUE_VALUE = 5;
    const SAME_ATTRIBUTE_VALUE = 2;
    const DIFFERENT_ATTRIBUTE_PENALTY = -2;
    const GAP_PENALTY = -2;
    const GAP = null;
    function similarityScore(node1, node2) {
        let score = 0;
        if (node1.nodeType === node2.nodeType) {
            score += SAME_TYPE_VALUE;
        }
        if (node1.nodeName === node2.nodeName) {
            score += SAME_TAG_VALUE;
        }
        if (node1.nodeValue === node2.nodeValue) {
            score += SAME_VALUE_VALUE;
        }
        const node1Attributes = getAttributeMap(node1);
        const node2Attributes = getAttributeMap(node1);
        node1Attributes.forEach((value, key) => {
            if (node2Attributes.get(key) === value) {
                score += SAME_ATTRIBUTE_VALUE / 2;
            }
            else {
                score += DIFFERENT_ATTRIBUTE_PENALTY / 2;
            }
        });
        node2Attributes.forEach((value, key) => {
            if (node1Attributes.get(key) === value) {
                score += SAME_ATTRIBUTE_VALUE / 2;
            }
            else {
                score += DIFFERENT_ATTRIBUTE_PENALTY / 2;
            }
        });
        return score;
    }
    const [s1, s2] = computeAlignment(flatDoc1, flatDoc2, similarityScore, GAP_PENALTY, GAP);
    const count = s1.length;
    for (let i = 0; i < count; i++) {
        const item1 = s1[i];
        const item2 = s2[i];
        const item1NodeID = item1 ? item1.nodeId : null;
        const item2NodeID = item2 ? item2.nodeId : null;
        if (item1NodeID) {
            doc1ToDoc2.set(item1NodeID, item2NodeID);
        }
        if (item2NodeID) {
            doc2ToDoc1.set(item2NodeID, item1NodeID);
        }
    }
    return [doc1ToDoc2, doc2ToDoc1];
}
exports.alignTabDocs = alignTabDocs;
;
function repeat(e, times) {
    const rv = [];
    for (let i = 0; i < times; i++) {
        rv.push(e);
    }
    return rv;
}
function computeAlignment(seq1, seq2, similarityScore, GAP_PENALTY, GAP = null) {
    const seq1Len = seq1.length;
    const seq2Len = seq2.length;
    //m:seq1Len
    //n:seq2Len
    if (seq1Len === 0) {
        return [repeat(GAP, seq1Len), seq2];
    }
    else if (seq2Len === 0) {
        return [seq1, repeat(GAP, seq1Len)];
    }
    const scores = new Matrix(seq1Len + 1, seq2Len + 1);
    function filteredMax(...seq) {
        return Math.max(...seq.filter((s) => s !== null));
    }
    scores.set(0, 0, 0);
    for (let i = 1; i <= seq1Len; i++) {
        scores.set(i, 0, -1 * i);
    }
    for (let j = 1; j <= seq2Len; j++) {
        scores.set(0, j, -1 * j);
    }
    for (let i = 1; i <= seq1Len; i++) {
        for (let j = 1; j <= seq2Len; j++) {
            scores.set(i, j, Math.max(scores.get(i - 1, j - 1) + (similarityScore(seq1[i - 1], seq2[j - 1])), scores.get(i - 1, j) + GAP_PENALTY, scores.get(i, j - 1) + GAP_PENALTY));
        }
    }
    let i = seq1Len;
    let j = seq2Len;
    const sq1 = [];
    const sq2 = [];
    do {
        const goup = scores.get(i - 1, j);
        const godiag = scores.get(i - 1, j - 1);
        const goleft = scores.get(i, j - 1);
        const max = filteredMax(goup, godiag, goleft);
        switch (max) {
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
    } while (i > 0 && j > 0);
    scores.destroy();
    return [sq1.reverse(), sq2.reverse()];
}
;
function flatten(doc) {
    const rv = [doc.root];
    for (let i = 0; i < rv.length; i++) {
        const node = rv[i];
        const { children, contentDocument } = node;
        rv.splice(i + 1, 0, ...children);
        if (contentDocument) {
            rv.splice(i + 1, 0, contentDocument);
        }
    }
    return rv;
}
function getAttributeMap(node) {
    const rv = new Map();
    if (node.attributes) {
        for (let i = 0; i < node.attributes.length; i++) {
            const attribute = node.attributes[i];
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
class Matrix {
    //m rows
    //n cols
    constructor(m, n, initValue) {
        this.m = m;
        this.n = n;
        this.contents = [];
        for (let i = 0; i < m; i++) {
            this.contents[i] = [];
            for (let j = 0; j < n; j++) {
                this.contents[i][j] = initValue;
            }
        }
    }
    ;
    // i:row, j:col
    get(i, j) {
        if (i < 0 || j < 0 || i >= this.m || j >= this.n) {
            return null;
        }
        else {
            return this.contents[i][j];
        }
    }
    ;
    // i:row, j:col
    set(i, j, value) { this.contents[i][j] = value; }
    ;
    // height
    getM() { return this.m; }
    ;
    // width
    getN() { return this.n; }
    ;
    destroy() { this.contents = null; }
    setRowValue(row, value) {
        for (let j = 0; j < this.n; j++) {
            this.contents[row][j] = value;
        }
    }
    ;
    setColumnValue(col, value) {
        for (let i = 0; i < this.m; i++) {
            this.contents[i][col] = value;
        }
    }
    ;
    getRowValue(row) {
        const rv = [];
        for (let j = 0; j < this.n; j++) {
            rv.push(this.contents[row][j]);
        }
        return rv;
    }
    ;
    getColumnValue(col) {
        const rv = [];
        for (let i = 0; i < this.m; i++) {
            rv.push(this.contents[i][col]);
        }
        return rv;
    }
    ;
    print(gap = "  ", toString = ((e) => `${e}`)) {
        function pad(str, len, alignRight = true, PAD = ' ') {
            let rv = str;
            while (rv.length < len) {
                rv = alignRight ? PAD + rv : rv + PAD;
            }
            return rv;
        }
        ;
        const colWidth = (col) => {
            return Math.max(...this.getColumnValue(col).map((x) => toString(x).length));
        };
        for (let i = 0; i < this.m; i++) {
            const values = this.getRowValue(i).map((item, j) => {
                return pad(toString(item), colWidth(j));
            });
            console.log(values.join(gap));
        }
    }
    ;
}
