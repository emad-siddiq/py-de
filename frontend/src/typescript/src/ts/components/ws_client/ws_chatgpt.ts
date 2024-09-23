import { Chat } from "../gpt/chat";
import { ObjectManager } from "./../../managers/object_manager";  // Adjust the import path as needed

class WebSocketChatGPT {
    private url: string;
    private socket: WebSocket | null;
    private onOpenCallback: ((socket: WebSocket) => void) | null;
    private reconnectTimer: number | null;
    private objectManager: ObjectManager;
    private socketId: string;

    constructor(url: string, socketId: string, onOpenCallback?: (socket: WebSocket) => void) {
        this.url = url;
        this.socket = null;
        this.onOpenCallback = onOpenCallback || null;
        this.reconnectTimer = null;
        this.objectManager = ObjectManager.getInstance();
        this.socketId = socketId;
        this.connect();

        // Subscribe to socket updates
        this.objectManager.subscribeToSocket(this.socketId, this.handleSocketUpdate.bind(this));
    }

    private connect(): void {
        if (this.socket) {
            this.socket.close();
        }

        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', this.onOpen.bind(this));
        this.socket.addEventListener('message', this.onMessage.bind(this));
        this.socket.addEventListener('error', this.onError.bind(this));
        this.socket.addEventListener('close', this.onClose.bind(this));

        // Add the new socket to ObjectManager
        this.objectManager.addWebSocket(this.socketId, this.socket);
    }

    private handleSocketUpdate(newSocket: WebSocket): void {
        console.log('Received socket update for ChatGPT');
        if (this.socket !== newSocket) {
            if (this.socket) {
                this.socket.close();
            }
            this.socket = newSocket;
            this.url = newSocket.url;
            
            // Re-attach event listeners to the new socket
            this.socket.addEventListener('open', this.onOpen.bind(this));
            this.socket.addEventListener('message', this.onMessage.bind(this));
            this.socket.addEventListener('error', this.onError.bind(this));
            this.socket.addEventListener('close', this.onClose.bind(this));

            if (this.socket.readyState === WebSocket.OPEN) {
                this.onOpen();
            }
        }
    }

    private onOpen(): void {
        console.log('ChatGPT web socket connection established.');
        if (this.onOpenCallback && this.socket) {
            this.onOpenCallback(this.socket);
        }
    }

    private onMessage(event: MessageEvent): void {
        console.log('Received message:', event.data);
        Chat.displayMessage(event.data, 'ai');
    }

    private onError(event: Event): void {
        console.error('WebSocket error:', event);
        Chat.displayMessage(`Error: ${event.type}`, 'error');
    }

    private onClose(): void {
        console.log('WebSocket connection closed. Reconnecting in 5 seconds...');
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = window.setTimeout(() => {
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

    public close(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.socket) {
            this.socket.close();
        }
        this.objectManager.removeWebSocket(this.socketId);
    }
}

export { WebSocketChatGPT }