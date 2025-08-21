#!/bin/bash

# Build script for Netlify deployment
echo "Starting Netlify build..."

# Install dependencies
echo "Installing dependencies..."
bun install

# Export for web
echo "Building web app..."
bunx expo export -p web --output-dir dist

echo "Build completed successfully!"