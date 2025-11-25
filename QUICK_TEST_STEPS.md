# 🧪 Quick Push Notification Testing Steps

**Created**: November 23, 2025  
**iPhone App Running**: WhizzMerchants on Ghayth's iPhone

---

## ✅ Testing Checklist (Do These in Order)

### Test 1: Frontend Test (Click and Send)

**Steps:**
1. ✅ Open browser: http://localhost:3000/frontend/pages/promotions.html
2. ✅ Page should show 5 merchant discounts
3. ✅ Click "📢 Send to Merchants" button (top of page)
4. ✅ Modal opens with form
5. Fill in form:
   - **Type**: ℹ️ Information
   - **Title**: `Test from WizzCentral`
   - **Message**: `Testing push notifications to iPhone`
   - **Target**: All Merchants
   - **Priority**: Normal
6. ✅ Click "Send to Merchants" button
7. ✅ Watch for success alert
8. ✅ **CHECK IPHONE** for notification! 🔔

**Expected Result:**
```
✅ Notification sent successfully!

Targeted: X merchants
Sent: X
Failed: X
```

**On iPhone:**
- Notification banner appears
- Sound/vibration
- "Test from WizzCentral" title
- Message shows correctly

---

### Test 2: Backend API Test (Direct)

**Steps:**
```bash
# Run the backend test script
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node test_backend_notification.js
```

**Expected Output:**
```
📱 Direct Backend Push Notification Test
=========================================

📤 Sending notification with payload:
{
  "notificationType": "info",
  "notificationTitle": "Direct Backend Test",
  "notificationBody": "This is a test notification...",
  "targetAudience": "all",
  "priority": "normal"
}

📡 Response Status: 200

✅ SUCCESS! Notification sent!

📊 Statistics:
   • Targeted: 5 merchants
   • Sent: 4
   • Failed: 1
   • Notification ID: NOTIF_1732357200000_abc123

📱 CHECK YOUR IPHONE NOW! 🔔
   You should receive a notification within 3 seconds.
```

**On iPhone:**
- New notification appears
- Title: "Direct Backend Test"
- Message matches script

---

### Test 3: Verify in Database

**Check notification logs:**
```bash
aws dynamodb scan \
  --table-name WizzCentral_Merchant_Notification_Logs \
  --profile wizz-drivers-ghayth-dev \
  --limit 5 \
  --query 'Items[*].[notificationId.S, timestamp.N, title.S, sentCount.N]' \
  --output table
```

**Expected:**
- Should see your test notifications logged
- Timestamp should be recent
- sentCount > 0

---

## 🔍 If Notifications Don't Appear on iPhone

### Check 1: iPhone Notification Settings
```
Settings → Notifications → WhizzMerchants
• Allow Notifications: ON
• Lock Screen: ON
• Notification Center: ON
• Banners: ON
• Sounds: ON
```

### Check 2: FCM Token Registered
```bash
# Check if your device token is registered
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --profile wizz-drivers-ghayth-dev \
  --query 'Items[*].[businessId.S, platform.S, isActive.BOOL]' \
  --output table
```

**If empty**: Your iPhone app hasn't registered its FCM token yet.

**Solution**: 
- Make sure you're logged into WhizzMerchants app
- Check Flutter logs for: `✅ FCM token saved to backend`
- May need to restart app or re-login

### Check 3: Backend Logs
Look at WizzCentral server terminal for:
```
📢 Sending information notification to merchants
🎯 Getting target merchants for audience: all
✅ Found X device tokens
🔔 Sending FCM notifications
```

### Check 4: FCM_SERVER_KEY
```bash
# Check if FCM key is set
grep FCM_SERVER_KEY /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env
```

Should output: `FCM_SERVER_KEY=AIza...` (long key)

If missing, add it to `.env` file.

---

## 📱 Expected iPhone Behavior

### Lock Screen (App Closed)
```
┌─────────────────────────────────────┐
│ WhizzMerchants         Now          │
│ ─────────────────────────────────   │
│ ℹ️ Test from WizzCentral           │
│    Testing push notifications to    │
│    iPhone                           │
└─────────────────────────────────────┘
```

### Banner (App Open)
- Notification slides down from top
- Stays for 3-5 seconds
- Can be swiped away

### Notification Center
- Swipe down from top
- Should see under "WhizzMerchants"
- Can tap to open app

### App Badge
- Red badge number on app icon (if configured)

---

## 🎯 Quick Test Commands

### Test Frontend
```bash
# Open browser to promotions page
open "http://localhost:3000/frontend/pages/promotions.html"
```

### Test Backend
```bash
# Send test notification via backend
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node test_backend_notification.js
```

### Check Logs
```bash
# Check notification logs
aws dynamodb scan \
  --table-name WizzCentral_Merchant_Notification_Logs \
  --profile wizz-drivers-ghayth-dev \
  --limit 3

# Check device tokens
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --profile wizz-drivers-ghayth-dev \
  --limit 3
```

### Check Server Status
```bash
curl http://localhost:3000/health
```

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ "Send to Merchants" button opens modal
2. ✅ Form submits without errors
3. ✅ Backend logs show: "✅ Found X device tokens"
4. ✅ Backend logs show: "🔔 Sending FCM notifications"
5. ✅ Success alert shows delivery stats
6. ✅ **iPhone receives notification within 3 seconds**
7. ✅ Notification title/message are correct
8. ✅ Tapping notification opens WhizzMerchants app
9. ✅ Notification logged in DynamoDB

---

## 📞 Need Help?

**Check these files:**
- Full guide: `SEND_TO_MERCHANTS_TESTING_GUIDE.md`
- Logic explanation: `MERCHANT_NOTIFICATION_SYSTEM_EXPLANATION.md`
- Quick reference: `SEND_TO_MERCHANTS_QUICK_REFERENCE.md`

**Common Issues:**
- AWS credentials expired → `aws sso login --profile wizz-drivers-ghayth-dev`
- No device tokens → Re-login to WhizzMerchants app
- FCM key missing → Add to `.env` file
- Server not running → `node local-dev-server.js`

---

**Last Updated**: November 23, 2025  
**Status**: Ready for testing 🚀
