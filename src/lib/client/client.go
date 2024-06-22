package client

import (
	"emad10101/authGo/config"
	"emad10101/authGo/lib/client/endpoints"
	"fmt"
	"log"
	"net/http"
	"os"
)

var portvar int = 9094

var c *config.YAML = config.ReadConfigFile()

func Start() {
	client := http.NewServeMux()
	client.HandleFunc("/login", LoginHandler)
	client.HandleFunc("/user-signup", endpoints.UserSignUpHandler)
	log.Printf("Client is running at: %s", c.Client.Url)
	http.ListenAndServe(fmt.Sprintf(":%d", portvar), client)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Handling Login request")
	writeHtml(w, r, "./lib/client/static/html/login.html")
}

// Responds with HTML file from the path `filename`
func writeHtml(w http.ResponseWriter, req *http.Request, filename string) {
	file, err := os.Open(filename)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer file.Close()
	fi, _ := file.Stat()
	http.ServeContent(w, req, file.Name(), fi.ModTime(), file)
}
