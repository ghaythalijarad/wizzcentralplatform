# 🔔 Complete Push Notification Test Procedure

## Current Status
✅ Firebase Admin SDK initialized successfully
✅ Server configured and running
✅ 4 merchants with 6 device tokens in database
⏳ Ready to test with fresh app restart

## Step-by-Step Testing Procedure

### Step 1: Restart WhizzMerchants App on iPhone 🔄

1. **Kill the app completely:**
   - On your iPhone, **double-tap the home button** (or swipe up from bottom)
   - Find the **WhizzMerchants** app in the app switcher
   - **Swipe up** to force close it

2. **Open the app fresh:**
   - Tap the **WhizzMerchants** icon on home screen
   - Wait for app to fully load and initialize
   - This will register a fresh FCM token with Firebase

3. **Verify you're logged in:**
   - Make sure you can see your merchant dashboard
   - The app should be in **background** or **closed** to receive notifications
   - Press **home button** to minimize the app

### Step 2: Verify Fresh Device Token 📱

Wait 10 seconds after app restart, then run:

```bash
# Check for the most recent device token
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens \
  --profile wizz-drivers-ghayth-dev --region us-east-1 \
  --filter-expression "platform = :p" \
  --expression-attribute-values '{":p":{"S":"ios"}}' \
  --projection-expression "deviceToken,updatedAt,platform" \
  --max-items 3 \
  | grep -A 2 "updatedAt"
```

You should see a very recent timestamp (within last minute).

### Step 3: Send Test Notification 🚀

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node test_backend_notification.js
```

### Step 4: Check Your iPhone 📱

Within **3 seconds**, you should:
- ✅ See a notification banner at the top
- ✅ Hear the notification sound
- ✅ See a badge on the app icon

**Expected notification:**
```
Title: "Direct Backend Test"
Body: "This is a test notification sent directly from the backend test script. If you receive this on your iPhone, the system is working!"
```

## Alternative: Test from Frontend UI 🖥️

### Option A: Send to All Merchants

1. Open browser: http://localhost:3000/frontend/pages/promotions.html
2. Click **"Send to Merchants"** button (blue button at top)
3. Fill in the form:
   - **Notification Type:** Info (ℹ️)
   - **Title:** "Test from WizzCentral UI"
   - **Message:** "Testing push notifications through the web interface!"
   - **Target Merchants:** All Merchants
   - **Priority:** Normal
4. Click **"Send Notification"**
5. Check your iPhone immediately

### Option B: Send with a Specific Discount

1. Find a discount row in the table
2. Click the **bell icon (🔔)** on any discount
3. Fill in the notification form:
   - **Target:** All Customers
   - **Title:** "Special Offer!"
   - **Message:** "Check out this amazing discount!"
4. Click **"Send Push Notification"**

## Troubleshooting 🔧

### If NO notification appears:

#### 1. Check App is in Background
```bash
# The app MUST be in background or closed
# If app is in foreground (active), iOS won't show the notification
# Solution: Press home button to minimize the app
```

#### 2. Check Notification Permissions
- Go to: **Settings > WhizzMerchants > Notifications**
- Ensure:
  - ✅ Allow Notifications: ON
  - ✅ Sounds: ON
  - ✅ Badges: ON
  - ✅ Banner Style: Temporary or Persistent

#### 3. Check Do Not Disturb
- Swipe down from top-right (Control Center)
- Ensure **Do Not Disturb** is OFF (moon icon should not be highlighted)

#### 4. Check Server Logs
```bash
tail -50 /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/server.log | grep -A 5 "Firebase\|FCM\|Token"
```

Look for:
- ✅ "Firebase Admin SDK initialized successfully"
- ✅ "Sending batch 1 with X tokens"
- ✅ "success, 0 failed"

#### 5. Check for FCM Errors
```bash
tail -100 /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/server.log | grep -i "error\|failed"
```

Common errors:
- **"Requested entity was not found"** = Invalid device token (app needs restart)
- **"registration-token-not-registered"** = Token expired (force close and reopen app)
- **"invalid-argument"** = Malformed token (check database)

### If notification fails with error:

#### Error: "Requested entity was not found"
```bash
# The device token is invalid or from a different Firebase project
# Solution:
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend
flutter run
# Then restart the app on iPhone and try again
```

#### Error: "Registration token not registered"
```bash
# The token has expired
# Solution: Force close and reopen WhizzMerchants app
```

## Testing Different Notification Types 🎨

### Test Info Notification (ℹ️)
```bash
curl -X POST http://localhost:3000/api/merchants/send-info-notification \
  -H "Content-Type: application/json" \
  -d '{
    "notificationTitle": "Platform Update",
    "notificationBody": "We have updated our terms of service. Please review.",
    "notificationType": "info",
    "targetAudience": "all",
    "priority": "normal"
  }'
```

### Test Warning Notification (⚠️)
```bash
curl -X POST http://localhost:3000/api/merchants/send-info-notification \
  -H "Content-Type: application/json" \
  -d '{
    "notificationTitle": "Action Required",
    "notificationBody": "Your merchant license expires in 7 days. Please renew.",
    "notificationType": "warning",
    "targetAudience": "all",
    "priority": "high"
  }'
```

### Test Urgent Notification (🚨)
```bash
curl -X POST http://localhost:3000/api/merchants/send-info-notification \
  -H "Content-Type: application/json" \
  -d '{
    "notificationTitle": "URGENT: Service Disruption",
    "notificationBody": "Our payment system is temporarily down. Cash only.",
    "notificationType": "urgent",
    "targetAudience": "all",
    "priority": "high"
  }'
```

## Success Criteria ✅

You know the system is working when:
1. ✅ Server logs show "X success, 0 failed"
2. ✅ Notification appears on iPhone within 3 seconds
3. ✅ You hear the notification sound
4. ✅ Badge appears on app icon
5. ✅ Tapping notification opens the app

## Quick Test Command (All-in-One)

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform && \
echo "🔔 Sending test notification in 5 seconds..." && \
echo "📱 Make sure WhizzMerchants app is in BACKGROUND on your iPhone!" && \
sleep 5 && \
node test_backend_notification.js && \
echo "" && \
echo "📊 Checking server logs for results..." && \
sleep 2 && \
tail -30 server.log | grep -A 10 "Batch.*complete"
```

---

## Next Steps After Successful Test

Once notifications are working:
1. ✅ Test from frontend UI
2. ✅ Test different notification types
3. ✅ Test targeting options (all, active, inactive, by city)
4. ✅ Test scheduling notifications
5. ✅ Create DynamoDB logging table for analytics
6. ✅ Deploy to production Lambda

---

**Ready to test? Follow the steps above! 🚀**
