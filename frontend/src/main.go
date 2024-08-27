package main

import (
	"embed"
	"log"
	"net/http"
	"strings"
)

// Embed the directories you need
//
//go:embed typescript/dist/html/* typescript/dist/js/* typescript/dist/img/* typescript/dist/css/*
var staticFiles embed.FS

func main() {
	// Handle requests to serve the correct files without exposing the full path
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		var path string

		// Default to serving index.html for root path
		if r.URL.Path == "/" {
			path = "typescript/dist/html/index.html"
			log.Printf("Serving root path: %s\n", path)
		} else {
			// Determine the correct path for js, img, and css, and default to html for everything else
			if strings.HasPrefix(r.URL.Path, "/js/") {
				path = "typescript/dist" + r.URL.Path
				w.Header().Set("Content-Type", "application/javascript")
				log.Printf("Serving JS file: %s\n", path)
			} else if strings.HasPrefix(r.URL.Path, "/img/") {
				path = "typescript/dist" + r.URL.Path
				// Check if the file is an SVG
				if strings.HasSuffix(r.URL.Path, ".svg") {
					w.Header().Set("Content-Type", "image/svg+xml")
					log.Printf("Serving SVG file: %s\n", path)
				} else {
					log.Printf("Serving IMG file: %s\n", path)
				}
			} else if strings.HasPrefix(r.URL.Path, "/css/") {
				path = "typescript/dist" + r.URL.Path
				w.Header().Set("Content-Type", "text/css")
				log.Printf("Serving CSS file: %s\n", path)
			} else {
				path = "typescript/dist/html" + r.URL.Path
				log.Printf("Serving HTML file: %s\n", path)
			}
		}

		// Read the file from the embedded filesystem
		data, err := staticFiles.ReadFile(path)
		if err != nil {
			log.Printf("File not found: %s\n", path)
			http.NotFound(w, r)
			return
		}

		// Write the file to the response
		_, err = w.Write(data)
		if err != nil {
			log.Printf("Error serving file: %s\n", path)
		} else {
			log.Printf("Successfully served: %s\n", path)
		}
	})

	// Log server start message
	log.Println("Starting server on :8081...")

	// Start the server
	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
