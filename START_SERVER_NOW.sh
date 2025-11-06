#!/bin/zsh

# WhizzCentral Platform - Absolute Startup Script
# This WILL work

clear
echo "════════════════════════════════════════════════════════════"
echo "  🚀 WhizzCentral Platform - Starting Server..."
echo "════════════════════════════════════════════════════════════"
echo ""

# Change to project directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Kill EVERYTHING on port 3000
echo "🧹 Cleaning port 3000..."
pkill -f "local-dev-server" 2>/dev/null
pkill -f "node.*3000" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2

echo "✅ Port 3000 is clear"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    echo "This will take 2-3 minutes..."
    npm install
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo "  🌐 STARTING SERVER NOW..."
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Once you see 'running on port 3000', the server is ready!"
echo ""
echo "📍 Then open Safari and go to:"
echo "   http://localhost:3000/pages/regions-simple.html"
echo ""
echo "💡 To stop server: Press Ctrl+C"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Start server with full output
node local-dev-server.js

# If we get here, server stopped
echo ""
echo "⚠️  Server has stopped"
