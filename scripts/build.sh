#!/bin/bash

set -e

# Define output directory and binary names
OUTPUT_DIR="dist"
BACKEND_MAC_BINARY="backend_mac_x86_64"
BACKEND_UBUNTU_X86_BINARY="backend_ubuntu_x86_64"
BACKEND_UBUNTU_ARM_BINARY="backend_ubuntu_aarch64"
FRONTEND_MAC_BINARY="frontend_mac_x86_64"
FRONTEND_UBUNTU_X86_BINARY="frontend_ubuntu_x86_64"
FRONTEND_UBUNTU_ARM_BINARY="frontend_ubuntu_aarch64"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Build node files
cd frontend/src/typescript/src
npm install
npm run build

cd ../../../../

# Change to backend
cd backend/src

echo $(pwd)

# Build for backend project
echo "Building backend project..."

# Cross-compile for macOS (x86_64)
GOOS=darwin GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$BACKEND_MAC_BINARY" 

# Cross-compile for Ubuntu (x86_64)
GOOS=linux GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$BACKEND_UBUNTU_X86_BINARY" 

# Cross-compile for Ubuntu (aarch64)
GOOS=linux GOARCH=arm64 go build -o "../../$OUTPUT_DIR/$BACKEND_UBUNTU_ARM_BINARY" 

cd ../../frontend/src

# Build for frontend project
echo "Building frontend project..."

# Cross-compile for macOS (x86_64)
GOOS=darwin GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$FRONTEND_MAC_BINARY" 

# Cross-compile for Ubuntu (x86_64)
GOOS=linux GOARCH=amd64 go build -o "../../$OUTPUT_DIR/$FRONTEND_UBUNTU_X86_BINARY" 

# Cross-compile for Ubuntu (aarch64)
GOOS=linux GOARCH=arm64 go build -o "../../$OUTPUT_DIR/$FRONTEND_UBUNTU_ARM_BINARY"

echo "Build completed. Binaries are located in $OUTPUT_DIR."
