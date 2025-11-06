#!/bin/bash
# Quick start script for Mapbox integration testing

echo "🗺️  WizzCentral Mapbox Integration - Quick Start"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/mapbox-integration-test.html" ]; then
    echo "❌ Error: Please run this script from the whizzCentralPlatform directory"
    exit 1
fi

cd frontend

echo "✅ Files ready:"
echo "   - mapbox-config.js (token configured)"
echo "   - mapbox-integration-test.html (test page)"
echo "   - .env.mapbox (environment variables)"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "🚀 Starting local server on http://localhost:8000"
    echo "   Opening test page in browser..."
    echo ""
    echo "📍 Test features:"
    echo "   - Interactive map of Iraq"
    echo "   - 5 city markers (Baghdad, Basra, Erbil, Najaf, Karbala)"
    echo "   - Search functionality"
    echo "   - Navigation controls"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "=================================================="
    echo ""
    
    # Open browser
    sleep 2
    if command -v open &> /dev/null; then
        open http://localhost:8000/mapbox-integration-test.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000/mapbox-integration-test.html
    fi
    
    # Start server
    python3 -m http.server 8000
else
    echo "⚠️  Python3 not found. Opening file directly..."
    if command -v open &> /dev/null; then
        open mapbox-integration-test.html
    else
        echo "❌ Cannot open file automatically"
        echo "   Please open frontend/mapbox-integration-test.html in your browser"
    fi
fi
