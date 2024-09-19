#!/bin/bash
set -e

# Function to install Go on Ubuntu
install_go_ubuntu() {
    echo "Installing Go on Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y wget
    wget https://go.dev/dl/go1.21.0.linux-arm64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.0.linux-arm64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    source ~/.bashrc
    rm go1.21.0.linux-arm64.tar.gz
}

# Function to install Go on macOS
install_go_mac() {
    echo "Installing Go on macOS..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install go
}

# Function to install Node.js and npm on Ubuntu
install_node_ubuntu() {
    echo "Installing Node.js and npm on Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y curl
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
}

# Function to install Node.js and npm on macOS
install_node_mac() {
    echo "Installing Node.js and npm on macOS..."
    brew install node
}

# Check if Go is installed
if ! command -v go &> /dev/null
then
    echo "Go is not installed. Attempting to install..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_go_ubuntu
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        install_go_mac
    else
        echo "Unsupported operating system. Please install Go manually."
        exit 1
    fi
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null
then
    echo "Node.js and npm are not installed. Attempting to install..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_node_ubuntu
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        install_node_mac
    else
        echo "Unsupported operating system. Please install Node.js and npm manually."
        exit 1
    fi
fi

# Verify Go, Node.js, and npm installation
if ! command -v go &> /dev/null || ! command -v node &> /dev/null || ! command -v npm &> /dev/null
then
    echo "Failed to install Go, Node.js, or npm. Please install them manually and try again."
    exit 1
fi

echo "Go, Node.js, and npm are installed."

# Define output directory and binary names
OUTPUT_DIR="dist"
BACKEND_BINARY="backend"
FRONTEND_BINARY="frontend"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Build node files
cd frontend/src/typescript/src || exit
npm install
npm run build
cd ../../../../ || exit

# Build for macOS Darwin M1 and Ubuntu aarch64
GOOS="darwin"
GOARCH="arm64"
SUFFIX="_mac_m1"

cd backend/src || exit
echo $(pwd)

# Build backend project for macOS Darwin M1
echo "Building backend project for macOS M1..."
GOOS=$GOOS GOARCH=$GOARCH go build -o "../../$OUTPUT_DIR/$BACKEND_BINARY$SUFFIX"

cd ../../frontend/src || exit

# Build frontend project for macOS Darwin M1
echo "Building frontend project for macOS M1..."
GOOS=$GOOS GOARCH=$GOARCH go build -o "../../$OUTPUT_DIR/$FRONTEND_BINARY$SUFFIX"

# Build backend and frontend project for Ubuntu aarch64
GOOS="linux"
GOARCH="arm64"
SUFFIX="_ubuntu_aarch64"

cd ../../backend/src || exit
echo "Building backend project for Ubuntu aarch64..."
GOOS=$GOOS GOARCH=$GOARCH go build -o "../../$OUTPUT_DIR/$BACKEND_BINARY$SUFFIX"

cd ../../frontend/src || exit
echo "Building frontend project for Ubuntu aarch64..."
GOOS=$GOOS GOARCH=$GOARCH go build -o "../../$OUTPUT_DIR/$FRONTEND_BINARY$SUFFIX"

echo "Build completed. Binaries for macOS M1 and Ubuntu aarch64 are located in $OUTPUT_DIR."