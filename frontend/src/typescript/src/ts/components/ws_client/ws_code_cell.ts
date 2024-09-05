import { ObjectManager } from "../../managers/object_manager";

class WebSocketCodeCell {
    private url: string;
    private socket: WebSocket | null;
    private onOpenCallback: ((socket: WebSocket) => void) | null;
    private reconnectTimer: number | null;
    private objectManager: ObjectManager;
    private socketId: string;
    private pingInterval: number | null;
    private lastPongTime: number;

    constructor(url: string, socketId: string, onOpenCallback: (socket: WebSocket) => void) {
        this.url = url;
        this.socket = null;
        this.onOpenCallback = onOpenCallback;
        this.reconnectTimer = null;
        this.objectManager = ObjectManager.getInstance();
        this.socketId = socketId;
        this.pingInterval = null;
        this.lastPongTime = Date.now();
        this.connect();

        // Subscribe to socket updates
        this.objectManager.subscribeToSocket(this.socketId, this.handleSocketUpdate.bind(this));
    }

    private connect(): void {
        if (this.socket) {
            this.socket.close();
        }

        console.log(`Attempting to connect to WebSocket at ${this.url}`);
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
        this.startPingInterval();
    }

    private onMessage(event: MessageEvent): void {
        console.log('Received message:', event.data);
        if (event.data === 'pong') {
            this.lastPongTime = Date.now();
            console.log('Received pong from server');
        } else {
            console.log('Python executed output:\n', event.data);
            if (event.data) {
                const editor = this.objectManager.getObject('editor');
                if (editor && typeof editor.displayOutputCell === 'function') {
                    editor.displayOutputCell(event.data);
                } else {
                    console.warn('Editor not found or displayOutputCell is not a function');
                }
            }
        }
    }

    private onError(event: Event): void {
        console.error('CodeCell WebSocket error:', event);
    }

    private onClose(event: CloseEvent): void {
        console.log(`CodeCell WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.stopPingInterval();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = window.setTimeout(() => {
            console.log('Attempting to reconnect...');
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

    private startPingInterval(): void {
        this.pingInterval = window.setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send('ping');
                console.log('Sent ping to server');
                
                // Check if we've received a pong recently
                if (Date.now() - this.lastPongTime > 30000) { // 30 seconds
                    console.warn('No pong received recently. Closing connection.');
                    this.socket.close();
                }
            }
        }, 15000); // Send a ping every 15 seconds
    }

    private stopPingInterval(): void {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    public sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            console.log('Sent message:', message);
        } else {
            console.warn('CodeCell WebSocket is not open. Cannot send message.');
        }
    }

    public close(): void {
        console.log('Closing CodeCell WebSocket connection');
        this.stopPingInterval();
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