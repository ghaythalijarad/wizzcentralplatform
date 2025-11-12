#!/bin/zsh

echo "🚀 Starting WhizzCentral Local Dev Server"
echo "=========================================="
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Kill any existing server
echo "🛑 Stopping existing servers..."
pkill -f "local-dev-server.js" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🚀 Starting local dev server on port 3000..."
echo ""

node local-dev-server.js

echo ""
echo "✅ Server started!"
echo "   URL: http://localhost:3000"
echo "   Support Dashboard: http://localhost:3000/pages/support.html"
echo ""
