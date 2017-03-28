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
        this.$onIPCChatSetTitle = _.bind(this.onIPCChatSetTitle, this)
        this.$onIPCChatSetVar = _.bind(this.onIPCChatSetVar, this)

        ipcMain.on('chat-connect', this.$onIPCChatConnect)
        ipcMain.on('chat-line', this.$onIPCChatLine);
        ipcMain.on('chat-set-title', this.$onIPCChatSetTitle);
        ipcMain.on('chat-set-var', this.$onIPCChatSetVar);

        this.title = false;
        this.messages = [];
        this.participants = [];
		this.variables = {};
    }
    serialize() {
        return {
            title: this.title,
			variables: this.variables,
            messages: this.messages.map(function(m) { return m.serialize(); }),
            participants: this.participants.map(function(p) { return p.serialize(); })
        };
    }

    onIPCChatConnect(info) {
        this.renderClients.push(info.sender);
		info.sender.send('connected', {
			state: this.serialize()
		});
    }
    onIPCChatLine(info, event) {
		this.onChatLine(false, event.message);
    }

	onIPCChatSetTitle(info, event) {
		const {value} = event;

		this.title = value;

		this.doNotify('chat-title-changed', {
			value: this.title
		});
	}

	onIPCChatSetVar(info, event) {
		const {name, value} = event;

		this.variables[name] = value;

		this.doNotify('chat-var-changed', {
			name: name,
			value: this.variables[name]
		});
	}

	onChatLine(sender, messageText) {
        var message = new TextualChatMessage(sender, messageText);
        this.messages.push(message);
        this.notifyMessage(message);
	}


	doNotify(eventType, eventBody) {
        this.renderClients.forEach(function(client) {
            client.send(eventType, eventBody);
        });
		this.emit(eventType, eventBody);
	}

    notifyMessage(message) {
		this.doNotify('chat-new-message', {
			type: 'new_message',
			message: message.serialize()
		});
    }

    destroy() {
        this.renderClients = [];
        ipcMain.removeListener('chat-connect', this.$onIPCChatConnect)
        ipcMain.removeListener('chat-line', this.$onIPCChatLine);
        ipcMain.removeListener('chat-set-title', this.$onIPCChatSetTitle);
        ipcMain.removeListener('chat-set-var', this.$onIPCChatSetVar);
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
    constructor(sender) {
        this.sender = sender;
    }
}

class TextualChatMessage extends ChatMessage{
	constructor(sender, message) {
		super(sender);
		this.message = message;
	}
    serialize() {
        return {
			type: 'textual',
            sender: this.sender ? this.sender.serialize() : false,
            message: this.message
        };
    }
}

class PageChatMessage extends ChatMessage{
	constructor(sender) {
		super(sender);
	}

    serialize() {
        return {
			type: 'page',
            sender: this.sender ? this.sender.serialize() : false
        };
    }
}


module.exports = ChatServer;
