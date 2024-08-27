import { Chat } from "../gpt/chat";

// WebSocketClient.ts
class WebSocketClientChatGPT {
    private url: string;
    private socket: WebSocket | null;
    private onOpenCallback: ((socket: WebSocket) => void) | null;

    constructor(url: string, onOpenCallback?: (socket: WebSocket) => void) {
        this.url = url;
        this.socket = null;
        this.onOpenCallback = onOpenCallback || null;
        this.connect();
    }

    private connect(): void {
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', this.onOpen.bind(this));
        this.socket.addEventListener('message', this.onMessage.bind(this));
        this.socket.addEventListener('error', this.onError.bind(this));
        this.socket.addEventListener('close', this.onClose.bind(this));
    }

    private onOpen(): void {
        console.log('ChatGPT web socket connection established.');
        if (this.onOpenCallback && this.socket) {
            this.onOpenCallback(this.socket);
        }
    }

    private onMessage(event: MessageEvent): void {

        //TODO this should select the message container and 
        // paste response in there

        
        console.log('Received message:', event.data);
        Chat.displayMessage(event.data);

    }

    private onError(event: Event): void {
        console.error('WebSocket error:', event);
        Chat.displayMessage(`Error: ${event.type}`, 'error');
    }

    private onClose(): void {
        console.log('WebSocket connection closed. Reconnecting in 5 seconds...');
        setTimeout(() => {
            this.connect();
        }, 5000);
    }

    public sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
    }

   
}


export {WebSocketClientChatGPT}