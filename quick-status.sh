#!/bin/bash
# Quick status check for regions management

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

export AWS_PAGER=""
export AWS_REGION=us-east-1  
export AWS_PROFILE=wizz-drivers-ghayth-dev

echo "======================================"
echo "Regions Management Status"
echo "======================================"
echo ""

# 1. Check server
echo "1. Server Status:"
if lsof -ti:3000 &>/dev/null; then
    echo "   ✅ Running on port 3000"
else
    echo "   ❌ NOT running"
fi
echo ""

# 2. Check DynamoDB table
echo "2. DynamoDB Table:"
aws dynamodb describe-table --table-name WizzCentral_Regions --output json 2>&1 | grep -q "TableStatus" && echo "   ✅ WizzCentral_Regions exists" || echo "   ❌ Table not found"
echo ""

# 3. Test API
echo "3. API Test:"
curl -s http://localhost:3000/api/regions > /tmp/regions_test.json 2>&1
if [ $? -eq 0 ]; then
    COUNT=$(jq '. | length' /tmp/regions_test.json 2>/dev/null || echo "0")
    echo "   ✅ API responding ($COUNT regions)"
else
    echo "   ❌ API not responding"
fi
echo ""

echo "======================================"
echo "Next Steps:"
echo "======================================"
echo ""
echo "📋 To setup everything:"
echo "   bash setup-complete-regions.sh"
echo ""
echo "🌐 Open UI in Safari:"
echo "   open -a Safari http://localhost:3000/pages/regions-toggle.html"
echo ""
