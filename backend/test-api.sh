#!/bin/bash

# WizzCentral Backend API Test Script
# This script tests the deployed API endpoints

set -e  # Exit on any error

echo "🧪 WizzCentral Backend API Tests"
echo "================================="

# Check if API URL file exists
if [ ! -f "api-url.txt" ]; then
    echo "❌ api-url.txt not found. Please deploy the backend first."
    exit 1
fi

API_URL=$(cat api-url.txt)
echo "🌐 Testing API at: $API_URL"
echo ""

# Test 1: Health check (any endpoint)
echo "1. 🔍 Health Check..."
if curl -s -f "$API_URL/auth/login" -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    echo "   ✅ API Gateway is responding"
else
    echo "   ❌ API Gateway is not responding"
    exit 1
fi

# Test 2: User Registration
echo "2. 👤 Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/register_response.json \
    -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test User",
        "email": "test@example.com",
        "password": "TestPassword123!",
        "role": "admin"
    }')

if [ "$REGISTER_RESPONSE" = "201" ]; then
    echo "   ✅ User registration successful"
    TEST_EMAIL="test@example.com"
    TEST_PASSWORD="TestPassword123!"
elif [ "$REGISTER_RESPONSE" = "400" ]; then
    echo "   ⚠️  User may already exist, will try login with demo user"
    TEST_EMAIL="demo@wizz.com"
    TEST_PASSWORD="demo123"
else
    echo "   ❌ User registration failed with code: $REGISTER_RESPONSE"
    cat /tmp/register_response.json
    echo ""
    echo "   🔄 Trying with demo user instead..."
    TEST_EMAIL="demo@wizz.com"
    TEST_PASSWORD="demo123"
fi

# Test 3: User Login
echo "3. 🔐 Testing User Login..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
    -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

if [ "$LOGIN_RESPONSE" = "200" ]; then
    echo "   ✅ User login successful"
    ACCESS_TOKEN=$(jq -r '.tokens.accessToken' /tmp/login_response.json 2>/dev/null || echo "")
    if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
        echo "   ⚠️  No access token in response"
        ACCESS_TOKEN=""
    else
        echo "   ✅ Access token received"
    fi
else
    echo "   ❌ User login failed with code: $LOGIN_RESPONSE"
    cat /tmp/login_response.json
    echo ""
fi

# Test 4: Protected endpoint (if we have a token)
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo "4. 🛡️  Testing Protected Endpoint..."
    PROFILE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/profile_response.json \
        -X GET "$API_URL/users/profile" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if [ "$PROFILE_RESPONSE" = "200" ]; then
        echo "   ✅ Protected endpoint access successful"
    else
        echo "   ❌ Protected endpoint access failed with code: $PROFILE_RESPONSE"
        cat /tmp/profile_response.json
        echo ""
    fi
else
    echo "4. ⏭️  Skipping protected endpoint test (no access token)"
fi

# Test 5: Public endpoints
echo "5. 🌍 Testing Public Endpoints..."

# Test FAQ endpoint (public)
FAQ_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/faq_response.json \
    -X GET "$API_URL/support/faqs")

if [ "$FAQ_RESPONSE" = "200" ]; then
    echo "   ✅ FAQ endpoint responding"
else
    echo "   ⚠️  FAQ endpoint returned code: $FAQ_RESPONSE"
fi

# Test Knowledge Base endpoint (public)
KB_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/kb_response.json \
    -X GET "$API_URL/support/knowledge-base")

if [ "$KB_RESPONSE" = "200" ]; then
    echo "   ✅ Knowledge Base endpoint responding"
else
    echo "   ⚠️  Knowledge Base endpoint returned code: $KB_RESPONSE"
fi

echo ""
echo "📊 Test Summary:"
echo "   API Gateway: ✅"
echo "   Registration: $([ "$REGISTER_RESPONSE" = "201" ] && echo "✅" || echo "⚠️")"
echo "   Login: $([ "$LOGIN_RESPONSE" = "200" ] && echo "✅" || echo "❌")"
echo "   Protected Endpoints: $([ "$PROFILE_RESPONSE" = "200" ] && echo "✅" || echo "❌")"
echo "   Public Endpoints: $([ "$FAQ_RESPONSE" = "200" ] && echo "✅" || echo "⚠️")"

echo ""
echo "💡 Tips:"
echo "   - Check CloudWatch logs for detailed error information"
echo "   - Use 'serverless logs -f functionName' to view function logs"
echo "   - Verify Cognito User Pool configuration if auth fails"

# Cleanup temp files
rm -f /tmp/register_response.json /tmp/login_response.json /tmp/profile_response.json /tmp/faq_response.json /tmp/kb_response.json

echo ""
echo "🧪 API testing complete!"
