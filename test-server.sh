#!/bin/bash
# Test script to start server and test regions API

echo "🚀 Starting WhizzCentral Platform Local Server..."
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Start server in background
node local-dev-server.js &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Test regions API
echo "🧪 Testing /api/regions endpoint..."
curl -s http://localhost:3000/api/regions | jq '. | length' 2>/dev/null || echo "Server not ready or jq not available"

# Test if server is responding
echo "🔍 Testing server status..."
curl -s -I http://localhost:3000 | head -1 || echo "Server not responding"

echo "✅ Server started with PID: $SERVER_PID"
echo "🌐 Open http://localhost:3000 in your browser"
echo "📊 Regions Management: http://localhost:3000/regions.html"
echo ""
echo "Press Enter to stop the server..."
read

# Kill the server
kill $SERVER_PID
echo "🛑 Server stopped"
