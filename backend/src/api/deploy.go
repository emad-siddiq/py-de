package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"emad/pysync/api/ssh"

	"github.com/gorilla/websocket"
)

// Logger handles logging operations
type Logger struct {
	writer io.Writer
	log    *log.Logger
}

// NewLogger creates a new Logger instance
func NewLogger(w io.Writer) *Logger {
	return &Logger{
		writer: w,
		log:    log.New(w, "", log.LstdFlags),
	}
}

// Log logs a message
func (l *Logger) Log(message string) {
	l.log.Println(message)
}

// Logf logs a formatted message
func (l *Logger) Logf(format string, v ...interface{}) {
	l.log.Printf(format, v...)
}

// handleError logs the error and sends an error response
func handleError(w http.ResponseWriter, message string, err error, statusCode int, logger *Logger) {
	errMsg := message
	if err != nil {
		errMsg = fmt.Sprintf("%s: %v", message, err)
	}
	logger.Log(errMsg)
	http.Error(w, errMsg, statusCode)
}

func DeployHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var requestBody struct {
		Hostname   string `json:"sshHostName"` // Changed from InstanceIP to Hostname
		SSHUser    string `json:"sshUser"`
		SSHKeyPath string `json:"sshKeyPath"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	logger := NewLogger(os.Stdout)
	logger.Log("Starting deployment process...")

	hostname := requestBody.Hostname
	if hostname == "" {
		handleError(w, "Hostname is required", nil, http.StatusBadRequest, logger)
		return
	}
	logger.Logf("Target Hostname: %s", hostname)

	// Create SSH executor
	executor, err := ssh.NewSSHExecutor(hostname, requestBody.SSHUser, requestBody.SSHKeyPath)
	if err != nil {
		handleError(w, "Failed to create SSH connection", err, http.StatusInternalServerError, logger)
		return
	}
	defer executor.Close()

	execPath, err := os.Executable()
	if err != nil {
		handleError(w, "Unable to determine executable path", err, http.StatusInternalServerError, logger)
		return
	}
	execDir := filepath.Dir(execPath)

	backendUbuntuBinaryPath := filepath.Join(execDir, "backend_ubuntu_aarch64")
	remoteBinaryPath := fmt.Sprintf("/home/%s/backend_ubuntu_aarch64", requestBody.SSHUser)

	// Check if binary exists and copy only if necessary
	checkAndCopyBinary := fmt.Sprintf(`
		if [ ! -f %s ]; then
			echo "Binary not found, copying..."
			exit 1
		else
			echo "Binary already exists"
			exit 0
		fi
	`, remoteBinaryPath)

	output, err := executor.ExecuteCommand(checkAndCopyBinary)
	if err != nil {
		logger.Log("Copying backend binary to the instance...")
		// Note: For now we'll use system SCP command for file transfer
		scpCmd := exec.Command("scp", "-o", "StrictHostKeyChecking=no", "-i", requestBody.SSHKeyPath,
			backendUbuntuBinaryPath, fmt.Sprintf("%s@%s:%s", requestBody.SSHUser, hostname, remoteBinaryPath))
		if err := scpCmd.Run(); err != nil {
			handleError(w, "Error copying backend binary", err, http.StatusInternalServerError, logger)
			return
		}
		logger.Log("Backend binary copied successfully.")

		chmodCmd := fmt.Sprintf("chmod +x %s", remoteBinaryPath)
		if _, err := executor.ExecuteCommand(chmodCmd); err != nil {
			handleError(w, "Error making backend binary executable", err, http.StatusInternalServerError, logger)
			return
		}
	} else {
		logger.Log(output)
	}

	// Check if the process is already running, if not, start it
	checkAndStartProcess := fmt.Sprintf(`
		if pgrep -f %s > /dev/null; then
			echo "Process is already running"
		else
			echo "Starting the process"
			nohup %s > %s.log 2>&1 & echo $!
		fi
	`, remoteBinaryPath, remoteBinaryPath, remoteBinaryPath)

	output, err = executor.ExecuteCommand(checkAndStartProcess)
	if err != nil {
		handleError(w, "Error checking/starting backend process", err, http.StatusInternalServerError, logger)
		return
	}
	logger.Log(output)

	// Wait for the process to start listening
	maxRetries := 6
	retryInterval := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		livenessCmd := `netstat -tlnp | grep -q ':8080' && echo "Process is listening on port 8080" || echo "Process is not listening on port 8080"`

		output, err := executor.ExecuteCommand(livenessCmd)
		if err != nil {
			logger.Logf("Error checking process status: %v", err)
			if i == maxRetries-1 {
				handleError(w, "Failed to check process status after maximum retries", err, http.StatusInternalServerError, logger)
				return
			}
		} else {
			logger.Log(output)
			if strings.Contains(output, "Process is listening on port 8080") {
				logger.Log("Backend service is running and listening on port 8080")

				// Perform WebSocket connection test
				wsURL := fmt.Sprintf("ws://%s:8080/ws/testSocket", hostname)
				if err := testWebSocketConnection(wsURL, logger); err != nil {
					logger.Logf("WebSocket connection test failed: %v", err)
					handleError(w, "WebSocket connection test failed", err, http.StatusInternalServerError, logger)
					return
				}
				logger.Log("WebSocket connection test passed successfully")
				break
			}
		}

		if i == maxRetries-1 {
			handleError(w, "Backend service is not listening on port 8080 after maximum retries", nil, http.StatusInternalServerError, logger)
			return
		}

		logger.Logf("Backend service not yet listening. Retrying in %v...", retryInterval)
		time.Sleep(retryInterval)
	}

	response := map[string]string{
		"hostname":  hostname,
		"wsBaseURL": fmt.Sprintf("ws://%s:8080/ws", hostname),
		"success":   "true",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	logger.Log("Deployment completed successfully.")
}

func testWebSocketConnection(url string, logger *Logger) error {
	logger.Logf("Attempting to connect to WebSocket test endpoint at %s", url)

	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, resp, err := dialer.Dial(url, nil)
	if err != nil {
		if resp != nil {
			logger.Logf("WebSocket handshake failed. Status code: %d", resp.StatusCode)
		}
		return fmt.Errorf("failed to connect to WebSocket: %v", err)
	}
	defer conn.Close()

	logger.Log("WebSocket connection established successfully")
	return nil
}
