#!/bin/bash

# End-to-End Merchant Chat Test Script
# This script will monitor Lambda logs while you test

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🧪 MERCHANT CHAT END-TO-END TEST                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Test Steps:"
echo "1. ✅ Lambda deployment verified"
echo "2. 🔍 Monitoring Lambda logs (this terminal)"
echo "3. 📱 Open WhizzMerchants app → Profile → About App → Chat Support"
echo "4. 💬 Send message: 'Hello from merchant!'"
echo "5. 💻 Check support dashboard at http://localhost:3000/pages/support.html"
echo "6. 📤 Reply from dashboard"
echo ""
echo "🔍 Watching for:"
echo "   🏪 Merchant connections"
echo "   💬 Chat messages"
echo "   📤 Agent replies"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Monitor logs
aws logs tail /aws/lambda/wizzcentral-websocket-dev-liveChatConnect \
  --follow \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --format short
