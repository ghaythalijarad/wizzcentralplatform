# 🔥 FCM Server Key Setup Guide

## Problem
Your push notifications are being "simulated" because the `FCM_SERVER_KEY` environment variable is not configured. Without this key, the system cannot actually send notifications via Firebase Cloud Messaging.

## Solution: Get Your FCM Server Key

### Step 1: Access Firebase Console
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Select your project: **wizz-business-app**

### Step 2: Get Server Key
1. Click on the **⚙️ Settings** icon (gear) in the left sidebar
2. Select **Project settings**
3. Go to the **Cloud Messaging** tab
4. Look for **Server key** (also called "Legacy server key")
5. Copy the key - it should look like:
   ```
   AAAAxxxxxxx:APA91bFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Add to Environment File
1. Open the file: `/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/.env`
2. Replace `YOUR_FCM_SERVER_KEY_HERE` with your actual key:
   ```env
   FCM_SERVER_KEY=AAAAxxxxxxx:APA91bFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Save the file

### Step 4: Restart Server
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
pkill -f "node.*local-dev-server.js"
node local-dev-server.js > server.log 2>&1 &
```

### Step 5: Test Notification
```bash
node test_backend_notification.js
```

## Expected Result
After adding the FCM key, you should see:
- ✅ "Sent: 6" (not "simulating")
- 📱 Notification appears on your iPhone within 3 seconds
- 🔔 You'll hear the notification sound

## Troubleshooting

### If you still don't get notifications:

#### 1. Check FCM Key is Loaded
```bash
# The server should log FCM configuration status on startup
tail -50 server.log | grep -i fcm
```

#### 2. Verify Device Token
```bash
# Check that your iPhone's device token is in the database
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens \\
  --filter-expression "platform = :p" \\
  --expression-attribute-values '{":p":{"S":"ios"}}' \\
  --profile wizz-drivers-ghayth-dev --region us-east-1 \\
  --max-items 5
```

#### 3. Check App is in Background
- Push notifications only appear when the app is in the **background** or **closed**
- If the app is in foreground, notifications won't show (iOS default behavior)
- Solution: Press home button to minimize the app, then test

#### 4. Check Notification Permissions
- Go to iPhone Settings > WhizzMerchants
- Ensure **Notifications** are enabled
- Enable **Sound**, **Badge**, and **Banner**

#### 5. Enable FCM Logging
Edit `merchant-info-notification.js` and add logging before FCM call:
```javascript
console.log('🔥 Sending to FCM with key:', FCM_SERVER_KEY ? 'CONFIGURED ✅' : 'NOT SET ❌');
console.log('📱 Tokens:', tokens.length);
```

## Alternative: Use WhizzMerchants Test Script

The WhizzMerchants app has its own notification testing script:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/backend
node test_push_notification.js
```

This script already has the FCM configuration and can help verify if notifications work.

## Security Note
⚠️ **NEVER commit the `.env` file with real keys to git!**

The `.env` file is already in `.gitignore`. Keep it local only.

---

**Quick Start Command:**
```bash
# 1. Get FCM key from Firebase Console
# 2. Add to .env file
# 3. Run these commands:
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
pkill -f "node.*local-dev-server.js" && node local-dev-server.js > server.log 2>&1 &
sleep 3 && node test_backend_notification.js
```
