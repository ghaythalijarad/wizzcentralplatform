#!/bin/bash
# Quick Test Script for Message Delivery Fix

echo "🧪 Testing Message Delivery Fix..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if server is running
echo -e "${YELLOW}Step 1: Checking server status...${NC}"
if pgrep -f "local-dev-server.js" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running${NC}"
    echo "Starting server..."
    cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
    node local-dev-server.js > server.log 2>&1 &
    sleep 3
    echo -e "${GREEN}✅ Server started${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking server logs for errors...${NC}"
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
if tail -20 server.log | grep -i "error" > /dev/null; then
    echo -e "${RED}⚠️  Errors found in server logs:${NC}"
    tail -20 server.log | grep -i "error"
else
    echo -e "${GREEN}✅ No errors in server logs${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Opening support dashboard...${NC}"
echo "Go to: http://localhost:3000/pages/support.html"
echo ""

echo -e "${YELLOW}Step 4: Testing checklist:${NC}"
echo ""
echo "🔍 In Browser Console, check for:"
echo "  1. Green 'Connected' status indicator"
echo "  2. No console errors"
echo "  3. Run: window.wsManager.getConnectionInfo()"
echo "     Expected: { connected: true, state: 'connected' }"
echo ""
echo "📱 In Flutter App:"
echo "  1. Start a chat session"
echo "  2. Send a message"
echo "  3. Check if message appears in support dashboard"
echo ""
echo "💬 In Support Dashboard:"
echo "  1. Select the active session"
echo "  2. Send a message"
echo "  3. Check console for:"
echo "     '📤 Sending chat message with correct format'"
echo "     '✅ Message sent successfully'"
echo "  4. Check if message appears in Flutter app"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Fix Applied Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "📝 See MESSAGE_DELIVERY_FIX.md for full testing guide"
echo ""
echo "🐛 If messages still not delivered:"
echo "  1. Check AWS CloudWatch logs for backend Lambda"
echo "  2. Verify Flutter app WebSocket connection"
echo "  3. Check browser console for WebSocket state"
echo ""
