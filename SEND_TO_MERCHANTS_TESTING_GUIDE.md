# 📱 "Send to Merchants" - Complete Testing Guide

**Date**: November 23, 2025  
**Purpose**: Test end-to-end push notification flow from WizzCentral to WhizzMerchants iPhone app

---

## 🎯 Testing Overview

This guide will walk you through testing the complete notification system:

```
WizzCentral (Admin) 
    → Click "Send to Merchants" 
    → Fill form 
    → Submit
    ↓
Backend Server 
    → Validate & authenticate
    → Query merchants from DynamoDB
    → Get FCM device tokens
    ↓
Firebase Cloud Messaging (FCM)
    → Send to Apple Push Notification Service (APNs)
    ↓
Your iPhone
    → Receive notification 🔔
    → App handles notification
    → Display in WhizzMerchants app
```

---

## 📋 Prerequisites Checklist

### ✅ Before You Start

- [ ] **AWS SSO Session Active**: Run `aws sso login --profile wizz-drivers-ghayth-dev`
- [ ] **WizzCentral Server Running**: http://localhost:3000
- [ ] **iPhone Connected**: Via USB cable
- [ ] **WhizzMerchants App Installed**: On physical iPhone
- [ ] **iPhone Unlocked**: Required for push notifications
- [ ] **Internet Connection**: Both Mac and iPhone
- [ ] **FCM_SERVER_KEY Configured**: In backend environment variables

---

## 🚀 Step-by-Step Testing Process

### Step 1: Run WhizzMerchants on Your iPhone

```bash
# Navigate to WhizzMerchants frontend
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend

# Check connected devices
flutter devices

# Should show:
# Ghayth's iPhone (mobile) • 00008110-001C79140284801E • ios • iOS 26.1

# Run app on iPhone
flutter run -d 00008110-001C79140284801E
```

**Expected Output:**
```
✓ Built build/ios/iphoneos/Runner.app
Launching lib/main.dart on Ghayth's iPhone in debug mode...
To hot restart changes while running, press "r" or "R".
For a more detailed help message, press "h". To quit, press "q".
```

**What to Check:**
- [ ] App launches successfully on iPhone
- [ ] Login screen appears
- [ ] Can log in with merchant credentials
- [ ] Dashboard loads without errors

---

### Step 2: Ensure Merchant is Logged In and App is Active

**On iPhone WhizzMerchants App:**

1. **Login** with test merchant credentials:
   - Phone: `+964 XXX XXX XXXX` (your test merchant)
   - Password: `your-password`

2. **Wait for FCM Token Registration**:
   - App should automatically register FCM token on login
   - Check Flutter logs for: `✅ FCM token saved to backend`

3. **Keep App Open**:
   - Stay on dashboard or any screen
   - App must be running to receive notifications immediately

**Check Backend Logs:**
```bash
# In terminal where WizzCentral server is running
# Look for:
POST /api/merchant/device-tokens
✅ Device token saved for business: business_123456
```

---

### Step 3: Get Your Merchant's Business ID

You need the `businessId` to verify which merchant will receive notifications.

**Option A: From WhizzMerchants App Logs**
```bash
# In the terminal running flutter app, look for:
📊 Current business: { businessId: 'business_1756336745961_ywix4oy9aa', ... }
```

**Option B: From DynamoDB**
```bash
aws dynamodb scan \
  --table-name WhizzMerchants_Businesses \
  --profile wizz-drivers-ghayth-dev \
  --limit 5 \
  --query 'Items[*].[businessId.S, businessName.S]' \
  --output table
```

**Option C: From Backend API**
```bash
# If you're logged in as that merchant, check:
curl http://localhost:3000/api/merchants | jq '.[] | {businessId, businessName}' | head -20
```

**Example Output:**
```
business_1756336745961_ywix4oy9aa  |  صلوات Restaurant
```

---

### Step 4: Open WizzCentral Promotions Page

1. **Open Browser**: http://localhost:3000/frontend/pages/promotions.html

2. **Login as Admin** (if not logged in):
   - Email: `admin@wizz.com`
   - Password: `your-admin-password`

3. **Verify Data Loads**:
   - Should see 5 merchant discounts
   - Should see 2 special campaigns
   - No errors (no "401 Unauthorized")

**Expected Screen:**
```
 Promotions & Campaigns
Manage discounts, special offers, and marketing campaigns.

[📢 Send to Merchants]  ← This button should be visible

 Merchant Discounts
Total: 5  Active: 5
┌─────────────┬───────────┬──────┬───────┬────────┐
│ DISCOUNT    │ MERCHANT  │ TYPE │ VALUE │ STATUS │
├─────────────┼───────────┼──────┼───────┼────────┤
│ تجريبات صلوات│ Unknown   │ %    │ 25%   │ active │
│ 3000        │ Unknown   │ %    │ 0%    │ active │
│ ...         │ ...       │ ...  │ ...   │ ...    │
└─────────────┴───────────┴──────┴───────┴────────┘
```

---

### Step 5: Click "Send to Merchants" Button

**What to Do:**
1. Click the **"📢 Send to Merchants"** button at the top of the page
2. Modal should open immediately

**Expected Behavior:**
- ✅ Modal appears with form
- ✅ No JavaScript errors in console (press F12)
- ✅ Form fields are visible and editable

**Troubleshooting:**
If button doesn't work:
```javascript
// Open browser console (F12) and run:
console.log('Testing openMerchantInfoModal:', typeof openMerchantInfoModal);
openMerchantInfoModal(); // Should open modal manually
```

---

### Step 6: Fill Out the Notification Form

**Test Notification #1: Simple Info Notification to All Merchants**

```
┌─────────────────────────────────────────────────────┐
│ 📢 Send Information to Merchants            [×]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Notification Type *                                 │
│ [ℹ️ Information ▼]                                  │
│                                                     │
│ Notification Title *                                │
│ Test Notification from WizzCentral                  │
│                                                     │
│ Notification Message *                              │
│ This is a test notification to verify the push     │
│ notification system is working correctly.           │
│                                                     │
│ Target Merchants *                                  │
│ [All Merchants ▼]                                   │
│                                                     │
│ Priority                                            │
│ [Normal ▼]                                          │
│                                                     │
│ ▶ Advanced Options (collapsed)                     │
│                                                     │
│ 📊 Estimated Reach                                  │
│ 🏪 ~5-10 merchants                                  │
│                                                     │
│ 📱 Notification Preview                             │
│ ┌─────────────────────────────────────────────┐   │
│ │ Test Notification from WizzCentral          │   │
│ │ This is a test notification to verify...    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Cancel]              [📤 Send to Merchants]       │
└─────────────────────────────────────────────────────┘
```

**Form Values:**
- **Notification Type**: ℹ️ Information
- **Title**: `Test Notification from WizzCentral`
- **Message**: `This is a test notification to verify the push notification system is working correctly.`
- **Target**: All Merchants
- **Priority**: Normal

---

### Step 7: Submit and Monitor

**What to Do:**
1. Click **"📤 Send to Merchants"** button
2. Watch browser alert
3. Check backend terminal logs
4. **CHECK YOUR IPHONE!** 📱

**Expected: Browser Alert**
```
✅ Notification sent successfully!

Targeted: 5 merchants
Sent: 4
Failed: 1
```

**Expected: Backend Terminal Logs**
```bash
# WizzCentral server logs:
📢 Sending information notification to merchants
🎯 Getting target merchants for audience: all
📊 Total merchants in database: 5
✅ Filtered to 5 merchants
📱 Getting device tokens for 5 merchants
✅ Found 4 device tokens
🔔 Sending FCM notifications to 4 tokens
📡 FCM Response: { success: 4, failure: 0 }
💾 Logging notification activity
✅ Notification sent successfully
```

**Expected: iPhone Notification**

**Lock Screen:**
```
┌─────────────────────────────────────┐
│ WhizzMerchants         Now          │
│ ─────────────────────────────────   │
│ ℹ️ Test Notification from          │
│    WizzCentral                      │
│    This is a test notification to   │
│    verify the push...               │
└─────────────────────────────────────┘
```

**In-App (if app is open):**
- Banner notification at top
- Notification sound (if enabled)
- May show in-app alert dialog

---

### Step 8: Verify Notification in App

**On iPhone:**

1. **If notification appeared on lock screen**:
   - Swipe/tap to open
   - Should open WhizzMerchants app
   - May navigate to specific screen (if actionUrl provided)

2. **If app was already open**:
   - Should see in-app notification banner
   - Or dialog popup with notification content

3. **Check Notification Center**:
   - Swipe down from top
   - Should see notification in list
   - Grouped under "WhizzMerchants"

**What to Verify:**
- [ ] Notification received within 3 seconds
- [ ] Title matches what you sent
- [ ] Message content is correct
- [ ] App icon badge updates (if configured)
- [ ] Sound plays (if enabled)
- [ ] Tapping notification opens app

---

### Step 9: Test Advanced Scenarios

Once basic test works, try these variations:

#### Test 2: Urgent Notification with High Priority
```
Type: 🚨 Urgent Alert
Title: Important: System Maintenance Tonight
Message: WhizzCentral will be down for maintenance from 10 PM to 2 AM. Please complete all orders before then.
Target: All Merchants
Priority: High Priority
```

**Expected:**
- High priority notifications show more prominently
- Notification sound may be different/louder
- Banner stays visible longer

---

#### Test 3: Target Active Merchants Only
```
Type: ✨ New Feature
Title: New Analytics Dashboard Available!
Message: Check out the new analytics dashboard with real-time insights into your orders and revenue.
Target: Active Merchants (orders in last 30 days)
Priority: Normal
```

**Expected:**
- Fewer merchants targeted (only active ones)
- Browser alert shows: "Targeted: 3 merchants" (example)

---

#### Test 4: Target by City
```
Type: 📋 Policy Update
Title: Najaf Commission Update
Message: New commission rates for Najaf merchants effective December 1st.
Target: By City
City: Najaf
Priority: Normal
```

**Expected:**
- Only merchants in Najaf receive notification
- Browser alert shows: "Targeted: 2 merchants" (example)

---

#### Test 5: Scheduled Notification
```
Type: ℹ️ Information
Title: Weekly Newsletter
Message: This week's highlights: New merchants, top performers, and upcoming features.
Target: All Merchants
Priority: Normal
Advanced Options:
  Send Time: Schedule for Later
  Scheduled Time: [Select 5 minutes from now]
```

**Expected:**
- Browser alert shows: "Notification scheduled successfully"
- Notification sends at scheduled time
- Check DynamoDB table: `WizzCentral_Scheduled_Merchant_Notifications`

---

#### Test 6: With Action URL (Deep Link)
```
Type: 📋 Policy Update
Title: New Commission Policy
Message: Review the updated commission structure. Tap to view details.
Target: All Merchants
Priority: High Priority
Advanced Options:
  Action URL: whizzmerchants://policy/commission-2025
  Image URL: https://example.com/commission-banner.jpg
```

**Expected:**
- Notification includes deep link
- Tapping notification opens specific screen in app
- Image displays in notification (if platform supports)

---

## 🔍 Debugging & Troubleshooting

### Issue 1: Button Doesn't Open Modal

**Symptoms:**
- Click "Send to Merchants" → nothing happens
- No modal appears

**Debug Steps:**
```javascript
// 1. Open browser console (F12)
// 2. Check for errors
console.log('Errors:', document.querySelectorAll('.error'));

// 3. Check if modal exists
console.log('Modal exists:', !!document.getElementById('merchantInfoNotificationModal'));

// 4. Check if function exists
console.log('Function exists:', typeof openMerchantInfoModal);

// 5. Try opening manually
openMerchantInfoModal();
```

**Solution:**
- Refresh page: Ctrl+Shift+R (hard refresh)
- Check if JavaScript loaded: View source and verify script tags
- Check browser console for errors

---

### Issue 2: "Failed to send notification"

**Symptoms:**
- Form submits but error alert appears
- Backend logs show error

**Debug Steps:**

1. **Check Backend Logs:**
```bash
# Look for error messages in terminal running WizzCentral server
# Common errors:
# - AWS credentials expired
# - FCM_SERVER_KEY not set
# - No device tokens found
# - DynamoDB query error
```

2. **Check AWS SSO:**
```bash
aws sso login --profile wizz-drivers-ghayth-dev
```

3. **Check FCM_SERVER_KEY:**
```bash
# In backend .env file or environment variables
echo $FCM_SERVER_KEY
# Should output: AIza... (long key)
```

4. **Check Device Tokens:**
```bash
# Query DynamoDB for device tokens
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --profile wizz-drivers-ghayth-dev \
  --limit 5
```

---

### Issue 3: No Notification on iPhone

**Symptoms:**
- Backend says "sent successfully"
- But no notification appears on iPhone

**Debug Steps:**

1. **Check iPhone Notification Settings:**
   - Settings → Notifications → WhizzMerchants
   - Ensure "Allow Notifications" is ON
   - Check that alerts, sounds, badges are enabled

2. **Check App Permissions:**
   - WhizzMerchants must request notification permission on first launch
   - If denied, notifications won't work

3. **Check FCM Token:**
```dart
// In WhizzMerchants app, check Flutter logs for:
✅ FCM Token: dxxx...xxx (long token)
✅ FCM token saved to backend
```

4. **Check Internet Connection:**
   - Both iPhone and Mac must have internet
   - Try opening Safari on iPhone to verify

5. **Check APNs Certificate:**
   - Firebase Console → Project Settings → Cloud Messaging
   - iOS APNs certificate must be uploaded and valid

6. **Test with Firebase Console:**
   - Go to Firebase Console
   - Cloud Messaging → Send test message
   - Enter FCM token manually
   - If this works but WizzCentral doesn't → issue is in backend

---

### Issue 4: High Failure Rate

**Symptoms:**
- Backend reports: "Sent: 1, Failed: 4"
- Many notifications fail to deliver

**Common Causes:**
- Expired/invalid device tokens
- App uninstalled from devices
- Merchants haven't logged in recently
- Network issues

**Solution:**
```bash
# Clean up old tokens (create cleanup script)
# Query tokens and check lastUsed timestamp
# Remove tokens older than 60 days
```

---

### Issue 5: Notification Received but App Doesn't Handle It

**Symptoms:**
- Notification appears on iPhone
- But tapping it doesn't open app or specific screen

**Debug Steps:**

1. **Check WhizzMerchants App Code:**
```dart
// In lib/services/notification_service.dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('📱 Notification received: ${message.data}');
  // Handler code should be here
});

FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('📱 Notification tapped: ${message.data}');
  // Navigation code should be here
});
```

2. **Check Flutter Logs:**
```bash
# In terminal running flutter app:
flutter logs | grep "Notification"
```

---

## 📊 Verification Checklist

After each test, verify:

### ✅ Frontend (WizzCentral)
- [ ] Button opens modal correctly
- [ ] Form fields are all editable
- [ ] Preview updates as you type
- [ ] Estimated reach displays correctly
- [ ] Form validation works (try submitting empty form)
- [ ] Success alert shows correct stats
- [ ] Modal closes after success

### ✅ Backend (WizzCentral Server)
- [ ] API endpoint receives request
- [ ] Authentication succeeds (no 401 errors)
- [ ] Merchants query executes
- [ ] Filtering logic works correctly
- [ ] Device tokens retrieved
- [ ] FCM API called successfully
- [ ] Response logged to DynamoDB
- [ ] No crashes or errors in logs

### ✅ Database (DynamoDB)
- [ ] `WhizzMerchants_Businesses` has merchant data
- [ ] `WhizzMerchants_DeviceTokens` has valid tokens
- [ ] `WizzCentral_Merchant_Notification_Logs` records activity
- [ ] Scheduled notifications saved (if scheduled)

### ✅ Mobile App (WhizzMerchants iPhone)
- [ ] App running and merchant logged in
- [ ] FCM token registered
- [ ] Notification received within 3 seconds
- [ ] Title and message correct
- [ ] Sound plays (if enabled)
- [ ] Badge updates (if configured)
- [ ] Tapping opens app correctly
- [ ] Deep link navigation works (if provided)

### ✅ Push Notification Service
- [ ] FCM receives request from backend
- [ ] APNs delivers to iPhone
- [ ] No errors in FCM logs
- [ ] Delivery confirmed

---

## 🎬 Quick Test Script

For rapid testing, use this script:

```bash
#!/bin/zsh
# Quick test script for Send to Merchants

echo "📱 Quick Test: Send to Merchants Notification"
echo "=============================================="
echo ""

# Step 1: Check if iPhone is connected
echo "1️⃣ Checking for iPhone..."
IPHONE_ID="00008110-001C79140284801E"
flutter devices | grep "$IPHONE_ID" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Ghayth's iPhone connected"
else
    echo "❌ iPhone not found. Please connect it."
    exit 1
fi

# Step 2: Check if WizzCentral server is running
echo "2️⃣ Checking WizzCentral server..."
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ WizzCentral server running"
else
    echo "❌ WizzCentral server not running. Start it with: cd whizzCentralPlatform && node local-dev-server.js"
    exit 1
fi

# Step 3: Check AWS SSO
echo "3️⃣ Checking AWS credentials..."
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ AWS credentials valid"
else
    echo "⚠️  AWS credentials may be expired. Run: aws sso login --profile wizz-drivers-ghayth-dev"
fi

# Step 4: Run WhizzMerchants on iPhone (in background)
echo "4️⃣ Starting WhizzMerchants on iPhone..."
echo "   (This will open in a new terminal window)"
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend
osascript -e 'tell app "Terminal" to do script "cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend && flutter run -d 00008110-001C79140284801E"'

echo ""
echo "5️⃣ Open WizzCentral Promotions page..."
sleep 3
open "http://localhost:3000/frontend/pages/promotions.html"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Wait for app to install on iPhone (~30 seconds)"
echo "   2. Login to WhizzMerchants app on iPhone"
echo "   3. In browser: Click 'Send to Merchants' button"
echo "   4. Fill form and submit"
echo "   5. Check iPhone for notification 🔔"
echo ""
```

Save as: `/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/test_send_to_merchants.sh`

Run with:
```bash
chmod +x test_send_to_merchants.sh
./test_send_to_merchants.sh
```

---

## 📝 Test Results Template

After testing, document results:

```markdown
## Test Results - [Date/Time]

### Test #1: Basic Notification to All Merchants
- **Form Data**:
  - Type: Information
  - Title: Test Notification
  - Target: All Merchants
  - Priority: Normal

- **Backend Response**:
  - Targeted: X merchants
  - Sent: X
  - Failed: X

- **iPhone Result**:
  - ✅ Notification received
  - ⏱️ Delay: X seconds
  - ✅ Title correct
  - ✅ Message correct
  - ✅ Sound played
  - ✅ App opened on tap

- **Issues**: None / [Describe any issues]

### Test #2: [Next test...]

```

---

## 🎯 Success Criteria

The system is working correctly when:

1. ✅ **Modal Opens**: Button click opens form immediately
2. ✅ **Form Submits**: No errors on submission
3. ✅ **Backend Processes**: Logs show successful FCM delivery
4. ✅ **iPhone Receives**: Notification appears within 3 seconds
5. ✅ **Content Correct**: Title and message match what was sent
6. ✅ **Interaction Works**: Tapping notification opens app
7. ✅ **Logging Works**: Activity recorded in DynamoDB
8. ✅ **Delivery Rate**: >95% success rate (most notifications delivered)

---

## 📞 Support & Resources

### Documentation
- [Complete Logic Explanation](./MERCHANT_NOTIFICATION_SYSTEM_EXPLANATION.md)
- [Visual Flow Diagram](./MERCHANT_NOTIFICATION_FLOW_DIAGRAM.md)
- [Quick Reference](./SEND_TO_MERCHANTS_QUICK_REFERENCE.md)

### Debugging Tools
- **Browser Console**: F12 (Chrome/Firefox)
- **Backend Logs**: Terminal running `local-dev-server.js`
- **Flutter Logs**: Terminal running `flutter run`
- **DynamoDB**: AWS Console or CLI

### Common Commands
```bash
# AWS SSO login
aws sso login --profile wizz-drivers-ghayth-dev

# Check DynamoDB tables
aws dynamodb list-tables --profile wizz-drivers-ghayth-dev

# Query device tokens
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens --profile wizz-drivers-ghayth-dev

# Check notification logs
aws dynamodb scan --table-name WizzCentral_Merchant_Notification_Logs --profile wizz-drivers-ghayth-dev --limit 10
```

---

**Last Updated**: November 23, 2025  
**Version**: 1.0.0  
**Tested By**: [Your Name]
