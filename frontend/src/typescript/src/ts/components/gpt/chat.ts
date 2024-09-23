import { ObjectManager } from "../../managers/object_manager";

class Chat {
    id: string;
    div: HTMLElement;
    objectManager: ObjectManager;
    toggle: boolean;
    private chatContainer: HTMLDivElement;
    private messagesContainer: HTMLDivElement;
    private chatInputArea: HTMLTextAreaElement;
    private sendButton: HTMLButtonElement;
    socket: WebSocket;

    constructor() {
        this.id = "chat-gpt";
        this.div = this.createDiv();
        this.toggle = false;
        this.socket = null;

        document.body.appendChild(this.div);
        document.body.appendChild(this.createChatWindow());
        this.addEventListeners();
        this.addStyles();
        ObjectManager.getInstance().subscribeToSocket("aiSocket", this.updateSocket.bind(this));
    }

    private updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`CodeCell ${this.id} updated with new WebSocket`);
    }

    private addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .message-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 10px;
            }
            .message {
                max-width: 70%;
                padding: 10px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            }
            .user-message {
                align-self: flex-end;
                background-color: #dcf8c6;
                color: black;
            }
            .ai-message {
                align-self: flex-start;
                background-color: #e6e6e6;
                color: black;
            }
            .error-message {
                align-self: center;
                background-color: #ff4d4d;
                color: white;
            }
            .message-time {
                font-size: 12px;
                color: #888;
                margin-top: 5px;
            }
            .markdown-block {
                width: 100%;
                box-sizing: border-box;
            }
            .chat-title {
                background-color: #f0f0f0;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                border-bottom: 1px solid #ccc;
            }
            .input-container {
                display: flex;
                flex-direction: column;
                padding: 10px;
                background-color: #f0f0f0;
                border-top: 1px solid #ccc;
            }
            .chat-input-area {
                width: 100%;
                height: 80px;
                padding: 8px;
                border-radius: 10px;
                border: 1px solid #ccc;
                resize: none;
                font-size: 14px;
                line-height: 20px;
                margin-bottom: 10px;
            }
            .send-button {
                align-self: flex-start;
                padding: 8px 20px;
                border-radius: 20px;
                border: none;
                background-color: #007bff;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            }
            .send-button:hover {
                background-color: #0056b3;
            }
        `;
        document.head.appendChild(style);
    }

    static displayMessage(message: string, type: 'user' | 'ai' | 'error' = 'user'): void {
        const chatMessageContainer = document.getElementById("message-container");

        if (!chatMessageContainer) {
            console.error("Chat message container not found.");
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message`;

        // Split the message by newline characters
        const lines = message.split('\n');
        let insideCodeBlock = false;
        let codeBlockContent = '';

        lines.forEach(line => {
            if (line.startsWith('```')) {
                // Toggle code block mode
                if (insideCodeBlock) {
                    // Close the code block
                    const codeElement = document.createElement('div');
                    codeElement.className = 'markdown-block';
                    codeElement.textContent = codeBlockContent;
                    Chat.applyMarkdownStyles(codeElement);
                    messageElement.appendChild(codeElement);
                    insideCodeBlock = false;
                    codeBlockContent = '';
                } else {
                    // Open a new code block
                    insideCodeBlock = true;
                }
            } else if (insideCodeBlock) {
                // Accumulate code block content
                codeBlockContent += line + '\n';
            } else {
                // Handle normal text lines
                const textElement = document.createElement('p');
                textElement.textContent = line;
                messageElement.appendChild(textElement);
            }
        });

        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = new Date().toLocaleTimeString();
        messageElement.appendChild(timeElement);

        chatMessageContainer.appendChild(messageElement);

        // Scroll to the bottom of the chat container
        chatMessageContainer.scrollTop = chatMessageContainer.scrollHeight;
    }

    static applyMarkdownStyles(element: HTMLDivElement): void {
        element.style.backgroundColor = '#2d2d2d';
        element.style.color = '#f8f8f2';
        element.style.padding = '10px';
        element.style.borderRadius = '5px';
        element.style.marginTop = '10px';
        element.style.fontFamily = 'monospace';
        element.style.whiteSpace = 'pre-wrap';
        element.style.overflowX = 'auto';
    }

    createDiv() {
        let div = document.createElement("div");
        div.id = this.id;
        div.className = this.id;
        div.style.boxSizing = "border-box";
        div.style.position = "sticky";
        div.style.top = "90vh";
        div.style.left = "95vw";
        div.style.zIndex = "1000";
        div.style.width = "6vh";
        div.style.height = "6vh";
        div.appendChild(this.addChatGPTIcon());
        div.style.justifyContent = "start";
        div.style.alignItems = "center";
        return div;
    }

    addChatGPTIcon() {
        let div = document.createElement("div");
        div.id = this.id;
        div.className = this.id;
        var image = new Image();
        image.src = "./../img/svg/chatgpt.svg";
        image.style.width = "5vh";
        image.style.height = "5vh";
        image.style.position = "relative";
        image.style.top = "0vh";
        image.style.left = "0vw";
        image.style.borderRadius = '50%';
        image.style.objectFit = 'cover';
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.width = "8vh";
        div.style.height = "8vh";
        div.style.borderRadius = '50%';
        div.style.backgroundColor = "#fcf5fc";
        div.appendChild(image);
        return div;
    }

    addEventListeners() {
        this.div.addEventListener('click', () => {
            if (this.toggle) {
                this.minimizeChatWindow();
            } else {
                this.maximizeChatWindow();
            }
            this.toggle = !this.toggle;
        });

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInputArea.addEventListener('keypress', (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });
    }

    createChatWindow() {
        let div = document.createElement("div");
        div.id = this.id + "chat-window";
        div.className = this.id + "chat-window";
        div.style.position = "fixed";
        div.style.top = "8vh";
        div.style.left = "50vw";
        div.style.width = "49vw";
        div.style.height = "91vh";
        div.style.display = "none";
        div.style.zIndex = "3";
        div.style.backgroundColor = "white";
        div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .4)";
        
        const titleDiv = document.createElement("div");
        titleDiv.className = "chat-title";
        titleDiv.textContent = "ChatGPT";
        titleDiv.style.fontFamily = "Palatino";
        titleDiv.style.color = "gray";
        titleDiv.style.fontSize = "3vh";

        div.appendChild(titleDiv);
        
        div.appendChild(this.createChatApp());
        return div;
    }

    createChatApp() {
        this.chatContainer = document.createElement('div');
        this.chatContainer.style.width = '100%';
        this.chatContainer.style.height = 'calc(100% - 40px)'; // Adjust for title height
        this.chatContainer.style.display = 'flex';
        this.chatContainer.style.flexDirection = 'column';
        this.chatContainer.style.backgroundColor = '#f9f9f9';
        this.chatContainer.style.fontFamily = 'Arial, sans-serif';

        this.messagesContainer = document.createElement('div');
        this.messagesContainer.id = "message-container";
        this.messagesContainer.className = "message-container";
        this.messagesContainer.style.flex = '1';
        this.messagesContainer.style.overflowY = 'auto';
        this.chatContainer.appendChild(this.messagesContainer);

        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        this.chatInputArea = document.createElement('textarea');
        this.chatInputArea.className = 'chat-input-area';
        this.chatInputArea.placeholder = 'Type a message...';
        inputContainer.appendChild(this.chatInputArea);

        this.sendButton = document.createElement('button');
        this.sendButton.className = 'send-button';
        this.sendButton.textContent = 'Send';
        inputContainer.appendChild(this.sendButton);

        this.chatContainer.appendChild(inputContainer);
        return this.chatContainer;
    }

    maximizeChatWindow() {
        let div = document.getElementById(this.id + "chat-window");
        div.style.display = "flex";
        div.style.flexDirection = "column";
    }

    minimizeChatWindow() {
        let div = document.getElementById(this.id + "chat-window");
        div.style.display = "none";
    }

    private sendMessage(): void {
        const message = this.chatInputArea.value.trim();
        console.log("Sending message through websocket to chatgpt", message);

        if (message !== '') {
            Chat.displayMessage(message, 'user');
            this.chatInputArea.value = '';
            this.socket.send(message);
        }
    }
}

export { Chat };