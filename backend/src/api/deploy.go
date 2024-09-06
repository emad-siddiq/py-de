package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/gorilla/websocket"
)

func DeployHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var requestBody struct {
		InstanceID      string `json:"instanceID"`
		AccessKeyID     string `json:"accessKeyID"`
		SecretAccessKey string `json:"secretAccessKey"`
		Region          string `json:"region"`
		SSHUser         string `json:"sshUser"`
		SSHKeyPath      string `json:"sshKeyPath"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	logger := NewLogger(os.Stdout)
	logger.Log("Starting deployment process...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(requestBody.Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(requestBody.AccessKeyID, requestBody.SecretAccessKey, ""),
		))
	if err != nil {
		handleError(w, "Unable to load AWS config", err, http.StatusInternalServerError, logger)
		return
	}
	logger.Log("AWS config loaded successfully.")

	svc := ec2.NewFromConfig(cfg)

	describeInstancesInput := &ec2.DescribeInstancesInput{
		InstanceIds: []string{requestBody.InstanceID},
	}
	describeInstancesOutput, err := svc.DescribeInstances(ctx, describeInstancesInput)
	if err != nil {
		handleError(w, "Unable to describe instance", err, http.StatusInternalServerError, logger)
		return
	}

	if len(describeInstancesOutput.Reservations) == 0 || len(describeInstancesOutput.Reservations[0].Instances) == 0 {
		handleError(w, "Instance not found", nil, http.StatusNotFound, logger)
		return
	}

	instance := describeInstancesOutput.Reservations[0].Instances[0]
	instanceIP := *instance.PublicIpAddress
	logger.Logf("Instance IP: %s", instanceIP)

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

	output, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, checkAndCopyBinary, logger)
	if err != nil {
		logger.Log("Copying backend binary to the instance...")
		if err := runSCPCommand(ctx, requestBody.SSHKeyPath, backendUbuntuBinaryPath, requestBody.SSHUser, instanceIP, remoteBinaryPath, logger); err != nil {
			handleError(w, "Error copying backend binary", err, http.StatusInternalServerError, logger)
			return
		}
		logger.Log("Backend binary copied successfully.")

		chmodCmd := fmt.Sprintf("chmod +x %s", remoteBinaryPath)
		if _, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, chmodCmd, logger); err != nil {
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

	output, err = runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, checkAndStartProcess, logger)
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

		output, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, livenessCmd, logger)
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
				wsURL := fmt.Sprintf("ws://%s:8080/ws/testSocket", instanceIP)
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
		"publicIP":  instanceIP,
		"wsBaseURL": fmt.Sprintf("ws://%s:8080/ws", instanceIP),
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

	logger.Logf("WebSocket connection established. Response status: %s", resp.Status)

	// Send a test message
	testMessage := "Hello, WebSocket!"
	logger.Logf("Sending test message: %s", testMessage)
	if err := conn.WriteMessage(websocket.TextMessage, []byte(testMessage)); err != nil {
		return fmt.Errorf("failed to send test message: %v", err)
	}

	// Read response
	logger.Log("Waiting for response...")
	_, message, err := conn.ReadMessage()
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}
	logger.Logf("Received response: %s", string(message))

	return nil
}

func runSSHCommand(ctx context.Context, sshKeyPath, sshUser, instanceIP, command string, logger *Logger) (string, error) {
	sshCmd := fmt.Sprintf("ssh -o StrictHostKeyChecking=no -i %s %s@%s '%s'", sshKeyPath, sshUser, instanceIP, command)
	cmd := exec.CommandContext(ctx, "sh", "-c", sshCmd)

	output, err := cmd.CombinedOutput()
	logger.Logf("SSH Command output: %s", string(output))

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			logger.Logf("SSH Command exit status: %d", exitError.ExitCode())
		}
		return string(output), fmt.Errorf("SSH command failed: %v", err)
	}

	return string(output), nil
}

func runSCPCommand(ctx context.Context, sshKeyPath, source, sshUser, instanceIP, destination string, logger *Logger) error {
	scpCmd := fmt.Sprintf("scp -o StrictHostKeyChecking=no -i %s %s %s@%s:%s", sshKeyPath, source, sshUser, instanceIP, destination)
	return runCommand(ctx, "sh", []string{"-c", scpCmd}, logger)
}

func runCommand(ctx context.Context, name string, args []string, logger *Logger) error {
	cmd := exec.CommandContext(ctx, name, args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		logger.Logf("Command failed: %v, output: %s", err, string(output))
		return fmt.Errorf("command failed: %v", err)
	}
	logger.Logf("Command output: %s", string(output))
	return nil
}

func handleError(w http.ResponseWriter, message string, err error, statusCode int, logger *Logger) {
	logger.Logf("%s: %v", message, err)
	http.Error(w, fmt.Sprintf("%s: %v", message, err), statusCode)
}

type Logger struct {
	w io.Writer
}

func NewLogger(w io.Writer) *Logger {
	return &Logger{w: w}
}

func (l *Logger) Log(message string) {
	fmt.Fprintf(l.w, "%s: %s\n", time.Now().Format(time.RFC3339), message)
}

func (l *Logger) Logf(format string, v ...interface{}) {
	l.Log(fmt.Sprintf(format, v...))
}
