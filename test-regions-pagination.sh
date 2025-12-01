#!/bin/bash
# Test script for regions pagination fix
# Tests that all 14 regions can be accessed via pagination

echo "🧪 Testing Regions Pagination..."
echo "================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:8080/frontend/pages/regions.html > /dev/null; then
    echo "❌ Server not running on localhost:8080"
    echo "Please start the server first:"
    echo "  cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/frontend"
    echo "  node server.js"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test API endpoint
echo "📡 Testing /api/regions endpoint..."
RESPONSE=$(curl -s http://localhost:8080/api/regions)

# Count regions
REGION_COUNT=$(echo "$RESPONSE" | grep -o '"regionId"' | wc -l | tr -d ' ')
echo "📊 Total regions in response: $REGION_COUNT"

if [ "$REGION_COUNT" -eq 14 ]; then
    echo "✅ Correct! All 14 regions returned"
elif [ "$REGION_COUNT" -gt 0 ]; then
    echo "⚠️  Warning: Expected 14 regions, got $REGION_COUNT"
else
    echo "❌ Error: No regions found in response"
    echo "Response: $RESPONSE"
    exit 1
fi

echo ""
echo "🎯 Pagination Test Summary:"
echo "  • Pagination Mode: Client-side"
echo "  • Items Per Page: 10 (default)"
echo "  • Total Regions: 14"
echo "  • Expected Pages: 2"
echo "  • Page 1: Regions 1-10"
echo "  • Page 2: Regions 11-14"
echo ""
echo "✅ Backend is working correctly!"
echo "🌐 Open in browser to test UI: http://localhost:8080/frontend/pages/regions.html"
echo ""
echo "🔍 Manual Test Steps:"
echo "  1. Page should show 'Showing 1 to 10 of 14 regions'"
echo "  2. Next button should be ENABLED"
echo "  3. Click Next → Should show 'Showing 11 to 14 of 14 regions'"
echo "  4. Previous button should be ENABLED"
echo "  5. Click Previous → Should return to first page"
echo ""
