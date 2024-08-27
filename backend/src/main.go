package main

import (
	"emad/pysync/api"
	"fmt"
	"log"
	"net/http"
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
	// Create a new ServeMux
	mux := http.NewServeMux()

	// Register your handlers
	mux.HandleFunc("/v1/ws", api.WebSocketV1)
	mux.HandleFunc("/v1/ws/chatgpt", api.WebSocketChatGPT)
	mux.HandleFunc("/api/deploy", api.DeployHandler)

	// Wrap the mux with the CORS middleware
	handler := corsMiddleware(mux)

	fmt.Println("PySync local server is launching on port 8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
