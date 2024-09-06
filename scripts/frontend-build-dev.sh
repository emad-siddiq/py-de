#!/bin/bash

set -e

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
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install node
}

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

# Verify Node.js and npm installation
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null
then
    echo "Failed to install Node.js and npm. Please install them manually and try again."
    exit 1
fi

echo "Node.js and npm are installed."

# Navigate to the frontend/typescript directory
cd frontend/src/typescript || exit

# Install dependencies
echo "Installing dependencies..."
npm install

# Run Webpack to build the project
echo "Running Webpack to build the project..."
npx webpack --config webpack.config.js

# Start Webpack Dev Server for development
echo "Starting Webpack Dev Server for development..."
npx webpack serve --config webpack.config.js

# Navigate back to the root scripts directory (if needed)
cd ../../../scripts || exit

echo "Frontend development environment is up and running at http://localhost:8081"