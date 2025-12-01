#!/bin/zsh
# Quick Test Script for Bulk Upload Feature
# Bypasses authentication issues for local testing

echo "🚀 WizzCentral Bulk Upload - Quick Test Setup"
echo "=============================================="
echo ""

# Step 1: Check if server is running
echo "📡 Step 1: Checking server status..."
SERVER_STATUS=$(curl -s http://localhost:3000/health 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✅ Server is running on http://localhost:3000"
else
    echo "❌ Server is not running. Please start it with:"
    echo "   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform"
    echo "   node local-dev-server.js"
    exit 1
fi

echo ""
echo "📝 Step 2: Opening merchants page in Chrome..."
echo ""

# Open Chrome with a specific URL that will auto-enable debug mode
open -na "Google Chrome" --args --new-window "http://localhost:3000/pages/merchants.html"

sleep 2

echo ""
echo "🎯 INSTRUCTIONS TO TEST BULK UPLOAD:"
echo "===================================="
echo ""
echo "1. In the Chrome window that just opened, press Cmd+Option+J to open DevTools"
echo ""
echo "2. In the Console tab, paste this command and press Enter:"
echo ""
echo "   sessionStorage.setItem('debugMode', 'true'); location.reload();"
echo ""
echo "3. The page will reload. You should see merchants listed."
echo ""
echo "4. Click on any merchant to view their products"
echo ""
echo "5. Click the 'Bulk Upload Products' button"
echo ""
echo "6. Upload this test file:"
echo "   /Users/ghaythallaheebi/WhizzEcoSystem/test-bulk-upload.csv"
echo ""
echo "7. Watch the progress and verify results!"
echo ""
echo "📊 Expected Results:"
echo "   First upload:  10 created, 0 updated, 0 skipped"
echo "   Second upload: 0 created, 0 updated, 10 skipped (duplicates detected!)"
echo ""
echo "✅ Debug mode bypasses authentication for local testing"
echo ""
