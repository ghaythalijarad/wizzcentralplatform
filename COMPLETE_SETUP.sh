#!/bin/zsh

echo "🗺️  COMPLETE DYNAMODB REGIONS SETUP"
echo "====================================="
echo ""

# Navigate to project
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Set AWS credentials
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_PAGER=""  # Disable pager

echo "📋 Step 1: Creating DynamoDB Table..."
echo ""
cd backend && node create-regions-table.js
TABLE_STATUS=$?

if [ $TABLE_STATUS -eq 0 ]; then
    echo ""
    echo "✅ DynamoDB table created successfully!"
else
    echo ""
    echo "⚠️  Table creation had issues, but continuing..."
fi

echo ""
echo "📋 Step 2: Stopping old server..."
cd ..
pkill -f "node local-dev-server.js" 2>/dev/null
sleep 2

echo ""
echo "📋 Step 3: Starting new server with DynamoDB integration..."
node local-dev-server.js > server-dynamodb.log 2>&1 &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

echo ""
echo "⏳ Waiting for server to initialize (5 seconds)..."
sleep 5

echo ""
echo "📋 Step 4: Testing API..."
API_TEST=$(curl -s http://localhost:3000/api/regions 2>/dev/null)

if [ -n "$API_TEST" ]; then
    echo "✅ API is responding!"
    REGION_COUNT=$(echo $API_TEST | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo "   Found $REGION_COUNT regions"
else
    echo "⚠️  API not responding yet"
fi

echo ""
echo "📋 Step 5: Opening Safari..."
open -a Safari "http://localhost:3000/pages/regions.html"

echo ""
echo "============================================"
echo "✅ SETUP COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Regions Page: http://localhost:3000/pages/regions.html"
echo "🔌 API Endpoint: http://localhost:3000/api/regions"
echo "📄 Server Logs: server-dynamodb.log"
echo "🆔 Server PID: $SERVER_PID"
echo ""
echo "🛠️  Commands:"
echo "   View logs: tail -f server-dynamodb.log"
echo "   Stop server: kill $SERVER_PID"
echo "   Test API: curl http://localhost:3000/api/regions"
echo ""
echo "📊 Test Toggle Active/Inactive:"
echo "   curl -X PATCH http://localhost:3000/api/regions/basra/toggle"
echo ""
