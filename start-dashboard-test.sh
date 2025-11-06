#!/bin/bash
# Quick Dashboard Testing Script
# Run this to start testing the dashboard

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     🧪 DASHBOARD TESTING - QUICK START 🧪                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Kill any existing server
echo "📡 Step 1: Stopping any existing server on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1
echo "   ✅ Port 8000 cleared"
echo ""

# Step 2: Start server
echo "🚀 Step 2: Starting local server..."
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
python3 -m http.server 8000 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2
echo "   ✅ Server started (PID: $SERVER_PID)"
echo ""

# Step 3: Verify server is running
echo "✅ Step 3: Verifying server..."
if lsof -i:8000 > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 8000"
else
    echo "   ❌ Server failed to start!"
    exit 1
fi
echo ""

# Step 4: Open dashboard
echo "🌐 Step 4: Opening dashboard..."
echo "   📍 URL: http://localhost:8000/pages/dashboard.html"
open "http://localhost:8000/pages/dashboard.html"
sleep 2
echo "   ✅ Dashboard opened in browser"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🔍 NOW CHECK THESE THINGS 🔍                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Open Browser DevTools:"
echo "   • Press Cmd+Option+I (Mac) or F12 (Windows)"
echo "   • Click on 'Console' tab"
echo ""
echo "2️⃣  Look for this message in console:"
echo "   ═══════════════════════════════════════════════════"
echo "   🔢 loadDashboardStats() FUNCTION CALLED"
echo "   🔢 window.dataService exists: true"
echo "   🔢 AWS object exists: true"
echo "   ═══════════════════════════════════════════════════"
echo ""
echo "3️⃣  Look for these SUCCESS messages:"
echo "   ✅ AWS dataService initialized"
echo "   ✅ Merchants: 3 (from WhizzMerchants_Businesses)"
echo "   ✅ Drivers: 3 (from WhizzDrivers_dev)"
echo "   ✅ Active Promotions: 5 (from WhizzMerchants_Discounts)"
echo "   ✅ Dashboard stats loaded from REAL AWS data"
echo ""
echo "4️⃣  Check dashboard displays these numbers:"
echo "   • Merchants: 3"
echo "   • Drivers: 3"
echo "   • Promotions: 5"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "❓ WHAT TO DO NEXT:"
echo ""
echo "✅ IF YOU SEE THE SUCCESS MESSAGES:"
echo "   Dashboard is working! Take a screenshot and celebrate! 🎉"
echo ""
echo "❌ IF YOU SEE ERRORS:"
echo "   1. Copy ALL console messages"
echo "   2. Take screenshot of console"
echo "   3. Share with me to debug"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Server PID: $SERVER_PID"
echo "To stop server: kill $SERVER_PID"
echo ""
