class Chat {
    get COMMANDS() {
        return [{
            name: 'clear',
            description: 'Clear the chat window',
            action: _.bind(this.clearChat, this)
        }, {
            name: 'title',
            description: 'Set the title of the task (use ampersands before variable names, like *&var*)',
            args: ['description'],
            action: _.bind(this.setTitle, this)
        }, {
            name: 'help',
            description: 'Print out this message',
            action: _.bind(this.printCommandHelp, this)
        }, {
            name: 'set',
            description: 'Set a variable value',
            args: ['var', 'val'],
            action: _.bind(this.setVar, this)
        }];
    }

    setVar(value) {
        console.log(value);
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
        this.addChatMessage('🤖 Arbi', commandDescriptionString, {
            color: '#307f8c'
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
                $('#chat-form').submit();
                event.preventDefault();
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
        const {ipcRenderer} = require('electron');
        ipcRenderer.send('chat-connect');
        ipcRenderer.on('new-message', _.bind(function(event, data) {
            const {message,sender} = data.message;
            this.addChatMessage('Me', message);
        }, this));
    }

    addChatMessage(sender, message, options) {
        const container = $('#chat-lines');
        var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
        container.append(this.getChatMessageElement(sender, message, options))
        if (at_bottom) {
            container.scrollTop(container.prop('scrollHeight'));
        }
    }

    clearChat() {
        $('#chat-lines').children().remove();
    }

    disable() {
        $('#chat-box').val('').prop('disabled', true).hide();
    }

    enable() {
        $('#chat-box').prop('disabled', false).show();
        this.printCommandHelp('Commands:')
    }

    addChatMessage(sender, message, options) {
        const container = $('#chat-lines');
        var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
        container.append(this.getChatMessageElement(sender, message, options))
        if (at_bottom) {
            container.scrollTop(container.prop('scrollHeight'));
        }
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
            rv.append($('<span />', {
                class: 'from',
                text: sender,
                style: 'color:' + options.color + ';'
            }))
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