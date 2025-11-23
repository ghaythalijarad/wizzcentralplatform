# 📱 Push Notification System for Discount Offers

## Overview
The WizzCentral platform now includes a comprehensive push notification system for sending discount offers and promotions to customers through the WhizzCustomers mobile app.

## ✨ Features

### 1. **Targeted Notifications**
- **All Customers**: Broadcast to entire customer base
- **Nearby Customers**: Location-based targeting (5km radius from merchant)
- **Loyal Customers**: Customers with 5+ orders
- **New Customers**: Customers who joined in the last 30 days

### 2. **Scheduling Options**
- **Send Immediately**: Push notification goes out right away
- **Schedule for Later**: Set specific date/time for delivery

### 3. **Customization**
- Auto-generated notification titles and messages
- Optional custom notification title and body
- Includes discount details, merchant info, and deep links

### 4. **Analytics & Tracking**
- Estimated reach calculation
- Delivery status tracking (sent/failed counts)
- Notification logs stored in DynamoDB

## 🏗️ Architecture

### Backend Components

#### 1. Lambda Function: `discount-push-notification.js`
Located: `/backend/lambda/discount-push-notification.js`

**Responsibilities:**
- Fetch customer device tokens from DynamoDB
- Apply audience targeting filters
- Send notifications via FCM (Firebase Cloud Messaging)
- Log delivery status and analytics

**Key Functions:**
- `getTargetCustomers()` - Filters customers based on audience type
- `getDeviceTokensForUsers()` - Retrieves FCM tokens from DynamoDB
- `sendFCMNotifications()` - Sends push via Firebase
- `logNotification()` - Stores delivery logs

#### 2. API Endpoints

**POST** `/api/discounts/:discountId/send-notification`
- Sends push notification for a specific discount
- Request body:
  ```json
  {
    "targetAudience": "all|nearby|loyal|new",
    "notificationTitle": "Optional custom title",
    "notificationBody": "Optional custom message",
    "scheduledTime": "2025-12-01T10:00:00Z" // optional
  }
  ```

**POST** `/api/push-notifications/send`
- Generic endpoint for custom push notifications

### Frontend Components

#### 1. Push Notification Modal
Located in: `/frontend/pages/promotions.html`

**Features:**
- Discount preview section
- Target audience selector
- Custom title/body inputs
- Scheduling options
- Estimated reach display

#### 2. JavaScript Functions
- `sendDiscountNotification()` - Opens modal with discount data
- `sendPushNotification()` - Submits notification request
- `updateEstimatedReach()` - Calculates target audience size
- `closePushModal()` - Closes modal and resets form

### Database Tables

#### 1. `WhizzCustomers_DeviceTokens`
Stores customer FCM device tokens
```
{
  "tokenId": "TOKEN_123",
  "userId": "USER_456",
  "deviceToken": "fcm_token_abc...",
  "platform": "android|ios",
  "status": "active|inactive",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

#### 2. `WizzCentral_Notification_Logs`
Tracks all sent notifications
```
{
  "logId": "LOG_789",
  "discountId": "DISC_001",
  "discountCode": "BURGER20",
  "merchantId": "MERCH_123",
  "targetAudience": "all",
  "totalTargeted": 500,
  "totalTokens": 450,
  "sent": 445,
  "failed": 5,
  "timestamp": 1234567890
}
```

#### 3. `WizzCentral_Scheduled_Notifications` (Optional)
For scheduled notifications
```
{
  "notificationId": "SCHED_001",
  "discountId": "DISC_001",
  "scheduledTime": "2025-12-01T10:00:00Z",
  "status": "scheduled|sent|failed",
  "createdAt": 1234567890
}
```

## 🚀 Usage Guide

### For Admins/Campaign Managers

1. **Navigate to Promotions Page**
   - Go to http://localhost:3000/pages/promotions.html
   - View the list of merchant discounts

2. **Send Push Notification**
   - Click the bell icon (🔔) next to any active discount
   - Modal opens with discount preview

3. **Configure Notification**
   - Select **Target Audience**:
     - All Customers
     - Nearby Customers
     - Loyal Customers
     - New Customers
   
   - (Optional) Customize **Title** and **Message**
   
   - Choose **Send Time**:
     - Send Immediately
     - Schedule for Later

4. **Review Estimated Reach**
   - The modal shows approximate number of customers that will receive the notification

5. **Send**
   - Click "Send Notification" button
   - System confirms delivery with sent/failed counts

### Auto-Generated Messages

**Example for 25% Percentage Discount:**
```
Title: "25% Off with BURGER20! 🎉"
Body: "Al-Mansour Burger House: Get 25% off your order! Tap to order now! 🛍️"
```

**Example for Free Delivery:**
```
Title: "Free Delivery with FREESHIP! 🚚"
Body: "Baghdad Pizza Palace: Enjoy free delivery on your next order! Tap to order now! 🛍️"
```

## 🔧 Configuration

### Environment Variables

Add these to your Lambda environment or `.env` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=wizz-drivers-ghayth-dev

# DynamoDB Tables
CUSTOMERS_TABLE=WizzUser_users_dev
DEVICE_TOKENS_TABLE=WhizzCustomers_DeviceTokens
NOTIFICATION_LOG_TABLE=WizzCentral_Notification_Logs
BUSINESSES_TABLE=WhizzMerchants_Businesses

# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key_here
```

### Getting FCM Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your WhizzCustomers project
3. Go to **Project Settings** > **Cloud Messaging**
4. Copy the **Server Key**
5. Set as environment variable: `FCM_SERVER_KEY`

## 📊 Notification Payload Structure

When customers receive the notification, it includes:

```json
{
  "notification": {
    "title": "25% Off with BURGER20! 🎉",
    "body": "Al-Mansour Burger House: Get 25% off your order!",
    "image": "https://...",
    "sound": "default",
    "badge": "1"
  },
  "data": {
    "type": "discount_offer",
    "discountId": "DISC_001",
    "discountCode": "BURGER20",
    "merchantId": "MERCH_123",
    "merchantName": "Al-Mansour Burger House",
    "discountType": "percentage",
    "discountValue": "25",
    "validUntil": "2025-12-31T23:59:59Z",
    "minimumOrderValue": "15000",
    "deepLink": "whizzcustomers://discount/DISC_001"
  }
}
```

## 🎯 Targeting Logic

### Nearby Customers
Uses Haversine formula to calculate distance between merchant location and customer location. Default radius: 5km.

```javascript
// Example: Baghdad coordinates
Merchant: lat=33.3152, lng=44.3661
Customer: lat=33.3200, lng=44.3700
Distance: ~0.5km ✅ Within range
```

### Loyal Customers
Filters users with `orderHistory.length >= 5`

### New Customers
Filters users where `createdAt > (now - 30 days)`

## 🔒 Security & Permissions

- **RBAC Protection**: Only users with `campaigns_admin:write` permission can send notifications
- **Rate Limiting**: API endpoints are rate-limited (100 req/15min)
- **Input Validation**: All user inputs are sanitized and validated
- **FCM Authentication**: Requires valid FCM Server Key

## 📈 Analytics & Monitoring

Monitor notification performance through:

1. **Delivery Logs** (DynamoDB)
   - Query `WizzCentral_Notification_Logs` table
   - View sent/failed counts per campaign

2. **API Responses**
   ```json
   {
     "success": true,
     "targeted": 500,
     "sent": 485,
     "failed": 15,
     "details": [...]
   }
   ```

3. **FCM Console**
   - View delivery statistics in Firebase Console
   - Track click-through rates
   - Monitor device engagement

## 🐛 Troubleshooting

### No device tokens found
**Issue**: `No device tokens found for target customers`

**Solutions:**
- Ensure customers have the WhizzCustomers app installed
- Verify `WhizzCustomers_DeviceTokens` table has data
- Check that tokens are marked as `status: "active"`

### FCM errors
**Issue**: Push notifications not being delivered

**Solutions:**
- Verify `FCM_SERVER_KEY` is correct
- Check Firebase Console for error logs
- Ensure device tokens are valid (not expired)
- Test with Firebase Console's "Send test message" feature

### Scheduled notifications not sending
**Issue**: Scheduled notifications remain in "scheduled" status

**Solutions:**
- Implement a cron job or EventBridge rule to process scheduled notifications
- Query `WizzCentral_Scheduled_Notifications` where `scheduledTime <= now() AND status = 'scheduled'`
- Invoke the Lambda function for each pending notification

## 🔄 Future Enhancements

1. **A/B Testing**
   - Test different notification titles/messages
   - Track which versions get better engagement

2. **Personalization**
   - Use customer name in notifications
   - Recommend discounts based on order history
   - Multilingual support (Arabic/English)

3. **Rich Media**
   - Include discount banner images
   - Add animated GIFs or videos

4. **Smart Timing**
   - Send notifications at optimal times (lunch/dinner hours)
   - Avoid sending during late night

5. **Advanced Targeting**
   - Customers who haven't ordered in X days
   - Customers with specific cuisine preferences
   - Customers within walking distance

## 📝 Code Examples

### Sending a notification programmatically

```javascript
const response = await fetch('http://localhost:3000/api/discounts/DISC_001/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetAudience: 'loyal',
    notificationTitle: 'Special Offer Just For You!',
    notificationBody: 'As a valued customer, enjoy 30% off your next order!'
  })
});

const result = await response.json();
console.log(`Sent to ${result.sent} customers`);
```

### Testing FCM locally

```bash
# Set environment variable
export FCM_SERVER_KEY="your_key_here"

# Run the server
npm start

# Send test notification
curl -X POST http://localhost:3000/api/discounts/DISC_001/send-notification \
  -H "Content-Type: application/json" \
  -d '{"targetAudience": "all"}'
```

## 📚 Related Documentation

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [AWS Lambda Node.js Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

**Last Updated**: November 23, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
