package ssh

import (
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/ssh"
)

type SSHExecutor struct {
	client *ssh.Client
}

// NewSSHExecutor creates a new SSH executor with the given credentials
func NewSSHExecutor(host string, username string, keyPath string) (*SSHExecutor, error) {
	// Ensure the host has a port; if missing, append :22
	if host != "" && !strings.Contains(host, ":") {
		host = host + ":22"
	}

	// Expand ~ to home directory if the path starts with ~
	if strings.HasPrefix(keyPath, "~") {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("unable to determine home directory: %w", err)
		}
		keyPath = strings.Replace(keyPath, "~", homeDir, 1)
	}

	// Read the private key
	key, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read private key: %w", err)
	}

	// Parse the private key
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, fmt.Errorf("unable to parse private key: %w", err)
	}

	// Configure SSH client
	config := &ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	// Connect to the SSH server
	client, err := ssh.Dial("tcp", host, config)
	if err != nil {
		return nil, fmt.Errorf("failed to dial: %w", err)
	}

	return &SSHExecutor{
		client: client,
	}, nil
}

// ExecuteCommand executes a single command on the remote SSH server and returns the output or an error
func (e *SSHExecutor) ExecuteCommand(command string) (string, error) {
	// Create a new session for the command
	session, err := e.client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}
	defer session.Close()

	// Capture combined output from stdout and stderr
	output, err := session.CombinedOutput(command)
	if err != nil {
		return "", fmt.Errorf("command execution error: %w\nOutput: %s", err, output)
	}

	return string(output), nil
}

// Close closes the SSH connection
func (e *SSHExecutor) Close() error {
	if e.client != nil {
		return e.client.Close()
	}
	return nil
}
