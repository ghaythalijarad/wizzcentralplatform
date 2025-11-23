# 🔔 Promotion Push Notifications - Quick Reference

## ⚡ Quick Start (5 Minutes)

### 1. Deploy Backend
```bash
cd whizzCentralPlatform/backend
./deploy-promotion-push-notification.sh
```

### 2. Configure FCM Key
```bash
aws lambda update-function-configuration \
  --function-name whizz-central-send-promotion-notification \
  --environment Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FCM_SERVER_KEY=YOUR_FCM_KEY} \
  --region us-east-1
```

### 3. Test System
```bash
./test-promotion-push-notification.sh
```

### 4. Create Promotion
1. Open: `http://localhost:8080/frontend/pages/promotions.html`
2. Click "Create Campaign"
3. Check ✅ "Send push notification to merchants"
4. Fill form and submit

---

## 📱 UI Features

### Location
**File:** `frontend/pages/promotions.html`
**Section:** Campaign Creation Modal → "Push Notifications"

### Fields
- ✅ **Toggle**: Send push notification to merchants (checked by default)
- 📝 **Title**: Custom notification title (optional, uses campaign name if empty)
- 💬 **Message**: Custom notification message (optional, max 150 chars)

### Default Behavior
- If no title: Uses campaign name
- If no message: Generated from discount (e.g., "🎉 New promotion: 25% off!")

---

## 🖥️ Backend

### Lambda Function
- **Name**: `whizz-central-send-promotion-notification`
- **File**: `backend/lambda/send-promotion-push-notification.js`
- **Runtime**: Node.js 20.x
- **Timeout**: 30 seconds
- **Memory**: 512 MB

### Environment Variables
| Variable | Value | Required |
|----------|-------|----------|
| `DEVICE_TOKENS_TABLE` | `WhizzMerchants_DeviceTokens` | ✅ Yes |
| `FCM_SERVER_KEY` | Your Firebase Server Key | ✅ Yes |

### API Endpoint
- **Path**: `/send-promotion-notification`
- **Method**: `POST`
- **Auth**: AWS_IAM (Cognito)

---

## 🧪 Testing

### Quick Test
```bash
cd whizzCentralPlatform/backend
./test-promotion-push-notification.sh
```

### Manual Test
```bash
# 1. Check device tokens
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens --region us-east-1

# 2. Invoke Lambda
aws lambda invoke \
  --function-name whizz-central-send-promotion-notification \
  --payload '{"httpMethod":"POST","body":"{\"title\":\"Test\",\"message\":\"Hello\"}"}' \
  --region us-east-1 \
  output.json

# 3. Check logs
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow
```

---

## 🔧 Troubleshooting

### No notifications sent?
```bash
# Check device tokens exist
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens --region us-east-1

# Check Lambda logs
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow

# Verify FCM key
aws lambda get-function-configuration \
  --function-name whizz-central-send-promotion-notification \
  --query 'Environment.Variables.FCM_SERVER_KEY' \
  --region us-east-1
```

### API Gateway 403 error?
```bash
# Add permission
aws lambda add-permission \
  --function-name whizz-central-send-promotion-notification \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --region us-east-1
```

---

## 📊 Success Metrics

### Frontend
✅ Push notification checkbox visible  
✅ Toggle shows/hides options  
✅ Form submits with notification data  
✅ Success message includes "Push notifications sent"

### Backend
✅ Lambda logs show device token count  
✅ CloudWatch shows FCM requests  
✅ Response includes `sent` count  
✅ No errors in logs

### Mobile App
✅ Merchant receives notification  
✅ Notification displays correctly  
✅ Tapping opens WhizzMerchants app

---

## 📞 Get FCM Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select WhizzMerchants project
3. ⚙️ Project Settings → Cloud Messaging
4. Copy "Server key" (Legacy)
5. Paste in Lambda environment variable

---

## 📝 Notification Format

```json
{
  "title": "🎉 Summer Sale!",
  "message": "Get 25% off on all orders",
  "data": {
    "campaignId": "campaign_123",
    "type": "promotion",
    "discountType": "percentage",
    "discountValue": 25
  }
}
```

---

## 📚 Full Documentation

See: `PROMOTION_PUSH_NOTIFICATION_GUIDE.md`

---

**Status:** ✅ Ready to Deploy  
**Last Updated:** November 22, 2025
