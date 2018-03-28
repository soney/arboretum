import * as util from 'util';
import {Duplex} from 'stream';
import * as WebSocket from 'ws';

export class WebSocketJSONStream extends Duplex {
    constructor(private ws:WebSocket) {
        super({objectMode: true});
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
        this.on('error', () => { this.ws.close(); })
        this.on('end', () => { this.ws.close(); })
    };
    public _read():void {};
    public _write(msg, encoding, next):void {
        this.ws.send(JSON.stringify(msg));
        next();
    };
};
