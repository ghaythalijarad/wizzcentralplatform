#!/bin/bash
set -e

echo "🏗️  Building Lambda functions individually..."

# Clean previous builds
rm -rf dist/
mkdir -p dist/websocket-handler dist/chat-bridge

# Build WebSocket handler
echo "📦 Building WebSocket handler..."
node build-websocket-handler.js

# Build Chat bridge
echo "📦 Building Chat bridge..."
node build-chat-bridge.js

# Copy package.json to each dist folder (minimal version)
echo '{"name": "lambda-function", "version": "1.0.0", "main": "index.js"}' > dist/websocket-handler/package.json
echo '{"name": "lambda-function", "version": "1.0.0", "main": "index.js"}' > dist/chat-bridge/package.json

echo "✅ All Lambda functions built successfully!"
echo "📊 Build sizes:"
du -sh dist/*/
