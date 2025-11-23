# 📢 "Send to Merchants" Feature - Complete Logic Explanation

## Overview
The "Send to Merchants" feature allows WizzCentral administrators to broadcast important information, policy updates, and announcements to merchants via push notifications to their WhizzMerchants mobile app.

---

## 🎯 Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WizzCentral Admin UI                              │
│                   (Promotions Page)                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 1. Admin clicks "Send to Merchants" button
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Modal Form Opens                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ • Notification Type (info/warning/urgent/feature/policy)      │  │
│  │ • Title & Message (required)                                  │  │
│  │ • Target Audience (all/active/inactive/new/by_city/category) │  │
│  │ • Priority (normal/high)                                      │  │
│  │ • Advanced: Action URL, Image URL, Scheduling                 │  │
│  │ • Live Preview                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 2. Form submission
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Frontend JavaScript Handler                             │
│              sendMerchantInfoNotification()                          │
│                                                                       │
│  • Collects form data                                                │
│  • Shows loading state                                               │
│  • Makes POST request to backend                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 3. HTTP POST to /api/merchants/send-info-notification
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Local Dev Server (Express)                              │
│              local-dev-server.js                                     │
│                                                                       │
│  • Route: app.post('/api/merchants/send-info-notification')         │
│  • Applies campaignsAccessGuard (RBAC check)                        │
│  • Wraps request in Lambda event format                             │
│  • Forwards to Lambda handler                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 4. Invokes Lambda handler
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Lambda Function                                         │
│        merchant-info-notification.js                                 │
│                                                                       │
│  📋 STEP 1: Parse & Validate Input                                   │
│     • Extract notification data from request body                    │
│     • Validate required fields (title, body)                         │
│     • Check for scheduled time (defer if future)                     │
│                                                                       │
│  🎯 STEP 2: Get Target Merchants                                     │
│     • Query WhizzMerchants_Businesses table                          │
│     • Apply filters based on targetAudience:                         │
│       ├─ all: All active merchants                                   │
│       ├─ active: Merchants with orders in last 30 days               │
│       ├─ inactive: No orders in 30 days                              │
│       ├─ new: Joined in last 14 days                                 │
│       ├─ by_city: Filter by city name                                │
│       └─ by_category: Filter by business type                        │
│                                                                       │
│  📱 STEP 3: Get Device Tokens                                        │
│     • Query WhizzMerchants_DeviceTokens table                        │
│     • For each businessId, get all FCM device tokens                 │
│     • Filter out expired/invalid tokens                              │
│                                                                       │
│  🔔 STEP 4: Send FCM Notifications                                   │
│     • Batch tokens in groups of 500 (FCM limit)                      │
│     • For each batch, send to FCM API:                               │
│       POST https://fcm.googleapis.com/fcm/send                       │
│       Headers: { Authorization: 'key=FCM_SERVER_KEY' }               │
│       Body: { notification, data, tokens }                           │
│     • Track success/failure counts                                   │
│                                                                       │
│  📊 STEP 5: Log Results                                              │
│     • Create log entry in WizzCentral_Merchant_Notification_Logs     │
│     • Store: notification details, targeting, results, timestamp     │
│                                                                       │
│  ✅ STEP 6: Return Response                                          │
│     • success: true/false                                            │
│     • targeted: count of merchants                                   │
│     • sent: successful deliveries                                    │
│     • failed: failed deliveries                                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 5. Response flows back
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Frontend Handler                                        │
│                                                                       │
│  • Receives JSON response                                            │
│  • Shows success/error alert                                         │
│  • Closes modal on success                                           │
│  • Displays delivery stats to admin                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Key Components

### 1. **Frontend UI** (`promotions.html`)

#### "Send to Merchants" Button
```javascript
// Located in page header
<button id="sendToMerchantsBtn" onclick="openMerchantInfoModal()">
    <i class="fas fa-paper-plane"></i> Send to Merchants
</button>
```

#### Modal Form Fields
- **Notification Type**: Categorizes the message (info, warning, urgent, feature, policy)
- **Title**: Main heading (required)
- **Body**: Detailed message (required)
- **Target Audience**: Who receives it
  - All Merchants
  - Active (orders in last 30 days)
  - Inactive (no recent orders)
  - New (joined in last 14 days)
  - By City (specify city)
  - By Category (restaurant, grocery, pharmacy, etc.)
- **Priority**: Normal or High
- **Advanced Options**:
  - Action URL: Deep link to specific app screen
  - Image URL: Visual banner
  - Scheduling: Send now or schedule for later

#### JavaScript Functions
```javascript
// Open modal
function openMerchantInfoModal() {
    document.getElementById('merchantInfoNotificationModal').style.display = 'flex';
    updateMerchantEstimatedReach();
}

// Close modal
function closeMerchantInfoModal() {
    document.getElementById('merchantInfoNotificationModal').style.display = 'none';
}

// Live preview update
function updateMerchantNotificationPreview() {
    const title = document.getElementById('merchant_notificationTitle').value;
    const body = document.getElementById('merchant_notificationBody').value;
    // Updates preview box with current values
}

// Form submission
async function sendMerchantInfoNotification(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Build payload
    const data = {
        notificationTitle: formData.get('notificationTitle'),
        notificationBody: formData.get('notificationBody'),
        notificationType: formData.get('notificationType'),
        targetAudience: formData.get('targetAudience'),
        priority: formData.get('priority'),
        // ... other fields
    };
    
    // Send to backend
    const response = await fetch(`${API_BASE_URL}/api/merchants/send-info-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    // Handle response
    if (response.ok) {
        alert('✅ Notification sent successfully!');
        closeMerchantInfoModal();
    }
}
```

---

### 2. **Backend Server** (`local-dev-server.js`)

```javascript
const { handler: merchantInfoNotificationHandler } = require('./backend/lambda/merchant-info-notification.js');

app.post('/api/merchants/send-info-notification', campaignsAccessGuard, async (req, res) => {
    try {
        console.log('📢 Sending information notification to merchants');
        
        // Wrap in Lambda event format
        req.lambdaEvent.httpMethod = 'POST';
        req.lambdaEvent.path = '/merchants/send-info-notification';
        
        // Invoke Lambda handler
        await handleLambdaResponse(merchantInfoNotificationHandler, req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});
```

**Security**: `campaignsAccessGuard` ensures only users with `campaigns_admin:write` permission can send notifications.

---

### 3. **Lambda Function** (`merchant-info-notification.js`)

#### Main Flow

```javascript
exports.handler = async (event) => {
    // 1. Parse input
    const { notificationTitle, notificationBody, targetAudience, ... } = parseBody(event);
    
    // 2. Validate
    if (!notificationTitle || !notificationBody) {
        return error(400, 'Missing required fields');
    }
    
    // 3. Schedule check
    if (scheduledTime && isFuture(scheduledTime)) {
        await scheduleNotification(body);
        return success('Scheduled');
    }
    
    // 4. Get target merchants
    const merchants = await getTargetMerchants({
        targetAudience,
        city,
        businessCategory
    });
    
    // 5. Get device tokens
    const tokens = await getDeviceTokensForMerchants(merchants);
    
    // 6. Send via FCM
    const results = await sendFCMNotifications(tokens, notification);
    
    // 7. Log activity
    await logNotificationActivity(notification, results);
    
    // 8. Return stats
    return success({
        targeted: merchants.length,
        sent: results.successCount,
        failed: results.failureCount
    });
};
```

#### Merchant Targeting Logic

```javascript
async function getTargetMerchants({ targetAudience, city, businessCategory }) {
    // Scan all merchants from WhizzMerchants_Businesses
    const allMerchants = await scanTable(BUSINESSES_TABLE);
    
    let filtered = allMerchants;
    
    switch (targetAudience) {
        case 'active':
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            filtered = allMerchants.filter(m => 
                m.status === 'active' && 
                m.lastOrderAt > thirtyDaysAgo
            );
            break;
            
        case 'inactive':
            const thirtyDaysAgo2 = Date.now() - (30 * 24 * 60 * 60 * 1000);
            filtered = allMerchants.filter(m => 
                m.status === 'inactive' || 
                !m.lastOrderAt || 
                m.lastOrderAt <= thirtyDaysAgo2
            );
            break;
            
        case 'new':
            const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            filtered = allMerchants.filter(m => 
                m.createdAt > fourteenDaysAgo
            );
            break;
            
        case 'by_city':
            filtered = allMerchants.filter(m => 
                m.city?.toLowerCase() === city?.toLowerCase()
            );
            break;
            
        case 'by_category':
            filtered = allMerchants.filter(m => 
                m.businessType?.toLowerCase() === businessCategory?.toLowerCase()
            );
            break;
            
        case 'all':
        default:
            filtered = allMerchants.filter(m => m.status !== 'deleted');
    }
    
    return filtered;
}
```

#### FCM Integration

```javascript
async function sendFCMNotifications(tokens, notification) {
    const FCM_URL = 'https://fcm.googleapis.com/fcm/send';
    const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
    
    // FCM allows max 1000 tokens per request, we use 500 for safety
    const batches = chunkArray(tokens, 500);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const batch of batches) {
        const payload = {
            registration_ids: batch,
            notification: {
                title: notification.title,
                body: notification.body,
                image: notification.image,
                sound: 'default',
                priority: notification.priority === 'high' ? 'high' : 'normal'
            },
            data: notification.data
        };
        
        const response = await httpsPost(FCM_URL, payload, {
            'Authorization': `key=${FCM_SERVER_KEY}`,
            'Content-Type': 'application/json'
        });
        
        successCount += response.success;
        failureCount += response.failure;
    }
    
    return { successCount, failureCount };
}
```

---

## 📊 Database Tables

### Input Tables (Read)

#### `WhizzMerchants_Businesses`
```javascript
{
    businessId: 'business_1756336745961_ywix4oy9aa',
    businessName: 'صلوات Restaurant',
    status: 'active',
    city: 'Najaf',
    businessType: 'restaurant',
    createdAt: 1756336745961,
    lastOrderAt: 1756500000000,
    email: 'merchant@example.com',
    phone: '+9647801234567'
}
```

#### `WhizzMerchants_DeviceTokens`
```javascript
{
    tokenId: 'token_123456',
    businessId: 'business_1756336745961_ywix4oy9aa',
    deviceToken: 'fcm_token_abc123xyz...',
    platform: 'iOS', // or 'Android'
    appVersion: '1.2.0',
    createdAt: 1756400000000,
    lastUsed: 1756450000000,
    isActive: true
}
```

### Output Tables (Write)

#### `WizzCentral_Merchant_Notification_Logs`
```javascript
{
    notificationId: 'NOTIF_1732406400000_abc123',
    timestamp: 1732406400000,
    notificationType: 'policy',
    title: 'New Commission Policy',
    body: 'Effective December 1st...',
    targetAudience: 'all',
    targetedCount: 150,
    sentCount: 145,
    failedCount: 5,
    priority: 'high',
    sentBy: 'admin@wizz.com',
    metadata: {
        city: null,
        category: null,
        actionUrl: 'whizzmerchants://policy/commission-2025'
    }
}
```

#### `WizzCentral_Scheduled_Merchant_Notifications`
```javascript
{
    scheduleId: 'SCHED_1732406400000_xyz789',
    scheduledTime: 1732500000000,
    notification: { /* full notification payload */ },
    status: 'pending', // or 'sent', 'failed'
    createdAt: 1732406400000,
    createdBy: 'admin@wizz.com'
}
```

---

## 🎨 Notification Types & Use Cases

### 1. **ℹ️ Information**
- **Purpose**: General announcements
- **Examples**:
  - "Platform maintenance scheduled for tonight"
  - "New dashboard features available"
  - "Monthly newsletter"

### 2. **⚠️ Warning**
- **Purpose**: Non-critical alerts
- **Examples**:
  - "Your menu hasn't been updated in 30 days"
  - "Low rating detected - check customer feedback"
  - "Payment delay notification"

### 3. **🚨 Urgent Alert**
- **Purpose**: Critical, immediate action required
- **Priority**: High
- **Examples**:
  - "Account suspension imminent"
  - "Security breach detected"
  - "System outage affecting orders"

### 4. **✨ New Feature**
- **Purpose**: Product updates, new capabilities
- **Examples**:
  - "Introducing: Real-time order tracking"
  - "New analytics dashboard available"
  - "AI-powered menu recommendations"

### 5. **📋 Policy Update**
- **Purpose**: Terms, commissions, regulations
- **Examples**:
  - "New commission structure effective Dec 1st"
  - "Updated terms of service"
  - "COVID-19 safety guidelines"

---

## 🔐 Security & Permissions

### RBAC (Role-Based Access Control)
```javascript
// Only users with campaigns_admin:write can send notifications
const campaignsAccessGuard = (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const hasPermission = userRoles.includes('campaigns_admin:write');
    
    if (!hasPermission) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
        });
    }
    
    next();
};
```

### Audit Trail
Every notification send is logged with:
- Who sent it (admin email)
- When it was sent
- To whom (targeting criteria)
- What was sent (title, body, type)
- Results (success/failure counts)

---

## 📱 Mobile App Integration

### WhizzMerchants App Requirements

#### 1. **FCM Token Registration**
```dart
// On app startup or login
Future<void> registerDeviceToken() async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  await api.post('/merchant/device-tokens', {
    'businessId': currentBusiness.id,
    'deviceToken': fcmToken,
    'platform': Platform.isIOS ? 'iOS' : 'Android',
    'appVersion': packageInfo.version,
  });
}
```

#### 2. **Notification Handler**
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final data = message.data;
  
  if (data['type'] == 'merchant_info') {
    final notificationType = data['notificationType'];
    final priority = data['priority'];
    final actionUrl = data['actionUrl'];
    
    // Show in-app notification
    showNotificationDialog(
      title: message.notification?.title,
      body: message.notification?.body,
      type: notificationType,
      priority: priority,
      onTap: () => handleActionUrl(actionUrl),
    );
  }
});
```

#### 3. **Deep Link Handling**
```dart
Future<void> handleActionUrl(String? url) async {
  if (url == null || url.isEmpty) return;
  
  // Parse deep link
  if (url.startsWith('whizzmerchants://')) {
    final uri = Uri.parse(url);
    
    // Route to appropriate screen
    switch (uri.host) {
      case 'policy':
        Navigator.pushNamed(context, '/policy/${uri.path}');
        break;
      case 'feature':
        Navigator.pushNamed(context, '/features/${uri.path}');
        break;
      default:
        // Open in-app browser for web URLs
        launchUrl(Uri.parse(url));
    }
  }
}
```

---

## 🧪 Testing Guide

### 1. **Test with Single Merchant**
```javascript
// In modal, select custom audience and provide specific businessId
{
  targetAudience: 'custom',
  customBusinessIds: ['business_1756336745961_ywix4oy9aa'],
  notificationTitle: 'Test Notification',
  notificationBody: 'This is a test'
}
```

### 2. **Test with Filter**
```javascript
// Test city filter
{
  targetAudience: 'by_city',
  city: 'Najaf',
  notificationTitle: 'Najaf Merchants Only',
  notificationBody: 'Important update for Najaf'
}
```

### 3. **Test Scheduling**
```javascript
// Schedule for 5 minutes from now
{
  ...notificationData,
  sendTime: 'scheduled',
  scheduledTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
}
```

### 4. **Monitor Logs**
```bash
# Server logs
tail -f /var/log/wizzcentral/notifications.log

# DynamoDB logs
aws dynamodb query \
  --table-name WizzCentral_Merchant_Notification_Logs \
  --limit 10 \
  --scan-index-forward false
```

---

## 🐛 Troubleshooting

### Issue: "No merchants targeted"
**Cause**: Filters are too restrictive or no merchants match criteria
**Solution**: 
- Check filter parameters (city spelling, category names)
- Verify merchants exist in database
- Try 'all' audience first to test

### Issue: "FCM error: Invalid registration token"
**Cause**: Expired or invalid device tokens
**Solution**:
- Tokens should be refreshed by mobile app periodically
- Implement token cleanup job to remove old tokens
- Check token format in DeviceTokens table

### Issue: "High failure rate"
**Cause**: Network issues, token expiry, app uninstalled
**Solution**:
- FCM provides failure reasons in response
- Log failures with reasons for analysis
- Implement retry mechanism for transient failures

### Issue: "Notification not showing on iOS"
**Cause**: Missing APNs certificate or iOS permissions
**Solution**:
- Verify FCM iOS configuration
- Check app permissions: Settings > Notifications > WhizzMerchants
- Test with Android first to isolate platform issues

---

## 📈 Best Practices

### 1. **Timing**
- Avoid late-night notifications (after 10 PM)
- Best times: 9 AM - 11 AM, 2 PM - 4 PM
- Use scheduling for optimal delivery times

### 2. **Content**
- Keep titles under 50 characters
- Body text under 150 characters for preview
- Use emojis sparingly for emphasis
- Write in local language (Arabic for Iraq)

### 3. **Frequency**
- Max 1-2 notifications per week per merchant
- Urgent alerts exempt from frequency limits
- Monitor unsubscribe/disable rates

### 4. **Targeting**
- Use specific audiences to reduce noise
- Test with small group first
- Personalize when possible

### 5. **Analytics**
- Track open rates via actionUrl clicks
- Monitor failure rates by platform
- A/B test notification styles

---

## 🔮 Future Enhancements

### 1. **Rich Notifications**
- Image carousels
- Action buttons (Accept/Decline)
- Video previews

### 2. **Personalization**
- Use merchant name in title
- Customize by business type
- Language preferences

### 3. **Analytics Dashboard**
- Notification performance metrics
- Open rate tracking
- Click-through rate (CTR)

### 4. **Templates**
- Pre-built notification templates
- Save custom templates
- Template library

### 5. **A/B Testing**
- Send variants to different groups
- Compare performance
- Auto-select best performer

---

## 📚 Related Documentation

- [Push Notifications Lambda](./backend/lambda/merchant-info-notification.js)
- [Customer Discount Notifications](./backend/lambda/discount-push-notification.js)
- [RBAC System](./assets/js/rbac.js)
- [FCM Setup Guide](./docs/FCM_SETUP.md)

---

## 🆘 Support

For issues or questions:
- Check logs: `tail -f logs/wizzcentral.log`
- Review Lambda CloudWatch logs
- Contact: dev@wizzcentral.com
- Slack: #wizzcentral-support

---

**Last Updated**: November 23, 2025  
**Version**: 1.0.0
