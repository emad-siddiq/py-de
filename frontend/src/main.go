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
			path = "typescript/dist/html/py-de.html"
		} else {
			// Determine the correct path for js, img, and css, and default to html for everything else
			if strings.HasPrefix(r.URL.Path, "/js/") {
				path = "typescript/dist" + r.URL.Path
				w.Header().Set("Content-Type", "application/javascript")
			} else if strings.HasPrefix(r.URL.Path, "/img/") {
				path = "typescript/dist" + r.URL.Path
				// Check if the file is an SVG
				if strings.HasSuffix(r.URL.Path, ".svg") {
					w.Header().Set("Content-Type", "image/svg+xml")
				}
			} else if strings.HasPrefix(r.URL.Path, "/css/") {
				path = "typescript/dist" + r.URL.Path
				w.Header().Set("Content-Type", "text/css")
			} else {
				path = "typescript/dist/html" + r.URL.Path
			}
		}

		// Read the file from the embedded filesystem
		data, err := staticFiles.ReadFile(path)
		if err != nil {
			// Log only the file not found errors
			log.Printf("File not found: %s\n", path)
			http.NotFound(w, r)
			return
		}

		// Write the file to the response
		_, err = w.Write(data)
		if err != nil {
			// Log only errors during file serving
			log.Printf("Error serving file: %s\n", path)
		}
	})

	// Log a minimal server start message
	log.Println("Server running on :3000")

	// Start the server
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
