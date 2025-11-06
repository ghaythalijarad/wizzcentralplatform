#!/bin/zsh

# Quick check of DynamoDB table data

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "🔍 Checking WizzCentral_Regions table data..."
echo ""

# Get item count
echo "📊 Counting items..."
COUNT=$(aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT" --query 'Count' --output text 2>/dev/null)
echo "Total items in table: $COUNT"
echo ""

if [ "$COUNT" -gt "0" ]; then
    echo "✅ Table has data!"
    echo ""
    echo "📝 First 10 regions:"
    aws dynamodb scan --table-name WizzCentral_Regions --max-items 10 --output json 2>/dev/null | \
        jq -r '.Items[] | "  \(if .level.S == "country" then "🌍" elif .level.S == "governorate" then "🏛️" else "📍" end) \(.name.S) (\(.name_ar.S)) - \(.level.S) - Active: \(.is_active.S)"'
    
    echo ""
    echo "📊 Breakdown:"
    COUNTRY_COUNT=$(aws dynamodb query --table-name WizzCentral_Regions --index-name LevelIndex --key-condition-expression "level = :level" --expression-attribute-values '{":level":{"S":"country"}}' --select "COUNT" --query 'Count' --output text 2>/dev/null)
    GOV_COUNT=$(aws dynamodb query --table-name WizzCentral_Regions --index-name LevelIndex --key-condition-expression "level = :level" --expression-attribute-values '{":level":{"S":"governorate"}}' --select "COUNT" --query 'Count' --output text 2>/dev/null)
    DIST_COUNT=$(aws dynamodb query --table-name WizzCentral_Regions --index-name LevelIndex --key-condition-expression "level = :level" --expression-attribute-values '{":level":{"S":"district"}}' --select "COUNT" --query 'Count' --output text 2>/dev/null)
    
    echo "  🌍 Country: $COUNTRY_COUNT"
    echo "  🏛️  Governorates: $GOV_COUNT"
    echo "  📍 Districts: $DIST_COUNT"
else
    echo "❌ Table is EMPTY!"
    echo ""
    echo "The table exists but has no data. The create script might have failed to insert data."
    echo ""
    echo "💡 Try running the insert manually:"
    echo "   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend"
    echo "   node create-regions-table.js"
fi

echo ""
