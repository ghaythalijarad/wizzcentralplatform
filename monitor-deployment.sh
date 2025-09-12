#!/bin/bash

echo "🚀 Monitoring WizzCentral Platform Deployment..."
echo "URL: https://main.d2f5oacwil9cbi.amplifyapp.com"
echo ""

check_deployment() {
    local url="https://main.d2f5oacwil9cbi.amplifyapp.com"
    local response=$(curl -s -w "%{http_code}" "$url" -o /tmp/amplify_response.html)
    local http_code="${response: -3}"
    
    echo "HTTP Status: $http_code"
    
    if [ "$http_code" = "200" ]; then
        local content=$(cat /tmp/amplify_response.html)
        if echo "$content" | grep -q "WizzCentral Platform - Login"; then
            echo "✅ SUCCESS: Login page is serving correctly!"
            echo "🎉 Deployment complete and working!"
            return 0
        elif echo "$content" | grep -q "Redirecting"; then
            echo "⚠️  Still showing redirect page..."
            return 1
        else
            echo "❓ Unknown content being served"
            echo "First 200 chars:"
            echo "$content" | head -c 200
            return 1
        fi
    else
        echo "❌ HTTP $http_code - Site not accessible"
        return 1
    fi
}

echo "Checking current status..."
if check_deployment; then
    exit 0
fi

echo ""
echo "⏳ Waiting for deployment to complete..."
echo "Checking every 30 seconds..."

for i in {1..20}; do
    echo ""
    echo "Check #$i at $(date +%H:%M:%S)"
    if check_deployment; then
        exit 0
    fi
    echo "Waiting 30 seconds..."
    sleep 30
done

echo ""
echo "❌ Deployment check timeout after 10 minutes"
echo "Please check Amplify console manually: https://console.aws.amazon.com/amplify/home"
