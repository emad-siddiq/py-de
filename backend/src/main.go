package main

import (
	"emad/pysync/api"
	"fmt"
	"log"
	"net/http"
)

//var c *config.YAML = config.ReadConfigFile()

func main() {
	//fs := http.FileServer(http.Dir("./static/"))
	//http.Handle("/", fs)

	//http.HandleFunc("/", pages.HomeHandler)

	http.HandleFunc("/v1/ws", api.WebSocketV1)
	http.HandleFunc("/v1/ws/chatgpt", api.WebSocketChatGPT)
	http.HandleFunc("/api/deploy", api.DeployHandler)

	fmt.Println("PySync local server is launching on port 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}

}
