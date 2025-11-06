#!/bin/zsh

# WhizzCentral Platform - Complete Server Starter
# Handles dependencies, port conflicts, and starts server

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🚀 WhizzCentral Platform - Server Starter         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Set project directory
PROJECT_DIR="/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform"

# Navigate to project
cd "$PROJECT_DIR" || {
    echo "❌ Error: Cannot find project directory"
    exit 1
}

echo "📁 Project: $PROJECT_DIR"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "   Please install from: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Check and install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    echo "   (This may take 2-3 minutes on first run)"
    echo ""
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo ""
fi

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is already in use"
    echo "   Attempting to free the port..."
    kill -9 $(lsof -t -i:3000) 2>/dev/null
    sleep 2
    echo "✅ Port 3000 is now available"
    echo ""
fi

# Check required files
if [ ! -f "local-dev-server.js" ]; then
    echo "❌ Error: local-dev-server.js not found"
    exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              🌐 Starting Server...                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Server will be available at:"
echo "   • Main Dashboard: http://localhost:3000"
echo "   • Regions Management: http://localhost:3000/pages/regions-simple.html"
echo "   • Login: http://localhost:3000/login.html"
echo ""
echo "💡 To stop the server: Press Ctrl+C"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Start the server
exec node local-dev-server.js
