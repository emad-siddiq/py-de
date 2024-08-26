class ObjectManager {
    private static instance: ObjectManager;
    private map: Map<string, any>; // Map for generic objects
    private sockets: Map<string, WebSocket>; // Map specifically for WebSockets

    private constructor() {
        this.map = new Map();
        this.sockets = new Map(); // Initialize socket map
    }

    public static getInstance(): ObjectManager {
        if (!ObjectManager.instance) {
            ObjectManager.instance = new ObjectManager();
        }
        return ObjectManager.instance;
    }

    public associate(divId: string, obj: any) {
        this.map.set(divId, obj);
    }

    public getObject(divId: string): any {
        return this.map.get(divId);
    }

    // Add a WebSocket instance to the manager
    public addWebSocket(id: string, socket: WebSocket) {
        this.sockets.set(id, socket);
    }

    // Retrieve a WebSocket instance by ID
    public getWebSocket(id: string): WebSocket | undefined {
        return this.sockets.get(id);
    }

    // Update the WebSocket URL and replace the WebSocket instance
    public updateWebSocket(id: string, url: string) {
        const existingSocket = this.sockets.get(id);
        if (existingSocket) {
            existingSocket.close(); // Close existing socket
        }

        // Create a new WebSocket with the updated URL
        const newSocket = new WebSocket(url);
        this.sockets.set(id, newSocket);
    }

    public updateWebSocketConnections(newBaseUrl: string) {
        // Update URLs for all managed WebSockets
        this.updateWebSocket('socket1', `${newBaseUrl}/v1/ws`);
        this.updateWebSocket('socket2', `${newBaseUrl}/v1/ws/gpt`);
    }
}

export { ObjectManager };
