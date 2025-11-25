# UI Notification Test Guide

## Current Status
✅ WizzCentral server running on port 3000
✅ Backend notification API tested successfully
✅ iPhone received test notification
✅ "Send to Merchants" button exists in promotions page
⏳ **NEXT STEP: Test from UI**

## Test Steps

### 1. Open Promotions Page
URL: http://localhost:3000/pages/promotions.html

### 2. Login (if needed)
- Use your WizzCentral admin credentials
- The page should load merchant discounts automatically

### 3. Click "Send to Merchants" Button
- Located in the page header (purple/tertiary colored button)
- Button text: "📣 Send to Merchants"

### 4. Fill the Modal Form
**Test Configuration:**
```
Notification Type: ℹ️ Information
Title: UI Test Notification
Body: This is a test from the WizzCentral UI
Target Audience: All Merchants
Priority: Normal
Send Time: Immediately
```

### 5. Click "Send Notification"
- Should show loading spinner
- Should display success alert with stats

### 6. Check iPhone
- WhizzMerchants app should receive the notification
- Notification should appear in iOS notification center

## Expected Results

### Success Response
```json
{
  "success": true,
  "targeted": 4,
  "sent": 1,
  "failed": 0,
  "message": "Notification sent successfully"
}
```

### What Should Happen
1. ✅ Modal opens when button is clicked
2. ✅ Form validation works
3. ✅ API request sent with authentication header
4. ✅ Success alert displays with stats
5. ✅ iPhone receives notification

## Debug Checklist

If modal doesn't open:
- [ ] Check browser console for errors (F12)
- [ ] Verify `openMerchantInfoModal` function exists
- [ ] Check if modal element has `id="merchantInfoNotificationModal"`

If API call fails:
- [ ] Check Network tab in browser DevTools
- [ ] Verify Authorization header is present
- [ ] Check server logs in terminal
- [ ] Verify AWS SSO session is active

If notification doesn't arrive:
- [ ] Check server response (should show sent: 1)
- [ ] Verify FCM token exists in DynamoDB
- [ ] Check WhizzMerchants app is in background
- [ ] Verify iPhone has internet connection

## Quick Commands

### Check AWS SSO Status
```bash
aws sts get-caller-identity --profile wizz-drivers-ghayth-dev
```

### Refresh AWS SSO (if expired)
```bash
aws sso login --profile wizz-drivers-ghayth-dev
```

### Check Server Status
```bash
lsof -i :3000
```

### Restart Server (if needed)
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node local-dev-server.js
```

## Test Data

The system currently has:
- **4 merchants** in DynamoDB (WhizzMerchants_Businesses)
- **1 active FCM token** (Ghayth's iPhone)
- **5 merchant discounts**

When you send to "All Merchants", it will:
- Target: 4 merchants
- Send: 1 notification (only Ghayth's iPhone has token)
- Failed: 0

## Next Steps After UI Test

1. ✅ Verify notification appears on iPhone
2. 📸 Take screenshot of success alert
3. 📝 Document any issues encountered
4. 🎉 Mark UI test as complete

---
**Status**: Ready to test from UI
**Server**: http://localhost:3000
**Test Page**: http://localhost:3000/pages/promotions.html
