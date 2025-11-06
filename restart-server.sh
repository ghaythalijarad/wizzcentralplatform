#!/bin/bash
# Restart Local Server Script

echo "🔄 RESTARTING WHIZZ CENTRAL PLATFORM LOCAL SERVER"
echo "================================================"

# Kill any existing Node.js processes for this project
echo "🛑 Stopping existing server processes..."
pkill -f "local-dev-server.js" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# Wait a moment
sleep 2

# Kill processes on port 3000
echo "🔄 Freeing up port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Navigate to project directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Start the server
echo "🚀 Starting local development server..."
echo "📍 Server will be available at: http://localhost:3000"
echo "📍 Frontend will be available at: http://localhost:8000"
echo ""
echo "✅ Starting server now... (Press Ctrl+C to stop)"

# Start the server in the background and show output
npm start
