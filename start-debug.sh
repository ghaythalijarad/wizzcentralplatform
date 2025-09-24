#!/bin/bash
echo "🚀 Starting WizzCentral Platform Server..."

cd /Users/ghaythallaheebi/wizzcentralplatform

echo "📍 Current directory: $(pwd)"
echo "📍 Node version: $(node --version)"
echo "📍 NPM version: $(npm --version)"

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

# Check if local-dev-server.js exists
if [ -f "local-dev-server.js" ]; then
    echo "✅ local-dev-server.js found"
else
    echo "❌ local-dev-server.js not found"
    exit 1
fi

# Try to start the server
echo "🔄 Starting server..."
node local-dev-server.js
