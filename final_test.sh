#!/bin/bash

# 🎯 FINAL TEST: Verify FCM Token Registration
# Run this after logging into the WhizzMerchants app

clear

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           FCM TOKEN REGISTRATION - FINAL TEST                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 WhizzMerchants app successfully built and installed!"
echo ""
echo "🎯 TESTING STEPS:"
echo ""
echo "┌───────────────────────────────────────────────────────────────┐"
echo "│ STEP 1: Check Token Table BEFORE Login                       │"
echo "└───────────────────────────────────────────────────────────────┘"

# Check current token count
BEFORE_COUNT=$(aws dynamodb scan \
    --table-name WhizzMerchants_DeviceTokens \
    --select "COUNT" \
    --profile wizz-drivers-ghayth-dev \
    --output json 2>/dev/null | jq -r '.Count' 2>/dev/null || echo "0")

echo "   Current tokens in database: $BEFORE_COUNT"
echo ""

echo "┌───────────────────────────────────────────────────────────────┐"
echo "│ STEP 2: Login to WhizzMerchants App                          │"
echo "└───────────────────────────────────────────────────────────────┘"
echo ""
echo "   📱 On your iPhone:"
echo "   1. Open WhizzMerchants app"
echo "   2. Enter your credentials"
echo "   3. Tap 'Sign In'"
echo "   4. Wait for dashboard to FULLY load"
echo ""
echo "   ⏱️  Give it 5 seconds after dashboard appears..."
echo ""
read -p "   Press ENTER when you're logged in and dashboard is loaded..."
echo ""

echo "┌───────────────────────────────────────────────────────────────┐"
echo "│ STEP 3: Check Token Table AFTER Login                        │"
echo "└───────────────────────────────────────────────────────────────┘"

# Check token count after login
AFTER_COUNT=$(aws dynamodb scan \
    --table-name WhizzMerchants_DeviceTokens \
    --select "COUNT" \
    --profile wizz-drivers-ghayth-dev \
    --output json 2>/dev/null | jq -r '.Count' 2>/dev/null || echo "0")

echo "   Tokens after login: $AFTER_COUNT"
echo ""

# Compare
if [ "$AFTER_COUNT" -gt "$BEFORE_COUNT" ]; then
    echo "   ✅ SUCCESS! New token registered!"
    echo ""
    
    # Show the token details
    echo "┌───────────────────────────────────────────────────────────────┐"
    echo "│ STEP 4: Token Details                                        │"
    echo "└───────────────────────────────────────────────────────────────┘"
    echo ""
    
    ./verify_token_after_login.sh
    
elif [ "$AFTER_COUNT" -eq "$BEFORE_COUNT" ] && [ "$AFTER_COUNT" -gt 0 ]; then
    echo "   ℹ️  Token already exists from previous login"
    echo "   (This is normal if you've logged in before)"
    echo ""
    ./verify_token_after_login.sh
else
    echo "   ❌ FAILED! No token was registered!"
    echo ""
    echo "   🔍 Troubleshooting:"
    echo "   1. Check Flutter console logs for errors"
    echo "   2. Verify Firebase is configured correctly"
    echo "   3. Ensure network connectivity"
    echo "   4. Try logging out and logging in again"
    echo ""
    exit 1
fi

echo ""
echo "┌───────────────────────────────────────────────────────────────┐"
echo "│ STEP 5: Test Push Notification                               │"
echo "└───────────────────────────────────────────────────────────────┘"
echo ""
read -p "Would you like to send a test notification now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📤 Sending test notification..."
    node test_backend_notification.js
    echo ""
    echo "📱 Check your iPhone for the notification!"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 TEST COMPLETE! 🎉                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
