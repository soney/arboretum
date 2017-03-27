const EventEmitter = require('events').EventEmitter;

class ChatServer extends EventEmitter {
    constructor() {
        super();
        this.title = false;
        this.messages = [];
        this.participants = [];
    }
    serialize() {
        return {
            title: this.title,
            messages: this.messages.map(function(m) { return m.serialize(); }),
            participants: this.participants.map(function(p) { return p.serialize(); })
        };
    }

    destroy() {

    }
}

class ChatParticipant {
    constructor(handle) {
        this.handle = handle;
    }
    serialize() {
        return {
            handle: this.handle
        };
    }
}

class ChatMessage {
    constructor(sender, message) {
        this.sender = sender;
        this.message = message;
    }
    serialize() {
        return {
            sender: this.sender.serialize(),
            message: this.message
        };
    }
}

module.exports = ChatServer;