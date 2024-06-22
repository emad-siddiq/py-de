package endpoints

import (
	"emad10101/authGo/config"
	"net/http"
	"text/template"
)

type UserSignUpData struct {
	FormAction string
}

var c *config.YAML = config.ReadConfigFile()

func UserSignUpHandler(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("../client/static/html/user-sign-up.html"))

	data := UserSignUpData{
		FormAction: c.AuthZ.Server.Url + c.AuthZ.Server.Endpoints.UserSignUp,
	}

	tmpl.Execute(w, data)
}
