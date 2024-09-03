package api

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allowing all origins for this example
	},
}

func WebSocketV1(w http.ResponseWriter, r *http.Request) {
	log.Printf("Attempting to upgrade connection to WebSocket for %s", r.RemoteAddr)
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		http.Error(w, "Could not upgrade to WebSocket", http.StatusInternalServerError)
		return
	}
	defer func() {
		log.Printf("Closing WebSocket connection for %s", conn.RemoteAddr())
		conn.Close()
	}()

	log.Printf("WebSocket connection established with %s", conn.RemoteAddr())

	conn.SetPingHandler(func(appData string) error {
		log.Printf("Received ping from %s", conn.RemoteAddr())
		err := conn.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(time.Second))
		if err != nil {
			log.Printf("Error sending pong to %s: %v", conn.RemoteAddr(), err)
		}
		return err
	})

	conn.SetPongHandler(func(appData string) error {
		log.Printf("Received pong from %s", conn.RemoteAddr())
		return nil
	})

	conn.SetCloseHandler(func(code int, text string) error {
		log.Printf("WebSocket connection closed by %s with code %d: %s", conn.RemoteAddr(), code, text)
		return nil
	})

	out := make(chan []byte)
	defer close(out)

	go handleWebSocket(conn, out)

	<-make(chan struct{})
}

func handleWebSocket(conn *websocket.Conn, out chan []byte) {
	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error for %s: %v", conn.RemoteAddr(), err)
			} else {
				log.Printf("WebSocket closed for %s: %v", conn.RemoteAddr(), err)
			}
			return
		}

		log.Printf("Received message type %d from %s", msgType, conn.RemoteAddr())

		switch msgType {
		case websocket.BinaryMessage:
			log.Printf("Incoming Binary Message from %s", conn.RemoteAddr())
		case websocket.CloseMessage:
			log.Printf("Close Message received from %s", conn.RemoteAddr())
			return
		case websocket.TextMessage:
			log.Printf("Incoming Text Message from %s: %s", conn.RemoteAddr(), string(msg))
		}

		go executePythonCode(msg, out)

		select {
		case output := <-out:
			log.Printf("Sending output back to client %s", conn.RemoteAddr())
			if err := conn.WriteMessage(websocket.TextMessage, output); err != nil {
				log.Printf("Error writing to WebSocket for %s: %v", conn.RemoteAddr(), err)
				return
			}
			log.Printf("Sent to %s: %s", conn.RemoteAddr(), string(output))
		case <-time.After(30 * time.Second):
			log.Printf("Timeout waiting for Python execution for %s", conn.RemoteAddr())
			if err := conn.WriteMessage(websocket.TextMessage, []byte("Execution timed out")); err != nil {
				log.Printf("Error writing timeout message to %s: %v", conn.RemoteAddr(), err)
				return
			}
		}
	}
}

func executePythonCode(code []byte, out chan<- []byte) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in executePythonCode: %v", r)
			out <- []byte(fmt.Sprintf("Error: %v", r))
		}
	}()

	execPath, err := os.Executable()
	if err != nil {
		log.Printf("Error getting executable path: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v", err))
		return
	}
	execDir := filepath.Dir(execPath)

	codePath := filepath.Join(execDir, "code.py")
	err = os.WriteFile(codePath, code, 0644)
	if err != nil {
		log.Printf("Error writing Python code to file: %v", err)
		out <- []byte(fmt.Sprintf("Error writing code: %v", err))
		return
	}

	log.Println("Running Python code")
	cmd := exec.Command("python", codePath)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("Error creating stdout pipe: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v", err))
		return
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		log.Printf("Error creating stderr pipe: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v", err))
		return
	}

	if err := cmd.Start(); err != nil {
		log.Printf("Error starting Python process: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v", err))
		return
	}

	stdoutData, _ := io.ReadAll(stdout)
	stderrData, _ := io.ReadAll(stderr)

	if err := cmd.Wait(); err != nil {
		log.Printf("Error waiting for Python process: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v\nStderr: %s", err, stderrData))
		return
	}

	if len(stderrData) > 0 {
		log.Printf("Python stderr: %s", stderrData)
	}

	log.Printf("Python stdout: %s", stdoutData)
	out <- stdoutData
	log.Println("Done with Python code execution")
}
