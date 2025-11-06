#!/bin/zsh

###############################################################################
# FINAL STEP: Complete DynamoDB Migration
# 1. Populate table with data
# 2. Verify data exists  
# 3. Restart server
# 4. Test API
# 5. Open UI
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║           🚀 FINAL DYNAMODB MIGRATION - ALL STEPS                 ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

# Step 1: Populate table
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/5: Populating DynamoDB table with 18 governorates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend
node create-regions-table.js --force-populate
cd ..

echo ""
echo "✅ Data population complete"
echo ""

# Step 2: Verify data
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/5: Verifying data in DynamoDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

COUNT=$(aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT" --query 'Count' --output text 2>/dev/null)
echo "📊 Total regions in DynamoDB: $COUNT"

if [ "$COUNT" -lt "18" ]; then
    echo "⚠️  Warning: Expected at least 18 regions (governorates)"
    echo "   You may need to run the populate script again"
else
    echo "✅ Data verified!"
fi

echo ""

# Step 3: Restart server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/5: Restarting server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⚠️  Please MANUALLY restart the server:"
echo ""
echo "   1. Go to VS Code"
echo "   2. Terminal → Tasks → Terminate 'Start Local Dev Server'"
echo "   3. Terminal → Run Task → 'Start Local Dev Server'"
echo ""
echo "   OR run this command in a new terminal:"
echo "   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform"
echo "   npm run local"
echo ""

read -p "Press Enter AFTER restarting the server..."

echo ""

# Step 4: Test API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4/5: Testing API with DynamoDB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 2  # Give server time to start

API_COUNT=$(curl -s http://localhost:3000/api/regions 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
echo "📊 API returned: $API_COUNT regions"

if [ "$API_COUNT" -ge "$COUNT" ]; then
    echo "✅ API is working with DynamoDB!"
else
    echo "⚠️  API count ($API_COUNT) doesn't match DynamoDB count ($COUNT)"
    echo "   Server may still be using old file-based code"
    echo "   Make sure you restarted the server!"
fi

echo ""

# Step 5: Open UI
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5/5: Opening Regions Toggle UI in Safari"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 1
open -a Safari "http://localhost:3000/pages/regions-toggle.html"

echo "✅ Safari opened!"
echo ""

# Final summary
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                 ✅ MIGRATION COMPLETE!                             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "   • DynamoDB regions: $COUNT"
echo "   • API regions: $API_COUNT"
echo "   • UI: http://localhost:3000/pages/regions-toggle.html"
echo ""
echo "🎯 You can now:"
echo "   ✅ Toggle any of the 18 governorates active/inactive"
echo "   ✅ Add new districts"
echo "   ✅ Filter regions (All, Gov, Districts, Active, Inactive)"
echo "   ✅ View real-time statistics"
echo ""
echo "📝 Troubleshooting:"
echo "   • If toggle doesn't work: Check browser console for errors"
echo "   • If wrong region count: Server may need another restart"
echo "   • View server logs for any errors"
echo ""
