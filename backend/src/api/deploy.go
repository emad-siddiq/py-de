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

// Path to the source code archive
const sourceCodeArchivePath = "/dist/source_code.tar.gz"

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

	// Archive the source code
	archiveCmd := "tar -czf /dist/source_code.tar.gz -C /path/to/source/code ."
	cmd := exec.Command("sh", "-c", archiveCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating source code archive: %v", err), http.StatusInternalServerError)
		return
	}

	// Copy the source code archive to the instance
	scpCmd := fmt.Sprintf(
		"scp -i %s /dist/source_code.tar.gz %s@%s:/home/%s",
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
		requestBody.SSHUser,
	)
	cmd = exec.Command("sh", "-c", scpCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error copying source code archive: %v", err), http.StatusInternalServerError)
		return
	}

	// SSH into instance and extract the source code
	extractCmd := fmt.Sprintf(
		"ssh -i %s %s@%s 'tar -xzf /home/%s/source_code.tar.gz -C /home/%s && rm /home/%s/source_code.tar.gz'",
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
		requestBody.SSHUser,
		requestBody.SSHUser,
		requestBody.SSHUser,
	)
	cmd = exec.Command("sh", "-c", extractCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error extracting source code: %v", err), http.StatusInternalServerError)
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
