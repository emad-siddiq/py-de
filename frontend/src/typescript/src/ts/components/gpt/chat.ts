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
        ObjectManager.getInstance().subscribeToSocket("codeSocket", this.updateSocket.bind(this));

    }

    private updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`CodeCell ${this.id} updated with new WebSocket`);
    }
    

    static displayMessage(message: string, type: 'normal' | 'error' = 'normal'): void {
        const chatMessageContainer = document.getElementById("message-container");

        if (!chatMessageContainer) {
            console.error("Chat message container not found.");
            return;
        }

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
                    chatMessageContainer.appendChild(codeElement);
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
                const messageElement = document.createElement('p');
                messageElement.textContent = line;
                if (type === 'error') {
                    messageElement.style.color = 'red';
                }
                chatMessageContainer.appendChild(messageElement);
            }
        });

        // Scroll to the bottom of the chat container
        chatMessageContainer.scrollTop = chatMessageContainer.scrollHeight;
    }

    // Helper function to apply styles to markdown code blocks
    static applyMarkdownStyles(element: HTMLDivElement): void {
        element.style.backgroundColor = '#2d2d2d'; // Dark background for code block
        element.style.color = '#f8f8f2';           // Light text color
        element.style.padding = '10px';
        element.style.borderRadius = '5px';
        element.style.marginTop = '10px';
        element.style.fontFamily = 'monospace';
        element.style.whiteSpace = 'pre-wrap';     // Preserve whitespace
        element.style.overflowX = 'auto';          // Horizontal scrolling for long lines
    }

    createDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", this.id);
        div.setAttribute("class", this.id);
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
        div.setAttribute("id", this.id);
        div.setAttribute("class", this.id);
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
            if (event.shiftKey && event.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    createChatWindow() {
        let div = document.createElement("div");
        div.setAttribute("id", this.id + "chat-window");
        div.setAttribute("class", this.id + "chat-window");
        div.style.position = "fixed";
        div.style.top = "8vh";
        div.style.left = "50vw";
        div.style.width = "49vw";
        div.style.height = "91vh";
        div.style.display = "none";
        div.style.zIndex = "3";
        div.style.backgroundColor = "black";
        div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .4)";
        div.appendChild(this.createChatApp());
        return div;
    }

    createChatApp() {
        this.chatContainer = document.createElement('div');
        this.applyChatContainerStyles(this.chatContainer);

        this.messagesContainer = document.createElement('div');
        this.messagesContainer.setAttribute("id", "message-container");
        this.messagesContainer.setAttribute("class", "message-container");

        this.applyMessagesContainerStyles(this.messagesContainer);
        this.chatContainer.appendChild(this.messagesContainer);

        this.chatInputArea = document.createElement('textarea');
        this.chatInputArea.placeholder = 'Type a message...';
        this.applyChatInputAreaStyles(this.chatInputArea);
        this.chatContainer.appendChild(this.chatInputArea);

        this.sendButton = document.createElement('button');
        this.sendButton.textContent = 'Send';
        this.applySendButtonStyles(this.sendButton);
        this.chatContainer.appendChild(this.sendButton);
        return this.chatContainer;
    }

    maximizeChatWindow() {
        let div = document.getElementById(this.id + "chat-window");
        div.style.display = "flex";
    }

    minimizeChatWindow() {
        let div = document.getElementById(this.id + "chat-window");
        div.style.display = "none";
    }

    private sendMessage(): void {
        const message = this.chatInputArea.value.trim();
        console.log("Sending message through websocket to chatgpt", message);

        if (message !== '') {
            const messageElement = document.createElement('div');
            messageElement.textContent = message;
            this.messagesContainer.appendChild(messageElement);
            this.chatInputArea.value = '';
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            this.socket.send(message);
        }
    }

    private applyChatContainerStyles(element: HTMLDivElement): void {
        element.style.width = '47vw';
        element.style.height = '70vh';
        element.style.margin = '0 auto';
        element.style.border = '1.5px solid #ccc';
        element.style.borderRadius = '5px';
        element.style.marginTop = '2vh';
        element.style.paddingBottom = '1vh';
        element.style.backgroundColor = '#f9f9f9';
        element.style.fontFamily = 'Arial, sans-serif';
    }

    private applyMessagesContainerStyles(element: HTMLDivElement): void {
        element.style.height = '65vh';
        element.style.overflowY = 'auto';
        element.style.marginBottom = '10px';
        element.style.padding = '1px';
    }

    private applyChatInputAreaStyles(element: HTMLTextAreaElement): void {
        element.style.height = '10vh';
        element.style.marginTop = '6vh';
        element.style.width = '100%';
        element.style.padding = '8px';
        element.style.borderRadius = '3px';
        element.style.border = '1.5px solid #ccc';
        element.style.boxSizing = 'border-box';
        element.style.fontSize = '16px';
        element.style.lineHeight = 'normal';
        element.style.overflow = 'hidden';
        element.style.verticalAlign = 'top';
        element.style.resize = 'none';
    }

    private applySendButtonStyles(element: HTMLButtonElement): void {
        element.style.padding = '8px';
        element.style.borderRadius = '3px';
        element.style.border = '1px solid #ccc';
        element.style.backgroundColor = '#007bff';
        element.style.color = 'white';
        element.style.cursor = 'pointer';
        element.style.marginTop = '1vh';
        element.style.width = '5vw';
        element.style.height = '4vh';
        element.style.fontSize = '18px';
        element.style.display = 'flex';
        element.style.justifyContent = 'center';
        element.style.alignItems = 'center';

        element.addEventListener('mouseenter', () => {
            element.style.backgroundColor = '#0056b3';
        });

        element.addEventListener('mouseleave', () => {
            element.style.backgroundColor = '#007bff';
        });
    }
}

export { Chat };
