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
