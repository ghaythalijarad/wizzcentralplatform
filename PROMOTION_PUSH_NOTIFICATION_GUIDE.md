# 🔔 Push Notification System for Promotions - Complete Implementation Guide

## Overview

This guide explains how to send push notifications to WhizzMerchants app when creating promotions from the WhizzCentralPlatform.

## Architecture

```
WhizzCentralPlatform (Web)
    ↓
Create Promotion with Push Notification Toggle
    ↓
Frontend sends campaign data + notification preferences
    ↓
Backend Lambda: send-promotion-push-notification
    ↓
Query WhizzMerchants_DeviceTokens DynamoDB table
    ↓
Send FCM push notifications to all merchant devices
    ↓
WhizzMerchants app receives notification
```

---

## 📱 Frontend Changes (COMPLETED ✅)

### File: `frontend/pages/promotions.html`

**Added Features:**
1. ✅ **Push Notification Toggle** - Checkbox to enable/disable push notifications
2. ✅ **Notification Title Field** - Custom title for the notification (optional)
3. ✅ **Notification Message Field** - Custom message (max 150 characters, optional)
4. ✅ **Toggle Functionality** - Show/hide notification options based on checkbox state
5. ✅ **Form Submission Handler** - Extract push notification data and send to backend

**UI Location:**
- In the campaign creation modal
- After the "Settings" section
- New section: "Push Notifications" with bell icon

**Default Behavior:**
- Checkbox is **checked by default**
- If no custom title: uses campaign name
- If no custom message: generates from discount value

---

## 🖥️ Backend Implementation

### File: `backend/lambda/send-promotion-push-notification.js`

**Functionality:**
- ✅ Query `WhizzMerchants_DeviceTokens` DynamoDB table
- ✅ Filter for active merchant devices
- ✅ Send FCM push notifications to all active merchants
- ✅ Support both iOS (APNS via FCM) and Android (FCM)
- ✅ Batch processing with error tracking
- ✅ Graceful error handling (non-blocking)

**Environment Variables:**
- `DEVICE_TOKENS_TABLE`: `WhizzMerchants_DeviceTokens`
- `FCM_SERVER_KEY`: Firebase Cloud Messaging Server Key (required)

---

## 🚀 Deployment Steps

### Step 1: Deploy Lambda Function

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./deploy-promotion-push-notification.sh
```

### Step 2: Configure FCM Server Key

You need to get the FCM Server Key from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your WhizzMerchants project
3. Go to **Project Settings** → **Cloud Messaging**
4. Copy the **Server key** (Legacy)

Then set it as environment variable:

```bash
aws lambda update-function-configuration \
  --function-name whizz-central-send-promotion-notification \
  --environment Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY_HERE} \
  --region us-east-1
```

### Step 3: Configure API Gateway

Add a new endpoint to your API Gateway:

1. **Resource**: `/send-promotion-notification`
2. **Method**: `POST`
3. **Integration Type**: Lambda Function
4. **Lambda Function**: `whizz-central-send-promotion-notification`
5. **CORS**: Enable (already handled in Lambda response)

**AWS CLI command:**

```bash
# Get your API Gateway REST API ID
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='WhizzCentralPlatformAPI'].id" --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/'].id" --output text)

# Create resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part send-promotion-notification \
  --query 'id' --output text)

# Create POST method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --authorization-type AWS_IAM

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:whizz-central-send-promotion-notification/invocations

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

### Step 4: Update Frontend Configuration

Update `frontend/config.js` to include the API endpoint:

```javascript
window.CONFIG = {
    // ...existing config...
    API_ENDPOINT: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
};
```

---

## 🧪 Testing

### Test 1: Create Campaign with Push Notification

1. Open WhizzCentralPlatform: `http://localhost:8080/frontend/pages/promotions.html`
2. Click **"Create Campaign"** button
3. Fill in campaign details:
   - Name: "Summer Sale"
   - Discount Type: Percentage
   - Discount Value: 25
   - etc.
4. In the **"Push Notifications"** section:
   - ✅ Ensure "Send push notification to merchants" is checked
   - (Optional) Add custom title: "🎉 New Summer Sale!"
   - (Optional) Add custom message: "Get 25% off on all orders this summer!"
5. Click **"Create Campaign"**

### Expected Result:

```
📝 Creating campaign with data: {...}
📱 Push notification settings: {sendPushNotification: true, ...}
✅ Campaign created successfully
📱 Sending push notifications to merchants...
✅ Push notifications sent successfully
Success: Campaign created successfully! Push notifications sent to merchants.
```

### Test 2: Check Merchant App

On a device with WhizzMerchants app installed and logged in:

1. The merchant should receive a push notification
2. Notification should display:
   - Title: Your custom title or campaign name
   - Message: Your custom message or generated message
3. Tapping the notification opens the WhizzMerchants app

### Test 3: Check DynamoDB

Verify device tokens exist:

```bash
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --filter-expression "isActive = :active" \
  --expression-attribute-values '{":active": {"BOOL": true}}' \
  --region us-east-1
```

### Test 4: Check CloudWatch Logs

```bash
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow
```

Look for:
```
📱 Promotion Push Notification Request: {...}
📱 Found X active merchant devices
✅ Notification results: Y sent, Z failed
```

---

## 📊 Notification Payload Structure

The notification sent to merchants includes:

```json
{
  "notification": {
    "title": "🎉 New Summer Sale!",
    "body": "Get 25% off on all orders this summer!",
    "sound": "default",
    "badge": 1
  },
  "data": {
    "campaignId": "campaign_123",
    "type": "promotion",
    "notificationType": "promotion",
    "discountType": "percentage",
    "discountValue": 25,
    "minimumOrderValue": 0,
    "validUntil": "2025-12-31",
    "timestamp": "2025-11-22T10:30:00.000Z"
  }
}
```

---

## 🔧 Troubleshooting

### Issue 1: No Push Notifications Sent

**Check:**
1. FCM_SERVER_KEY is configured correctly
2. Device tokens exist in DynamoDB table
3. Device tokens are marked as `isActive: true`
4. API Gateway endpoint is configured correctly

**Debug:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow

# Check device tokens
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens --region us-east-1
```

### Issue 2: "FCM_SERVER_KEY not configured" Warning

**Solution:**
Add the FCM Server Key:

```bash
aws lambda update-function-configuration \
  --function-name whizz-central-send-promotion-notification \
  --environment Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FCM_SERVER_KEY=YOUR_KEY} \
  --region us-east-1
```

### Issue 3: Push Notification Toggle Not Working

**Check:**
1. Browser console for JavaScript errors
2. Verify `setupPushNotificationToggle()` is called
3. Check if IDs match: `sendPushNotification` and `pushNotificationOptions`

**Debug:**
```javascript
// Open browser console
const checkbox = document.getElementById('sendPushNotification');
const options = document.getElementById('pushNotificationOptions');
console.log('Checkbox:', checkbox);
console.log('Options:', options);
```

### Issue 4: 403 Error from API Gateway

**Check:**
1. Cognito credentials are valid
2. API Gateway has proper IAM authorization
3. Lambda has permission to be invoked by API Gateway

**Solution:**
```bash
# Add Lambda permission for API Gateway
aws lambda add-permission \
  --function-name whizz-central-send-promotion-notification \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --region us-east-1
```

---

## 📝 Code References

### Frontend Code Location
- **HTML**: `whizzCentralPlatform/frontend/pages/promotions.html`
  - Lines 1123-1156: Push Notification UI section
  - Lines ~1740: Push notification toggle JavaScript
  - Lines ~1430: Updated createCampaign method

### Backend Code Location
- **Lambda**: `whizzCentralPlatform/backend/lambda/send-promotion-push-notification.js`
- **Deployment Script**: `whizzCentralPlatform/backend/deploy-promotion-push-notification.sh`

### Related Infrastructure
- **Device Tokens Table**: `WhizzMerchants_DeviceTokens` (DynamoDB)
- **WhizzMerchants App**: `whizzMerchants/frontend/lib/services/firebase_messaging_service.dart`

---

## 🎯 Success Criteria

✅ **Frontend:**
- Checkbox appears in campaign creation form
- Toggle shows/hides notification options
- Custom title and message fields work
- Form data includes push notification settings

✅ **Backend:**
- Lambda function deployed successfully
- FCM_SERVER_KEY configured
- API Gateway endpoint responding
- CloudWatch logs show notification attempts

✅ **WhizzMerchants App:**
- Merchant receives push notification
- Notification displays correctly
- Tapping opens app

---

## 🚀 Next Steps

1. **Deploy the Lambda function** using the provided script
2. **Configure FCM Server Key** from Firebase Console
3. **Set up API Gateway endpoint** 
4. **Test from WhizzCentralPlatform** promotions page
5. **Monitor CloudWatch logs** for any issues

---

## 📞 Support

If you encounter issues:

1. Check CloudWatch logs
2. Verify DynamoDB has device tokens
3. Ensure FCM Server Key is valid
4. Test with a single device first
5. Check WhizzMerchants app logs

---

## 🔗 Related Documentation

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [WhizzMerchants Push Notification Infrastructure](../whizzMerchants/SOLID_PUSH_NOTIFICATION_SYSTEM.md)
- [DynamoDB Device Tokens Schema](../whizzMerchants/FCM_TOKEN_SAVE_COMPLETE.md)

---

**Last Updated:** November 22, 2025
**Status:** ✅ Ready for Testing
