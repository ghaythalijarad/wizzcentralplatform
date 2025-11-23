# 📊 Merchant Notification System - Visual Flow Diagram

## Quick Reference: What Happens When You Click "Send to Merchants"

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         WizzCentral Promotions Page                         │
│                         http://localhost:8080                               │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ 👤 Admin Action: Click "Send to Merchants" button
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           📝 MODAL FORM OPENS                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Notification Type: [ℹ️ Info ▼]                                      │  │
│  │  Title: [______________________________________]                      │  │
│  │  Message: [____________________________________]                      │  │
│  │           [____________________________________]                      │  │
│  │  Target: [All Merchants ▼]                                           │  │
│  │  Priority: [Normal ▼]                                                │  │
│  │  ────────────────────────────────────────────                        │  │
│  │  📱 Preview:                                                          │  │
│  │  ┌──────────────────────────────────────────┐                        │  │
│  │  │ 🔔 Your Title Here                        │                        │  │
│  │  │    Your message will appear here...      │                        │  │
│  │  └──────────────────────────────────────────┘                        │  │
│  │  📊 Estimated Reach: ~150 merchants                                  │  │
│  │                                                                       │  │
│  │  [Cancel]  [Send to Merchants →]                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ ✅ Admin clicks "Send to Merchants"
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    🖥️ FRONTEND JAVASCRIPT                                   │
│                    sendMerchantInfoNotification()                          │
│                                                                             │
│  📤 Collect Form Data:                                                      │
│     {                                                                       │
│       notificationTitle: "New Commission Policy",                          │
│       notificationBody: "Effective December 1st, 2025...",                 │
│       notificationType: "policy",                                          │
│       targetAudience: "all",                                               │
│       priority: "high"                                                     │
│     }                                                                       │
│                                                                             │
│  🌐 HTTP POST Request:                                                      │
│     URL: http://localhost:3000/api/merchants/send-info-notification        │
│     Headers: { Content-Type: application/json }                            │
│     Body: JSON.stringify(formData)                                         │
│                                                                             │
│  ⏳ Loading State: "Sending..."                                             │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ 🚀 HTTP POST
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    🖧 EXPRESS SERVER                                         │
│                    local-dev-server.js:918                                  │
│                                                                             │
│  🔐 Security Check (campaignsAccessGuard):                                  │
│     ✓ User authenticated?                                                  │
│     ✓ Has 'campaigns_admin:write' permission?                              │
│     ❌ If no → Return 403 Forbidden                                         │
│                                                                             │
│  📦 Wrap Request in Lambda Event Format:                                    │
│     req.lambdaEvent = {                                                    │
│       httpMethod: 'POST',                                                  │
│       path: '/merchants/send-info-notification',                           │
│       body: JSON.stringify(req.body),                                      │
│       headers: req.headers,                                                │
│       requestContext: { /* auth context */ }                               │
│     }                                                                       │
│                                                                             │
│  🔄 Forward to Lambda Handler:                                              │
│     await handleLambdaResponse(merchantInfoNotificationHandler, req, res)  │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ ⚡ Lambda Invocation
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    ⚡ LAMBDA FUNCTION                                        │
│                    merchant-info-notification.js                            │
│                                                                             │
│  ╔══════════════════════════════════════════════════════════════════════╗  │
│  ║  STEP 1: PARSE & VALIDATE INPUT                                      ║  │
│  ╚══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  📋 Parse Event Body:                                                       │
│     const body = JSON.parse(event.body);                                   │
│     const { notificationTitle, notificationBody, ... } = body;             │
│                                                                             │
│  ✅ Validation:                                                             │
│     if (!notificationTitle || !notificationBody) {                         │
│       return { statusCode: 400, body: "Missing required fields" };         │
│     }                                                                       │
│                                                                             │
│  📅 Check Scheduling:                                                       │
│     if (scheduledTime && new Date(scheduledTime) > Date.now()) {           │
│       await scheduleNotification(body);                                    │
│       return { statusCode: 200, body: "Scheduled" };                       │
│     }                                                                       │
│                                                                             │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  ║  STEP 2: GET TARGET MERCHANTS                                         ║  │
│  ╚══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  🗄️ Query DynamoDB: WhizzMerchants_Businesses                              │
│     const scanCommand = new ScanCommand({                                  │
│       TableName: 'WhizzMerchants_Businesses',                              │
│       ProjectionExpression: 'businessId, businessName, status, city, ...'  │
│     });                                                                     │
│     const result = await dynamoDB.send(scanCommand);                       │
│     let merchants = result.Items; // e.g., 150 merchants                   │
│                                                                             │
│  🎯 Apply Filters Based on targetAudience:                                  │
│                                                                             │
│     Switch (targetAudience) {                                              │
│                                                                             │
│       case 'all':                                                          │
│         ├─ merchants = merchants.filter(m => m.status !== 'deleted')      │
│         └─ Result: All active merchants (150)                              │
│                                                                             │
│       case 'active':                                                       │
│         ├─ const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000) │
│         ├─ merchants = merchants.filter(m =>                              │
│         │     m.status === 'active' &&                                    │
│         │     m.lastOrderAt > thirtyDaysAgo                               │
│         │   )                                                              │
│         └─ Result: Merchants with recent orders (85)                       │
│                                                                             │
│       case 'inactive':                                                     │
│         ├─ merchants = merchants.filter(m =>                              │
│         │     m.status === 'inactive' ||                                  │
│         │     !m.lastOrderAt ||                                            │
│         │     m.lastOrderAt <= thirtyDaysAgo                              │
│         │   )                                                              │
│         └─ Result: Inactive merchants (65)                                 │
│                                                                             │
│       case 'new':                                                          │
│         ├─ const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)│
│         ├─ merchants = merchants.filter(m =>                              │
│         │     m.createdAt > fourteenDaysAgo                               │
│         │   )                                                              │
│         └─ Result: New merchants (12)                                      │
│                                                                             │
│       case 'by_city':                                                      │
│         ├─ merchants = merchants.filter(m =>                              │
│         │     m.city?.toLowerCase() === city?.toLowerCase()               │
│         │   )                                                              │
│         └─ Result: e.g., Najaf merchants (45)                              │
│                                                                             │
│       case 'by_category':                                                  │
│         ├─ merchants = merchants.filter(m =>                              │
│         │     m.businessType?.toLowerCase() === category?.toLowerCase()   │
│         │   )                                                              │
│         └─ Result: e.g., Restaurants (78)                                  │
│     }                                                                       │
│                                                                             │
│  📊 Output: List of businessIds to target                                  │
│     targetMerchants = ['business_123', 'business_456', ...]                │
│                                                                             │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  ║  STEP 3: GET DEVICE TOKENS                                            ║  │
│  ╚══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  📱 Query WhizzMerchants_DeviceTokens:                                      │
│     For each businessId in targetMerchants {                               │
│       const queryCommand = new QueryCommand({                              │
│         TableName: 'WhizzMerchants_DeviceTokens',                          │
│         IndexName: 'businessId-index',                                     │
│         KeyConditionExpression: 'businessId = :bid',                       │
│         ExpressionAttributeValues: { ':bid': businessId }                  │
│       });                                                                   │
│       const tokens = await dynamoDB.send(queryCommand);                    │
│       deviceTokens.push(...tokens.Items);                                  │
│     }                                                                       │
│                                                                             │
│  🧹 Filter & Validate Tokens:                                               │
│     deviceTokens = deviceTokens.filter(t =>                                │
│       t.isActive &&                                                        │
│       t.deviceToken &&                                                     │
│       t.deviceToken.length > 0                                             │
│     );                                                                      │
│                                                                             │
│  📊 Result:                                                                 │
│     deviceTokens = [                                                       │
│       'fcm_token_abc123...',                                               │
│       'fcm_token_def456...',                                               │
│       ... (145 tokens for 150 merchants)                                   │
│     ]                                                                       │
│                                                                             │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  ║  STEP 4: SEND FCM NOTIFICATIONS                                       ║  │
│  ╚══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  📦 Build FCM Payload:                                                      │
│     const fcmPayload = {                                                   │
│       notification: {                                                      │
│         title: "New Commission Policy",                                    │
│         body: "Effective December 1st, 2025...",                           │
│         image: null,                                                       │
│         sound: 'default',                                                  │
│         priority: 'high'                                                   │
│       },                                                                    │
│       data: {                                                              │
│         type: 'merchant_info',                                             │
│         notificationType: 'policy',                                        │
│         priority: 'high',                                                  │
│         actionUrl: '',                                                     │
│         timestamp: '1732406400000'                                         │
│       }                                                                     │
│     };                                                                      │
│                                                                             │
│  🔄 Batch Tokens (FCM limit: 1000, we use 500 for safety):                 │
│     batches = [                                                            │
│       [token1, token2, ..., token145]  // Batch 1 (145 tokens)             │
│     ]                                                                       │
│                                                                             │
│  📡 Send Each Batch to FCM:                                                 │
│     For each batch {                                                       │
│       const response = await httpsPost(                                    │
│         'https://fcm.googleapis.com/fcm/send',                             │
│         {                                                                   │
│           registration_ids: batch,                                         │
│           notification: fcmPayload.notification,                           │
│           data: fcmPayload.data                                            │
│         },                                                                  │
│         headers: {                                                         │
│           'Authorization': `key=${FCM_SERVER_KEY}`,                        │
│           'Content-Type': 'application/json'                               │
│         }                                                                   │
│       );                                                                    │
│                                                                             │
│       // FCM Response:                                                     │
│       {                                                                     │
│         multicast_id: 123456789,                                           │
│         success: 140,     ✅ Successfully delivered                        │
│         failure: 5,       ❌ Failed (invalid token, app uninstalled, etc.) │
│         results: [                                                         │
│           { message_id: 'msg_1' },  // Success                             │
│           { error: 'InvalidRegistration' },  // Failure                    │
│           ...                                                              │
│         ]                                                                   │
│       }                                                                     │
│                                                                             │
│       successCount += response.success;                                    │
│       failureCount += response.failure;                                    │
│     }                                                                       │
│                                                                             │
│  📊 Results Summary:                                                        │
│     Total Sent: 145                                                        │
│     Successful: 140                                                        │
│     Failed: 5                                                              │
│                                                                             │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  ║  STEP 5: LOG NOTIFICATION ACTIVITY                                    ║  │
│  ╚══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  💾 Save to DynamoDB: WizzCentral_Merchant_Notification_Logs                │
│     const logItem = {                                                      │
│       notificationId: 'NOTIF_1732406400000_abc123',                        │
│       timestamp: 1732406400000,                                            │
│       notificationType: 'policy',                                          │
│       title: 'New Commission Policy',                                      │
│       body: 'Effective December 1st, 2025...',                             │
│       targetAudience: 'all',                                               │
│       targetedCount: 150,                                                  │
│       sentCount: 140,                                                      │
│       failedCount: 5,                                                      │
│       priority: 'high',                                                    │
│       sentBy: 'admin@wizz.com',                                            │
│       metadata: { city: null, category: null }                             │
│     };                                                                      │
│     await dynamoDB.send(new PutCommand({                                   │
│       TableName: 'WizzCentral_Merchant_Notification_Logs',                 │
│       Item: logItem                                                        │
│     }));                                                                    │
│                                                                             │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  ║  STEP 6: RETURN RESPONSE                                              ║  │
│  ╚══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  📤 Build Success Response:                                                 │
│     return {                                                               │
│       statusCode: 200,                                                     │
│       headers: { 'Content-Type': 'application/json' },                     │
│       body: JSON.stringify({                                               │
│         success: true,                                                     │
│         message: 'Notifications sent successfully',                        │
│         targeted: 150,                                                     │
│         sent: 140,                                                         │
│         failed: 5,                                                         │
│         notificationId: 'NOTIF_1732406400000_abc123'                       │
│       })                                                                    │
│     };                                                                      │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ 📨 Response flows back
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    🖧 EXPRESS SERVER                                         │
│                    local-dev-server.js                                      │
│                                                                             │
│  📥 Receive Lambda Response:                                                │
│     const lambdaResult = await handler(lambdaEvent);                       │
│                                                                             │
│  📤 Send to Frontend:                                                       │
│     res.status(lambdaResult.statusCode).json(                              │
│       JSON.parse(lambdaResult.body)                                        │
│     );                                                                      │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ ✅ HTTP Response
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    🖥️ FRONTEND JAVASCRIPT                                   │
│                    sendMerchantInfoNotification()                          │
│                                                                             │
│  📨 Receive Response:                                                       │
│     const result = await response.json();                                  │
│     {                                                                       │
│       success: true,                                                       │
│       targeted: 150,                                                       │
│       sent: 140,                                                           │
│       failed: 5                                                            │
│     }                                                                       │
│                                                                             │
│  ✅ Show Success Alert:                                                     │
│     alert(                                                                 │
│       `✅ Notification sent successfully!\n\n` +                            │
│       `Targeted: 150 merchants\n` +                                        │
│       `Sent: 140\n` +                                                      │
│       `Failed: 5`                                                          │
│     );                                                                      │
│                                                                             │
│  🔒 Close Modal:                                                            │
│     closeMerchantInfoModal();                                              │
│     document.getElementById('merchantInfoNotificationForm').reset();       │
└────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     │ 📱 Notifications delivered to merchant devices
                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    📱 WHIZZMERCHANTS MOBILE APP                             │
│                    (iOS/Android)                                            │
│                                                                             │
│  🔔 FCM Push Notification Received:                                         │
│     FirebaseMessaging.onMessage.listen((message) {                         │
│       // Display notification                                              │
│       showNotification(                                                    │
│         title: "New Commission Policy",                                    │
│         body: "Effective December 1st, 2025...",                           │
│         icon: policy_icon,                                                 │
│         priority: HIGH                                                     │
│       );                                                                    │
│     });                                                                     │
│                                                                             │
│  📲 Notification Appears:                                                   │
│     ┌─────────────────────────────────────────────────┐                    │
│     │ WhizzMerchants                   Now             │                    │
│     │ ─────────────────────────────────────────────    │                    │
│     │ 📋 New Commission Policy                         │                    │
│     │ Effective December 1st, 2025, the commission... │                    │
│     └─────────────────────────────────────────────────┘                    │
│                                                                             │
│  👆 User Taps Notification:                                                 │
│     ├─ If actionUrl provided → Navigate to specific screen                 │
│     └─ Else → Open app home screen                                         │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Success Metrics

| Metric | Value |
|--------|-------|
| **Merchants in Database** | 150 |
| **Target Audience** | All |
| **Merchants Matched Filter** | 150 |
| **Device Tokens Found** | 145 (some merchants have no app installed) |
| **Notifications Sent** | 145 |
| **Successful Deliveries** | 140 (96.5% success rate) |
| **Failed Deliveries** | 5 (invalid tokens, app uninstalled) |
| **Average Delivery Time** | 2-3 seconds |

---

## 📊 Database State Changes

### Before Notification Send

**WhizzMerchants_Businesses** (150 merchants)
```
┌──────────────┬───────────────┬─────────┬──────────┬─────────────┐
│ businessId   │ businessName  │ status  │ city     │ lastOrderAt │
├──────────────┼───────────────┼─────────┼──────────┼─────────────┤
│ business_123 │ Restaurant A  │ active  │ Najaf    │ 1732300000  │
│ business_456 │ Grocery B     │ active  │ Baghdad  │ 1732350000  │
│ ...          │ ...           │ ...     │ ...      │ ...         │
└──────────────┴───────────────┴─────────┴──────────┴─────────────┘
```

**WhizzMerchants_DeviceTokens** (145 tokens)
```
┌──────────────┬─────────────────────────┬──────────┬─────────┐
│ businessId   │ deviceToken             │ platform │ isActive│
├──────────────┼─────────────────────────┼──────────┼─────────┤
│ business_123 │ fcm_abc123xyz...        │ iOS      │ true    │
│ business_456 │ fcm_def456uvw...        │ Android  │ true    │
│ ...          │ ...                     │ ...      │ ...     │
└──────────────┴─────────────────────────┴──────────┴─────────┘
```

**WizzCentral_Merchant_Notification_Logs** (empty)
```
┌─────────────────┬───────────┬───────┬──────┬────────┐
│ notificationId  │ timestamp │ title │ sent │ failed │
├─────────────────┼───────────┼───────┼──────┼────────┤
│ (empty)         │           │       │      │        │
└─────────────────┴───────────┴───────┴──────┴────────┘
```

### After Notification Send

**WizzCentral_Merchant_Notification_Logs** (new entry)
```
┌─────────────────────────────┬─────────────┬─────────────────────────┬──────┬────────┐
│ notificationId              │ timestamp   │ title                   │ sent │ failed │
├─────────────────────────────┼─────────────┼─────────────────────────┼──────┼────────┤
│ NOTIF_1732406400000_abc123  │ 1732406400  │ New Commission Policy   │ 140  │ 5      │
└─────────────────────────────┴─────────────┴─────────────────────────┴──────┴────────┘
```

---

## 🔄 Error Handling Flow

```
┌─────────────────────────────────────────┐
│ Potential Error Points                  │
├─────────────────────────────────────────┤
│                                         │
│ ❌ Frontend Validation Failed           │
│    └─> Show inline error messages      │
│                                         │
│ ❌ No Permission (403 Forbidden)        │
│    └─> Alert: "Insufficient permissions"│
│                                         │
│ ❌ No Merchants Match Filter (0 results)│
│    └─> Alert: "No merchants targeted"  │
│                                         │
│ ❌ DynamoDB Query Failed                │
│    └─> Log error, return 500            │
│    └─> Alert: "Database error"          │
│                                         │
│ ❌ FCM Server Error                     │
│    └─> Retry failed tokens              │
│    └─> Log failures for later analysis  │
│                                         │
│ ❌ Invalid FCM Token                    │
│    └─> Mark token as inactive           │
│    └─> Continue with other tokens       │
│                                         │
│ ❌ Network Timeout                      │
│    └─> Retry with exponential backoff   │
│    └─> Alert user if total failure      │
└─────────────────────────────────────────┘
```

---

## 📱 Mobile App Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    WhizzMerchants App                           │
│                    (Merchant's Device)                          │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     │ 1. App Startup / Login
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  📱 Register for Push Notifications                              │
│     FirebaseMessaging.instance.getToken()                       │
│     └─> fcm_token_abc123xyz...                                  │
│                                                                  │
│  📤 Send Token to Backend                                        │
│     POST /api/merchant/device-tokens                            │
│     {                                                            │
│       businessId: 'business_123',                               │
│       deviceToken: 'fcm_token_abc123xyz...',                    │
│       platform: 'iOS',                                           │
│       appVersion: '1.2.0'                                        │
│     }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Later...
                     │ 2. WizzCentral sends notification
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  🔔 FCM Push Notification Received                               │
│     FirebaseMessaging.onMessage.listen((RemoteMessage message) { │
│                                                                  │
│       // Extract notification data                              │
│       final title = message.notification?.title;                │
│       final body = message.notification?.body;                  │
│       final data = message.data;                                │
│       final type = data['notificationType']; // 'policy'        │
│       final priority = data['priority']; // 'high'              │
│       final actionUrl = data['actionUrl'];                      │
│                                                                  │
│       // Show in-app notification                               │
│       showNotificationDialog(                                   │
│         title: title,                                           │
│         body: body,                                             │
│         icon: getIconForType(type),                             │
│         priority: priority,                                     │
│         onTap: () => handleAction(actionUrl)                    │
│       );                                                         │
│     });                                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ 3. User taps notification
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  👆 Handle User Action                                           │
│     if (actionUrl.startsWith('whizzmerchants://')) {            │
│       // Deep link to specific screen                           │
│       switch (actionUrl.host) {                                 │
│         case 'policy':                                          │
│           Navigator.pushNamed('/policy/commission-2025');       │
│         case 'feature':                                         │
│           Navigator.pushNamed('/features/new');                 │
│         default:                                                │
│           Navigator.pushNamed('/home');                         │
│       }                                                          │
│     } else if (actionUrl.startsWith('http')) {                  │
│       // Open web URL in-app browser                            │
│       launchUrl(Uri.parse(actionUrl));                          │
│     } else {                                                     │
│       // No action URL, just open app                           │
│       Navigator.pushNamed('/home');                             │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Screenshots

### WizzCentral Admin View

```
┌────────────────────────────────────────────────────────────────┐
│ WizzCentral  Home  Dashboard  Merchants  Orders  → Promotions  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📢 Promotions & Campaigns                                      │
│                                                                 │
│  Manage discounts, special offers, and marketing campaigns     │
│                                                                 │
│  [📢 Send to Merchants]  ← MAIN BUTTON                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🏷️ Merchant Discounts                Total: 5    Active: 5    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DISCOUNT    MERCHANT    TYPE        VALUE   STATUS  🔔  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ SUMMER25    Rest. A     Percentage  25%     Active  🔔  │  │
│  │ FREE_DEL    Grocery B   Free Del.   -       Active  🔔  │  │
│  │ ...                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Modal After Clicking "Send to Merchants"

```
┌────────────────────────────────────────────────────────────────┐
│  📢 Send Information to Merchants                         [×]  │
│  Broadcast important updates, policies, and announcements      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Notification Type *                                            │
│  [ℹ️ Information ▼]                                             │
│                                                                 │
│  Notification Title *                                           │
│  [New Commission Policy Effective December 1st              ]  │
│                                                                 │
│  Notification Message *                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Starting December 1st, 2025, the commission structure  │    │
│  │ will change to 12% for orders under 50,000 IQD and... │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Target Merchants *                                             │
│  [All Merchants ▼]                                              │
│                                                                 │
│  Priority                                                       │
│  [High Priority ▼]                                              │
│                                                                 │
│  ▶ Advanced Options                                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📊 Estimated Reach                                             │
│  🏪 ~150 merchants                                              │
│                                                                 │
│  📱 Notification Preview                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 📋 New Commission Policy Effective December 1st        │    │
│  │    Starting December 1st, 2025, the commission...      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Cancel]                        [📤 Send to Merchants]        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

**Created**: November 23, 2025  
**Version**: 1.0.0
