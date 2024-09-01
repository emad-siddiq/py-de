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
)

// DeployHandler handles the deployment process
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

	// Create context with timeout for the entire deployment process
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Create AWS config with static credentials and specified region
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

	// Describe instance to get its public IP
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

	// Get the directory of the current executable
	execPath, err := os.Executable()
	if err != nil {
		handleError(w, "Unable to determine executable path", err, http.StatusInternalServerError, logger)
		return
	}
	execDir := filepath.Dir(execPath)

	// Path to the backend Ubuntu binary for aarch64 in the same directory as the current binary
	backendUbuntuBinaryPath := filepath.Join(execDir, "backend_ubuntu_aarch64")

	// Install prerequisites on the instance if not already installed
	logger.Log("Checking and installing prerequisites on the instance...")
	prereqCmd := `
		command -v curl >/dev/null 2>&1 || { echo 'curl not found, installing...'; sudo apt-get update && sudo apt-get install -y curl; }
		command -v wget >/dev/null 2>&1 || { echo 'wget not found, installing...'; sudo apt-get update && sudo apt-get install -y wget; }
		command -v netstat >/dev/null 2>&1 || { echo 'netstat not found, installing...'; sudo apt-get update && sudo apt-get install -y net-tools; }
	`
	if _, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, prereqCmd, logger); err != nil {
		handleError(w, "Error checking/installing prerequisites", err, http.StatusInternalServerError, logger)
		return
	}
	logger.Log("Prerequisites checked and installed successfully.")

	// Improved process killing
	logger.Log("Killing any existing process running on port 8080 on the remote instance...")
	killCmd := `
		pid=$(lsof -ti:8080)
		if [ ! -z "$pid" ]; then
			echo "Killing process $pid"
			kill -9 $pid
			sleep 2
		else
			echo "No process found running on port 8080"
		fi
	`
	output, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, killCmd, logger)
	if err != nil {
		logger.Logf("Error during process killing: %v", err)
		logger.Logf("Kill command output: %s", output)
	} else {
		logger.Logf("Kill command output: %s", output)
	}

	// Copy the Ubuntu backend binary to the instance
	logger.Log("Copying backend binary to the instance...")
	if err := runSCPCommand(ctx, requestBody.SSHKeyPath, backendUbuntuBinaryPath, requestBody.SSHUser, instanceIP,
		fmt.Sprintf("/home/%s/backend_ubuntu_aarch64", requestBody.SSHUser), logger); err != nil {
		handleError(w, "Error copying backend binary", err, http.StatusInternalServerError, logger)
		return
	}
	logger.Log("Backend binary copied successfully.")

	// Make the binary executable
	chmodCmd := fmt.Sprintf("chmod +x /home/%s/backend_ubuntu_aarch64", requestBody.SSHUser)
	if _, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, chmodCmd, logger); err != nil {
		handleError(w, "Error making backend binary executable", err, http.StatusInternalServerError, logger)
		return
	}

	// Run the binary in the background
	runBinaryCmd := fmt.Sprintf("nohup /home/%s/backend_ubuntu_aarch64 > /home/%s/backend_ubuntu_aarch64.log 2>&1 & echo $!", requestBody.SSHUser, requestBody.SSHUser)
	output, err = runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, runBinaryCmd, logger)
	if err != nil {
		handleError(w, "Error starting backend binary", err, http.StatusInternalServerError, logger)
		return
	}
	pid := strings.TrimSpace(output)
	logger.Logf("Backend process started with PID: %s", pid)

	// Wait for the process to start
	time.Sleep(5 * time.Second)

	// Improved liveness check
	maxRetries := 6
	retryInterval := 10 * time.Second

	for i := 0; i < maxRetries; i++ {
		livenessCmd := fmt.Sprintf(`
			if ps -p %s > /dev/null; then
				echo "Process is running"
				if netstat -tlnp | grep -q ':%d.*%s'; then
					echo "Process is listening on port 8080"
					exit 0
				else
					echo "Process is not listening on port 8080"
				fi
			else
				echo "Process is not running"
			fi
			exit 1
		`, pid, 8080, pid)

		output, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, livenessCmd, logger)
		logger.Logf("Liveness check output: %s", output)

		if err == nil {
			logger.Log("Backend service is running and listening on port 8080")
			break
		}

		if i == maxRetries-1 {
			handleError(w, "Backend service is not running or not listening on port 8080 after maximum retries", nil, http.StatusInternalServerError, logger)
			return
		}

		logger.Logf("Backend service not yet running or listening. Retrying in %v...", retryInterval)
		time.Sleep(retryInterval)
	}

	// // WebSocket connection test
	// wsTestCmd := `
	// curl -v -N -H "Connection: Upgrade" \
	// 		   -H "Upgrade: websocket" \
	// 		   -H "Host: localhost:8080" \
	// 		   -H "Origin: http://localhost:8080" \
	// 		   -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
	// 		   -H "Sec-WebSocket-Version: 13" \
	// 		   http://localhost:8080/v1/ws
	// `
	// wsOutput, err := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, wsTestCmd, logger)
	// if err != nil {
	// 	logger.Logf("Error during WebSocket handshake test: %v", err)
	// } else {
	// 	logger.Logf("WebSocket handshake test output: %s", wsOutput)
	// 	if strings.Contains(wsOutput, "HTTP/1.1 101 Switching Protocols") {
	// 		logger.Log("WebSocket handshake successful")
	// 	} else {
	// 		logger.Log("WebSocket handshake unsuccessful")
	// 	}
	// }

	// // Additional WebSocket test using netcat
	// ncTestCmd := `
	// (printf "GET /v1/ws HTTP/1.1\r\nHost: localhost:8080\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n"; sleep 2) | nc localhost 8080
	// `
	// ncOutput, ncErr := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, ncTestCmd, logger)
	// if ncErr != nil {
	// 	logger.Logf("Error during netcat WebSocket test: %v", ncErr)
	// } else {
	// 	logger.Logf("Netcat WebSocket test output: %s", ncOutput)
	// 	if strings.Contains(ncOutput, "HTTP/1.1 101 Switching Protocols") {
	// 		logger.Log("Netcat WebSocket test successful")
	// 	} else {
	// 		logger.Log("Netcat WebSocket test unsuccessful")
	// 	}
	// }

	// // Additional diagnostics
	// logger.Log("Running additional diagnostics...")

	// // Check server-side network connections
	// netstatCmd := "netstat -tlnp | grep :8080 || echo 'No process listening on port 8080'"
	// netstatOutput, _ := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, netstatCmd, logger)
	// logger.Logf("Netstat output: %s", netstatOutput)

	// // Check for any active connections to port 8080
	// ssCmd := "ss -tn src :8080 or dst :8080"
	// ssOutput, _ := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, ssCmd, logger)
	// logger.Logf("Active connections on port 8080: %s", ssOutput)

	// // Check if the backend process is still running
	// psCmd := fmt.Sprintf("ps aux | grep backend_ubuntu_aarch64 | grep -v grep")
	// psOutput, _ := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, psCmd, logger)
	// logger.Logf("Backend process status: %s", psOutput)

	// // Check the last 50 lines of the application log
	// tailCmd := fmt.Sprintf("tail -n 50 /home/%s/backend_ubuntu_aarch64.log", requestBody.SSHUser)
	// tailOutput, _ := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, tailCmd, logger)
	// logger.Logf("Last 50 lines of application log: %s", tailOutput)

	// // Check system resources
	// resourceCmd := "free -m && uptime"
	// resourceOutput, _ := runSSHCommand(ctx, requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, resourceCmd, logger)
	// logger.Logf("System resources: %s", resourceOutput)

	// // Check EC2 instance status
	// logger.Logf("Instance state: %s", instance.State.Name)
	// logger.Logf("Public DNS: %s", *instance.PublicDnsName)

	// // Check security group rules
	// if len(instance.SecurityGroups) > 0 {
	// 	describeSecurityGroupsInput := &ec2.DescribeSecurityGroupsInput{
	// 		GroupIds: []string{*instance.SecurityGroups[0].GroupId},
	// 	}
	// 	describeSecurityGroupsOutput, err := svc.DescribeSecurityGroups(ctx, describeSecurityGroupsInput)
	// 	if err != nil {
	// 		logger.Logf("Error describing security groups: %v", err)
	// 	} else {
	// 		for _, group := range describeSecurityGroupsOutput.SecurityGroups {
	// 			for _, permission := range group.IpPermissions {
	// 				if permission.FromPort != nil && *permission.FromPort == 8080 {
	// 					logger.Logf("Security group rule found for port 8080: %v", permission)
	// 				}
	// 			}
	// 		}
	// 	}
	// } else {
	// 	logger.Log("No security groups found for the instance")
	// }

	// // Download the logs from the instance
	// logger.Log("Attempting to download logs from the remote instance...")
	// logFilePath := fmt.Sprintf("/home/%s/backend_ubuntu_aarch64.log", requestBody.SSHUser)
	// localLogPath := filepath.Join(execDir, "backend_ubuntu_aarch64.log")
	// scpCmd := fmt.Sprintf("scp -o StrictHostKeyChecking=no -i %s %s@%s:%s %s", requestBody.SSHKeyPath, requestBody.SSHUser, instanceIP, logFilePath, localLogPath)
	// if err := runCommand(ctx, "sh", []string{"-c", scpCmd}, logger); err != nil {
	// 	logger.Logf("Failed to download logs from the instance: %v", err)
	// 	logger.Log("Deployment completed with warnings. Unable to download log file.")
	// } else {
	// 	logger.Log("Logs downloaded successfully.")
	// }

	// Respond with instance IP and WebSocket URL
	response := map[string]string{
		"publicIP": instanceIP,
		"wsURL":    fmt.Sprintf("ws://%s:8080/v1/ws", instanceIP),
		"success":  "true",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	logger.Log("Deployment completed successfully.")
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

// Logger is a simple logger that writes to an io.Writer
type Logger struct {
	w io.Writer
}

// NewLogger creates a new Logger
func NewLogger(w io.Writer) *Logger {
	return &Logger{w: w}
}

// Log logs a message
func (l *Logger) Log(message string) {
	fmt.Fprintf(l.w, "%s: %s\n", time.Now().Format(time.RFC3339), message)
}

// Logf logs a formatted message
func (l *Logger) Logf(format string, v ...interface{}) {
	l.Log(fmt.Sprintf(format, v...))
}
