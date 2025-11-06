#!/bin/bash

# Start Mapbox Geocoding Playground
# WhizzCentral Platform V2

echo ""
echo "🚀 Starting Mapbox Geocoding Playground..."
echo "=========================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🌐 Starting server on port 3000..."
node regions-api/server.js
