#!/bin/bash

set -e

# Define output directory and binary names
OUTPUT_DIR="dist"
BACKEND_MAC_ARM_BINARY="backend_mac_arm64"
BACKEND_UBUNTU_ARM_BINARY="backend_ubuntu_aarch64"
FRONTEND_MAC_ARM_BINARY="frontend_mac_arm64"
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

# Cross-compile for macOS (ARM64)
GOOS=darwin GOARCH=arm64 go build -o "../../$OUTPUT_DIR/$BACKEND_MAC_ARM_BINARY" 

# Cross-compile for Ubuntu (ARM64)
GOOS=linux GOARCH=arm64 go build -o "../../$OUTPUT_DIR/$BACKEND_UBUNTU_ARM_BINARY" 

cd ../../frontend/src

# Build for frontend project
echo "Building frontend project..."

# Cross-compile for macOS (ARM64)
GOOS=darwin GOARCH=arm64 go build -o "../../$OUTPUT_DIR/$FRONTEND_MAC_ARM_BINARY" 

# Cross-compile for Ubuntu (ARM64)
GOOS=linux GOARCH=arm64 go build -o "../../$OUTPUT_DIR/$FRONTEND_UBUNTU_ARM_BINARY"

echo "Build completed. Binaries are located in $OUTPUT_DIR."