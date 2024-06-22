package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

func WebSocketV1(w http.ResponseWriter, r *http.Request) {
	var conn, _ = upgrader.Upgrade(w, r, nil)

	go func(conn *websocket.Conn) {
		for {
			mType, msg, _ := conn.ReadMessage()

			conn.WriteMessage(mType, msg)
		}
	}(conn)
}

func WebSocketV2(w http.ResponseWriter, r *http.Request) {
	var conn, _ = upgrader.Upgrade(w, r, nil)
	go func(conn *websocket.Conn) {
		for {
			_, msg, _ := conn.ReadMessage()
			println(string(msg))
		}
	}(conn)
}

func WebSocketV3(w http.ResponseWriter, r *http.Request) {
	var conn, _ = upgrader.Upgrade(w, r, nil)
	go func(conn *websocket.Conn) {
		ch := time.Tick(5 * time.Second)

		for range ch {
			conn.WriteJSON(myStruct{
				Username:  "emad",
				FirstName: "Emad",
				LastName:  "Siddiq",
			})
		}
	}(conn)
}

func WebSocketV4(w http.ResponseWriter, r *http.Request) {
	var conn, _ = upgrader.Upgrade(w, r, nil)

	go func(conn *websocket.Conn) {
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				conn.Close()
			}
			fmt.Printf("%T\n", msg)
			println(string(msg))

		}
	}(conn)

	go func(conn *websocket.Conn) {
		ch := time.Tick(5 * time.Second)

		for range ch {
			conn.WriteJSON(myStruct{
				Username:  "emad",
				FirstName: "Emad",
				LastName:  "Siddiq",
			})
		}
	}(conn)
}

type myStruct struct {
	Username  string `json:"username"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName`
}
