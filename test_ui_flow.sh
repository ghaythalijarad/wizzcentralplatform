#!/bin/bash
# UI Test Verification Script

echo "🧪 WizzCentral Notification UI Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check server
echo -e "${BLUE}Step 1: Checking server status...${NC}"
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on port 3000${NC}"
else
    echo -e "${RED}❌ Server is NOT running!${NC}"
    echo "Start it with: cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform && node local-dev-server.js"
    exit 1
fi

# Step 2: Check AWS SSO
echo ""
echo -e "${BLUE}Step 2: Checking AWS SSO session...${NC}"
if aws sts get-caller-identity --profile wizz-drivers-ghayth-dev > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AWS SSO session is active${NC}"
else
    echo -e "${YELLOW}⚠️  AWS SSO session expired${NC}"
    echo "Refresh with: aws sso login --profile wizz-drivers-ghayth-dev"
    read -p "Press Enter to continue anyway or Ctrl+C to cancel..."
fi

# Step 3: Check DynamoDB tokens
echo ""
echo -e "${BLUE}Step 3: Checking FCM tokens in DynamoDB...${NC}"
TOKEN_COUNT=$(aws dynamodb scan \
    --table-name WhizzMerchants_DeviceTokens \
    --profile wizz-drivers-ghayth-dev \
    --select COUNT \
    --output text 2>/dev/null | awk '{print $2}')

if [ -n "$TOKEN_COUNT" ] && [ "$TOKEN_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $TOKEN_COUNT FCM token(s) in DynamoDB${NC}"
else
    echo -e "${YELLOW}⚠️  No FCM tokens found${NC}"
fi

# Step 4: Check merchant count
echo ""
echo -e "${BLUE}Step 4: Checking merchant count...${NC}"
MERCHANT_COUNT=$(aws dynamodb scan \
    --table-name WhizzMerchants_Businesses \
    --profile wizz-drivers-ghayth-dev \
    --select COUNT \
    --output text 2>/dev/null | awk '{print $2}')

if [ -n "$MERCHANT_COUNT" ] && [ "$MERCHANT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $MERCHANT_COUNT merchant(s) in DynamoDB${NC}"
else
    echo -e "${YELLOW}⚠️  No merchants found${NC}"
fi

# Step 5: Test backend API
echo ""
echo -e "${BLUE}Step 5: Testing backend notification API...${NC}"
echo "This will send a test notification from the backend..."

# Check if test script exists
if [ ! -f "test_backend_notification.js" ]; then
    echo -e "${RED}❌ test_backend_notification.js not found${NC}"
else
    node test_backend_notification.js 2>&1 | grep -q "Sent: 1"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend API test successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend API test had issues (check output above)${NC}"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo -e "${BLUE}📋 Test Summary${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Server Status:${NC} Running on http://localhost:3000"
echo -e "${GREEN}✅ Test Page:${NC} http://localhost:3000/pages/promotions.html"
echo ""
echo -e "${YELLOW}🧪 Manual UI Test Instructions:${NC}"
echo "1. Open: http://localhost:3000/pages/promotions.html"
echo "2. Login with your WizzCentral admin credentials"
echo "3. Click the '📣 Send to Merchants' button"
echo "4. Fill the form:"
echo "   - Type: Information"
echo "   - Title: UI Test from Browser"
echo "   - Body: Testing the complete notification flow"
echo "   - Target: All Merchants"
echo "   - Priority: Normal"
echo "5. Click 'Send Notification'"
echo "6. Check for success alert"
echo "7. Check iPhone for notification"
echo ""
echo -e "${GREEN}Expected Result:${NC}"
echo "  - Targeted: $MERCHANT_COUNT merchants"
echo "  - Sent: $TOKEN_COUNT notification(s)"
echo "  - Failed: 0"
echo ""
echo -e "${BLUE}📱 iPhone Setup:${NC}"
echo "  - WhizzMerchants app should be running in background"
echo "  - Device should have internet connection"
echo "  - Push notifications should be enabled"
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Ready to test!${NC}"
echo "=========================================="
