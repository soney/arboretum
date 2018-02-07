import {EventEmitter} from 'events';
import {ipcMain} from 'electron';
import * as _ from 'underscore';

export class ChatServer extends EventEmitter {
    private title:string = '';
    private messages:Array<ChatMessage> = new Array<ChatMessage>();
    private participants:Array<ChatParticipant> = new Array<ChatParticipant>();
    private variables:Map<string, string> = new Map<string, string>();
    private arbi:AutomatedChatParticipant;
    constructor(mainWindow) {
        super();
        ipcMain.on('chat-connect', this.onIPCChatConnect)

        this.arbi = this.addAutomatedParticipant('Arbi', '&#129302;');
    }
    public serialize() {
        return {
            title: this.title,
			variables: this.variables,
            messages: this.messages.map(function(m) { return m.serialize(); }),
            participants: this.participants.map(function(p) { return p.serialize(); })
        };
    }

    public addParticipant(participant:ChatParticipant):void {
        this.participants.push(participant);
		this.doNotify('chat-participants-changed', {
            participants: this.participants.map(function(p) { return p.serialize(); })
        });
    }
    public removeParticipant(participant:ChatParticipant):void {
        const participantIndex = this.participants.indexOf(participant);
        if(participantIndex >= 0) {
            this.participants.splice(participantIndex, 1);
        }
		this.doNotify('chat-participants-changed', {
            participants: this.participants.map(function(p) { return p.serialize(); })
        });
    }

    private addAutomatedParticipant(name:string, avatar:string):AutomatedChatParticipant {
        const participant = new AutomatedChatParticipant(this, name, avatar);
        this.addParticipant(participant);
        participant.on('chat-line', _.bind(this.onChatLine, this));
        participant.on('chat-page', _.bind(this.onChatPage, this));
        return participant;
    }

    public addIPCParticipant(client) {
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

    public addSocketParticipant(socket, browserShadow, isAdmin) {
        var avatar, name;
        if(isAdmin) {
            avatar = this.getLocalAvatar();
            name = this.getLocalName();
        } else {
            avatar = this.getRemoteAvatar();
            name = this.getRemoteName();
        }
        const participant = new SocketChatParticipant(this, name, avatar, socket, browserShadow)
        this.addParticipant(participant);
        participant.on('chat-line', _.bind(this.onChatLine, this));
        participant.on('chat-set-name', _.bind(this.onSetName, this));
        participant.on('chat-page', _.bind(this.onChatPage, this));
        participant.on('chat-disconnect', _.bind(this.onChatDisconnect, this));

        if(isAdmin) {
            participant.on('chat-set-title', _.bind(this.onSetTitle, this));
            participant.on('chat-set-var', _.bind(this.onSetVar, this));
            participant.on('chat-set-name', _.bind(this.onSetName, this));
        }

        return participant;
    }

    public getRemoteName():string {
        return `Remote ${this.participants.length}`;
    }

    public getLocalName() :string{
        return `Admin ${this.participants.length}`;
    }

    public getLocalAvatar():string { return '&#129312;'; }
    public getRemoteAvatar() :string{ return '&#128100;'; }
    // getRemoteAvatar() { return '&#128566;'; }

    private onChatDisconnect(participant) {
        participant.destroy();
        this.removeParticipant(participant);
    }

    private onSocketAdminChatConnect(socket) {
        this.addSocketParticipant(socket, false, true);
    }

    private onSocketChatConnect(socket, browserShadow) {
        this.addSocketParticipant(socket, browserShadow, false);
    }

    private onIPCChatConnect = (info) => {
        const participant = this.addIPCParticipant(info.sender);
        participant.notifyClient('connected', this.serialize());
    }

    public getVisibleNodes(messageId) {
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
        this.participants.forEach((participant:ChatParticipant) => {
            participant.notifyClient(eventType, eventBody);
        });
	}

    destroy() {
        ipcMain.removeListener('chat-connect', this.onIPCChatConnect)
        this.participants.forEach(function(participant) {
            participant.destroy();
        });
        this.participants = [];
    }
}

abstract class ChatParticipant extends EventEmitter {
    constructor(private server:ChatServer, private handle:string, private avatar:string) {
        super();
    };
    public serialize() {
        return {
            handle: this.handle,
            avatar: this.avatar
        };
    }
    public getHandle():string { return this.handle; }
    public setHandle(handle:string):void { this.handle = handle; }
    public destroy() { }
    abstract notifyClient(eventType, contents);
}

class AutomatedChatParticipant extends ChatParticipant {
    constructor(chatServer, handle, avatar) {
        super(chatServer, handle, avatar);
    }
    public notifyClient(eventType, contents) { }

    public say(message:string) {
        this.emit('chat-line', this, message);
    }
}

class IPCChatParticipant extends ChatParticipant {
    constructor(chatServer, handle, avatar, private client) {
        super(chatServer, handle, avatar);
        this.addListeners();
    }

    private addListeners() {
        ipcMain.on('chat-line', this.onChatLine);
        ipcMain.on('chat-set-title', this.onChatSetTitle);
        ipcMain.on('chat-set-var', this.onChatSetVar);
        ipcMain.on('chat-set-name', this.onChatSetName);
        ipcMain.on('chat-disconnect', this.onChatDisconnect);
    }

    private removeListeners() {
        ipcMain.removeListener('chat-line', this.onChatLine);
        ipcMain.removeListener('chat-set-title', this.onChatSetTitle);
        ipcMain.removeListener('chat-set-var', this.onChatSetVar);
        ipcMain.removeListener('chat-set-name', this.onChatSetName);
        ipcMain.removeListener('chat-disconnect', this.onChatDisconnect);
    }

    public notifyClient(eventType, contents) {
        this.client.send(eventType, contents);
    }

    private onChatLine = (info, event) => {
        if(info.sender === this.client) {
            this.emit('chat-line', this, event.message);
        }
    }

	private onChatSetTitle = (info, event) => {
        if(info.sender === this.client) {
            this.emit('chat-set-title', this, event.value);
        }
    }

	private onChatSetVar = (info, event) => {
        if(info.sender === this.client) {
            this.emit('chat-set-var', this, event.name, event.value);
        }
	}

    private onChatSetName = (info, event) => {
        if(info.sender === this.client) {
            this.emit('chat-set-name', this, event.name);
        }
    }

    private onChatDisconnect = (info, event) => {
        if(info.sender === this.client) {
            this.emit('chat-disconnect', this);
        }
    }
}

class SocketChatParticipant extends ChatParticipant {
    constructor(chatServer, handle, avatar, private socket, private shadowBrowser) {
        super(chatServer, handle, avatar);
        this.addListeners();
    }
    public destroy() {
        this.removeListeners();
    };

    public notifyClient(eventType, contents) {
        this.socket.emit(eventType, contents)
    };

    private addListeners() {
		this.socket.on('chat-client-ready', _.bind(function() {
			this.socket.emit('chat-connected', this.server.serialize());
		}, this));

        this.socket.on('disconnect', _.bind(function() {
            this.emit('chat-disconnect', this);
        }, this));

        this.socket.on('chat-line', this.onChatLine);
        this.socket.on('chat-set-name', this.onChatSetName);
        this.socket.on('chat-set-title', this.onChatSetTitle);
        this.socket.on('chat-set-var', this.onChatSetVar);

        if(this.shadowBrowser) {
    		this.shadowBrowser.on('nodeReply', _.bind(function(nodes) {
                // const {nodeIds} = info;
                // const nodeIds = _.map(nodes, function(node) {
                //     return node.getId();
                // });
                this.emit('chat-page', this, nodes);
    		}, this));
        }
    }

    public removeListeners():void {
        this.socket.removeListener('chat-line', this.onChatLine);
        this.socket.removeListener('chat-set-name', this.onChatSetName);
        this.socket.removeListener('chat-set-title', this.onChatSetTitle);
        this.socket.removeListener('chat-set-var', this.onChatSetVar);
    }

    private onChatLine = (event) => {
        this.emit('chat-line', this, event.message);
    }

    private onChatSetName = (event) => {
        this.emit('chat-set-name', this, event.name);
    }

	private onChatSetTitle = (info, event) => {
    }

	private onChatSetVar = (info, event) => {
	}
}

export abstract class ChatMessage {
    constructor(protected sender:ChatParticipant, protected messageID:number) { }
    abstract serialize():any;
}

export class TextualChatMessage extends ChatMessage {
	constructor(sender:ChatParticipant, private message:string, messageID:number) {
		super(sender, messageID);
	}

    public serialize() {
        return {
			type: 'textual',
            sender: this.sender ? this.sender.serialize() : false,
            message: this.message
        };
    }
}

export class PageChatMessage extends ChatMessage {
	constructor(sender:ChatParticipant, public nodes:Array<any>, messageID:number) {
		super(sender, messageID);
	}

    public serialize() {
        return {
			type: 'page',
            sender: this.sender ? this.sender.serialize() : false,
            snippetID: this.messageID
        };
    }
}
