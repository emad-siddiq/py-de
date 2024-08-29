package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

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

	fmt.Println("Starting deployment process...")

	// Create AWS config with static credentials and specified region
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(requestBody.Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(requestBody.AccessKeyID, requestBody.SecretAccessKey, ""),
		))
	if err != nil {
		http.Error(w, fmt.Sprintf("Unable to load AWS config: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error loading AWS config: %v\n", err)
		return
	}
	fmt.Println("AWS config loaded successfully.")

	svc := ec2.NewFromConfig(cfg)

	// Describe instance to get its public IP
	instance, err := svc.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{requestBody.InstanceID},
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("Unable to describe instance: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error describing instance: %v\n", err)
		return
	}

	if len(instance.Reservations) == 0 || len(instance.Reservations[0].Instances) == 0 {
		http.Error(w, "Instance not found", http.StatusNotFound)
		fmt.Println("Instance not found.")
		return
	}

	instanceIP := *instance.Reservations[0].Instances[0].PublicIpAddress
	fmt.Printf("Instance IP: %s\n", instanceIP)

	// Get the directory of the current executable
	execPath, err := os.Executable()
	if err != nil {
		http.Error(w, fmt.Sprintf("Unable to determine executable path: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error determining executable path: %v\n", err)
		return
	}
	execDir := filepath.Dir(execPath)

	// Path to the backend Ubuntu binary for aarch64 in the same directory as the current binary
	backendUbuntuBinaryPath := filepath.Join(execDir, "backend_ubuntu_aarch64")

	// Install prerequisites on the instance if not already installed
	fmt.Println("Checking and installing prerequisites on the instance...")
	installCmd := fmt.Sprintf(
		`ssh -i %s %s@%s 'command -v curl >/dev/null 2>&1 || { echo "curl not found, installing..."; sudo apt-get update && sudo apt-get install -y curl wget; }'`,
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
	)
	cmd := exec.Command("sh", "-c", installCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error checking/installing prerequisites: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error checking/installing prerequisites: %v\n", err)
		return
	}
	fmt.Println("Prerequisites checked and installed successfully.")

	// Copy the Ubuntu backend binary to the instance
	fmt.Println("Copying backend binary to the instance...")
	scpCmd := fmt.Sprintf(
		"scp -i %s %s %s@%s:/home/%s/backend_ubuntu_aarch64",
		requestBody.SSHKeyPath,
		backendUbuntuBinaryPath,
		requestBody.SSHUser,
		instanceIP,
		requestBody.SSHUser,
	)
	cmd = exec.Command("sh", "-c", scpCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error copying backend binary: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error copying backend binary: %v\n", err)
		return
	}
	fmt.Println("Backend binary copied successfully.")

	// SSH into instance, make the binary executable, and run it
	fmt.Println("Running backend binary on the instance...")
	runCmd := fmt.Sprintf(
		`ssh -i %s %s@%s 'chmod +x /home/%s/backend_ubuntu_aarch64 && nohup /home/%s/backend_ubuntu_aarch64 > /dev/null 2>&1 & echo $! > /home/%s/backend_ubuntu_aarch64.pid && echo "PID: $(cat /home/%s/backend_ubuntu_aarch64.pid)"'`,
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
		requestBody.SSHUser,
		requestBody.SSHUser,
		requestBody.SSHUser,
		requestBody.SSHUser,
	)
	cmd = exec.Command("sh", "-c", runCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error running backend binary: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error running backend binary: %v\n", err)
		return
	}
	fmt.Println("Backend binary is running on the instance.")

	// Print the curl command to test the WebSocket endpoint
	curlCmd := fmt.Sprintf(`curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: %s:8080" -H "Origin: http://%s:8080" http://%s:8080/v1/ws`, instanceIP, instanceIP, instanceIP)
	fmt.Printf("Use the following curl command to test the WebSocket endpoint:\n%s\n", curlCmd)

	// Respond with instance IP and the curl command
	response := map[string]string{
		"publicIP": instanceIP,
		"curlCmd":  curlCmd,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	fmt.Println("Deployment completed successfully.")
}
