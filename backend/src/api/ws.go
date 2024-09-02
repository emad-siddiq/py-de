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
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WebSocketV1(w http.ResponseWriter, r *http.Request) {
	log.Printf("Attempting to upgrade connection to WebSocket for %s", r.RemoteAddr)
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("WebSocket connection established with %s", conn.RemoteAddr())

	conn.SetPingHandler(func(appData string) error {
		log.Printf("Received ping from %s", conn.RemoteAddr())
		return conn.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(time.Second))
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
				log.Printf("WebSocket read error: %v", err)
			} else {
				log.Printf("WebSocket closed: %v", err)
			}
			return
		}

		switch msgType {
		case websocket.BinaryMessage:
			log.Println("Incoming Binary Message")
		case websocket.CloseMessage:
			log.Println("Close Message received")
			return
		case websocket.TextMessage:
			log.Printf("Incoming Text Message: %s", string(msg))
		}

		go executePythonCode(msg, out)

		select {
		case output := <-out:
			log.Println("Sending output back to client")
			if err := conn.WriteMessage(websocket.TextMessage, output); err != nil {
				log.Printf("Error writing to WebSocket: %v", err)
				return
			}
			log.Printf("Sent: %s", string(output))
		case <-time.After(30 * time.Second):
			log.Println("Timeout waiting for Python execution")
			if err := conn.WriteMessage(websocket.TextMessage, []byte("Execution timed out")); err != nil {
				log.Printf("Error writing timeout message: %v", err)
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
