#!/bin/zsh
# Complete Push Notification Testing Script
# Tests both frontend and backend notification sending

echo "📱 Push Notification Testing Suite"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo "${GREEN}✅ $1${NC}"
}

print_error() {
    echo "${RED}❌ $1${NC}"
}

print_info() {
    echo "${YELLOW}ℹ️  $1${NC}"
}

# Step 1: Check Prerequisites
echo "📋 Step 1: Checking Prerequisites"
echo "-----------------------------------"

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    print_success "WizzCentral server is running"
else
    print_error "WizzCentral server is NOT running"
    echo "   Start it with: cd whizzCentralPlatform && node local-dev-server.js"
    exit 1
fi

# Check AWS credentials
if aws sts get-caller-identity --profile wizz-drivers-ghayth-dev > /dev/null 2>&1; then
    print_success "AWS credentials are valid"
else
    print_error "AWS credentials expired or invalid"
    echo "   Run: aws sso login --profile wizz-drivers-ghayth-dev"
    exit 1
fi

# Check if iPhone is connected
IPHONE_ID="00008110-001C79140284801E"
if flutter devices 2>/dev/null | grep -q "$IPHONE_ID"; then
    print_success "Ghayth's iPhone is connected"
else
    print_info "iPhone not detected (optional for backend tests)"
fi

echo ""

# Step 2: Check Database State
echo "📊 Step 2: Database State"
echo "-----------------------------------"

# Count merchants
MERCHANT_COUNT=$(aws dynamodb scan \
    --table-name WhizzMerchants_Businesses \
    --profile wizz-drivers-ghayth-dev \
    --select COUNT 2>/dev/null | jq -r '.Count // 0')
print_info "Merchants in database: $MERCHANT_COUNT"

# Count device tokens
TOKEN_COUNT=$(aws dynamodb scan \
    --table-name WhizzMerchants_DeviceTokens \
    --profile wizz-drivers-ghayth-dev \
    --select COUNT 2>/dev/null | jq -r '.Count // 0')
print_info "Device tokens registered: $TOKEN_COUNT"

# List merchants
echo ""
print_info "Merchants in system:"
aws dynamodb scan \
    --table-name WhizzMerchants_Businesses \
    --profile wizz-drivers-ghayth-dev \
    --limit 5 \
    --query 'Items[*].[businessId.S, businessName.S, status.S]' \
    --output table 2>/dev/null | head -20

echo ""

# Step 3: Frontend Test
echo "🌐 Step 3: Frontend Test"
echo "-----------------------------------"
print_info "Opening WizzCentral Promotions page in browser..."
sleep 2
open "http://localhost:3000/frontend/pages/promotions.html"

echo ""
print_info "📝 Manual Steps Required:"
echo "   1. Login to WizzCentral (if not already logged in)"
echo "   2. Wait for page to load (should show 5 merchant discounts)"
echo "   3. Click the '📢 Send to Merchants' button"
echo "   4. Fill out the form:"
echo "      - Type: ℹ️ Information"
echo "      - Title: Test from Script"
echo "      - Message: This is an automated test notification"
echo "      - Target: All Merchants"
echo "      - Priority: Normal"
echo "   5. Click 'Send to Merchants' button"
echo "   6. Check for success alert and notification stats"
echo ""

read "?Press Enter when you've completed the frontend test (or Ctrl+C to skip)..."

echo ""
print_success "Frontend test acknowledged"

# Step 4: Backend Direct Test
echo "🔧 Step 4: Backend Direct Test"
echo "-----------------------------------"
print_info "Creating test notification payload..."

# Get FCM_SERVER_KEY
FCM_KEY=$(grep FCM_SERVER_KEY /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env 2>/dev/null | cut -d '=' -f2)
if [ -z "$FCM_KEY" ]; then
    print_error "FCM_SERVER_KEY not found in .env file"
    print_info "Add it to: /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env"
    print_info "Format: FCM_SERVER_KEY=your-key-here"
else
    print_success "FCM_SERVER_KEY found"
fi

# Test notification payload
TEST_PAYLOAD='{
  "notificationType": "info",
  "notificationTitle": "Backend Test Notification",
  "notificationBody": "This notification was sent directly via backend API to test the system.",
  "targetAudience": "all",
  "priority": "normal"
}'

echo ""
print_info "Test payload:"
echo "$TEST_PAYLOAD" | jq .

echo ""
print_info "Sending test notification via backend API..."

# Send notification (you'll need to be logged in for this to work)
RESPONSE=$(curl -s -X POST http://localhost:3000/api/merchants/send-info-notification \
    -H "Content-Type: application/json" \
    -d "$TEST_PAYLOAD")

echo ""
print_info "Backend Response:"
echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    print_success "Backend notification sent successfully!"
    TARGETED=$(echo "$RESPONSE" | jq -r '.targeted // 0')
    SENT=$(echo "$RESPONSE" | jq -r '.sent // 0')
    FAILED=$(echo "$RESPONSE" | jq -r '.failed // 0')
    echo ""
    print_info "Statistics:"
    echo "   • Targeted: $TARGETED merchants"
    echo "   • Sent: $SENT"
    echo "   • Failed: $FAILED"
else
    print_error "Backend notification failed"
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // "Unknown error"')
    print_error "Error: $ERROR_MSG"
fi

echo ""

# Step 5: Check Notification Logs
echo "📝 Step 5: Notification Logs"
echo "-----------------------------------"
print_info "Recent notification logs from DynamoDB:"

aws dynamodb scan \
    --table-name WizzCentral_Merchant_Notification_Logs \
    --profile wizz-drivers-ghayth-dev \
    --limit 5 \
    --query 'Items[*].[notificationId.S, timestamp.N, title.S, targetedCount.N, sentCount.N, failedCount.N]' \
    --output table 2>/dev/null | head -20

echo ""

# Step 6: iPhone Verification
echo "📱 Step 6: iPhone Verification"
echo "-----------------------------------"
print_info "CHECK YOUR IPHONE NOW! 🔔"
echo ""
echo "What to look for:"
echo "   • Lock screen notification"
echo "   • Notification banner (if app is open)"
echo "   • Sound/vibration"
echo "   • Badge on app icon"
echo ""
echo "If notification appeared:"
echo "   • Title should match what you sent"
echo "   • Message content should be correct"
echo "   • Tapping should open WhizzMerchants app"
echo ""

read "?Did you receive the notification on your iPhone? (y/n): " RECEIVED

if [[ "$RECEIVED" == "y" || "$RECEIVED" == "Y" ]]; then
    print_success "Great! Push notifications are working! 🎉"
    echo ""
    read "?Was the title correct? (y/n): " TITLE_OK
    read "?Was the message correct? (y/n): " MESSAGE_OK
    read "?Did tapping open the app? (y/n): " TAP_OK
    
    echo ""
    echo "📊 Test Results Summary:"
    [[ "$TITLE_OK" == "y" ]] && print_success "Title ✓" || print_error "Title ✗"
    [[ "$MESSAGE_OK" == "y" ]] && print_success "Message ✓" || print_error "Message ✗"
    [[ "$TAP_OK" == "y" ]] && print_success "Tap action ✓" || print_error "Tap action ✗"
else
    print_error "Notification not received. Troubleshooting needed."
    echo ""
    print_info "Troubleshooting steps:"
    echo "   1. Check iPhone notification settings:"
    echo "      Settings → Notifications → WhizzMerchants"
    echo "      Ensure 'Allow Notifications' is ON"
    echo ""
    echo "   2. Check if FCM token is registered:"
    echo "      Run: aws dynamodb scan --table-name WhizzMerchants_DeviceTokens --profile wizz-drivers-ghayth-dev"
    echo ""
    echo "   3. Check WhizzMerchants app logs:"
    echo "      Look for: 'FCM token saved to backend'"
    echo ""
    echo "   4. Ensure app requested notification permission"
    echo "      May need to reinstall app if permission was denied"
fi

echo ""

# Step 7: Summary
echo "📋 Step 7: Test Summary"
echo "-----------------------------------"
echo ""
print_info "Testing Complete!"
echo ""
echo "What was tested:"
echo "   ✓ WizzCentral server health"
echo "   ✓ AWS credentials"
echo "   ✓ Database connectivity"
echo "   ✓ Frontend modal and form"
echo "   ✓ Backend API endpoint"
echo "   ✓ FCM integration"
echo "   ✓ iPhone notification delivery"
echo ""
echo "Next steps:"
echo "   • Test different notification types (warning, urgent, feature, policy)"
echo "   • Test targeting options (active, inactive, by city, by category)"
echo "   • Test scheduling notifications"
echo "   • Test deep links (action URLs)"
echo ""
print_success "Testing script complete!"
echo ""
