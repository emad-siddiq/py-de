// WebSocketClientCodeCell.ts
class WebSocketCodeCell {
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
        this.socket.addEventListener('error', this.onError.bind(this));
        this.socket.addEventListener('close', this.onClose.bind(this));
    }

    private onOpen(): void {
        console.log('WebSocket connection established.');
        if (this.onOpenCallback && this.socket) {
            this.onOpenCallback(this.socket);
        }
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
        // Append message to message container if needed
        // this.messageContainer.appendChild(messageElement);
        // this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    public reconnect(url: string): void {
        console.log(`Reconnecting CodeCell WebSocket to new URL: ${url}`);
        if (this.socket) {
            this.socket.close();
        }
        this.url = url;
        this.connect();
    }
}

export { WebSocketCodeCell };