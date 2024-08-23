// WebSocketClient.ts
export class WebSocketClient {
    private url: string;
    private socket: WebSocket | null;
    private codeCellDiv: HTMLElement;
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
        console.log('WebSocket connection established.');
        if (this.onOpenCallback && this.socket) {
            this.onOpenCallback(this.socket);
        }
        this.sendMessage('Client connected.');
    }

    private onMessage(event: MessageEvent): void {
        console.log('Received message:', event.data);
        this.displayMessage(event.data);
    }

    private onError(event: Event): void {
        console.error('WebSocket error:', event);
        this.displayMessage(`Error: ${event.type}`, 'error');
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

    private displayMessage(message: string, type: 'normal' | 'error' = 'normal'): void {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        if (type === 'error') {
            messageElement.style.color = 'red';
        }
       // this.messageContainer.appendChild(messageElement);
       // this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    public setActiveCodeCell(codeCellId: string): void {
        const newCell = document.getElementById(codeCellId);
        if (!newCell) {
            throw new Error(`Element with id ${codeCellId} not found.`);
        }
        this.codeCellDiv = newCell;
    }
}
