class ObjectManager {
    private static instance: ObjectManager;
    private objects: Map<string, any> = new Map();
    private webSockets: Map<string, WebSocket> = new Map();
    private socketSubscriptions: Map<string, Set<(socket: WebSocket) => void>> = new Map();

    private constructor() {}

    public static getInstance(): ObjectManager {
        if (!ObjectManager.instance) {
            ObjectManager.instance = new ObjectManager();
        }
        return ObjectManager.instance;
    }

    public associate(id: string, object: any): void {
        this.objects.set(id, object);
    }

    public getObject(id: string): any {
        return this.objects.get(id);
    }

    public addWebSocket(id: string, socket: WebSocket): void {
        this.webSockets.set(id, socket);
        this.notifySubscribers(id, socket);
    }

    public getWebSocket(id: string): WebSocket | undefined {
        return this.webSockets.get(id);
    }

    public subscribeToSocket(socketId: string, callback: (socket: WebSocket) => void): void {
        if (!this.socketSubscriptions.has(socketId)) {
            this.socketSubscriptions.set(socketId, new Set());
        }
        this.socketSubscriptions.get(socketId)!.add(callback);

        // If the socket already exists, call the callback immediately
        const existingSocket = this.webSockets.get(socketId);
        if (existingSocket) {
            callback(existingSocket);
        }
    }

    private notifySubscribers(socketId: string, socket: WebSocket): void {
        const subscribers = this.socketSubscriptions.get(socketId);
        if (subscribers) {
            subscribers.forEach(callback => callback(socket));
        }
    }

    public updateWebSocketConnections(wsBaseURL: string): void {
        console.log("Updating WebSocket base URL with:", wsBaseURL);
        
        // Close existing connections
        this.webSockets.forEach((ws, key) => {    //websockets are stored by unique paths as keys in jupyter.ts 
            ws.close();                       
            const newSocket = new WebSocket(`${wsBaseURL}/${key}`);
            this.webSockets.set(key, newSocket);
            this.notifySubscribers(key, newSocket);
        });

    }

    public getAllWebSockets(): Map<string, WebSocket> {
        return this.webSockets;
    }

    public removeWebSocket(id: string): boolean {
        return this.webSockets.delete(id);
    }

    public clearAllWebSockets(): void {
        this.webSockets.clear();
    }

    public hasWebSocket(id: string): boolean {
        return this.webSockets.has(id);
    }
}

export { ObjectManager };