#!/bin/bash

###############################################################################
# COMPLETE THE DYNAMODB MIGRATION - Run This Now!
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║       🚀 Complete DynamoDB Migration for Regions Management       ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Step 1: Create DynamoDB Table
echo "Step 1 of 3: Creating DynamoDB Table with 18 Governorates..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
chmod +x execute-dynamodb-migration.sh
./execute-dynamodb-migration.sh

echo ""
echo ""

# Step 2: Restart Server
echo "Step 2 of 3: Restarting Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Please manually restart the server:"
echo ""
echo "   1. Stop the current 'Start Local Dev Server' task"
echo "   2. Start it again from Terminal → Run Task → 'Start Local Dev Server'"
echo ""
echo "   OR run this command:"
echo "   lsof -ti:3000 | xargs kill -9 && npm run local"
echo ""
read -p "Press Enter after restarting the server..."

echo ""
echo ""

# Step 3: Open UI
echo "Step 3 of 3: Opening Regions Toggle UI..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
open -a Safari "http://localhost:3000/pages/regions-toggle.html"

echo ""
echo "✅ Safari opened with regions toggle UI"
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ MIGRATION COMPLETE!                         ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 You can now:"
echo "   • Toggle any of the 18 governorates active/inactive"
echo "   • Add new districts under governorates"
echo "   • Filter and search regions"
echo "   • View real-time statistics"
echo ""
echo "📝 Full guide: DYNAMODB_MIGRATION_COMPLETED.md"
echo ""
