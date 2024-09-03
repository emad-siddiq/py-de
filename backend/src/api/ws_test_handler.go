package api

import (
	"log"
	"net/http"
)

// WebSocketTestHandler is an exported endpoint that echoes back any message it receives
func WebSocketTestHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket:", err)
		return
	}
	defer conn.Close()

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			return
		}
		log.Printf("Received message: %s\n", string(p))
		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Println("Error writing message:", err)
			return
		}
		log.Printf("Echoed message: %s\n", string(p))
	}
}
