#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting Python HTTP Server..."
echo "📁 Directory: $(pwd)"

# Kill any existing server on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start the server
nohup python3 -m http.server 8080 > server.log 2>&1 &
SERVER_PID=$!

sleep 2

# Check if server started successfully
if lsof -i:8080 > /dev/null 2>&1; then
    echo "✅ Server started successfully on port 8080"
    echo "🌐 Access at: http://localhost:8080"
    echo "📄 Support page: http://localhost:8080/frontend/pages/support.html" 
    echo "📋 Server PID: $SERVER_PID"
else
    echo "❌ Failed to start server on port 8080"
    exit 1
fi
