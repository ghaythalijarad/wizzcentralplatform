# 🚀 Push Notification System - Ready to Test!

**Date**: November 22, 2025  
**Status**: ✅ Fully Deployed & Server Running

---

## ✅ Current Status

### Server Status
- ✅ **Local Server Running** on http://localhost:8080
- ✅ **Promotions Page** accessible at: http://localhost:8080/frontend/pages/promotions.html
- ✅ **Lambda Function** deployed and active
- ✅ **API Gateway** configured and live
- ✅ **FCM Server Key** configured in Lambda
- ✅ **6 Active Merchant Devices** ready to receive notifications

---

## 📱 How to Test Push Notifications

### Option 1: Test from WhizzCentralPlatform UI (Recommended)

1. **Open the Promotions Page** (already open in browser):
   ```
   http://localhost:8080/frontend/pages/promotions.html
   ```

2. **Login** to WhizzCentralPlatform with your credentials

3. **Click "Create Campaign"** button

4. **Fill in the campaign details**:
   - Campaign Title: "Black Friday Sale"
   - Campaign Code: "BLACK50"
   - Discount Type: Percentage
   - Discount Value: 50
   - Start Date: Today
   - End Date: Next week

5. **Push Notification Settings** (already visible):
   - ✅ "Send push notification to merchants" is **checked by default**
   - Optional: Customize notification title (e.g., "🎉 50% Off Black Friday!")
   - Optional: Customize message (e.g., "Amazing deal! 50% off for Black Friday!")

6. **Click "Create Campaign"**

7. **Watch the console** for push notification logs:
   ```
   📱 Sending promotion push notification
   🔗 Using API endpoint: https://570ve00sak.execute-api.us-east-1.amazonaws.com/prod
   📤 Sending to backend
   📡 Response status: 200
   ✅ Push notification response
   ```

### Option 2: Test from Terminal

Run the quick test script:
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./test-push-quick.sh
```

### Option 3: Test with AWS CLI

Direct Lambda invocation:
```bash
aws lambda invoke \
  --function-name whizz-central-send-promotion-notification \
  --payload '{"title":"Test","message":"Test notification","campaignId":"test123"}' \
  --region us-east-1 \
  /tmp/response.json && cat /tmp/response.json
```

---

## 🎯 What to Expect

### On WhizzCentralPlatform (Your Screen)
1. Campaign creation form submits successfully
2. Success message: "Campaign created successfully! Push notifications sent to merchants."
3. Browser console shows push notification request and response

### On WhizzMerchants App (Merchant Devices)
1. Push notification appears on all 6 active merchant devices
2. Notification shows:
   - **Title**: Your custom title or campaign name
   - **Message**: Your custom message or default promotion text
3. Tapping notification opens WhizzMerchants app

### In AWS CloudWatch Logs
View detailed logs:
```bash
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow
```

You should see:
- ✅ Device tokens queried from DynamoDB
- ✅ FCM notifications sent to each device
- ✅ Success/failure status for each device

---

## 🔧 Technical Details

### API Endpoint
```
POST https://570ve00sak.execute-api.us-east-1.amazonaws.com/prod/send-promotion-notification
```

### Request Payload Format
```json
{
  "title": "Campaign Title",
  "message": "Notification message",
  "campaignId": "campaign_123",
  "type": "promotion",
  "targetAudience": "merchants",
  "data": {
    "campaignId": "campaign_123",
    "discountType": "percentage",
    "discountValue": 50,
    "minimumOrderValue": 0,
    "validUntil": "2025-12-31"
  }
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Push notifications sent successfully",
  "devicesSent": 6,
  "devicesQueried": 6,
  "details": [...]
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
**Solution**: Server is now running! Refresh the page.

### Issue: Push notification request fails with 403
**Possible Causes**:
1. Not logged in to WhizzCentralPlatform
2. Authentication token expired

**Solution**: 
- Login again to WhizzCentralPlatform
- Check browser console for authentication errors

### Issue: Notifications not received on devices
**Check**:
1. Are merchants logged in to WhizzMerchants app?
2. Did they grant notification permissions?
3. Check CloudWatch logs for FCM errors

**Verify Device Tokens**:
```bash
aws dynamodb scan \
  --table-name WhizzMerchants_DeviceTokens \
  --filter-expression "isActive = :active" \
  --expression-attribute-values '{":active": {"BOOL": true}}'
```

### Issue: Lambda function error
**Check Logs**:
```bash
aws logs tail /aws/lambda/whizz-central-send-promotion-notification \
  --since 10m \
  --region us-east-1
```

---

## 📊 System Architecture

```
WhizzCentralPlatform UI
         ↓
    [Create Campaign]
         ↓
    Extract push notification data
         ↓
    POST to API Gateway
    https://570ve00sak.execute-api.us-east-1.amazonaws.com/prod/send-promotion-notification
         ↓
    API Gateway triggers Lambda
         ↓
    Lambda Function:
    whizz-central-send-promotion-notification
         ↓
    Query DynamoDB:
    WhizzMerchants_DeviceTokens
         ↓
    Get 6 active device tokens
         ↓
    Send FCM notifications
    to each device token
         ↓
    WhizzMerchants App
    receives notifications
```

---

## 📝 Quick Commands Reference

| Action | Command |
|--------|---------|
| Start Server | `cd whizzCentralPlatform && python3 -m http.server 8080` |
| Open Promotions | `open http://localhost:8080/frontend/pages/promotions.html` |
| Test Lambda | `./backend/test-push-quick.sh` |
| View Logs | `aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow` |
| Check Devices | `aws dynamodb scan --table-name WhizzMerchants_DeviceTokens` |
| Test Full System | `./backend/test-promotion-push-notification.sh` |

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Campaign creation shows success message
2. ✅ Browser console shows push notification logs
3. ✅ CloudWatch logs show "Sent FCM notification successfully"
4. ✅ Merchants receive notifications on their devices
5. ✅ No errors in console or CloudWatch

---

## 📚 Documentation

- **Quick Setup**: `QUICK_SETUP.md`
- **Complete Guide**: `PROMOTION_PUSH_NOTIFICATION_GUIDE.md`
- **Deployment Details**: `DEPLOYMENT_SUMMARY.md`

---

## 🚀 Next Steps

1. **Test the system** by creating a campaign from the UI
2. **Verify notifications** are received on merchant devices
3. **Check CloudWatch logs** to confirm successful delivery
4. **Monitor usage** and adjust as needed

---

**Ready to test!** 🎯

Open the promotions page and create your first campaign with push notifications!

```
http://localhost:8080/frontend/pages/promotions.html
```

The server is running, the Lambda is deployed, API Gateway is configured, and 6 merchant devices are waiting for your notification! 🚀
