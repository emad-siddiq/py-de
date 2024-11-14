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
	"time"

	"emad/pysync/api/ssh"

	"github.com/gorilla/websocket"
)

// Logger handles logging operations
type Logger struct {
	writer io.Writer
	log    *log.Logger
}

// DeployRequest represents the deployment request body
type DeployRequest struct {
	Hostname   string `json:"sshHostName"`
	SSHUser    string `json:"sshUser"`
	SSHKeyPath string `json:"sshKeyPath"`
}

// DeployResponse represents the deployment response
type DeployResponse struct {
	Hostname  string `json:"hostname"`
	WSBaseURL string `json:"wsBaseURL"`
	Success   string `json:"success"`
}

// Config represents deployment configuration
type Config struct {
	MaxRetries     int
	RetryInterval  time.Duration
	WSTimeout      time.Duration
	ListenPort     string
	BinaryFileName string
}

// NewConfig creates a default configuration
func NewConfig() *Config {
	return &Config{
		MaxRetries:     6,
		RetryInterval:  5 * time.Second,
		WSTimeout:      10 * time.Second,
		ListenPort:     "8080",
		BinaryFileName: "backend_ubuntu_aarch64",
	}
}

// NewLogger creates a new Logger instance
func NewLogger(w io.Writer) *Logger {
	return &Logger{
		writer: w,
		log:    log.New(w, "", log.LstdFlags),
	}
}

func (l *Logger) Log(message string) {
	l.log.Println(message)
}

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

	logger := NewLogger(os.Stdout)
	logger.Log("Starting deployment process...")

	request, err := parseDeployRequest(r)
	if err != nil {
		handleError(w, "Invalid request body", err, http.StatusBadRequest, logger)
		return
	}

	if request.Hostname == "" {
		handleError(w, "Hostname is required", nil, http.StatusBadRequest, logger)
		return
	}
	logger.Logf("Target Hostname: %s", request.Hostname)

	config := NewConfig()
	if err := handleDeploy(request, config, logger); err != nil {
		handleError(w, "Deployment failed", err, http.StatusInternalServerError, logger)
		return
	}

	response := DeployResponse{
		Hostname:  request.Hostname,
		WSBaseURL: fmt.Sprintf("ws://%s:%s/ws", request.Hostname, config.ListenPort),
		Success:   "true",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	logger.Log("Deployment completed successfully.")
}

func parseDeployRequest(r *http.Request) (*DeployRequest, error) {
	var request DeployRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}
	return &request, nil
}

func handleDeploy(request *DeployRequest, config *Config, logger *Logger) error {
	executor, err := ssh.NewSSHExecutor(request.Hostname, request.SSHUser, request.SSHKeyPath)
	if err != nil {
		return fmt.Errorf("failed to create SSH connection: %w", err)
	}
	defer executor.Close()

	if err := copyBinaryIfNeeded(executor, request, config, logger); err != nil {
		return err
	}

	if err := startAndVerifyProcess(executor, request, config, logger); err != nil {
		return fmt.Errorf("failed to start and verify process: %w", err)
	}

	wsURL := fmt.Sprintf("ws://%s:%s/ws/testSocket", request.Hostname, config.ListenPort)
	if err := testWebSocketConnection(wsURL, config.WSTimeout, logger); err != nil {
		return fmt.Errorf("WebSocket connection test failed: %w", err)
	}

	return nil
}

func copyBinaryIfNeeded(executor *ssh.SSHExecutor, request *DeployRequest, config *Config, logger *Logger) error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("unable to determine executable path: %w", err)
	}

	execDir := filepath.Dir(execPath)
	backendBinaryPath := filepath.Join(execDir, config.BinaryFileName)
	remoteBinaryPath := fmt.Sprintf("/home/%s/%s", request.SSHUser, config.BinaryFileName)

	// Delete existing binary
	deleteCmd := fmt.Sprintf("rm -f %s", remoteBinaryPath)
	if _, err := executor.ExecuteCommand(deleteCmd); err != nil {
		return fmt.Errorf("error deleting existing binary: %w", err)
	}

	// Copy new binary
	logger.Log("Copying backend binary to the instance...")
	scpCmd := exec.Command("scp",
		"-o", "StrictHostKeyChecking=no",
		"-i", request.SSHKeyPath,
		backendBinaryPath,
		fmt.Sprintf("%s@%s:%s", request.SSHUser, request.Hostname, remoteBinaryPath))

	if output, err := scpCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("error copying backend binary: %w, output: %s", err, string(output))
	}

	// Make executable
	if _, err := executor.ExecuteCommand(fmt.Sprintf("chmod +x %s", remoteBinaryPath)); err != nil {
		return fmt.Errorf("error making backend binary executable: %w", err)
	}

	logger.Log("Backend binary copied and made executable successfully.")
	return nil
}

func startAndVerifyProcess(executor *ssh.SSHExecutor, request *DeployRequest, config *Config, logger *Logger) error {
	// Kill any process running on port 8080
	killCmd := "pkill -f :\\8080 || true"
	if _, err := executor.ExecuteCommand(killCmd); err != nil {
		logger.Logf("Warning: error killing existing process on port 8080: %v", err)
	}

	// Start the binary
	startCmd := fmt.Sprintf("cd /home/%s && nohup ./%s > /dev/null 2>&1 &", request.SSHUser, config.BinaryFileName)
	if _, err := executor.ExecuteCommand(startCmd); err != nil {
		return fmt.Errorf("error starting process: %w", err)
	}

	logger.Log("Process is running and listening on port")
	return nil
}

func testWebSocketConnection(url string, timeout time.Duration, logger *Logger) error {
	logger.Logf("Attempting to connect to WebSocket test endpoint at %s", url)

	dialer := websocket.Dialer{
		HandshakeTimeout: timeout,
	}

	conn, resp, err := dialer.Dial(url, nil)
	if err != nil {
		if resp != nil {
			logger.Logf("WebSocket handshake failed. Status code: %d", resp.StatusCode)
		}
		return fmt.Errorf("failed to connect to WebSocket: %w", err)
	}
	defer conn.Close()

	logger.Log("WebSocket connection established successfully")
	return nil
}
