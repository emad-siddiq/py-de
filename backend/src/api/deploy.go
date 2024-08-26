package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"

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
		SSHUser         string `json:"sshUser"`
		SSHKeyPath      string `json:"sshKeyPath"`
		BinaryPath      string `json:"binaryPath"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create AWS config with static credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithCredentialsProvider(
		credentials.NewStaticCredentialsProvider(requestBody.AccessKeyID, requestBody.SecretAccessKey, ""),
	))
	if err != nil {
		http.Error(w, fmt.Sprintf("Unable to load AWS config: %v", err), http.StatusInternalServerError)
		return
	}

	svc := ec2.NewFromConfig(cfg)

	// Describe instance to get its public IP
	instance, err := svc.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
		InstanceIds: []string{requestBody.InstanceID},
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("Unable to describe instance: %v", err), http.StatusInternalServerError)
		return
	}

	if len(instance.Reservations) == 0 || len(instance.Reservations[0].Instances) == 0 {
		http.Error(w, "Instance not found", http.StatusNotFound)
		return
	}

	instanceIP := *instance.Reservations[0].Instances[0].PublicIpAddress

	// SSH into instance and deploy binary
	deployCmd := fmt.Sprintf(
		"ssh -i %s %s@%s sudo cp %s /home/%s && sudo chmod +x /home/%s/%s",
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
		requestBody.BinaryPath,
		requestBody.SSHUser,
		requestBody.SSHUser,
		requestBody.BinaryPath,
	)
	cmd := exec.Command("sh", "-c", deployCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error deploying binary: %v", err), http.StatusInternalServerError)
		return
	}

	// Expose WebSocket ports
	exposeCmd := fmt.Sprintf(
		"ssh -i %s %s@%s sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT",
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
	)
	cmd = exec.Command("sh", "-c", exposeCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error exposing WebSocket ports: %v", err), http.StatusInternalServerError)
		return
	}

	// Respond with instance IP
	response := map[string]string{"publicIP": instanceIP}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
