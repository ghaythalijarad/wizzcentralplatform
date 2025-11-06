#!/bin/zsh

echo "🌍 STARTING WHIZZ CENTRAL PLATFORM - REGION API SERVER"
echo "======================================================"
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Check if port 3001 is already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is already in use"
    echo "   Killing existing process..."
    kill $(lsof -t -i:3001) 2>/dev/null
    sleep 2
fi

echo "🚀 Starting Central Platform Region API Server..."
echo "   - Serving ALL 18 Iraqi Governorates"
echo "   - Districts with hierarchical structure"
echo "   - Neighborhoods with GPS coordinates"
echo ""
echo "📡 Server will run at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node local-regions-comprehensive.js
