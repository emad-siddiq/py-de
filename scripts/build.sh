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

# Determine the local processor architecture
if [[ "$OSTYPE" == "darwin"* ]]; then
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        GOARCH="arm64"
        SUFFIX="_mac_arm64"
    elif [[ "$ARCH" == "x86_64" ]]; then
        GOARCH="amd64"
        SUFFIX="_mac_amd64"
    else
        echo "Unsupported Mac architecture: $ARCH"
        exit 1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    ARCH=$(uname -m)
    if [[ "$ARCH" == "aarch64" ]]; then
        GOARCH="arm64"
        SUFFIX="_ubuntu_aarch64"
    elif [[ "$ARCH" == "x86_64" ]]; then
        GOARCH="amd64"
        SUFFIX="_ubuntu_amd64"
    else
        echo "Unsupported Linux architecture: $ARCH"
        exit 1
    fi
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Change to backend
cd backend/src || exit
echo $(pwd)

# Build for backend project
echo "Building backend project..."
GOOS=$([[ "$OSTYPE" == "darwin"* ]] && echo "darwin" || echo "linux") GOARCH=$GOARCH go build -o "../../$OUTPUT_DIR/$BACKEND_BINARY$SUFFIX"

cd ../../frontend/src || exit

# Build for frontend project
echo "Building frontend project..."
GOOS=$([[ "$OSTYPE" == "darwin"* ]] && echo "darwin" || echo "linux") GOARCH=$GOARCH go build -o "../../$OUTPUT_DIR/$FRONTEND_BINARY$SUFFIX"

echo "Build completed. Binaries are located in $OUTPUT_DIR."