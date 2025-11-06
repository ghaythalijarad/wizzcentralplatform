#!/bin/zsh
# Quick Start Script for Mapbox Geocoding Playground

echo "🚀 Starting Mapbox Geocoding Playground..."
echo ""

cd "$(dirname "$0")"

# Start server in background
node regions-api/server.js &
SERVER_PID=$!

echo "✅ Server started with PID: $SERVER_PID"
echo "🌐 Opening browser at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait a moment for server to start
sleep 2

# Open browser (macOS)
open http://localhost:3000

# Wait for user to press Ctrl+C
wait $SERVER_PID
