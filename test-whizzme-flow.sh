#!/bin/bash

# WhizzMe AI-First Flow Testing Script
# This script tests the complete WhizzMe integration

echo "🤖 WhizzMe AI-First Flow Test"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check Endpoint${NC}"
echo "GET http://localhost:3000/api/whizzme/health"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/whizzme/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ PASS: Health check successful${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ FAIL: Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Orders Category
echo -e "${BLUE}Test 2: Orders Category Query${NC}"
echo "POST http://localhost:3000/api/whizzme/chat"
echo "Message: 'How do I process a refund?'"
ORDERS_RESPONSE=$(curl -s -X POST http://localhost:3000/api/whizzme/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I process a refund?",
    "userType": "merchant",
    "sessionId": "test-orders-123",
    "metadata": {
      "category": "orders"
    }
  }')
if echo "$ORDERS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS: Orders query successful${NC}"
    echo "Suggestion: $(echo "$ORDERS_RESPONSE" | grep -o '"suggestion":"[^"]*"' | cut -d'"' -f4 | head -c 100)..."
else
    echo -e "${RED}❌ FAIL: Orders query failed${NC}"
    echo "Response: $ORDERS_RESPONSE"
fi
echo ""

# Test 3: Payments Category
echo -e "${BLUE}Test 3: Payments Category Query${NC}"
echo "Message: 'My payment is pending'"
PAYMENTS_RESPONSE=$(curl -s -X POST http://localhost:3000/api/whizzme/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My payment is pending",
    "userType": "merchant",
    "sessionId": "test-payments-456",
    "metadata": {
      "category": "payments"
    }
  }')
if echo "$PAYMENTS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS: Payments query successful${NC}"
    echo "Suggestion: $(echo "$PAYMENTS_RESPONSE" | grep -o '"suggestion":"[^"]*"' | cut -d'"' -f4 | head -c 100)..."
else
    echo -e "${RED}❌ FAIL: Payments query failed${NC}"
    echo "Response: $PAYMENTS_RESPONSE"
fi
echo ""

# Test 4: Account Category
echo -e "${BLUE}Test 4: Account Category Query${NC}"
echo "Message: 'How do I update my profile?'"
ACCOUNT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/whizzme/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I update my profile?",
    "userType": "merchant",
    "sessionId": "test-account-789",
    "metadata": {
      "category": "account"
    }
  }')
if echo "$ACCOUNT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS: Account query successful${NC}"
    echo "Suggestion: $(echo "$ACCOUNT_RESPONSE" | grep -o '"suggestion":"[^"]*"' | cut -d'"' -f4 | head -c 100)..."
else
    echo -e "${RED}❌ FAIL: Account query failed${NC}"
    echo "Response: $ACCOUNT_RESPONSE"
fi
echo ""

# Test 5: Business Setup Category
echo -e "${BLUE}Test 5: Business Setup Category Query${NC}"
echo "Message: 'How do I add my business hours?'"
SETUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/whizzme/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I add my business hours?",
    "userType": "merchant",
    "sessionId": "test-setup-101",
    "metadata": {
      "category": "business_setup"
    }
  }')
if echo "$SETUP_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS: Business setup query successful${NC}"
    echo "Suggestion: $(echo "$SETUP_RESPONSE" | grep -o '"suggestion":"[^"]*"' | cut -d'"' -f4 | head -c 100)..."
else
    echo -e "${RED}❌ FAIL: Business setup query failed${NC}"
    echo "Response: $SETUP_RESPONSE"
fi
echo ""

# Test 6: Technical Category
echo -e "${BLUE}Test 6: Technical Category Query${NC}"
echo "Message: 'The app keeps crashing'"
TECH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/whizzme/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "The app keeps crashing",
    "userType": "merchant",
    "sessionId": "test-tech-202",
    "metadata": {
      "category": "technical"
    }
  }')
if echo "$TECH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS: Technical query successful${NC}"
    echo "Suggestion: $(echo "$TECH_RESPONSE" | grep -o '"suggestion":"[^"]*"' | cut -d'"' -f4 | head -c 100)..."
else
    echo -e "${RED}❌ FAIL: Technical query failed${NC}"
    echo "Response: $TECH_RESPONSE"
fi
echo ""

# Test 7: Multiple Messages (Escalation Test)
echo -e "${BLUE}Test 7: Multiple Messages in One Session${NC}"
SESSION_ID="test-escalation-303"
for i in {1..5}; do
    echo "Message $i/5..."
    MULTI_RESPONSE=$(curl -s -X POST http://localhost:3000/api/whizzme/chat \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"I need help with order #$i\",
        \"userType\": \"merchant\",
        \"sessionId\": \"$SESSION_ID\",
        \"metadata\": {
          \"category\": \"orders\",
          \"messageCount\": $i
        }
      }")
    if echo "$MULTI_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}  ✅ Message $i successful${NC}"
    else
        echo -e "${RED}  ❌ Message $i failed${NC}"
    fi
done
echo ""

# Summary
echo "=============================="
echo -e "${BLUE}🎉 WhizzMe Test Summary${NC}"
echo "=============================="
echo "All tests completed. Review the results above."
echo ""
echo "Next steps:"
echo "1. Open WhizzMerchants app on simulator"
echo "2. Navigate to Support Chat"
echo "3. Select a category (e.g., 'Orders & Deliveries')"
echo "4. Verify blue WhizzMe UI appears (not red error screen)"
echo "5. Send messages and verify AI responses"
echo "6. Check that after 4 exchanges, smart escalation to human agent occurs"
echo ""
