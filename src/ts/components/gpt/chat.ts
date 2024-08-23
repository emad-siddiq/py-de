import { ObjectManager } from "../../managers/object_manager";
import { createImgDiv } from "../editor/menu/utility";

class Chat {
    id: string;
    div: HTMLElement;
    objectManager: ObjectManager;
    toggle: boolean;
    private chatContainer: HTMLDivElement;
    private messagesContainer: HTMLDivElement;
    private chatInputArea: HTMLTextAreaElement;
    private sendButton: HTMLButtonElement;

    constructor(objectManger: ObjectManager) {
        this.id = "chat-gpt";
        this.div = this.createDiv();
        this.toggle = false;
        

        document.body.appendChild(this.div);
        document.body.appendChild(this.createChatWindow());
        this.addEventListeners();



    }

    createDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", this.id);
        div.setAttribute("class", this.id);
        div.style.boxSizing = "border-box";

        // Set location in browser window
        div.style.position = "sticky";
        //div position from top-left term corner in terms of view-width and view-height
        div.style.top = "90vh";
        div.style.left = "95vw";
        div.style.zIndex = "1000";

        //div size
        div.style.width = "6vh";
        div.style.height = "6vh";
    

        //Add child nodes
        div.appendChild(this.addChatGPTIcon());

        //Return div with styling set
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
            // Maximize ChatGPT window
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

        div.style.backgroundColor = "#fcf5f5";
        div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .4)";

        div.appendChild(this.createChatApp());

        return div;
    }

    createChatApp() {
        this.chatContainer = document.createElement('div');
        this.applyChatContainerStyles(this.chatContainer);

        // Create messages container
        this.messagesContainer = document.createElement('div');
        this.applyMessagesContainerStyles(this.messagesContainer);
        this.chatContainer.appendChild(this.messagesContainer);

        this.chatInputArea = document.createElement('textarea'); // Changed to textarea
        this.chatInputArea.placeholder = 'Type a message...';
        this.applyChatInputAreaStyles(this.chatInputArea);
        this.chatContainer.appendChild(this.chatInputArea);

        // Create send button
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
        console.log(message);

        if (message !== '') {
            const messageElement = document.createElement('div');
            messageElement.textContent = message;
            this.messagesContainer.appendChild(messageElement);
            this.chatInputArea.value = '';
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
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
        //element.style.borderBottom = '1px solid #ccc';
        element.style.marginBottom = '10px';
        element.style.padding = '1px';
    }



    private applyChatInputAreaStyles(element: HTMLTextAreaElement): void {
        element.style.height = '10vh';
        element.style.marginTop = '6vh';

        element.style.width = '100%';
        element.style.padding = '8px'; // Padding for space inside the input
        element.style.borderRadius = '3px';
        element.style.border = '1.5px solid #ccc';
        element.style.boxSizing = 'border-box'; // Ensure padding is included in width
        element.style.fontSize = '16px';       // Adjust font size if needed
        element.style.lineHeight = 'normal';   // Use normal line height to align text at the top
        element.style.overflow = 'hidden';     // Hide any overflow text
        element.style.verticalAlign = 'top';   // Align text at the top
        element.style.resize = 'none';   // Align text at the top

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
        element.style.display = 'flex'; // Use flexbox
        element.style.justifyContent = 'center'; // Center horizontally
        element.style.alignItems = 'center'; // Center vertically





        element.addEventListener('mouseenter', () => {
            element.style.backgroundColor = '#0056b3';
        });

        element.addEventListener('mouseleave', () => {
            element.style.backgroundColor = '#007bff';
        });
    }






}

export {Chat}