package main

import (
	"emad/pysync/api"
	"emad/pysync/config"
	"fmt"
	"net/http"
)

var c *config.YAML = config.ReadConfigFile()

func main() {
	fs := http.FileServer(http.Dir("./static/"))
	http.Handle("/", fs)

	//http.HandleFunc("/", pages.HomeHandler)

	http.HandleFunc("/v1/ws", api.WebSocketV1)
	http.HandleFunc("/v1/ws/chatgpt", api.WebSocketChatGPT)

	fmt.Printf("PySync local server is launching")
	http.ListenAndServe(":8080", nil)

}
