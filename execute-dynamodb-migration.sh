#!/bin/bash

###############################################################################
# Complete DynamoDB Migration for Regions Management
# This script:
# 1. Creates DynamoDB table with all 18 Iraqi governorates
# 2. Tests the table
# 3. Provides next steps
###############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     WhizzCentral - Full DynamoDB Migration for Regions           ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Set AWS environment
export AWS_PAGER=""
export AWS_REGION="us-east-1"
export AWS_PROFILE="wizz-drivers-ghayth-dev"

BASE_DIR="/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform"
cd "$BASE_DIR"

echo "📍 Working directory: $(pwd)"
echo "🔧 AWS Region: $AWS_REGION"
echo "👤 AWS Profile: $AWS_PROFILE"
echo ""

# Step 1: Create DynamoDB Table
echo "═══════════════════════════════════════════════════════════════════"
echo "Step 1: Creating DynamoDB Table"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

cd backend
node create-regions-table.js
cd ..

echo ""
echo "✅ DynamoDB table creation complete"
echo ""

# Step 2: Verify table
echo "═══════════════════════════════════════════════════════════════════"
echo "Step 2: Verifying Table"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

TABLE_STATUS=$(aws dynamodb describe-table --table-name WizzCentral_Regions --query 'Table.TableStatus' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$TABLE_STATUS" = "ACTIVE" ]; then
    echo "✅ Table is ACTIVE"
    
    # Get item count
    ITEM_COUNT=$(aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT" --query 'Count' --output text 2>/dev/null || echo "0")
    echo "📊 Total regions in table: $ITEM_COUNT"
    
    # Show sample regions
    echo ""
    echo "📝 Sample regions (first 5):"
    aws dynamodb scan \
        --table-name WizzCentral_Regions \
        --max-items 5 \
        --output json 2>/dev/null | \
        jq -r '.Items[] | "   • \(.name.S) (\(.name_ar.S)) - Level: \(.level.S) - Active: \(.is_active.S)"' || echo "   (Could not retrieve sample data)"
    
else
    echo "❌ Table status: $TABLE_STATUS"
    echo "   Please check the error messages above"
    exit 1
fi

echo ""

# Step 3: Next Steps
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ MIGRATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📊 What was created:"
echo "   • DynamoDB Table: WizzCentral_Regions"
echo "   • All 18 Iraqi Governorates"
echo "   • Sample districts under major cities"
echo "   • 3 Global Secondary Indexes (LevelIndex, ParentIndex, ActiveIndex)"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1️⃣  Restart the local development server:"
echo "    • Stop current server (if running)"
echo "    • The server will now use DynamoDB instead of file-based storage"
echo ""
echo "2️⃣  Open the Regions Toggle UI:"
echo "    http://localhost:3000/pages/regions-toggle.html"
echo ""
echo "3️⃣  Test the toggle functionality:"
echo "    • Toggle governorates active/inactive"
echo "    • Add new districts"
echo "    • Filter and search regions"
echo ""
echo "📝 API Endpoints (DynamoDB-backed):"
echo "   GET    /api/regions              - List all regions"
echo "   POST   /api/regions              - Create new region"
echo "   PUT    /api/regions/:id          - Update region"
echo "   PATCH  /api/regions/:id/toggle   - Toggle active status ⭐"
echo "   DELETE /api/regions/:id          - Delete region"
echo ""
echo "🔍 Verify data:"
echo "   aws dynamodb scan --table-name WizzCentral_Regions"
echo ""
echo "✅ DynamoDB migration is complete and ready to use!"
echo ""
