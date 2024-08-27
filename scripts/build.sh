#!/bin/bash

set -e

# Define output directory and binary names
OUTPUT_DIR="dist"
BACKEND_MAC_BINARY="backend_mac_amd64"
BACKEND_UBUNTU_BINARY="backend_ubuntu_amd64"
FRONTEND_MAC_BINARY="frontend_mac_amd64"
FRONTEND_UBUNTU_BINARY="frontend_ubuntu_amd64"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Change to backend
cd backend/src

echo $(pwd)



# Build for backend project
echo "Building backend project..."

# Build for macOS
GOOS=darwin GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$BACKEND_MAC_BINARY" 

# Build for Ubuntu
GOOS=linux GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$BACKEND_UBUNTU_BINARY" 

cd ../../frontend/src

# Build for frontend project
echo "Building frontend project..."

# Build for macOS
GOOS=darwin GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$FRONTEND_MAC_BINARY" 

# Build for Ubuntu
GOOS=linux GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$FRONTEND_UBUNTU_BINARY"

echo "Build completed. Binaries are located in $OUTPUT_DIR."
