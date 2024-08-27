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

// Path to the backend Ubuntu binary in the dist folder
const backendUbuntuBinaryPath = "/dist/backend_ubuntu_amd64"

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

	fmt.Println("Starting deployment process...")

	// Create AWS config with static credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithCredentialsProvider(
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

	// Copy the Ubuntu backend binary to the instance
	fmt.Println("Copying backend binary to the instance...")
	scpCmd := fmt.Sprintf(
		"scp -i %s %s %s@%s:/home/%s/backend_ubuntu_amd64",
		requestBody.SSHKeyPath,
		backendUbuntuBinaryPath,
		requestBody.SSHUser,
		instanceIP,
		requestBody.SSHUser,
	)
	cmd := exec.Command("sh", "-c", scpCmd)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error copying backend binary: %v", err), http.StatusInternalServerError)
		fmt.Printf("Error copying backend binary: %v\n", err)
		return
	}
	fmt.Println("Backend binary copied successfully.")

	// SSH into instance and run the backend binary
	fmt.Println("Running backend binary on the instance...")
	runCmd := fmt.Sprintf(
		"ssh -i %s %s@%s 'chmod +x /home/%s/backend_ubuntu_amd64 && /home/%s/backend_ubuntu_amd64 &'",
		requestBody.SSHKeyPath,
		requestBody.SSHUser,
		instanceIP,
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

	// Respond with instance IP
	response := map[string]string{"publicIP": instanceIP}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	fmt.Println("Deployment completed successfully.")
}
