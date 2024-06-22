package authZ

import (
	"emad10101/authGo/config"
	"fmt"
	"log"
	"net/http"
	"os"
)

var portvar int = 9096

var c *config.YAML = config.ReadConfigFile()

func Start() {

	serverMuxA := http.NewServeMux()
	serverMuxA.HandleFunc("/login", loginHandler)

	go func() {
		log.Printf("AuthZ server is running at: %s", c.AuthZ.Server.Url)
		http.ListenAndServe(c.AuthZ.Server.Url, serverMuxA)
	}()
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		http.Error(w, "GET not supported on login endpoint", http.StatusBadRequest)
	}

	if r.Method == "POST" {
		if r.Form == nil {
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		username := r.Form.Get("username")
		pwd := r.Form.Get("password")

		fmt.Printf(username, pwd)
		w.Header().Set("Location", "/auth")
		w.WriteHeader(http.StatusFound)
	}
	writeHtml(w, r, "./../src/authZ/static/login.html")
}

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
