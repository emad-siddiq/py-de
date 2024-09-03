import { ObjectManager } from "../../managers/object_manager";  // Adjust the import path as needed

class WebSocketCodeCell {
    private url: string;
    private socket: WebSocket | null;
    private onOpenCallback: ((socket: WebSocket) => void) | null;
    private reconnectTimer: number | null;
    private objectManager: ObjectManager;
    private socketId: string;

    constructor(url: string, socketId: string, onOpenCallback: (socket: WebSocket) => void) {
        this.url = url;
        this.socket = null;
        this.onOpenCallback = onOpenCallback;
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

    private onOpen(): void {
        console.log('CodeCell WebSocket connection established.');
        if (this.onOpenCallback && this.socket) {
            this.onOpenCallback(this.socket);
        }
    }

    private onMessage(event: MessageEvent): void {
        console.log('Received message:', event.data);
        // Handle incoming messages
    }

    private onError(event: Event): void {
        console.error('CodeCell WebSocket error:', event);
    }

    private onClose(): void {
        console.log('CodeCell WebSocket connection closed. Reconnecting in 5 seconds...');
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = window.setTimeout(() => {
            this.connect();
        }, 5000);
    }

    private handleSocketUpdate(socket: WebSocket): void {
        console.log('Received socket update for CodeCell');
        if (this.socket !== socket) {
            if (this.socket) {
                this.socket.close();
            }
            this.socket = socket;
            this.url = socket.url;
            
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

    public sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.warn('CodeCell WebSocket is not open. Cannot send message.');
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

export { WebSocketCodeCell };