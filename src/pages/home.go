package pages

import (
	"net/http"
	"os"
)

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

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	writeHtml(w, r, "./static/html/index.html")
}
