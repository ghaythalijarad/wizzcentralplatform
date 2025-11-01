#!/bin/bash
# Test Login After Configuration Fix

echo "🧪 WizzCentral Login Test Script"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test credentials
EMAIL="g87_a@yahoo.com"
PASSWORD="Gha@551987"

echo -e "${YELLOW}📝 Test Credentials:${NC}"
echo "   Email: $EMAIL"
echo "   Password: ${PASSWORD//?/*}"
echo ""

echo -e "${YELLOW}🔧 Configuration Applied:${NC}"
echo "   User Pool: us-east-1_Cp9YnOQWi (wizzcentral)"
echo "   Client ID: 97sgkf07b6n8qeugfcsntbd8c"
echo ""

echo -e "${YELLOW}✅ Node.js Test (Backend):${NC}"
echo "   Running test-login.js..."
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node test-login.js > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Backend login SUCCESSFUL${NC}"
else
    echo -e "   ${RED}❌ Backend login FAILED${NC}"
fi
echo ""

echo -e "${YELLOW}🌐 Browser Test:${NC}"
echo "   1. Open: http://localhost:3000/index.html"
echo "   2. Clear browser cache (Cmd+Shift+R for hard reload)"
echo "   3. Try login with test credentials above"
echo ""
echo "   📊 Diagnostic Tool: http://localhost:3000/login-diagnostic.html"
echo ""

echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   • MUST clear browser cache - old config may be cached"
echo "   • Chrome: Cmd+Shift+Delete → Clear cache"
echo "   • Or: Hard Reload (Cmd+Shift+R)"
echo ""

echo -e "${YELLOW}🚀 Opening browser...${NC}"
sleep 1

# Open the login page
open "http://localhost:3000/index.html"

echo ""
echo -e "${GREEN}✅ Ready to test!${NC}"
echo ""
echo "If login fails, please:"
echo "  1. Open browser DevTools (F12 or Cmd+Option+I)"
echo "  2. Go to Console tab"
echo "  3. Try to login"
echo "  4. Share any error messages you see"
echo ""
echo "Or use the diagnostic tool for detailed error info:"
echo "  http://localhost:3000/login-diagnostic.html"
