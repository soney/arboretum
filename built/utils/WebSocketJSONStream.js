"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class WebSocketJSONStream extends stream_1.Duplex {
    constructor(ws) {
        super({ objectMode: true });
        this.ws = ws;
        this.ws.addEventListener('message', (msg) => {
            this.push(JSON.parse(msg.data));
        });
        this.ws.addEventListener('close', () => {
            this.push(null);
            this.end();
            this.emit('close');
            this.emit('end');
        });
        this.ws.addEventListener('error', (err) => {
            console.error(err);
        });
        this.on('error', () => { this.ws.close(); });
        this.on('end', () => { this.ws.close(); });
    }
    ;
    _read() { }
    ;
    _write(msg, encoding, next) {
        this.ws.send(JSON.stringify(msg));
        next();
    }
    ;
}
exports.WebSocketJSONStream = WebSocketJSONStream;
;
