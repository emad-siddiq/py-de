import { ObjectManager } from "../../managers/object_manager";
import { OutputCell } from "../editor/output_cell/output_cell";
import { Terminal } from "./../../windows/terminal";

class WebSocketCodeCell {
    private url: string;
    private socket: WebSocket | null;
    private onOpenCallback: ((socket: WebSocket) => void) | null;
    private reconnectTimer: number | null;
    private objectManager: ObjectManager;
    private socketId: string;
    private pingInterval: number | null;
    private lastPongTime: number;
    private terminal: Terminal;
    private executionQueue: { type: 'python' | 'shell'; content: string }[] = [];
    private isExecuting: boolean = false;

    constructor(url: string, socketId: string, onOpenCallback: (socket: WebSocket) => void) {
        this.url = url;
        this.socket = null;
        this.onOpenCallback = onOpenCallback;
        this.reconnectTimer = null;
        this.objectManager = ObjectManager.getInstance();
        this.socketId = socketId;
        this.pingInterval = null;
        this.lastPongTime = Date.now();
        this.terminal = this.objectManager.getObject('terminal') as Terminal;
        this.connect();

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

        this.objectManager.addWebSocket(this.socketId, this.socket);
    }

    private onOpen(): void {
        console.log('CodeCell WebSocket connection established.');
        if (this.onOpenCallback && this.socket) {
            this.onOpenCallback(this.socket);
        }
        this.startPingInterval();
        this.processQueue();
    }

    private onMessage(event: MessageEvent): void {
        console.log('Received message:', event.data);
        if (event.data === 'pong') {
            this.lastPongTime = Date.now();
            console.log('Received pong from server');
        } else {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'python_output') {
                    console.log('Python executed output:\n', data.content);
                    if (data.content) {
                        const editor = this.objectManager.getObject('editor');
                        if (editor) {
                            let code_cell_id = "code-cell-" + editor.active_cell_number;
                            new OutputCell(code_cell_id, data.content);
                        } else {
                            console.warn('Editor not found or displayOutputCell is not a function');
                        }
                    }
                } else if (data.type === 'shell_output') {
                    console.log('Shell command output:\n', data.content);
                    this.terminal.write(data.content);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
            this.isExecuting = false;
            this.processQueue();
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
                
                if (Date.now() - this.lastPongTime > 30000) {
                    console.warn('No pong received recently. Closing connection.');
                    this.socket.close();
                }
            }
        }, 15000);
    }

    private stopPingInterval(): void {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    public sendMessage(content: string, type: 'python' | 'shell'): void {
        const message = JSON.stringify({ type, content });
        this.executionQueue.push({ type, content: message });
        this.processQueue();
    }

    private processQueue(): void {
        if (this.isExecuting || this.executionQueue.length === 0) {
            return;
        }

        this.isExecuting = true;
        const { content } = this.executionQueue.shift()!;

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(content);
            console.log('Sent message:', content);
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
            this.isExecuting = false;
            this.processQueue();
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