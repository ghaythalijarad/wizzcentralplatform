#!/bin/bash
# Simple script to start the dashboard local server

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         🚀 STARTING DASHBOARD LOCAL SERVER 🚀              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Kill any existing server on port 8000
echo "📡 Stopping any existing server on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ Port 8000 cleared"
echo ""

# Navigate to the FRONTEND directory (important!)
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/frontend

# Start the Python HTTP server
echo "🚀 Starting HTTP server on port 8000..."
echo "📁 Serving from: $(pwd)"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  ✅ Server will start now!                                 ║"
echo "║                                                            ║"
echo "║  🌐 Dashboard URL:                                         ║"
echo "║     http://localhost:8000/pages/dashboard.html            ║"
echo "║                                                            ║"
echo "║  📝 To stop the server: Press Ctrl+C                       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⏳ Starting server in background..."
echo ""

# Start the server in background
nohup python3 -m http.server 8000 > /tmp/dashboard-server.log 2>&1 &
SERVER_PID=$!

sleep 2

# Check if server started successfully
if lsof -i:8000 > /dev/null 2>&1; then
    echo "✅ Server started successfully! (PID: $SERVER_PID)"
    echo ""
    echo "🌐 Dashboard is ready at: http://localhost:8000/pages/dashboard.html"
    echo ""
    echo "📝 To stop the server later, run: kill $SERVER_PID"
    echo "   Or use: lsof -ti:8000 | xargs kill -9"
    echo ""
else
    echo "❌ Server failed to start. Check /tmp/dashboard-server.log"
    exit 1
fi
