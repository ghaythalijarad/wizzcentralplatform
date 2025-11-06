#!/bin/bash
# Restart Local Server with Enhanced Najaf Regions

echo "🔄 RESTARTING WHIZZ CENTRAL PLATFORM"
echo "===================================="
echo ""

# Kill existing server processes
echo "🛑 Stopping existing servers..."
pkill -f "local-dev-server" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "✅ Servers stopped"
echo ""

# Wait a moment
sleep 2

# Navigate to project directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Set AWS environment
export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_REGION=us-east-1

echo "🚀 Starting enhanced local server..."
echo "   • Enhanced with 20 comprehensive Najaf regions"
echo "   • 4 districts + 16 neighborhoods"
echo "   • GADM boundary data integrated"
echo ""

# Start the server in background
node local-dev-server.js &
SERVER_PID=$!

echo "✅ Server starting with PID: $SERVER_PID"
echo ""

# Start frontend server
echo "🎨 Starting frontend server on port 8000..."
cd frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo "✅ Frontend server starting with PID: $FRONTEND_PID"
echo ""

echo "🌐 SERVERS READY!"
echo "================="
echo "• Backend API: http://localhost:3000"
echo "• Frontend UI: http://localhost:8000"
echo "• Regions Admin: http://localhost:8000/pages/regions.html"
echo ""
echo "🎉 REFRESH YOUR BROWSER TO SEE 20 NAJAF REGIONS!"
echo ""
echo "📊 What you'll see:"
echo "   ✅ 4 Najaf Districts (Level 2)"
echo "   ✅ 16 Najaf Neighborhoods (Level 3)"
echo "   ✅ Complete Arabic/English names"
echo "   ✅ Enhanced GPS coordinates"
echo "   ✅ Delivery configurations"
echo ""
echo "Press Ctrl+C to stop servers"

# Keep script running
wait
