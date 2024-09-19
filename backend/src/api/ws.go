package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
	execTimeout    = 30 * time.Second
)

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

type WebSocketMessage struct {
	Type    string `json:"type"`
	Content string `json:"content"`
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
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error: %v", err)
			}
			break
		}

		log.Printf("Received message: %s", string(message))

		if string(message) == "ping" {
			c.conn.WriteMessage(websocket.TextMessage, []byte("pong"))
			continue
		}

		var msg WebSocketMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			// If it's not valid JSON, assume it's a plain text Python command
			msg = WebSocketMessage{Type: "python", Content: string(message)}
		}

		switch msg.Type {
		case "python":
			go executePythonCode([]byte(msg.Content), c.send)
		case "shell":
			go executeShellCommand(msg.Content, c.send)
		case "env_info":
			go sendEnvironmentInfo(c.send)
		default:
			log.Printf("Unsupported message type: %s", msg.Type)
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
			sendOutput(out, "python_output", fmt.Sprintf("Error: %v", r))
		}
	}()

	tmpDir, err := os.MkdirTemp("", "python_exec_")
	if err != nil {
		log.Printf("Error creating temp directory: %v", err)
		sendOutput(out, "python_output", fmt.Sprintf("Error: %v", err))
		return
	}
	defer os.RemoveAll(tmpDir)

	codePath := filepath.Join(tmpDir, fmt.Sprintf("code_%d.py", time.Now().UnixNano()))

	log.Printf("Writing code to file %s: %s", codePath, string(code))

	err = os.WriteFile(codePath, code, 0644)
	if err != nil {
		log.Printf("Error writing Python code to file: %v", err)
		sendOutput(out, "python_output", fmt.Sprintf("Error writing code: %v", err))
		return
	}

	log.Println("Running Python code")

	ctx, cancel := context.WithTimeout(context.Background(), execTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, getPythonPath(), codePath)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if runtime.GOOS != "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			Setpgid: true,
		}
	}

	if err := cmd.Start(); err != nil {
		log.Printf("Error starting Python process: %v", err)
		sendOutput(out, "python_output", fmt.Sprintf("Error: %v", err))
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
		sendOutput(out, "python_output", "Execution timed out")
	case err := <-done:
		if err != nil {
			log.Printf("Error running Python process: %v", err)
			sendOutput(out, "python_output", fmt.Sprintf("Error: %v\nStderr: %s", err, stderr.String()))
			return
		}
	}

	output := strings.TrimSpace(stdout.String())
	if stderr.Len() > 0 {
		log.Printf("Python stderr: %s", stderr.String())
		if output != "" {
			output += "\n"
		}
		output += "Stderr: " + strings.TrimSpace(stderr.String())
	}

	log.Printf("Python output: %s", output)
	sendOutput(out, "python_output", output)
	log.Println("Done with Python code execution")
}

func executeShellCommand(command string, out chan<- []byte) {
	log.Printf("Executing shell command: %s", command)
	ctx, cancel := context.WithTimeout(context.Background(), execTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "sh", "-c", command)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		log.Printf("Error executing shell command: %v", err)
		sendOutput(out, "shell_output", fmt.Sprintf("Error: %v\nStderr: %s", err, stderr.String()))
		return
	}

	output := strings.TrimSpace(stdout.String())
	if stderr.Len() > 0 {
		if output != "" {
			output += "\n"
		}
		output += "Stderr: " + strings.TrimSpace(stderr.String())
	}
	log.Printf("Shell command output: %s", output)
	sendOutput(out, "shell_output", strings.TrimSpace(output))
}

func sendEnvironmentInfo(out chan<- []byte) {
	currentUser, err := user.Current()
	if err != nil {
		log.Printf("Error getting current user: %v", err)
		currentUser = &user.User{Username: "unknown"}
	}

	osName := runtime.GOOS
	if osName == "darwin" {
		osName = "macOS"
	}

	hostname := getHostname()

	info := struct {
		PythonPath string `json:"pythonPath"`
		OS         string `json:"os"`
		Username   string `json:"username"`
		Hostname   string `json:"hostname"`
	}{
		PythonPath: getPythonPath(),
		OS:         osName,
		Username:   currentUser.Username,
		Hostname:   hostname,
	}

	jsonInfo, err := json.Marshal(info)
	if err != nil {
		log.Printf("Error marshaling environment info: %v", err)
		sendOutput(out, "env_info", "Error getting environment info")
		return
	}

	log.Printf("Sending environment info: %s", string(jsonInfo))
	sendOutput(out, "env_info", string(jsonInfo))
}

func sendOutput(out chan<- []byte, outputType string, content string) {
	output := WebSocketMessage{Type: outputType, Content: content}
	jsonOutput, err := json.Marshal(output)
	if err != nil {
		log.Printf("Error marshaling output: %v", err)
		return
	}
	log.Printf("Sending output: %s", string(jsonOutput))
	out <- jsonOutput
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("Error getting hostname: %v", err)
		return "unknown"
	}
	return hostname
}
