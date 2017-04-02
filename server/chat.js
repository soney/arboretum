const EventEmitter = require('events').EventEmitter;
const electron = require('electron');
const ipcMain = electron.ipcMain;
const _ = require('underscore');

class ChatServer extends EventEmitter {
    constructor(mainWindow) {
        super();
        this.$onIPCChatConnect = _.bind(this.onIPCChatConnect, this)

        ipcMain.on('chat-connect', this.$onIPCChatConnect)

        this.title = false;
        this.messages = [];
        this.participants = [];
		this.variables = {};

        this.arbi = this.addAutomatedParticipant('Arbi', '&#129302;');
    }
    serialize() {
        return {
            title: this.title,
			variables: this.variables,
            messages: this.messages.map(function(m) { return m.serialize(); }),
            participants: this.participants.map(function(p) { return p.serialize(); })
        };
    }

    addParticipant(participant) {
        this.participants.push(participant);
		this.doNotify('chat-participants-changed', {
            participants: this.participants.map(function(p) { return p.serialize(); })
        });
    }
    removeParticipant(participant) {
        const participantIndex = this.participants.indexOf(participant);
        if(participantIndex >= 0) {
            this.participants.splice(participantIndex, 1);
        }
		this.doNotify('chat-participants-changed', {
            participants: this.participants.map(function(p) { return p.serialize(); })
        });
    }

    addAutomatedParticipant(name, avatar) {
        const participant = new AutomatedChatParticipant(this, name, avatar);
        this.addParticipant(participant);
        participant.on('chat-line', _.bind(this.onChatLine, this));
        participant.on('chat-page', _.bind(this.onChatPage, this));
        return participant;
    }

    addIPCParticipant(client) {
        const participant = new IPCChatParticipant(this, this.getLocalName(), this.getLocalAvatar(), client);
        this.addParticipant(participant);
        participant.on('chat-line', _.bind(this.onChatLine, this));
        participant.on('chat-set-title', _.bind(this.onSetTitle, this));
        participant.on('chat-set-var', _.bind(this.onSetVar, this));
        participant.on('chat-set-name', _.bind(this.onSetName, this));
        participant.on('chat-page', _.bind(this.onChatPage, this));
        participant.on('chat-disconnect', _.bind(this.onChatDisconnect, this));
        return participant;
    }

    addSocketParticipant(socket, browserShadow) {
        const participant = new SocketChatParticipant(this, this.getRemoteName(), this.getRemoteAvatar(), socket, browserShadow)
        this.addParticipant(participant);
        participant.on('chat-line', _.bind(this.onChatLine, this));
        participant.on('chat-set-name', _.bind(this.onSetName, this));
        participant.on('chat-page', _.bind(this.onChatPage, this));
        participant.on('chat-disconnect', _.bind(this.onChatDisconnect, this));
        return participant;
    }

    getRemoteName() {
        return 'Remote ' + this.participants.length;
    }

    getLocalName() {
        return 'Admin ' + this.participants.length;
    }

    getLocalAvatar() { return '&#129312;'; }
    getRemoteAvatar() { return '&#128100;'; }
    // getRemoteAvatar() { return '&#128566;'; }

    onChatDisconnect(participant) {
        participant.destroy();
        this.removeParticipant(participant);
    }

    onSocketChatConnect(socket, browserShadow) {
        this.addSocketParticipant(socket, browserShadow);
    }

    onIPCChatConnect(info) {
        const participant = this.addIPCParticipant(info.sender);
        participant.notifyClient('connected', this.serialize());
    }

    getVisibleNodes(messageId) {
        const message = this.messages[messageId];
        if(message && message instanceof PageChatMessage) {
            return message.nodes;
        } else {
            return [];
        }
    }

	onChatLine(sender, messageText) {
        const messageID = this.messages.length;
        var message = new TextualChatMessage(sender, messageText, messageID);
        this.messages.push(message);
		this.doNotify('chat-new-message', message.serialize());
	}

	onChatPage(sender, nodes) {
        const messageID = this.messages.length;
        var message = new PageChatMessage(sender, nodes, messageID);
        this.messages.push(message);
		this.doNotify('chat-new-message', message.serialize());
	}

    onSetTitle(participant, title) {
        this.title = title;

		this.doNotify('chat-title-changed', {
			value: this.title
		});
        this.arbi.say(participant.handle + ' changed the title to "' + this.title + '"');
    }

    onSetVar(participant, name, value) {
		this.variables[name] = value;

		this.doNotify('chat-var-changed', {
			name: name,
			value: this.variables[name]
		});
        this.arbi.say(participant.handle + ' set ' + name + ' to ' + this.variables[name]);
    }

    onSetName(client, newName) {
        const oldName = client.getHandle();
        client.setHandle(newName);

        this.doNotify('chat-name-changed', {
            oldName: oldName,
            name: newName
        });
		this.doNotify('chat-participants-changed', {
            participants: this.participants.map(function(p) { return p.serialize(); })
        });

        this.arbi.say(oldName + ' is now ' + newName);
    }


	doNotify(eventType, eventBody) {
        this.participants.forEach(function(participant) {
            participant.notifyClient(eventType, eventBody);
        });
	}

    destroy() {
        ipcMain.removeListener('chat-connect', this.$onIPCChatConnect)
        this.participants.forEach(function(participant) {
            participant.destroy();
        });
        this.participants = [];
    }
}

class ChatParticipant extends EventEmitter {
    constructor(chatServer, handle, avatar) {
        super();
        this.server = chatServer;
        this.handle = handle;
        this.avatar = avatar;
    }
    serialize() {
        return {
            handle: this.handle,
            avatar: this.avatar
        };
    }
    getHandle() {
        return this.handle;
    }
    setHandle(handle) {
        this.handle = handle;
    }
    destroy() {
        this.removeAllListeners();
    }
}

class AutomatedChatParticipant extends ChatParticipant {
    constructor(chatServer, handle, avatar) {
        super(chatServer, handle, avatar);
    }
    notifyClient(eventType, contents) { }

    say(message) {
        this.emit('chat-line', this, message);
    }

    sendPagePortion() {
    }
}

class IPCChatParticipant extends ChatParticipant {
    constructor(chatServer, handle, avatar, client) {
        super(chatServer, handle, avatar);
        this.client = client;
        this.addListeners();
    }

    addListeners() {
        this.$onChatLine = _.bind(this.onChatLine, this)
        this.$onChatSetTitle = _.bind(this.onChatSetTitle, this)
        this.$onChatSetVar = _.bind(this.onChatSetVar, this)
        this.$onChatSetName = _.bind(this.onChatSetName, this)
        this.$onChatDisconnect = _.bind(this.onChatDisconnect, this)

        ipcMain.on('chat-line', this.$onChatLine);
        ipcMain.on('chat-set-title', this.$onChatSetTitle);
        ipcMain.on('chat-set-var', this.$onChatSetVar);
        ipcMain.on('chat-set-name', this.$onChatSetName);
        ipcMain.on('chat-disconnect', this.$onChatDisconnect);
    }

    removeListeners() {
        ipcMain.removeListener('chat-line', this.$onChatLine);
        ipcMain.removeListener('chat-set-title', this.$onChatSetTitle);
        ipcMain.removeListener('chat-set-var', this.$onChatSetVar);
        ipcMain.removeListener('chat-set-name', this.$onChatSetName);
        ipcMain.removeListener('chat-disconnect', this.$onChatDisconnect);
    }

    notifyClient(eventType, contents) {
        this.client.send(eventType, contents);
    }

    onChatLine(info, event) {
        if(info.sender === this.client) {
            this.emit('chat-line', this, event.message);
        }
    }

	onChatSetTitle(info, event) {
        if(info.sender === this.client) {
            this.emit('chat-set-title', this, event.value);
        }
    }

	onChatSetVar(info, event) {
        if(info.sender === this.client) {
            this.emit('chat-set-var', this, event.name, event.value);
        }
	}

    onChatSetName(info, event) {
        if(info.sender === this.client) {
            this.emit('chat-set-name', this, event.name);
        }
    }

    onChatDisconnect(info, event) {
        if(info.sender === this.client) {
            this.emit('chat-disconnect', this);
        }
    }
}

class SocketChatParticipant extends ChatParticipant {
    constructor(chatServer, handle, avatar, socket, shadowBrowser) {
        super(chatServer, handle, avatar);
        this.socket = socket;
        this.shadowBrowser = shadowBrowser;
        this.addListeners();
    }

    notifyClient(eventType, contents) {
        this.socket.emit(eventType, contents)
    }

    addListeners() {
		this.socket.on('chat-client-ready', _.bind(function() {
			this.socket.emit('chat-connected', this.server.serialize());
		}, this));

        this.socket.on('disconnect', _.bind(function() {
            this.emit('chat-disconnect', this);
        }, this));

        this.$onChatLine = _.bind(this.onChatLine, this)
        this.$onChatSetName = _.bind(this.onChatSetName, this)

        this.socket.on('chat-line', this.$onChatLine);
        this.socket.on('chat-set-name', this.$onChatSetName);

		this.shadowBrowser.on('nodeReply', _.bind(function(nodes) {
            // const {nodeIds} = info;
            // const nodeIds = _.map(nodes, function(node) {
            //     return node.getId();
            // });
            this.emit('chat-page', this, nodes);
		}, this));
    }

    removeListeners() {
        this.socket.removeListener('chat-line', this.$onChatLine);
        this.socket.removeListener('chat-set-name', this.$onChatSetName);
    }

    notifyClient(eventType, contents) {
        this.socket.emit(eventType, contents);
    }

    onChatLine(event) {
        this.emit('chat-line', this, event.message);
    }

    onChatSetName(event) {
        this.emit('chat-set-name', this, event.name);
    }
}

class ChatMessage {
    constructor(sender, messageID) {
        this.sender = sender;
        this.messageID = messageID
    }
}

class TextualChatMessage extends ChatMessage {
	constructor(sender, message, messageID) {
		super(sender, messageID);
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

class PageChatMessage extends ChatMessage {
	constructor(sender, nodes, messageID) {
		super(sender, messageID);
        this.nodes = nodes;
	}

    serialize() {
        return {
			type: 'page',
            sender: this.sender ? this.sender.serialize() : false,
            snippetID: this.messageID
        };
    }
}

module.exports = ChatServer;