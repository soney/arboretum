const EventEmitter = require('events').EventEmitter;
const electron = require('electron');
const ipcMain = electron.ipcMain;
const _ = require('underscore');

class ChatServer extends EventEmitter {
    constructor(mainWindow) {
        super();
        this.renderClients = []
        this.$onIPCChatConnect = _.bind(this.onIPCChatConnect, this)
        this.$onIPCChatLine = _.bind(this.onIPCChatLine, this)

        ipcMain.on('chat-connect', this.$onIPCChatConnect)
        ipcMain.on('chat-line', this.$onIPCChatLine);

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

    onIPCChatConnect(info) {
        this.renderClients.push(info.sender);
    }
    onIPCChatLine(info, event) {
        var message = new ChatMessage(false, event.message)
        this.messages.push(message);
        this.notifyMessage(message);
    }

    notifyMessage(message) {
        this.renderClients.forEach(function(client) {
            client.send('new-message', {
                type: 'new_message',
                message: message.serialize()
            });
        });
    }

    destroy() {
        this.renderClients = [];
        ipcMain.off('chat-connect', this.$onIPCChatConnect)
        ipcMain.off('chat-line', this.$onIPCChatLine);
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
            sender: this.sender ? this.sender.serialize() : false,
            message: this.message
        };
    }
}

module.exports = ChatServer;