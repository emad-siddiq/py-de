#!/bin/bash

set -e

# Step 1: Navigate to the frontend/typescript directory
cd frontend/src/typescript

# Step 2: Run Webpack to build the project
echo "Running Webpack to build the project..."
npx webpack --config ../../../webpack.config.js

# Step 3: Start Webpack Dev Server for development
echo "Starting Webpack Dev Server for development..."
npx webpack serve --config ../../../webpack.config.js

# Step 4: Navigate back to the root scripts directory (if needed)
cd ../../../scripts

echo "Frontend development environment is up and running at http://localhost:8081"