#!/bin/zsh

# Quick Server Launcher for WhizzCentral
echo "🚀 Starting WhizzCentral Platform..."

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Kill any existing process on port 3000
pkill -f "local-dev-server" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "✅ Port 3000 cleared"
echo "🌐 Starting server..."
echo ""
echo "Once started, open Safari and go to:"
echo "   http://localhost:3000/pages/regions-simple.html"
echo ""

# Start the server
node local-dev-server.js
