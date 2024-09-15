package main

import (
	"emad/pysync/api"
	"fmt"
	"log"
	"net/http"
	"os"
)

// CORS Middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight OPTIONS request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// Set up file logging
	logFile, err := os.OpenFile("server.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer logFile.Close()

	log.SetOutput(logFile)
	// Create a new ServeMux
	mux := http.NewServeMux()

	// Register your handlers
	mux.HandleFunc("/ws/codeSocket", logMiddleware(api.WebSocketV1))
	mux.HandleFunc("/ws/aiSocket", logMiddleware(api.WebSocketChatGPT))
	mux.HandleFunc("/ws/deploySocket", logMiddleware(api.DeployHandler))
	mux.HandleFunc("/ws/testSocket", logMiddleware(api.WebSocketTestHandler)) // New WebSocket test endpoint

	// Wrap the mux with the CORS middleware
	handler := corsMiddleware(mux)

	fmt.Println("PySync local server is launching on port 8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func logMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
	}
}
