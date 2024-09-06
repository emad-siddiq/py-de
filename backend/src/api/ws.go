package api

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync"
	"syscall"
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

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB
	execTimeout    = 30 * time.Second
)

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

func (c *Client) readPump(cancel context.CancelFunc) {
	defer func() {
		cancel()
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		messageType, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error: %v", err)
			}
			break
		}

		switch messageType {
		case websocket.TextMessage:
			if string(message) == "ping" {
				if err := c.conn.WriteMessage(websocket.TextMessage, []byte("pong")); err != nil {
					log.Printf("Error sending pong: %v", err)
					return
				}
			} else {
				go executePythonCode(message, c.send)
			}
		case websocket.PingMessage:
			if err := c.conn.WriteMessage(websocket.PongMessage, nil); err != nil {
				log.Printf("Error sending pong: %v", err)
				return
			}
		default:
			log.Printf("Received unsupported message type: %d", messageType)
		}
	}
}

func (c *Client) writePump(cancel context.CancelFunc) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func WebSocketV1(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{conn: conn, send: make(chan []byte, 256)}
	ctx, cancel := context.WithCancel(context.Background())

	go client.writePump(cancel)
	go client.readPump(cancel)

	<-ctx.Done()
}

var (
	pythonPath     string
	pythonPathOnce sync.Once
)

func getPythonPath() string {
	pythonPathOnce.Do(func() {
		path, err := exec.LookPath("python3")
		if err != nil {
			path, err = exec.LookPath("python")
			if err != nil {
				log.Fatal("Python interpreter not found")
			}
		}
		pythonPath = path
	})
	return pythonPath
}

func executePythonCode(code []byte, out chan<- []byte) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in executePythonCode: %v", r)
			out <- []byte(fmt.Sprintf("Error: %v", r))
		}
	}()

	// Create a temporary directory
	tmpDir, err := os.MkdirTemp("", "python_exec_")
	if err != nil {
		log.Printf("Error creating temp directory: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v", err))
		return
	}
	defer os.RemoveAll(tmpDir)

	// Create a unique filename
	codePath := filepath.Join(tmpDir, fmt.Sprintf("code_%d.py", time.Now().UnixNano()))

	// Log file content before writing
	log.Printf("Writing code to file %s: %s", codePath, string(code))

	err = os.WriteFile(codePath, code, 0644)
	if err != nil {
		log.Printf("Error writing Python code to file: %v", err)
		out <- []byte(fmt.Sprintf("Error writing code: %v", err))
		return
	}

	log.Println("Running Python code")

	ctx, cancel := context.WithTimeout(context.Background(), execTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, getPythonPath(), codePath)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Set resource limits
	if runtime.GOOS != "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			Setpgid: true,
		}
	}

	if err := cmd.Start(); err != nil {
		log.Printf("Error starting Python process: %v", err)
		out <- []byte(fmt.Sprintf("Error: %v", err))
		return
	}

	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	select {
	case <-ctx.Done():
		if runtime.GOOS != "windows" {
			syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
		} else {
			cmd.Process.Kill()
		}
		<-done
		out <- []byte("Execution timed out")
	case err := <-done:
		if err != nil {
			log.Printf("Error running Python process: %v", err)
			out <- []byte(fmt.Sprintf("Error: %v\nStderr: %s", err, stderr.String()))
			return
		}
	}

	if stderr.Len() > 0 {
		log.Printf("Python stderr: %s", stderr.String())
	}

	log.Printf("Python stdout: %s", stdout.String())
	out <- stdout.Bytes()
	log.Println("Done with Python code execution")
}
