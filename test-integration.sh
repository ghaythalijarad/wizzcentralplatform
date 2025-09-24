#!/bin/bash

echo "🧪 Testing WizzCentral Dashboard Integration"
echo "=========================================="

echo ""
echo "1. Testing demo endpoint..."
DEMO_RESPONSE=$(curl -s http://localhost:3000/dashboard/stats/demo)
echo "Demo endpoint response:"
echo "$DEMO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DEMO_RESPONSE"

echo ""
echo "2. Checking customer count in demo data..."
CUSTOMERS_COUNT=$(echo "$DEMO_RESPONSE" | grep -o '"customersCount":[0-9]*' | grep -o '[0-9]*')
echo "Customers count: $CUSTOMERS_COUNT"

echo ""
echo "3. Testing dashboard HTML..."
HTML_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/frontend/pages/dashboard.html)
echo "Dashboard HTML status: $HTML_STATUS"

echo ""
echo "4. Testing dashboard JavaScript..."
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/frontend/dashboard.js)
echo "Dashboard JS status: $JS_STATUS"

echo ""
echo "5. Checking for required elements..."
curl -s http://localhost:3000/frontend/pages/dashboard.html > /tmp/dashboard.html
HAS_CUSTOMER_COUNT=$(grep -c "customersCount" /tmp/dashboard.html)
HAS_DATA_SOURCE=$(grep -c "dataSourceIndicator" /tmp/dashboard.html)

echo "Has customersCount element: $([ $HAS_CUSTOMER_COUNT -gt 0 ] && echo '✅ Yes' || echo '❌ No')"
echo "Has dataSourceIndicator element: $([ $HAS_DATA_SOURCE -gt 0 ] && echo '✅ Yes' || echo '❌ No')"

echo ""
echo "📊 SUMMARY:"
echo "=========="
if [ "$CUSTOMERS_COUNT" = "3" ] && [ "$HTML_STATUS" = "200" ] && [ "$JS_STATUS" = "200" ] && [ $HAS_CUSTOMER_COUNT -gt 0 ]; then
    echo "🎉 SUCCESS: Dashboard integration is working!"
    echo "   - Demo endpoint returns 3 customers ✅"
    echo "   - Dashboard HTML loads properly ✅"
    echo "   - Dashboard JS loads properly ✅"
    echo "   - Required elements are present ✅"
    echo ""
    echo "💡 The dashboard should now display '3' for total customers"
    echo "   when AWS credentials are unavailable, falling back to demo data."
else
    echo "❌ ISSUES DETECTED:"
    [ "$CUSTOMERS_COUNT" != "3" ] && echo "   - Customer count not 3: $CUSTOMERS_COUNT"
    [ "$HTML_STATUS" != "200" ] && echo "   - HTML not loading: $HTML_STATUS"
    [ "$JS_STATUS" != "200" ] && echo "   - JavaScript not loading: $JS_STATUS"
    [ $HAS_CUSTOMER_COUNT -eq 0 ] && echo "   - Missing customersCount element"
fi

rm -f /tmp/dashboard.html
