#!/bin/zsh

# Check if WizzCentral_Regions DynamoDB table exists

export AWS_PAGER=""
export AWS_REGION=us-east-1
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "🔍 Checking DynamoDB Table Status..."
echo ""

# Check if table exists
TABLE_EXISTS=$(aws dynamodb list-tables --output json 2>/dev/null | jq -r '.TableNames[]' | grep -c "WizzCentral_Regions" || echo "0")

if [ "$TABLE_EXISTS" -eq "1" ]; then
    echo "✅ Table EXISTS: WizzCentral_Regions"
    echo ""
    
    # Get table status
    STATUS=$(aws dynamodb describe-table --table-name WizzCentral_Regions --query 'Table.TableStatus' --output text 2>/dev/null)
    echo "📊 Status: $STATUS"
    
    # Get item count
    COUNT=$(aws dynamodb scan --table-name WizzCentral_Regions --select "COUNT" --query 'Count' --output text 2>/dev/null)
    echo "📝 Total Items: $COUNT"
    
    if [ "$COUNT" -gt "0" ]; then
        echo ""
        echo "✅ Table has data!"
        echo ""
        echo "Sample regions:"
        aws dynamodb scan --table-name WizzCentral_Regions --max-items 5 --output json 2>/dev/null | jq -r '.Items[] | "  • \(.name.S) (\(.name_ar.S)) - \(.level.S) - Active: \(.is_active.S)"'
    else
        echo ""
        echo "⚠️  Table exists but is EMPTY"
        echo "   Run: cd backend && node create-regions-table.js"
    fi
else
    echo "❌ Table does NOT exist: WizzCentral_Regions"
    echo ""
    echo "📝 To create it, run:"
    echo "   cd backend"
    echo "   node create-regions-table.js"
fi

echo ""
