class Chat {
    get COMMANDS() {
        return [{
            name: 'clear',
            description: 'Clear the chat window',
            action: _.bind(this.clear, this)
        }, {
            name: 'title',
            description: 'Set the title of the task (use ampersands before variable names, like *&var*)',
            args: ['description'],
            action: _.bind(this.notifySetTitle, this)
        }, {
            name: 'help',
            description: 'Print out this message',
            action: _.bind(this.printCommandHelp, this)
        }, {
            name: 'set',
            description: 'Set a variable value',
            args: ['var', 'val'],
            action: _.bind(this.notifySetVar, this)
        }, {
            name: 'name',
            args: ['name'],
            description: 'Set your chat handle',
            action: _.bind(this.setName, this)
        }];
    }

    sendIPCMessage() {
        const {ipcRenderer} = require('electron');
        return ipcRenderer.send.apply(ipcRenderer, arguments);
    }
    onIPCMessage(message_type, responder, context) {
        const {ipcRenderer} = require('electron');
        const func = _.bind(responder, context || this);
        ipcRenderer.on.call(ipcRenderer, message_type, func);

        return function() {
            ipcRenderer.removeListener(message_type, func);
        };
    }

    notifySetVar(fullMessage) {
		const trimmedMessage = fullMessage.trim();
		var spaceIndex = trimmedMessage.search(/\s/);
		if (spaceIndex < 0) {
			spaceIndex = message.length;
		}
		const name = trimmedMessage.slice(0, spaceIndex);
		const value = trimmedMessage.slice(spaceIndex + 1);

        this.sendIPCMessage('chat-set-var', {
            name: name,
            value: value
        });
    }

    setVar(name, value) {
		this.sendIPCMessage('chat-set-var', {
            name: name,
            value: value
		});
    }
    setName(name) {
		this.sendIPCMessage('chat-set-name', {
            name: name
		});
    }

    notifySetTitle(title) {
		this.sendIPCMessage('chat-set-title', {
			value: title
		});
    }

    setTitle(title) {
        $('#task-name').text(title);
    }

    printCommandHelp(starterLine) {
        starterLine = starterLine || '';
        var commandDescriptions = _.map(this.COMMANDS, function(c) {
            var name = '**/' + c.name + '**';
            var args = _.map(c.args || [], function(a) {
                return '{' + a + '}';
            }).join(' ');
            if (args.length > 0) {
                name = name + ' ' + args + '';
            }
            name = name + ': ' + c.description + '';
            return name;
        });
        var commandDescriptionString = starterLine + '\n' + commandDescriptions.join('\n');
        // this.addChatMessage('🤖 Arbi', commandDescriptionString, {
        //     color: '#307f8c'
        // });
        this.addChatMessage(false, commandDescriptionString, {
            class: 'command'
        });
    }

    doCommand(command, args) {
        var matchingCommands = _.filter(this.COMMANDS, function(c) {
            return c.name.toUpperCase() === command.toUpperCase();
        });
        this.addChatMessage(false, '/' + command + ' ' + args, {
            class: 'command'
        });
        if (matchingCommands.length === 0) {
            this.printCommandHelp('*/' + command + '* is not a recognized command');
        } else {
            _.each(matchingCommands, function(c) {
                c.action(args);
            });
        }
    }
    constructor () {
        $('#chat-box').on('keydown', function(event) {
            if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)) {
                event.preventDefault();
                $('#chat-form').submit();
            }
        });
        $('#chat-form').on('submit', _.bind(function(event) {
            this.sendCurrentTextMessage();
            event.preventDefault();
        }, this));
        // enableChat();

        $('#task').on('click', function() {
            var script_bar = $('#script_bar');
            var task_button = $('#task');
            if (script_bar.is(':hidden')) {
                task_button.addClass('active');
                script_bar.show();
            } else {
                task_button.removeClass('active');
                script_bar.hide();
            }
        });
    }

    connect() {
        this.sendIPCMessage('chat-connect');
        this.removeChatMessageListener = this.onIPCMessage('chat-new-message', function(event, data) {
			const {type, sender} = data;
			if(type == 'textual') {
				const {message} = data;
				this.addChatMessage(sender, message);
			} else {
                console.log(data);
            }
        });
        this.removeVarChangedListener = this.onIPCMessage('chat-var-changed', function(event, data) {
            const {name, value} = data;
            this.setVar(name, value);
        });
        this.removeChatTitleChangedListener = this.onIPCMessage('chat-title-changed', function(event, data) {
            const {value} = data;
            this.setTitle(value);
        });
    }

    addChatMessage(sender, message, options) {
        const container = $('#chat-lines');
        var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
        container.append(this.getChatMessageElement(sender, message, options))
        if (at_bottom) {
            container.scrollTop(container.prop('scrollHeight'));
        }
    }

    clear() {
        $('#chat-lines').children().remove();
    }

    disable() {
        $('#chat-box').val('').prop('disabled', true).hide();
        if(this.removeChatMessageListener) {
            this.removeChatMessageListener();
        }
        if(this.removeVarChangedListener) {
            this.removeVarChangedListener();
        }
        if(this.removeChatTitleChangedListener) {
            this.removeChatTitleChangedListener();
        }
        this.sendIPCMessage('chat-disconnect');
    }

    enable() {
        $('#chat-box').prop('disabled', false).show();
        this.printCommandHelp('Commands:')
    }

    getChatMessageElement(sender, message, options) {
        options = _.extend({
            class: '',
            color: ''
        }, options);
        var rv = $('<li />', {
            class: 'chat-line ' + options.class
        });
        if (sender) {
            if(sender.avatar) {
                rv.append($('<span />', {
                    html: sender.avatar + "&nbsp;"
                }));
            }
            rv.append($('<span />', {
                class: 'from',
                text: sender.handle,
                style: 'color:' + options.color + ';'
            }));
        }
        rv.append($('<span />', {
            class: 'message',
            html: Chat.mdify(message)
        }));
        return rv;
    }

    sendCurrentTextMessage() {
        var message = $('#chat-box').val();
        $('#chat-box').val('');
        if (message) {
            if (message[0] == '/') {
                var spaceIndex = message.search(/\s/);
                if (spaceIndex < 0) {
                    spaceIndex = message.length;
                }

                var command = message.slice(1, spaceIndex);
                var args = message.slice(spaceIndex + 1);
                this.doCommand(command, args);
            } else {
                // this.addChatMessage('Me', message);
                const {ipcRenderer} = require('electron');
                ipcRenderer.send('chat-line', {
                    message: message
                });
            }
        }
    }

    static mdify(message) {
        //  var tmp = document.createElement("DIV");
        //  tmp.innerHTML = message;
        //  var rv = tmp.textContent || tmp.innerText || "";
        var rv = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return rv.replace(/\*\*([^*]+)\*\*/g, "<b>$1<\/b>").replace(/\*([^*]+)\*/g, "<i>$1<\/i>");
    }
}
