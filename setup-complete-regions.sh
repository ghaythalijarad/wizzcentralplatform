#!/bin/bash

###############################################################################
# Complete Regions Management Setup Script
# Sets up DynamoDB table with all 18 Iraqi governorates and launches UI
###############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║       WhizzCentral Regions Management - Complete Setup            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Set AWS environment
export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

BASE_DIR="/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform"
cd "$BASE_DIR"

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Check if DynamoDB table exists
echo "🔍 Step 1: Checking if WizzCentral_Regions table exists..."
if aws dynamodb describe-table --table-name WizzCentral_Regions &>/dev/null; then
    echo "   ✅ Table already exists"
    echo ""
    echo "   Would you like to:"
    echo "   1) Keep existing table and data"
    echo "   2) Delete and recreate (⚠️  DELETES ALL DATA)"
    echo ""
    read -p "   Enter choice (1 or 2): " choice
    
    if [ "$choice" = "2" ]; then
        echo ""
        echo "   🗑️  Deleting existing table..."
        aws dynamodb delete-table --table-name WizzCentral_Regions
        echo "   ⏳ Waiting for table deletion..."
        sleep 10
        echo "   ✅ Table deleted"
    else
        echo "   ✅ Keeping existing table"
        TABLE_EXISTS=true
    fi
else
    echo "   ℹ️  Table does not exist - will create new table"
    TABLE_EXISTS=false
fi

echo ""

# Step 2: Create table if needed
if [ "$TABLE_EXISTS" != "true" ]; then
    echo "🔨 Step 2: Creating DynamoDB table with all 18 governorates..."
    cd backend
    node create-regions-table.js
    cd ..
    echo "   ✅ Table created successfully"
else
    echo "✅ Step 2: Skipping table creation (already exists)"
fi

echo ""

# Step 3: Verify server is running
echo "🚀 Step 3: Checking local development server..."
if lsof -ti:3000 &>/dev/null; then
    echo "   ✅ Server is running on port 3000"
else
    echo "   ⚠️  Server is not running on port 3000"
    echo "   📝 Please start the server manually:"
    echo "      npm run local"
    echo ""
    read -p "   Press Enter after starting the server..."
fi

echo ""

# Step 4: Test API
echo "🧪 Step 4: Testing regions API..."
sleep 2
API_TEST=$(curl -s http://localhost:3000/api/regions | head -c 100)
if [ ! -z "$API_TEST" ]; then
    echo "   ✅ API is responding"
else
    echo "   ❌ API is not responding"
    echo "   Please check server logs"
    exit 1
fi

echo ""

# Step 5: Open regions toggle page in Safari
echo "🌐 Step 5: Opening Regions Management UI in Safari..."
sleep 1

open -a Safari "http://localhost:3000/pages/regions-toggle.html"

echo "   ✅ Safari launched"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                      ✅ SETUP COMPLETE!                            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "   • DynamoDB Table: WizzCentral_Regions"
echo "   • Governorates: All 18 Iraqi governorates loaded"
echo "   • Server: http://localhost:3000"
echo "   • UI: http://localhost:3000/pages/regions-toggle.html"
echo ""
echo "🎯 You can now:"
echo "   ✓ Toggle governorates active/inactive"
echo "   ✓ Add districts under each governorate"
echo "   ✓ Filter and search regions"
echo "   ✓ View real-time statistics"
echo ""
echo "📝 API Endpoints:"
echo "   GET    /api/regions              - List all regions"
echo "   POST   /api/regions              - Create new region"
echo "   PUT    /api/regions/:id          - Update region"
echo "   PATCH  /api/regions/:id/toggle   - Toggle active status"
echo "   DELETE /api/regions/:id          - Delete region"
echo ""
echo "🔧 Useful Commands:"
echo "   • View table: aws dynamodb scan --table-name WizzCentral_Regions"
echo "   • Test API: curl http://localhost:3000/api/regions"
echo "   • Server logs: Check terminal running 'npm run local'"
echo ""
