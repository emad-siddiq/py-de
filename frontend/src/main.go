package main

import (
	"log"
	"net/http"
)

func main() {
	// Define the directory to serve static files from
	fs := http.FileServer(http.Dir("./typescript/dist"))
	http.Handle("/", fs)

	// Log server start message
	log.Println("Starting server on :8081...")

	// Start the server
	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		// Log any errors that occur while starting the server
		log.Fatalf("Server failed to start: %v", err)
	}
}
