# 🔥 Firebase Cloud Messaging V1 API Setup Guide

**Project**: wizz business  
**Date**: November 22, 2025  
**Status**: FCM API Enabled ✅ - Need Service Account Key

---

## ✅ What's Already Done

1. **Firebase Cloud Messaging API V1** is ENABLED in Google Cloud Console
2. **Service Account exists**: `firebase-adminsdk-fbsvc@wizz-business-app.iam.gserviceaccount.com`
3. **Lambda function code updated** to use FCM V1 API with JWT authentication
4. **Deployment script ready**: `deploy-fcm-v1-update.sh`

---

## 📋 What You Need to Do Now (5 Minutes)

### Step 1: Download Firebase Service Account Key 🔑

#### A. Open Firebase Console
1. Go to: **https://console.firebase.google.com/**
2. Select: **"wizz business"** project
   - Or whichever project your WhizzMerchants app uses

#### B. Navigate to Service Accounts Tab
1. Click the **⚙️ Settings** icon (gear icon in left sidebar)
2. Select **"Project settings"**
3. Click on the **"Service accounts"** tab at the top

#### C. You Should See:
```
Firebase Admin SDK
Node.js                      [Dropdown]

firebase-adminsdk-fbsvc@wizz-business-app.iam.gserviceaccount.com

⚙️ Manage service account permissions

[Generate new private key]  ← CLICK THIS BUTTON
```

#### D. Generate and Download Key
1. Click **"Generate new private key"** button
2. A dialog will appear:
   ```
   Generate new private key?
   
   This key allows access to your project's Firebase services
   from a non-Google environment.
   
   [Cancel]  [Generate key]
   ```
3. Click **"Generate key"**
4. A JSON file will download: `wizz-business-app-firebase-adminsdk-xxxxx-xxxxxxxxx.json`

#### E. Save the File Securely
```bash
# Move the downloaded file to the lambda directory
mv ~/Downloads/wizz-business-app-firebase-adminsdk-*.json \
   /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend/lambda/firebase-service-account.json
```

**⚠️ IMPORTANT**: This file contains sensitive credentials. Never commit it to Git!

---

### Step 2: Deploy Updated Lambda Function 🚀

Once you have the service account JSON file in place:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Deploy the updated Lambda function
./deploy-fcm-v1-update.sh
```

This will:
- ✅ Package the new Lambda code with FCM V1 support
- ✅ Include the Firebase service account credentials
- ✅ Install required npm packages (`googleapis`)
- ✅ Update the Lambda function in AWS
- ✅ Configure environment variables

---

### Step 3: Test Push Notifications 🧪

After deployment completes:

```bash
# Test sending push notifications
./quick-test-push.sh
```

**Expected Success Output**:
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "message": "Push notifications sent to 6 merchants",
    "sent": 6,
    "failed": 0,
    "total": 6
  }
}
```

---

## 🔍 What Changed from Legacy API

### Old Legacy API (DEPRECATED):
```javascript
// Used FCM_SERVER_KEY environment variable
// Simple HTTP POST to fcm.googleapis.com/fcm/send
// Deprecated June 20, 2024
```

### New V1 API (CURRENT):
```javascript
// Uses Firebase Service Account (JSON file)
// JWT-based authentication with Google APIs
// Modern, recommended, and secure
// Endpoint: fcm.googleapis.com/v1/projects/{projectId}/messages:send
```

---

## 📱 How It Works

```
WhizzCentralPlatform
       ↓
  Create Campaign
       ↓
  JavaScript calls API Gateway
       ↓
  API Gateway → Lambda Function
       ↓
  Lambda reads firebase-service-account.json
       ↓
  Generate JWT token using Google APIs
       ↓
  Get OAuth2 access token
       ↓
  Query DynamoDB for device tokens (6 merchants)
       ↓
  Send FCM V1 message to each device
       ↓
  FCM delivers to WhizzMerchants app
       ↓
  Merchants receive notification! 🎉
```

---

## 🔐 Security Notes

### Service Account JSON File Contains:
- `project_id`: Your Firebase project ID
- `private_key`: RSA private key for signing JWTs
- `client_email`: Service account email
- `token_uri`: Google OAuth2 token endpoint

### Security Best Practices:
1. ✅ **Never commit to Git** - Already in `.gitignore`
2. ✅ **Stored only in Lambda layer** - Packaged with deployment
3. ✅ **IAM permissions** - Lambda role has minimal permissions
4. ✅ **Encrypted at rest** - AWS Lambda encrypts function code
5. ✅ **No public access** - Only Lambda function can access

---

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Lambda function shows "Last modified: just now"
- [ ] Test script returns `sent: 6, failed: 0`
- [ ] CloudWatch logs show "Successfully sent FCM notification"
- [ ] No errors in CloudWatch logs
- [ ] Merchants receive test notification on their devices

---

## 🛠️ Troubleshooting

### If you get "Service account file not found":
```bash
# Check if file exists
ls -la backend/lambda/firebase-service-account.json

# If missing, re-download from Firebase Console
```

### If you get "Invalid service account":
```bash
# Verify JSON format
cat backend/lambda/firebase-service-account.json | jq .

# Should show: project_id, private_key, client_email, etc.
```

### If you get "Permission denied":
```bash
# Service account needs FCM permissions
# Go to Google Cloud Console:
# IAM & Admin → Service Accounts → 
# Select firebase-adminsdk → Permissions →
# Ensure "Firebase Cloud Messaging API Admin" role
```

### If deployment fails:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Re-login if needed
aws sso login --profile wizz-drivers-ghayth-dev
```

---

## 📊 File Structure

```
whizzCentralPlatform/backend/
├── lambda/
│   ├── send-promotion-push-notification-v1.js  ✅ NEW (FCM V1 API)
│   ├── firebase-service-account.json           ⬇️ DOWNLOAD THIS
│   └── package.json                            ✅ Updated (added googleapis)
├── deploy-fcm-v1-update.sh                     ✅ NEW
└── quick-test-push.sh                          ✅ Updated
```

---

## 🎯 Success Criteria

You'll know it's working when:

1. **Deployment succeeds**:
   ```
   ✅ Lambda function updated successfully
   ```

2. **Test returns success**:
   ```json
   {
     "sent": 6,
     "failed": 0,
     "total": 6
   }
   ```

3. **CloudWatch logs show**:
   ```
   📱 Sending FCM V1 notification to device: xxx
   ✅ Successfully sent to device 1/6
   ✅ Successfully sent to device 2/6
   ...
   ✅ All 6 notifications sent successfully
   ```

4. **Merchants receive notifications** on their WhizzMerchants app!

---

## 🚀 Next Steps After Success

Once push notifications are working:

1. **Test from UI**:
   - Open: http://localhost:8080/frontend/pages/promotions.html
   - Create a new campaign
   - Check "Send push notification to merchants"
   - Fill in details and create
   - Merchants receive notification instantly!

2. **Monitor in Production**:
   - Check CloudWatch logs regularly
   - Monitor FCM delivery reports
   - Track notification open rates

3. **Add Features**:
   - Scheduled notifications
   - Targeted notifications (by location, etc.)
   - Rich media notifications
   - Action buttons

---

## 📞 Quick Commands Reference

```bash
# Deploy updated Lambda
cd backend && ./deploy-fcm-v1-update.sh

# Test push notifications
./quick-test-push.sh

# View live logs
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow

# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name whizz-central-send-promotion-notification

# Check device tokens
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --filter-expression "isActive = :active" \
  --expression-attribute-values '{":active": {"BOOL": true}}'
```

---

## 📚 Resources

- **Firebase Cloud Messaging V1 Docs**: https://firebase.google.com/docs/cloud-messaging/migrate-v1
- **Google APIs Node.js Client**: https://github.com/googleapis/google-api-nodejs-client
- **Service Account Auth**: https://cloud.google.com/docs/authentication/production
- **FCM Best Practices**: https://firebase.google.com/docs/cloud-messaging/concept-options

---

**You're almost there!** Just download the service account key and run the deployment script! 🎉

**Estimated Time**: 5 minutes  
**Complexity**: Easy (just download a file and run a script)

---

**Last Updated**: November 22, 2025  
**Status**: Ready for Service Account Download
