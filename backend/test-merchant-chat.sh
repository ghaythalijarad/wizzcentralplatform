#!/bin/zsh

echo "\n╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Merchant Chat - Testing Guide                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝\n"

echo "The routing fix has been applied! 🎉\n"

echo "📊 Current Status:"
echo "  ✅ Route 'chat_merchant_connect' fixed"
echo "  ✅ Now points to: WizzUser-WebSocketDefault-dev"
echo "  ✅ API Gateway deployed\n"

echo "🧪 Test Steps:\n"

echo "1️⃣  Start monitoring Lambda logs (in this terminal):"
echo "   This will show merchant connections in real-time.\n"

echo "2️⃣  Open WhizzMerchants Flutter app (in another terminal/device)"
echo "   Navigate: Profile → About App → Chat Support\n"

echo "3️⃣  Look for connection logs below"
echo "   Should see merchant connecting and sending handshake\n"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

echo "🔍 Starting Lambda log monitoring...\n"
echo "Press Ctrl+C to stop monitoring\n"

AWS_PROFILE=wizz-drivers-ghayth-dev aws logs tail \
    /aws/lambda/WizzUser-WebSocketDefault-dev \
    --follow \
    --format short \
    --region us-east-1
