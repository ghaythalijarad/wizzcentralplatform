#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting WhizzCentral Platform..."
echo "📁 Directory: $(pwd)"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🌐 Starting server on http://localhost:3000"
echo "🗺️ Regions page: http://localhost:3000/pages/regions-simple.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node local-dev-server.js
