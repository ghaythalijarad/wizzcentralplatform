#!/bin/zsh

echo "🚀 Starting WhizzCentral Server for Safari..."
echo ""

# Kill any existing server
echo "🧹 Cleaning up old processes..."
pkill -f "node local-dev-server.js" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Navigate to project directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Start server in background
echo "▶️  Starting Node server..."
node local-dev-server.js > server-output.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if lsof -i:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on port 3000!"
    echo "📊 Server PID: $SERVER_PID"
    echo ""
    echo "🌐 Opening regions page in Safari..."
    echo ""
    
    # Open in Safari
    open -a Safari http://localhost:3000/pages/regions.html
    
    echo "✅ Safari should now open with the regions page"
    echo ""
    echo "📋 Useful URLs:"
    echo "   • Regions: http://localhost:3000/pages/regions.html"
    echo "   • Dashboard: http://localhost:3000/pages/dashboard.html"
    echo "   • API Test: http://localhost:3000/api/regions"
    echo ""
    echo "📄 Server logs: server-output.log"
    echo "🛑 To stop server: kill $SERVER_PID"
    echo ""
    echo "💡 To view live logs: tail -f server-output.log"
else
    echo "❌ Server failed to start!"
    echo "📄 Check server-output.log for errors:"
    cat server-output.log
    exit 1
fi
