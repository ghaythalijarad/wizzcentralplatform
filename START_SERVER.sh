#!/bin/zsh
# WhizzCentral Platform - Simple Server Starter
# For macOS with zsh shell

echo "🚀 WhizzCentral Platform Starter"
echo "================================="
echo ""

# Navigate to project directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Killing existing process..."
    kill -9 $(lsof -t -i:3000)
    sleep 2
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a few minutes)..."
    npm install
    echo ""
fi

# Start the server
echo "🌐 Starting server on http://localhost:3000"
echo ""
echo "📍 Available pages:"
echo "   • Main: http://localhost:3000"
echo "   • Regions: http://localhost:3000/pages/regions-simple.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================="
echo ""

node local-dev-server.js
