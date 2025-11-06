#!/bin/bash
# Dashboard Real Data Testing Script
# This script helps verify that dashboard is loading REAL data from DynamoDB

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🧪 DASHBOARD REAL DATA TESTING - STEP BY STEP 🧪          ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "📡 Step 1: Checking local server..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 8000"
else
    echo "   ❌ Server is NOT running!"
    echo "   Starting server now..."
    cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
    python3 -m http.server 8000 > /dev/null 2>&1 &
    sleep 2
    echo "   ✅ Server started on port 8000"
fi
echo ""

# Check AWS credentials
echo "📋 Step 2: Verifying AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "   ✅ AWS credentials are valid"
    aws sts get-caller-identity --query 'Account' --output text | xargs -I {} echo "   📌 Account: {}"
else
    echo "   ❌ AWS credentials NOT configured!"
    echo "   Please run: aws configure"
    exit 1
fi
echo ""

# Check DynamoDB tables
echo "📊 Step 3: Checking DynamoDB tables..."

echo "   🔍 Checking WizzOrders table..."
ORDERS_COUNT=$(aws dynamodb scan --table-name WizzOrders --select COUNT --query 'Count' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "      ✅ WizzOrders: $ORDERS_COUNT orders"
else
    echo "      ⚠️  WizzOrders: Access denied or table doesn't exist"
fi

echo "   🔍 Checking WhizzMerchants_Businesses table..."
MERCHANTS_COUNT=$(aws dynamodb scan --table-name WhizzMerchants_Businesses --select COUNT --query 'Count' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "      ✅ WhizzMerchants_Businesses: $MERCHANTS_COUNT merchants"
else
    echo "      ⚠️  WhizzMerchants_Businesses: Access denied or table doesn't exist"
fi

echo "   🔍 Checking WhizzDrivers_dev table..."
DRIVERS_COUNT=$(aws dynamodb scan --table-name WhizzDrivers_dev --select COUNT --query 'Count' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "      ✅ WhizzDrivers_dev: $DRIVERS_COUNT drivers"
else
    echo "      ⚠️  WhizzDrivers_dev: Access denied or table doesn't exist"
fi

echo "   🔍 Checking WhizzMerchants_Discounts table..."
DISCOUNTS_COUNT=$(aws dynamodb scan --table-name WhizzMerchants_Discounts --select COUNT --query 'Count' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "      ✅ WhizzMerchants_Discounts: $DISCOUNTS_COUNT discounts"
else
    echo "      ⚠️  WhizzMerchants_Discounts: Access denied or table doesn't exist"
fi

echo "   🔍 Checking WizzUser_users_dev table..."
USERS_COUNT=$(aws dynamodb scan --table-name WizzUser_users_dev --select COUNT --query 'Count' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "      ✅ WizzUser_users_dev: $USERS_COUNT users"
else
    echo "      ⚠️  WizzUser_users_dev: Access denied or table doesn't exist"
fi
echo ""

# Show expected dashboard values
echo "📈 Step 4: Expected Dashboard Statistics:"
echo "┌────────────────────────────────────────────────────────────┐"
echo "│  Total Customers:      $USERS_COUNT                        "
echo "│  Active Merchants:     $MERCHANTS_COUNT                    "
echo "│  Online Drivers:       $DRIVERS_COUNT                      "
echo "│  Orders Today:         [Check if order is from today]      "
echo "│  Revenue Today:        [Sum of today's orders]             "
echo "│  Support Tickets:      0 (no table yet)                    "
echo "│  Active Promotions:    $DISCOUNTS_COUNT                    "
echo "└────────────────────────────────────────────────────────────┘"
echo ""

# Check if mock API files are present (they should NOT be loaded)
echo "🔍 Step 5: Verifying mock API files are NOT loaded..."
if grep -q "orders-api.js\|campaigns-api.js\|merchant-discounts-api.js" frontend/pages/dashboard.html 2>/dev/null; then
    echo "   ❌ WARNING: Mock API files still referenced in dashboard.html!"
    echo "   This should have been fixed!"
else
    echo "   ✅ Mock API files NOT loaded (correct!)"
fi
echo ""

# Open dashboard in browser
echo "🌐 Step 6: Opening dashboard in browser..."
echo "   📍 URL: http://localhost:8000/pages/dashboard.html"
echo ""
echo "   Opening in your default browser..."
open "http://localhost:8000/pages/dashboard.html"
sleep 2
echo "   ✅ Dashboard opened"
echo ""

# Instructions for manual verification
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🔍 MANUAL VERIFICATION STEPS 🔍                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Open Browser DevTools:"
echo "   • Press F12 (or Cmd+Option+I on Mac)"
echo "   • Click on 'Console' tab"
echo ""
echo "2️⃣  Look for these SUCCESS messages in console:"
echo "   ✅ \"AWS dataService initialized\""
echo "   ✅ \"Scanning DynamoDB tables for real data...\""
echo "   ✅ \"Merchants: $MERCHANTS_COUNT (from WhizzMerchants_Businesses)\""
echo "   ✅ \"Drivers: $DRIVERS_COUNT (from WhizzDrivers_dev)\""
echo "   ✅ \"Active Promotions: $DISCOUNTS_COUNT (from WhizzMerchants_Discounts)\""
echo "   ✅ \"Dashboard stats loaded from REAL AWS data\""
echo ""
echo "3️⃣  Verify dashboard displays:"
echo "   • Merchants = $MERCHANTS_COUNT (NOT 1!)"
echo "   • Drivers = $DRIVERS_COUNT (NOT 1!)"
echo "   • Promotions = $DISCOUNTS_COUNT (NOT 8!)"
echo ""
echo "4️⃣  Check Data Source Indicator:"
echo "   • Should show: \"Live Data\" with green/blue background"
echo "   • Text: \"Displaying real-time data from AWS DynamoDB\""
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "❌ If you see ERRORS in console:"
echo "   • \"AccessDenied\" → IAM permissions issue"
echo "   • \"Token expired\" → Login again to dashboard"
echo "   • \"dataService not available\" → Check script loading order"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎯 SUCCESS CRITERIA:"
echo "   ✅ Console shows \"REAL AWS data\" message"
echo "   ✅ Merchants count = $MERCHANTS_COUNT"
echo "   ✅ Drivers count = $DRIVERS_COUNT"
echo "   ✅ Promotions count = $DISCOUNTS_COUNT"
echo "   ✅ No mock data references in console"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Press Enter when you've verified the console logs..."
read

echo ""
echo "📸 Would you like to see sample data from the tables? (y/n)"
read SHOW_SAMPLE

if [ "$SHOW_SAMPLE" = "y" ] || [ "$SHOW_SAMPLE" = "Y" ]; then
    echo ""
    echo "📦 Sample Order Data:"
    aws dynamodb scan --table-name WizzOrders --limit 1 2>/dev/null | head -20
    echo ""
    echo "🏪 Sample Merchant Data:"
    aws dynamodb scan --table-name WhizzMerchants_Businesses --limit 1 2>/dev/null | head -20
    echo ""
    echo "🏍️  Sample Driver Data:"
    aws dynamodb scan --table-name WhizzDrivers_dev --limit 1 2>/dev/null | head -20
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              ✅ TESTING COMPLETE! ✅                           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "If everything looks good, the dashboard is working with REAL data!"
echo ""
