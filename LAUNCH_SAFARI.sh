#!/bin/zsh
# Complete Server Startup and Safari Access Guide

echo "═══════════════════════════════════════════════════════════"
echo "🚀 WhizzCentral Platform - Safari Connection Guide"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Navigate to project
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Step 2: Kill any existing server
echo "🧹 Step 1: Cleaning up old processes..."
pkill -f "node local-dev-server.js" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2
echo "   ✅ Port 3000 cleared"
echo ""

# Step 3: Check dependencies
echo "📦 Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules not found, installing..."
    npm install
else
    echo "   ✅ Dependencies installed"
fi
echo ""

# Step 4: Start server
echo "▶️  Step 3: Starting server..."
node local-dev-server.js &
SERVER_PID=$!
echo "   🆔 Server PID: $SERVER_PID"
echo ""

# Step 5: Wait for server
echo "⏳ Step 4: Waiting for server to initialize (5 seconds)..."
sleep 5
echo ""

# Step 6: Verify server is running
echo "🔍 Step 5: Verifying server..."
if lsof -i:3000 > /dev/null 2>&1; then
    echo "   ✅ Server is RUNNING on port 3000"
    echo ""
    
    # Test API endpoint
    echo "🧪 Step 6: Testing API endpoint..."
    API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/regions)
    if [ "$API_TEST" = "200" ]; then
        echo "   ✅ API responding correctly (HTTP 200)"
    else
        echo "   ⚠️  API returned HTTP $API_TEST"
    fi
    echo ""
    
    # Open Safari
    echo "🌐 Step 7: Opening Safari..."
    open -a Safari "http://localhost:3000/pages/regions.html"
    echo "   ✅ Safari should open in 2-3 seconds"
    echo ""
    
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ SUCCESS! Server is running"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "📋 Quick Links:"
    echo "   🗺️  Regions:   http://localhost:3000/pages/regions.html"
    echo "   📊 Dashboard: http://localhost:3000/pages/dashboard.html"
    echo "   🔌 API Test:  http://localhost:3000/api/regions"
    echo ""
    echo "📊 Server Info:"
    echo "   PID: $SERVER_PID"
    echo "   Port: 3000"
    echo "   Status: Running"
    echo ""
    echo "🛠️  Useful Commands:"
    echo "   Stop server:    kill $SERVER_PID"
    echo "   Check port:     lsof -i:3000"
    echo "   View processes: ps aux | grep local-dev-server"
    echo ""
    echo "💡 If Safari shows blank page:"
    echo "   1. Clear Safari cache (Cmd+Option+E)"
    echo "   2. Hard refresh (Cmd+Shift+R)"
    echo "   3. Check browser console (Cmd+Option+C)"
    echo ""
    echo "Press Ctrl+C to stop this script (server continues running)"
    echo "═══════════════════════════════════════════════════════════"
    
    # Keep script running to show server is active
    wait $SERVER_PID
    
else
    echo "   ❌ Server FAILED to start"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check if port 3000 is in use: lsof -i:3000"
    echo "   2. Verify Node.js is installed: node --version"
    echo "   3. Check for syntax errors: node -c local-dev-server.js"
    echo "   4. Try manual start: node local-dev-server.js"
    echo ""
    exit 1
fi
