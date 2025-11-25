# 🎯 WizzCentral UI - Push Notification Testing Guide

## 📅 Date: November 23, 2025

---

## ✅ SYSTEM STATUS

All components are working:
- ✅ Firebase initialized in WhizzMerchants app
- ✅ FCM token saved to DynamoDB (1 device)
- ✅ WizzCentral server running on port 3000
- ✅ Firebase Admin SDK initialized
- ✅ Backend test successful (notification received!)

**NOW TEST FROM UI** → http://localhost:3000/pages/promotions.html

---

## 📱 Step-by-Step UI Testing

### Step 1: Open Promotions Page

1. **Navigate to:** http://localhost:3000/pages/promotions.html
2. **Login if needed:**
   - Email: Your WizzCentral admin credentials
   - Password: Your password

### Step 2: Click "Send to Merchants" Button

1. **Look for the button** in the top-right corner of the page
2. **Button text:** "Send to Merchants" or "📢 Send to Merchants"
3. **Click it** → Modal should open

### Step 3: Fill Out Notification Form

**In the modal that opens:**

#### Basic Information:
- **Notification Title:** `Test from WizzCentral UI`
- **Notification Body:** `This is a test notification sent from the WizzCentral web interface. If you receive this, the UI integration is working perfectly!`

#### Notification Type:
- Select: **ℹ️ Information** (or any type you want)

#### Target Audience:
- Select: **All Merchants** (this will target your test merchant)

#### Priority:
- Select: **Normal** (or High if you want immediate delivery)

#### Advanced Options (Optional):
- Leave blank for basic test

### Step 4: Preview Notification

The modal should show a **live preview** at the bottom:
```
┌─────────────────────────────────┐
│ WIZZ Business Manager          │
├─────────────────────────────────┤
│ Test from WizzCentral UI       │
│                                 │
│ This is a test notification    │
│ sent from the WizzCentral web  │
│ interface...                   │
└─────────────────────────────────┘
```

### Step 5: Send Notification

1. **Click "Send Notification"** button at bottom of modal
2. **Watch for:**
   - Loading spinner
   - Success message: "Notification sent successfully!"
   - Statistics: "Sent to X merchants"

### Step 6: Check iPhone

**Within 3 seconds, you should receive:**
- 🔔 Push notification on your iPhone
- **Title:** Test from WizzCentral UI
- **Body:** This is a test notification sent from the WizzCentral web interface...
- **Sound:** Default notification sound
- **Badge:** App icon badge increases

---

## 🔍 Troubleshooting UI Issues

### Issue 1: "Send to Merchants" Button Not Visible

**Solution:**
1. Check browser console for errors (F12)
2. Refresh page: `Cmd + Shift + R` (hard refresh)
3. Clear cache and reload

### Issue 2: Modal Doesn't Open

**Solution:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if `openMerchantInfoModal` function exists:
   ```javascript
   window.openMerchantInfoModal
   ```
4. Should see: `function openMerchantInfoModal()`

### Issue 3: Send Button Doesn't Work

**Check:**
1. Browser console for errors
2. Network tab (F12 → Network)
3. Should see POST request to `/api/merchants/send-info-notification`
4. Response should be 200 OK

### Issue 4: No Notification Received

**Check:**
1. Server console logs:
   ```
   📢 Merchant Information Notification Handler invoked
   🎯 Target merchants: 4
   📱 Device tokens found: 1
   📤 Sending notifications to 1 devices
   ✅ Batch 1 complete: 1 success, 0 failed
   ```

2. If "Device tokens found: 0":
   - Check DynamoDB table is not empty
   - Token might have been cleared - logout/login again

---

## 🎨 Testing Different Notification Types

### 1. Information Notification
```
Type: ℹ️ Information
Title: "Platform Update Available"
Body: "A new version of the merchant app is available with bug fixes and improvements."
Priority: Normal
```

### 2. Warning Notification
```
Type: ⚠️ Warning
Title: "Payment Processing Delay"
Body: "We're experiencing a delay in payment processing. Your payouts may be delayed by 24 hours."
Priority: High
```

### 3. Urgent Notification
```
Type: 🚨 Urgent
Title: "Immediate Action Required"
Body: "Please verify your business license expires soon. Update it now to avoid service interruption."
Priority: High
```

### 4. Feature Notification
```
Type: ✨ New Feature
Title: "Introducing Analytics Dashboard"
Body: "Track your sales, orders, and customer trends with our new analytics dashboard. Check it out now!"
Priority: Normal
```

### 5. Policy Notification
```
Type: 📋 Policy Update
Title: "Updated Terms of Service"
Body: "We've updated our Terms of Service. Please review the changes in the app settings."
Priority: Normal
```

---

## 🎯 Testing Different Audiences

### Test 1: All Merchants
```
Target Audience: All Merchants
Expected: 1 notification sent (your test device)
```

### Test 2: By City (if you have city in profile)
```
Target Audience: By City
City: Baghdad (or your merchant's city)
Expected: 1 notification sent
```

### Test 3: By Category
```
Target Audience: By Category
Category: restaurant (or your merchant's type)
Expected: 1 notification sent
```

### Test 4: Active Merchants
```
Target Audience: Active Merchants
Expected: 0-1 notifications (depends on recent orders)
```

---

## 📊 Expected Console Logs

### In Browser Console (F12):
```javascript
✅ WizzMerchantDiscountsAPI loaded and available globally
📢 Opening merchant info notification modal...
📤 Sending merchant notification...
✅ Notification sent successfully
{
  "success": true,
  "message": "Push notifications sent to merchants",
  "targeted": 4,
  "sent": 1,
  "failed": 0
}
```

### In Server Terminal:
```
📢 Merchant Information Notification Handler invoked
🎯 Getting target merchants for audience: all
📊 Total merchants in database: 4
✅ Filtered to 4 merchants
🎯 Target merchants: 4
📱 Device tokens found: 1
📤 Sending notifications to 1 devices via Firebase Admin SDK
📨 Sending batch 1 with 1 tokens
✅ Batch 1 complete: 1 success, 0 failed
📊 Final results: 1 sent, 0 failed
```

---

## ✅ Success Checklist

Test each of these and mark as complete:

- [ ] Promotions page loads successfully
- [ ] "Send to Merchants" button visible
- [ ] Click button → Modal opens
- [ ] Fill out form with test data
- [ ] Preview shows correct notification
- [ ] Click "Send Notification"
- [ ] Success message appears
- [ ] Statistics show "Sent: 1"
- [ ] iPhone receives push notification within 3 seconds
- [ ] Notification has correct title and body
- [ ] Sound plays
- [ ] Badge increments

**If all checked:** 🎉 **UI INTEGRATION COMPLETE!** 🎉

---

## 🚀 Next Steps

Once UI testing is successful:

### 1. Test Multiple Devices
- Add more merchants
- Have them login to WhizzMerchants app
- Tokens will be saved
- Send notifications to all

### 2. Test Scheduling
- Fill form with future date/time
- Click Send
- Notification should be scheduled (not sent immediately)

### 3. Test Different Types
- Send information notification
- Send warning notification
- Send urgent notification
- Verify each has correct appearance

### 4. Production Deployment
- Deploy Lambda functions to AWS
- Update API Gateway endpoints
- Test from production domain
- Monitor CloudWatch logs

---

## 📝 Quick Reference

| Component | Status | URL/Command |
|-----------|--------|-------------|
| WizzCentral UI | ✅ Running | http://localhost:3000/pages/promotions.html |
| Backend Server | ✅ Running | http://localhost:3000 |
| Firebase Admin SDK | ✅ Initialized | Server console |
| DynamoDB Tokens | ✅ Has Data | 1 device token |
| Test Merchant | ✅ Logged In | iPhone device |

---

## 🔔 Expected Notification Appearance

**On iPhone Lock Screen:**
```
┌─────────────────────────────────┐
│ 🔔 WIZZ Business Manager       │
├─────────────────────────────────┤
│ Test from WizzCentral UI       │
│                                 │
│ This is a test notification    │
│ sent from the WizzCentral web  │
│ interface. If you receive      │
│ this, the UI integration is    │
│ working perfectly!             │
│                                 │
│ now                            │
└─────────────────────────────────┘
```

**In Notification Center:**
- Same format
- Can swipe to clear
- Tapping opens WhizzMerchants app

**On App Icon:**
- Badge count increases
- Shows unread notification count

---

**Ready to test!** 🎯

**Current Status:** Everything is configured and working. Just need to test from the UI!

**Date:** November 23, 2025
**Testing:** UI integration test ready
