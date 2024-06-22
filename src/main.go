package main

import (
	"emad/pysync/api"
	"emad/pysync/config"
	"net/http"
)

var c *config.YAML = config.ReadConfigFile()

func main() {
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	http.HandleFunc("/v1/ws", api.WebSocketV1)
	http.HandleFunc("/v2/ws", api.WebSocketV2)
	http.HandleFunc("/v3/ws", api.WebSocketV3)
	http.HandleFunc("/v4/ws", api.WebSocketV4)

	http.ListenAndServe(":8080", nil)
}
