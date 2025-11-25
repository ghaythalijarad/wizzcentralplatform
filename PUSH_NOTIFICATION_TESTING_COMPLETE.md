# 🚀 Complete Push Notification Testing Guide

## Current Status
✅ Backend API working (4 merchants targeted, 6 device tokens found)  
❌ No actual notifications sent (FCM_SERVER_KEY not configured)  
📱 Your iPhone is ready (WhizzMerchants app running)

---

## 🔥 IMMEDIATE ACTION REQUIRED: Get FCM Server Key

### Step 1: Open Firebase Console
```bash
open "https://console.firebase.google.com/project/wizz-business-app/settings/cloudmessaging"
```

### Step 2: Copy the Server Key
- Look for **"Server key"** or **"Legacy server key"**
- Copy the entire key (starts with `AAAA...`)

### Step 3: Add to .env File
```bash
# Open the .env file
nano /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env

# Replace this line:
FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY_HERE

# With your actual key:
FCM_SERVER_KEY=AAAAxxxxx:APA91bFxxxxxxxxxxxxxxxxxxxxxx

# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 4: Restart Server
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
pkill -f "node.*local-dev-server.js"
node local-dev-server.js > server.log 2>&1 &
```

### Step 5: Verify FCM Key is Loaded
```bash
# Check server logs for FCM confirmation
sleep 2
tail -20 server.log | grep -i fcm
```

---

## 🧪 Testing Methods

### Method 1: Backend API Test (Recommended)
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Make sure WhizzMerchants app is in BACKGROUND on iPhone (not foreground!)
node test_backend_notification.js
```

**Expected Result:**
- Terminal shows: "Sent: 6" (not "simulating")
- iPhone receives notification within 3 seconds
- Notification plays sound and shows banner

### Method 2: Frontend UI Test
```bash
# Open WizzCentral in browser
open "http://localhost:3000/frontend/pages/promotions.html"
```

1. Click **"Send to Merchants"** button (top right)
2. Fill in:
   - **Type:** ℹ️ Info
   - **Title:** "Test from WizzCentral"
   - **Message:** "Testing push notifications!"
   - **Target:** All Merchants
   - **Priority:** High
3. Click **"Send Notification"**
4. Check your iPhone

### Method 3: Direct API Call
```bash
# Using curl to test the API directly
curl -X POST http://localhost:3000/api/merchants/send-info-notification \
  -H "Content-Type: application/json" \
  -d '{
    "notificationTitle": "Direct API Test",
    "notificationBody": "This is a test from curl command",
    "notificationType": "urgent",
    "targetAudience": "all",
    "priority": "high"
  }'
```

---

## 📱 CRITICAL: App Must Be in Background!

Push notifications on iOS **ONLY show when app is in background or closed**.

**Before testing:**
1. Open WhizzMerchants app on iPhone
2. Press **Home button** (or swipe up) to minimize the app
3. Wait 2 seconds
4. **NOW** run the test command

---

## 🔍 Troubleshooting

### Problem: Still no notifications after adding FCM key

**Check 1: Verify Key is Loaded**
```bash
# Should show the key (masked)
grep FCM_SERVER_KEY /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env
```

**Check 2: View Server Logs**
```bash
tail -50 /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/server.log
```

**Check 3: Test with More Logging**
```bash
# Run test with verbose output
DEBUG=* node test_backend_notification.js
```

**Check 4: Verify Device Token**
```bash
# Check your iPhone's token is valid
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --filter-expression "platform = :p AND isActive = :a" \
  --expression-attribute-values '{":p":{"S":"ios"},":a":{"BOOL":true}}' \
  --profile wizz-drivers-ghayth-dev \
  --region us-east-1 \
  --max-items 3
```

**Check 5: iPhone Notification Settings**
```
Settings > WhizzMerchants > Notifications
- ✅ Allow Notifications: ON
- ✅ Sounds: ON
- ✅ Badges: ON
- ✅ Show in Notification Center: ON
- ✅ Show on Lock Screen: ON
```

---

## 🎯 What Should Happen

When everything is working correctly:

1. **Terminal Output:**
   ```
   ✅ SUCCESS! Notification sent!
   📊 Statistics:
      • Targeted: 4 merchants
      • Sent: 6
      • Failed: 0
   ```

2. **iPhone Behavior:**
   - 🔔 Notification sound plays
   - 📱 Banner appears at top
   - 💬 Shows title and message
   - 🔴 Badge appears on app icon

3. **Server Logs:**
   ```
   📢 Merchant Information Notification Handler invoked
   🎯 Target merchants: 4
   📱 Device tokens found: 6
   🔥 Sending to FCM...
   ✅ FCM Response: success
   ```

---

## 🚨 Quick Recovery Commands

If something goes wrong:

```bash
# Kill and restart everything
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
pkill -f "node.*local-dev-server.js"
rm -f server.log
node local-dev-server.js > server.log 2>&1 &

# Wait 3 seconds for server to start
sleep 3

# Check server is running
curl -s http://localhost:3000/health | jq .

# Run test
node test_backend_notification.js
```

---

## 📊 Success Checklist

- [ ] FCM_SERVER_KEY added to `.env` file
- [ ] Server restarted after adding key
- [ ] Server logs show FCM configuration loaded
- [ ] WhizzMerchants app is in **background** (not foreground!)
- [ ] iPhone notifications are enabled in Settings
- [ ] Test command returns "Sent: 6" (not "simulating")
- [ ] 🎉 **Notification received on iPhone!**

---

## 🎓 Next Steps After Success

Once notifications are working:

1. **Test Different Notification Types:**
   - Info (ℹ️)
   - Warning (⚠️)
   - Urgent (🚨)
   - Feature (✨)
   - Policy (📋)

2. **Test Different Targets:**
   - All merchants
   - Active merchants only
   - By city
   - By category

3. **Test Priority Levels:**
   - Normal (silent delivery)
   - High (with sound and banner)

4. **Test from Frontend:**
   - Use "Send to Merchants" button
   - Test scheduling for later
   - Test with images and action URLs

---

**Need Help?**
If you're still stuck after following these steps, check:
- `FCM_SETUP_GUIDE.md` - Detailed Firebase setup
- `server.log` - Server error messages
- Firebase Console - Verify project permissions
