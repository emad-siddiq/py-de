package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

func WebSocketV1(w http.ResponseWriter, r *http.Request) {
	var conn, _ = upgrader.Upgrade(w, r, nil)

	out := make(chan []byte)

	go func(conn *websocket.Conn, out chan []byte) {
		for {
			msgType, msg, err := conn.ReadMessage()
			// if msg == nil {
			// 	conn.Close()
			// 	return
			// }

			if msgType == websocket.BinaryMessage {
				fmt.Printf("Incoming Binary")
			}

			if msgType == websocket.CloseMessage {
				fmt.Printf("Close Message")
				conn.Close()
				return
			}

			if msgType == websocket.TextMessage {
				fmt.Printf("Incoming Text Message")
			}

			if err != nil {
				conn.Close()
				return
			}

			fmt.Println("Receiving message")
			println(string(msg))
			fmt.Println("-----")

			// Handle incoming python code it
			// Read about channels

			// We need to write to a socket connection when the python computation is done.
			// https://gobyexample.com/channel-synchronization

			go executePythonCode(msg, out)
			output := <-out
			fmt.Println("Sending... ")

			conn.WriteMessage(websocket.TextMessage, output)

			fmt.Println("Sent: ", string(output))

		}
	}(conn, out)
}

func executePythonCode(code []byte, out chan []byte) {

	err := os.WriteFile("./code.py", code, 0644)

	if err != nil {
		return
	}

	//Run Python code and redirect stdout/stderr
	fmt.Printf("Starting python code")
	cmd := exec.Command("python", "code.py")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		panic(err)
	}
	//stderr, err := cmd.StderrPipe()
	// if err != nil {
	// 	panic(err)
	// }
	err = cmd.Start()
	if err != nil {
		panic(err)
	}

	std, err := io.ReadAll(stdout)
	fmt.Printf("Read: %s", string(std))
	out <- std

	cmd.Wait()
	fmt.Printf("Done with python code")

}
