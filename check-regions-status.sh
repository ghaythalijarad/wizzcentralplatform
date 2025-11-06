#!/bin/bash

###############################################################################
# Quick Regions Status Check
# Verifies table exists and shows current regions count
###############################################################################

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "🔍 Checking WizzCentral_Regions table status..."
echo ""

# Check if table exists
if aws dynamodb describe-table --table-name WizzCentral_Regions &>/dev/null; then
    echo "✅ Table exists: WizzCentral_Regions"
    echo ""
    
    # Get item count
    echo "📊 Scanning for regions count..."
    RESULT=$(aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT")
    COUNT=$(echo $RESULT | jq -r '.Count')
    
    echo "   Total regions in table: $COUNT"
    echo ""
    
    # Show sample regions
    echo "📝 Sample regions (first 5):"
    aws dynamodb scan --table-name WizzCentral_Regions --max-items 5 | jq -r '.Items[] | "   • \(.name.S) (\(.name_ar.S)) - \(if .is_active.S == "true" then "🟢 ACTIVE" else "🔴 INACTIVE" end)"'
    echo ""
    
    # Check server
    echo "🚀 Checking local server..."
    if lsof -ti:3000 &>/dev/null; then
        echo "   ✅ Server is running on port 3000"
        
        # Test API
        echo ""
        echo "🧪 Testing API..."
        API_COUNT=$(curl -s http://localhost:3000/api/regions | jq '. | length')
        echo "   API returned $API_COUNT regions"
    else
        echo "   ⚠️  Server is NOT running on port 3000"
        echo "   Start with: npm run local"
    fi
    
else
    echo "❌ Table does NOT exist: WizzCentral_Regions"
    echo ""
    echo "💡 To create the table, run:"
    echo "   ./setup-complete-regions.sh"
fi

echo ""
