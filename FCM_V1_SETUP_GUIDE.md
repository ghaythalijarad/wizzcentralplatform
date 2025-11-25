# 🔥 Firebase Cloud Messaging V1 Setup Guide

**Date**: November 22, 2025  
**API Version**: Firebase Cloud Messaging API V1 (Modern, Recommended)  
**Authentication**: Service Account (OAuth2)

---

## 🎯 Why FCM V1?

- ✅ **Modern API**: Recommended by Firebase
- ✅ **More Secure**: Uses OAuth2 instead of static Server Key
- ✅ **Better Features**: Enhanced targeting, analytics, and reliability
- ✅ **Future-Proof**: Legacy API deprecated June 20, 2024

---

## 📋 Setup Steps (5 Minutes)

### Step 1: Download Firebase Service Account Key

1. **Open Firebase Console**:
   ```
   https://console.firebase.google.com/
   ```

2. **Select Your Project**:
   - Choose "**wizz business**" (or your WhizzMerchants project)

3. **Navigate to Service Accounts**:
   - Click **Settings ⚙️** (gear icon in left sidebar)
   - Select **"Project settings"**
   - Go to **"Service accounts"** tab

4. **Generate New Private Key**:
   - Click the **"Generate new private key"** button
   - Click **"Generate key"** in the confirmation dialog
   - A JSON file will download automatically

5. **Save the File**:
   ```bash
   # Save as:
   /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend/lambda/firebase-service-account.json
   ```

### Step 2: Deploy the Updated Lambda Function

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./deploy-fcm-v1-update.sh
```

This script will:
- ✅ Extract credentials from the service account JSON
- ✅ Update Lambda function with FCM V1 code
- ✅ Configure environment variables
- ✅ Set Firebase Project ID, Client Email, and Private Key

### Step 3: Test the System

```bash
./quick-test-push.sh
```

You should see:
```json
{
  "success": true,
  "message": "Push notifications sent to 6 merchants",
  "sent": 6,
  "failed": 0,
  "total": 6
}
```

---

## 🔍 What Changed?

### Old Implementation (Legacy API):
- Used static **Server Key** (AAAA...)
- Simple but deprecated
- Less secure

### New Implementation (V1 API):
- Uses **Service Account** with OAuth2
- Creates JWT tokens on-the-fly
- More secure and modern
- Better error handling

---

## 📁 Files Created/Updated

### New Files:
```
backend/
├── lambda/
│   └── send-promotion-push-notification-v1.js  ← New V1 implementation
├── get-firebase-service-account.sh             ← Guide script
├── deploy-fcm-v1-update.sh                     ← Deployment script
└── FCM_V1_SETUP_GUIDE.md                       ← This file
```

### Service Account File (You need to download):
```
backend/lambda/firebase-service-account.json    ← Download from Firebase
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Store service account as Lambda environment variable
- Keep the JSON file out of git (.gitignore)
- Rotate keys periodically
- Use least-privilege IAM policies

### ❌ DON'T:
- Commit service account JSON to git
- Share the private key
- Use the same key in multiple places

---

## 📊 Environment Variables

The Lambda function now uses these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DEVICE_TOKENS_TABLE` | WhizzMerchants_DeviceTokens | DynamoDB table name |
| `FIREBASE_PROJECT_ID` | wizz-business-app | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | firebase-adminsdk-xxxxx@... | Service account email |
| `FIREBASE_PRIVATE_KEY` | -----BEGIN PRIVATE KEY----- | Service account private key |

---

## 🧪 Testing

### Test 1: Lambda Direct Invocation
```bash
./quick-test-push.sh
```

**Expected Output**:
```
✅ FCM V1 notification sent successfully
📱 Push notifications sent to 6 merchants
```

### Test 2: From WhizzCentralPlatform UI

1. Open: http://localhost:8080/frontend/pages/promotions.html
2. Click "Create Campaign"
3. Fill in campaign details
4. ✅ Check "Send push notification to merchants"
5. Click "Create Campaign"
6. Verify notifications received on WhizzMerchants app

### Test 3: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/whizz-central-send-promotion-notification \
  --follow \
  --region us-east-1
```

**Look for**:
```
📱 FCM V1 notification sent successfully
✅ Notification results: 6 sent, 0 failed
```

---

## 🆘 Troubleshooting

### Issue: "Firebase service account file not found"
**Solution**: Download the service account JSON from Firebase Console

### Issue: "Failed to get access token"
**Solution**: Check that FIREBASE_PRIVATE_KEY has correct line breaks

### Issue: "No active merchant devices found"
**Solution**: Have merchants log in to WhizzMerchants app to register device tokens

### Issue: "Invalid token"
**Solution**: 
- Verify device tokens are valid
- Check Firebase project ID is correct
- Ensure merchants have latest app version

---

## 📱 How It Works

```
WhizzCentralPlatform UI
         ↓
   Create Campaign
         ↓
   JavaScript calls API Gateway
         ↓
   Lambda Function Triggered
         ↓
   Query DynamoDB for Device Tokens
         ↓
   Generate OAuth2 Access Token
     (using Service Account)
         ↓
   Call FCM V1 API
   POST /v1/projects/{project}/messages:send
         ↓
   Firebase delivers to devices
         ↓
   WhizzMerchants App receives notification
```

---

## 🎨 Notification Payload (FCM V1)

```json
{
  "message": {
    "token": "device_token_here",
    "notification": {
      "title": "🎉 New Promotion: 25% Off!",
      "body": "Check out this amazing deal!"
    },
    "data": {
      "campaignId": "campaign_123",
      "type": "promotion",
      "discountValue": "25",
      "discountType": "percentage"
    },
    "android": {
      "priority": "high",
      "notification": {
        "sound": "default",
        "channel_id": "promotions"
      }
    },
    "apns": {
      "payload": {
        "aps": {
          "alert": {
            "title": "🎉 New Promotion",
            "body": "Check out this amazing deal!"
          },
          "sound": "default",
          "badge": 1
        }
      }
    }
  }
}
```

---

## 🚀 Quick Start Commands

### Complete Setup (First Time):
```bash
cd backend

# Download service account from Firebase Console
# Save as: lambda/firebase-service-account.json

# Deploy FCM V1 update
./deploy-fcm-v1-update.sh

# Test
./quick-test-push.sh
```

### Test Push Notification:
```bash
./quick-test-push.sh
```

### View Logs:
```bash
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow
```

### Open WhizzCentralPlatform:
```bash
open http://localhost:8080/frontend/pages/promotions.html
```

---

## ✅ Success Checklist

- [ ] Downloaded service account JSON from Firebase Console
- [ ] Saved JSON file as `lambda/firebase-service-account.json`
- [ ] Ran `./deploy-fcm-v1-update.sh`
- [ ] Tested with `./quick-test-push.sh`
- [ ] Saw "6 sent, 0 failed" in results
- [ ] Verified merchants received notifications
- [ ] Tested from WhizzCentralPlatform UI

---

## 📞 Next Steps

Once setup is complete:

1. **Test from UI**: Create a campaign from WhizzCentralPlatform
2. **Verify Delivery**: Check WhizzMerchants app for notifications
3. **Monitor Logs**: Keep CloudWatch Logs open during testing
4. **Production Ready**: System is ready for live use!

---

## 🎉 Completion

Once you see:
```
✅ Push notifications sent to 6 merchants
sent: 6, failed: 0, total: 6
```

**You're done!** The modern FCM V1 API is fully configured and working.

---

**Questions?** Check CloudWatch Logs or Firebase Console for detailed error messages.

**Last Updated**: November 22, 2025  
**Status**: Ready for FCM V1 Migration  
**Next Action**: Download service account JSON and run deploy script
