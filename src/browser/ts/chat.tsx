// import {ipcRenderer} from 'electron';
// import {Arboretum} from '../browser_main';
// import * as _ from 'underscore';
//
// export interface ChatCommand {
//     name:string,
//     description:string,
//     args?:Array<string>,
//     action:(...args:Array<string>)=>void
// };
//
// export class Chat {
//     private COMMANDS:Array<ChatCommand> = [{
//             name: 'clear',
//             description: 'Clear the chat window',
//             action: this.clear
//         }, {
//             name: 'title',
//             description: 'Set the title of the task (use ampersands before variable names, like *&var*)',
//             args: ['description'],
//             action: this.notifySetTitle
//         }, {
//             name: 'help',
//             description: 'Print out this message',
//             action: this.printCommandHelp
//         }, {
//             name: 'set',
//             description: 'Set a variable value',
//             args: ['var', 'val'],
//             action: this.notifySetVar
//         }, {
//             name: 'name',
//             args: ['name'],
//             description: 'Set your chat handle',
//             action: this.setName
//     }];
//
//     constructor(private arboretum:Arboretum) {
//         $('#chat-box').on('keydown', (event) => {
//             if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)) {
//                 event.preventDefault();
//                 $('#chat-form').submit();
//             }
//         });
//         $('#chat-form').on('submit', (event) => {
//             this.sendCurrentTextMessage();
//             event.preventDefault();
//         });
//         // enableChat();
//
//         $('#task').on('click', () => {
//             const script_bar = $('#script_bar');
//             const task_button = $('#task');
//             if (script_bar.is(':hidden')) {
//                 task_button.addClass('active');
//                 script_bar.show();
//             } else {
//                 task_button.removeClass('active');
//                 script_bar.hide();
//             }
//         });
//     }
//
//     private sendIPCMessage(message:string, data?:any):void {
//         return ipcRenderer.send(message, data);
//     };
//
//     private onIPCMessage(message_type:string, responder:(event:any)=>void, context:any=this):()=>void {
//         const func = _.bind(responder, context);
//         ipcRenderer.on.call(ipcRenderer, message_type, func);
//
//         return () => {
//             ipcRenderer.removeListener(message_type, func);
//         };
//     };
//
//     private notifySetVar(fullMessage:string):void {
// 		const trimmedMessage = fullMessage.trim();
// 		var spaceIndex = trimmedMessage.search(/\s/);
// 		if (spaceIndex < 0) {
// 			spaceIndex = fullMessage.length;
// 		}
// 		const name = trimmedMessage.slice(0, spaceIndex);
// 		const value = trimmedMessage.slice(spaceIndex + 1);
//
//         this.sendIPCMessage('chat-set-var', {
//             name: name,
//             value: value
//         });
//     };
//
//     private setVar(name:string, value:string):void {
//         console.log(name, value);
//     }
//     private setName(name:string):void {
// 		this.sendIPCMessage('chat-set-name', {
//             name: name
// 		});
//     }
//
//     private notifySetTitle(title:string):void {
// 		this.sendIPCMessage('chat-set-title', {
// 			value: title
// 		});
//     }
//
//     private setTitle(title:string):void {
//         $('#task-name').text(title);
//     };
//
//     private printCommandHelp(starterLine:string=''):void {
//         const commandDescriptions = this.COMMANDS.map((c) => {
//             let description = `**/${c.name}**`;
//             const args:string = (c.args || []).map((a) => {
//                 return `{${a}}`;
//             }).join(' ');
//             if (args.length > 0) {
//                 description = `${description} ${args}`;
//             }
//             description = `${description}: ${c.description}`;
//             return description;
//         });
//         const commandDescriptionString = `${starterLine}\n${commandDescriptions.join('\n')}`;
//         // this.addTextualChatMessage(false, commandDescriptionString, {
//         //     class: 'command'
//         // });
//     };
//
//     private doCommand(command:string, args:Array<string>):void {
//         const matchingCommands = this.COMMANDS.filter((c) => {
//             return c.name.toUpperCase() === command.toUpperCase();
//         });
//         // this.addTextualChatMessage(false, `/${command} ${args}`, {
//         //     class: 'command'
//         // });
//         if (matchingCommands.length === 0) {
//             this.printCommandHelp(`*/${command} * is not a recognized command`);
//         } else {
//             matchingCommands.forEach((c) => {
//                 c.action.apply(this, args);
//             });
//         }
//     };
//
//     private connect():void {
//         this.sendIPCMessage('chat-connect');
//         // this.removeChatMessageListener = this.onIPCMessage('chat-new-message', (event, data) => {
// 		// 	const {type, sender} = data;
// 		// 	if(type == 'textual') {
// 		// 		const {message} = data;
// 		// 		this.addTextualChatMessage(sender, message);
// 		// 	} else if(type == 'page') {
//         //         const {snippetID} = data;
//         //         this.addPageChatMessage(sender, snippetID);
// 		// 	} else {
//         //         console.log(data);
//         //     }
//         // });
//         // this.removeVarChangedListener = this.onIPCMessage('chat-var-changed', (event, data) => {
//         //     const {name, value} = data;
//         // });
//         // this.removeChatTitleChangedListener = this.onIPCMessage('chat-title-changed', (event, data) => {
//         //     const {value} = data;
//         //     this.setTitle(value);
//         // });
//         //
//         // this.removeChatParticipantsChangedListener = this.onIPCMessage('chat-participants-changed', (event, data) => {
//         //     const {participants} = data;
//         //     this.setParticipants(participants);
//         // });
//     }
//
//     // setParticipants(participants) {
// 	// 	var participantElements = _.map(participants, function(p) {
// 	// 		return $('<span />').html(p.avatar+'&nbsp;')
//     //         .append(p.handle)
//     //         .addClass('chat-avatar')
//     //         .attr({
//     //             title: p.handle
//     //         });
// 	// 	})
//     //     const chatParticipants = $('#chat-participants');
// 	// 	chatParticipants.children().remove();
// 	// 	chatParticipants.append.apply(chatParticipants, participantElements);
//     // }
//     //
//     // addChatMessage(element) {
//     //     const container = $('#chat-lines');
//     //     var at_bottom = Math.abs(container.scrollTop() + container.height() - container.prop('scrollHeight')) < 100;
//     //     container.append(element);
//     //     if (at_bottom) {
//     //         container.scrollTop(container.prop('scrollHeight'));
//     //     }
//     // }
//     //
//     // addTextualChatMessage(sender, message, options) {
//     //     const element = this.getTextualChatMessageElement(sender, message, options);
//     //     this.addChatMessage(element);
//     // }
//     //
//     // addPageChatMessage(sender, snippetID, options) {
//     //     const url = require('url');
//     //     const href = url.format({
//     //         protocol: 'http',
//     //         hostname: 'localhost',
//     //         port: 3000,
//     //         pathname: '/m',
//     //         query: { m: snippetID }
//     //     });
//     //     const element = this.getPageChatMessageElement(sender, href, options);
//     //     this.addChatMessage(element);
//     // }
//     //
//     private clear():void {
//         $('#chat-lines').children().remove();
//     }
//     private disable():void {
//         $('#chat-box').val('').prop('disabled', true).hide();
//         // this.setParticipants([]);
//         // if(this.removeChatMessageListener) {
//         //     this.removeChatMessageListener();
//         // }
//         // if(this.removeVarChangedListener) {
//         //     this.removeVarChangedListener();
//         // }
//         // if(this.removeChatTitleChangedListener) {
//         //     this.removeChatTitleChangedListener();
//         // }
//         // if(this.removeChatParticipantsChangedListener) {
//         //      this.removeChatParticipantsChangedListener()
//         // }
//         this.sendIPCMessage('chat-disconnect');
//     }
//
//     private enable():void {
//         $('#chat-box').prop('disabled', false).show();
//         this.printCommandHelp('Commands:')
//     }
//
//     // getSenderElements(sender, options) {
//     //     var rv = [];
//     //     options = _.extend({
//     //         color: ''
//     //     }, options);
//     //     if(sender) {
//     //         if(sender.avatar) {
//     //             rv.push($('<span />', {
//     //                 html: sender.avatar + "&nbsp;"
//     //             }));
//     //         }
//     //         rv.push($('<span />', {
//     //             class: 'from',
//     //             text: sender.handle,
//     //             style: 'color:' + options.color + ';'
//     //         }));
//     //     }
//     //     return rv;
//     // }
//     //
//     // getTextualChatMessageElement(sender, message, options) {
//     //     options = _.extend({
//     //         class: ''
//     //     }, options);
//     //
//     //     var rv = $('<li />', {
//     //         class: 'chat-line ' + options.class
//     //     });
//     //
//     //     var senderElements = this.getSenderElements(sender, options);
//     //     rv.append.apply(rv, senderElements);
//     //
//     //     rv.append($('<span />', {
//     //         class: 'message',
//     //         html: Chat.mdify(message)
//     //     }));
//     //     return rv;
//     // };
//
//     // private getPageChatMessageElement(sender, href:string, options?:{class:string}):JQuery<HTMLElement> {
//     //     options = _.extend({
//     //         class: ''
//     //     }, options);
//     //
//     //     const rv:JQuery<HTMLElement> = $('<li />', {
//     //         class: 'chat-line ' + options.class
//     //     });
//     //
//     //     const senderElements = this.getSenderElements(sender, options);
//     //     rv.append.apply(rv, senderElements);
//     //
//     //     rv.append($('<iframe />', {
//     //         attr: {
//     //             src: href,
//     //             class: 'snippet'
//     //         },
//     //         css: {
//     //         }
//     //     }));
//     //     return rv;
//     // };
//     //
//     private sendCurrentTextMessage():void {
//         let message:string = $('#chat-box').val() + '';
//         $('#chat-box').val('');
//         if (message) {
//             if (message[0] == '/') {
//                 let spaceIndex = message.search(/\s/);
//                 if (spaceIndex < 0) {
//                     spaceIndex = message.length;
//                 }
//
//                 const command = message.slice(1, spaceIndex);
//                 const args = message.slice(spaceIndex + 1);
//                 this.doCommand(command, args.split(' '));
//             } else {
//                 this.sendIPCMessage('chat-line', {
//                     message: message
//                 });
//             }
//         }
//     }
//
//     static mdify(message:string):string {
//         //  var tmp = document.createElement("DIV");
//         //  tmp.innerHTML = message;
//         //  var rv = tmp.textContent || tmp.innerText || "";
//         var rv = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
//         return rv.replace(/\*\*([^*]+)\*\*/g, "<b>$1<\/b>").replace(/\*([^*]+)\*/g, "<i>$1<\/i>");
//     }
import * as React from 'react';

const ENTER_KEY:number = 13;

type ArboretumChatProps = {
    onSendMessage:(message:string)=>void,
    chatText?:string
};
type ArboretumChatState = {
    chatText:string
};

export class ArboretumChat extends React.Component<ArboretumChatProps, ArboretumChatState> {
    constructor(props) {
        super(props);
        this.state = {
            chatText:this.props.chatText||''
        };
    };

    private chatKeyDown = (event:React.KeyboardEvent<HTMLTextAreaElement>):void => {
        const {keyCode, ctrlKey, altKey, metaKey, shiftKey} = event;
        if(keyCode === ENTER_KEY && !(ctrlKey || altKey || metaKey || shiftKey)) {
            event.preventDefault();
            const {chatText} = this.state;
            if(chatText !== '') {
                if(this.props.onSendMessage) { this.props.onSendMessage(chatText); }
                this.setState({chatText:''});
            }
        }
    };

    private onTextareaChange = (event:React.ChangeEvent<HTMLTextAreaElement>):void => {
        this.setState({ chatText:event.target.value });
    };

    public render():React.ReactNode {
        return <div className='chat'>
            <h6 id="task_title"><span className="icon icon-chat"></span><span id='task-name'>Chat</span></h6>
            <div id="chat-participants"></div>
            <ul id="chat-lines"></ul>
            <form id="chat-form">
                <textarea id="chat-box" className="form-control" placeholder="Send a message" onChange={this.onTextareaChange} onKeyDown={this.chatKeyDown} value={this.state.chatText}></textarea>
            </form>
        </div>;
    };
};
