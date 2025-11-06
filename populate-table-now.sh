#!/bin/zsh

###############################################################################
# Populate DynamoDB Table with All 18 Iraqi Governorates
###############################################################################

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     Populating WizzCentral_Regions with All 18 Governorates      ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "🚀 Running table population script..."
echo ""

node create-regions-table.js --force-populate

echo ""
echo "✅ Done!"
echo ""
echo "🔍 To verify, run:"
echo "   ../check-dynamodb-data.sh"
echo ""
