# 📋 Complete "Send to Merchants" Feature Summary

## Quick Answer: What Happens When You Click "Send to Merchants"?

When you click the **"Send to Merchants"** button on the WizzCentral Promotions page, here's what happens in plain English:

1. **📝 A modal form opens** where you fill in:
   - What type of notification (info, warning, urgent, feature, policy)
   - Title and message
   - Who should receive it (all merchants, active only, by city, etc.)
   - Priority level

2. **🎯 The system finds target merchants** by querying the `WhizzMerchants_Businesses` table and applying your filters

3. **📱 Gets their device tokens** from the `WhizzMerchants_DeviceTokens` table (these are like "addresses" for push notifications)

4. **🔔 Sends push notifications** via Firebase Cloud Messaging (FCM) to their WhizzMerchants mobile apps

5. **📊 Logs the activity** in `WizzCentral_Merchant_Notification_Logs` with success/failure stats

6. **✅ Shows you the results**: "Targeted: 150 merchants, Sent: 140, Failed: 5"

---

## 🎯 The Complete Flow (Simplified)

```
You (Admin) 
    ↓ Click "Send to Merchants"
Modal Form
    ↓ Fill in details and submit
Frontend JavaScript
    ↓ POST /api/merchants/send-info-notification
Express Server (local-dev-server.js)
    ↓ Security check (RBAC)
Lambda Function (merchant-info-notification.js)
    ↓ Query merchants from DynamoDB
    ↓ Filter by your criteria
    ↓ Get device tokens
    ↓ Send to FCM
    ↓ Log results
    ↓ Return stats
Backend Response
    ↓ Success/Failure message
Frontend Alert
    ↓ Shows: "140 notifications sent!"
Merchant Mobile Apps
    ↓ Receive push notification 🔔
```

---

## 📂 Files Involved

### Frontend
- **`frontend/pages/promotions.html`** (lines 1267-1415)
  - Contains the "Send to Merchants" button
  - Modal form with all input fields
  - JavaScript functions: `openMerchantInfoModal()`, `sendMerchantInfoNotification()`

### Backend
- **`local-dev-server.js`** (lines 918-930)
  - Express endpoint: `POST /api/merchants/send-info-notification`
  - Security guard: `campaignsAccessGuard`
  - Forwards to Lambda handler

### Lambda Function
- **`backend/lambda/merchant-info-notification.js`** (468 lines)
  - Main business logic
  - DynamoDB queries
  - FCM integration
  - Logging and error handling

---

## 🗄️ Database Tables Used

| Table Name | Purpose | Read/Write |
|------------|---------|------------|
| `WhizzMerchants_Businesses` | Get list of merchants | Read |
| `WhizzMerchants_DeviceTokens` | Get FCM tokens for push | Read |
| `WizzCentral_Merchant_Notification_Logs` | Store send history | Write |
| `WizzCentral_Scheduled_Merchant_Notifications` | Store scheduled notifications | Write (if scheduled) |

---

## 🎛️ Targeting Options Explained

### 1. **All Merchants**
- **Criteria**: All merchants except deleted ones
- **SQL Equivalent**: `SELECT * FROM merchants WHERE status != 'deleted'`
- **Typical Count**: 150+ merchants

### 2. **Active Merchants**
- **Criteria**: Received orders in last 30 days
- **Logic**: `lastOrderAt > (now - 30 days) AND status = 'active'`
- **Typical Count**: ~60% of total (e.g., 90 out of 150)

### 3. **Inactive Merchants**
- **Criteria**: No orders in 30 days OR status = 'inactive'
- **Logic**: `lastOrderAt <= (now - 30 days) OR status = 'inactive'`
- **Typical Count**: ~40% of total (e.g., 60 out of 150)

### 4. **New Merchants**
- **Criteria**: Joined in last 14 days
- **Logic**: `createdAt > (now - 14 days)`
- **Typical Count**: ~5-10% (e.g., 7-15 merchants)

### 5. **By City**
- **Criteria**: Located in specific city
- **Logic**: `city.toLowerCase() === selectedCity.toLowerCase()`
- **Example**: Najaf (45), Baghdad (60), Basra (30)

### 6. **By Category**
- **Criteria**: Specific business type
- **Logic**: `businessType.toLowerCase() === selectedCategory.toLowerCase()`
- **Example**: Restaurant (78), Grocery (42), Pharmacy (20)

---

## 🔔 Notification Types Explained

### ℹ️ Information
- **Color**: Blue
- **Priority**: Normal
- **Use Cases**: General announcements, updates, newsletters
- **Example**: "New dashboard features available"

### ⚠️ Warning
- **Color**: Orange
- **Priority**: Normal
- **Use Cases**: Non-critical alerts that need attention
- **Example**: "Your menu hasn't been updated in 30 days"

### 🚨 Urgent Alert
- **Color**: Red
- **Priority**: High
- **Use Cases**: Critical issues requiring immediate action
- **Example**: "Account suspension imminent - verify documents"

### ✨ New Feature
- **Color**: Purple
- **Priority**: Normal
- **Use Cases**: Product updates, new capabilities
- **Example**: "Introducing: AI-powered menu recommendations"

### 📋 Policy Update
- **Color**: Green
- **Priority**: Normal to High
- **Use Cases**: Terms changes, commission updates, regulations
- **Example**: "New commission structure effective December 1st"

---

## 📱 What Merchants See

### On Their Phone (WhizzMerchants App)

**Notification Banner:**
```
┌─────────────────────────────────────────┐
│ WhizzMerchants              Now         │
│ ───────────────────────────────────     │
│ 📋 New Commission Policy                │
│ Starting December 1st, 2025, the        │
│ commission structure will change to...  │
└─────────────────────────────────────────┘
```

**When They Tap:**
- If `actionUrl` is provided → Opens specific screen (e.g., Policy details page)
- If no `actionUrl` → Opens app home screen

**In Notification Center:**
```
Today
├─ WhizzMerchants (2)
│  ├─ 📋 New Commission Policy (2 min ago)
│  └─ ✨ New Feature Available (1 day ago)
└─ Other apps...
```

---

## 🔐 Security & Permissions

### Who Can Send Notifications?
Only users with the **`campaigns_admin:write`** permission can access the "Send to Merchants" feature.

**Check in Code:**
```javascript
// local-dev-server.js line 918
app.post('/api/merchants/send-info-notification', campaignsAccessGuard, async (req, res) => {
    // Only users with campaigns_admin:write reach here
});
```

**User Roles:**
- ✅ **Administrator**: Full access
- ✅ **Marketing Manager**: Can send (if role configured)
- ❌ **Support Agent**: Cannot send
- ❌ **Viewer**: Cannot send

---

## 📊 Example Scenario Walkthrough

### Scenario: Announcing New Commission Policy

**Step 1: Admin Opens Modal**
- Clicks "Send to Merchants" button on Promotions page

**Step 2: Fills Form**
```
Notification Type: 📋 Policy Update
Title: "New Commission Policy Effective December 1st"
Message: "Starting December 1st, 2025, the commission structure 
          will be 12% for orders under 50,000 IQD and 10% for 
          orders above. This change helps us improve service quality."
Target: All Merchants
Priority: High
```

**Step 3: System Processes**
1. Queries `WhizzMerchants_Businesses` → Finds 150 merchants
2. Filters: `status != 'deleted'` → 150 merchants match
3. Queries `WhizzMerchants_DeviceTokens` → Finds 145 device tokens
   - 5 merchants don't have app installed or logged in
4. Sends to FCM in batches of 500 (only 1 batch needed)
5. FCM delivers:
   - ✅ Success: 140 (96.5%)
   - ❌ Failed: 5 (invalid tokens, app uninstalled)

**Step 4: Admin Sees Result**
```
✅ Notification sent successfully!

Targeted: 150 merchants
Sent: 140
Failed: 5
```

**Step 5: Merchants Receive**
- 140 merchants get push notification on their phones
- They see title, message, and policy icon
- Tapping opens the app (or policy details page if actionUrl provided)

**Step 6: Logged in Database**
```sql
-- WizzCentral_Merchant_Notification_Logs
{
  notificationId: "NOTIF_1732406400000_abc123",
  timestamp: 1732406400000,
  title: "New Commission Policy Effective December 1st",
  targetAudience: "all",
  targetedCount: 150,
  sentCount: 140,
  failedCount: 5,
  sentBy: "admin@wizz.com"
}
```

---

## 🧪 Testing Checklist

### ✅ Basic Functionality
- [ ] Button appears in page header
- [ ] Modal opens when button clicked
- [ ] All form fields are editable
- [ ] Preview updates as you type
- [ ] Estimated reach calculates correctly
- [ ] Form validates required fields
- [ ] Success alert shows after send
- [ ] Modal closes after success

### ✅ Targeting Options
- [ ] "All Merchants" sends to all active merchants
- [ ] "Active" filters to merchants with recent orders
- [ ] "Inactive" filters to merchants without recent orders
- [ ] "New" filters to recently joined merchants
- [ ] "By City" shows city input field
- [ ] "By Category" shows category dropdown
- [ ] City filter works case-insensitive
- [ ] Category filter matches business types

### ✅ Notification Types
- [ ] All 5 types available in dropdown
- [ ] Icon changes based on type
- [ ] Priority can be set to normal or high

### ✅ Advanced Options
- [ ] Can expand advanced options section
- [ ] Action URL field accepts URLs
- [ ] Image URL field accepts URLs
- [ ] Schedule option shows datetime picker
- [ ] Scheduled time validates future dates only

### ✅ Security
- [ ] Non-admin users cannot access feature
- [ ] Button hidden if no permission
- [ ] API returns 403 for unauthorized users

### ✅ Error Handling
- [ ] Shows error if title missing
- [ ] Shows error if message missing
- [ ] Shows error if no merchants match filter
- [ ] Shows error if API fails
- [ ] Recovers gracefully from FCM errors

---

## 🐛 Common Issues & Solutions

### Issue 1: "No merchants targeted"
**Symptoms**: Modal shows "Estimated Reach: 0 merchants"
**Causes**:
- Filter is too restrictive
- No merchants exist in database
- All merchants are deleted/inactive

**Solutions**:
1. Try "All Merchants" first to test
2. Check database: `SELECT COUNT(*) FROM WhizzMerchants_Businesses WHERE status != 'deleted'`
3. Verify filter parameters (city spelling, category names)

---

### Issue 2: "High failure rate (>20%)"
**Symptoms**: Sent: 50, Failed: 20 (29% failure)
**Causes**:
- Many merchants uninstalled app
- Device tokens are old/expired
- Network issues with FCM

**Solutions**:
1. Implement token refresh job (remove tokens older than 60 days)
2. Ask merchants to log in again to refresh tokens
3. Check FCM server status
4. Review error codes in logs

---

### Issue 3: "Notification not appearing on iOS"
**Symptoms**: Android works, iOS doesn't receive
**Causes**:
- Missing APNs certificate in FCM
- iOS notification permissions denied
- App not registered for push on iOS

**Solutions**:
1. Verify FCM iOS configuration in Firebase Console
2. Check app permissions: Settings > Notifications > WhizzMerchants
3. Ensure app calls `requestPermission()` on iOS
4. Test with TestFlight build vs production

---

### Issue 4: "Scheduled notifications not sending"
**Symptoms**: Notification scheduled but never delivered
**Causes**:
- No scheduler job running
- Scheduled time in past
- Notification deleted from schedule table

**Solutions**:
1. Implement CloudWatch Event Rule to check scheduled notifications every 5 minutes
2. Validate scheduled time is in future on form submission
3. Add retry mechanism for failed scheduled sends

---

## 📈 Analytics & Monitoring

### Key Metrics to Track

| Metric | How to Calculate | Target |
|--------|------------------|--------|
| **Delivery Rate** | (sent / targeted) × 100 | >95% |
| **Failure Rate** | (failed / targeted) × 100 | <5% |
| **Open Rate** | Clicks on actionUrl / sent | >30% |
| **Response Time** | Time from send to FCM delivery | <3 seconds |
| **Active Tokens** | Valid tokens / total merchants | >80% |

### Monitoring Queries

**Delivery Success Rate (Last 7 Days):**
```javascript
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
const logs = await dynamoDB.query({
  TableName: 'WizzCentral_Merchant_Notification_Logs',
  KeyConditionExpression: 'timestamp > :start',
  ExpressionAttributeValues: { ':start': sevenDaysAgo }
});

const totalSent = logs.Items.reduce((sum, log) => sum + log.sentCount, 0);
const totalTargeted = logs.Items.reduce((sum, log) => sum + log.targetedCount, 0);
const deliveryRate = (totalSent / totalTargeted) * 100;

console.log(`Delivery Rate: ${deliveryRate.toFixed(2)}%`);
```

**Most Common Notification Types:**
```javascript
const typeCounts = logs.Items.reduce((acc, log) => {
  acc[log.notificationType] = (acc[log.notificationType] || 0) + 1;
  return acc;
}, {});

console.log('Notification Types:', typeCounts);
// Output: { policy: 12, info: 8, feature: 5, warning: 3, urgent: 1 }
```

---

## 🚀 Future Enhancements (Roadmap)

### Phase 1: Core Improvements
- [ ] A/B testing for notification variants
- [ ] Retry mechanism for failed deliveries
- [ ] Token cleanup job (remove expired tokens)
- [ ] Notification templates library

### Phase 2: Analytics
- [ ] Real-time delivery dashboard
- [ ] Open rate tracking via deep links
- [ ] Merchant engagement metrics
- [ ] Notification performance reports

### Phase 3: Advanced Features
- [ ] Rich media (images, videos, buttons)
- [ ] Personalization (merchant name, category-specific)
- [ ] Multi-language support (Arabic/English auto-detect)
- [ ] Notification groups/categories

### Phase 4: Automation
- [ ] Auto-send on specific events (new merchant signup, inactive merchant alert)
- [ ] Scheduled recurring notifications (weekly newsletter)
- [ ] Smart sending (optimal time based on merchant activity)

---

## 📚 Related Documentation

- **[Complete Logic Explanation](./MERCHANT_NOTIFICATION_SYSTEM_EXPLANATION.md)** - Deep dive into every component
- **[Visual Flow Diagram](./MERCHANT_NOTIFICATION_FLOW_DIAGRAM.md)** - ASCII diagrams of the flow
- **[Customer Discount Notifications](./backend/lambda/discount-push-notification.js)** - Similar system for customers
- **[RBAC System](./assets/js/rbac.js)** - Role-based access control
- **[FCM Setup Guide](./docs/FCM_SETUP.md)** - Firebase Cloud Messaging configuration

---

## 🆘 Quick Help

### I can't see the "Send to Merchants" button
**Check**:
1. Are you logged in as admin?
2. Do you have `campaigns_admin:write` permission?
3. Is the button being added by JavaScript? (Check browser console for errors)

### Notifications are failing with "FCM_SERVER_KEY not found"
**Fix**:
```bash
export FCM_SERVER_KEY="your-fcm-server-key-here"
# Or add to .env file
echo "FCM_SERVER_KEY=your-key" >> .env
```

### How do I get FCM_SERVER_KEY?
1. Go to Firebase Console: https://console.firebase.google.com
2. Select WhizzMerchants project
3. Go to Project Settings > Cloud Messaging
4. Copy "Server Key" (legacy)

### Where are the logs?
- **Frontend**: Browser console (`F12` → Console tab)
- **Backend**: Terminal running `local-dev-server.js`
- **Lambda**: Check function logs in CloudWatch (if deployed)
- **Database**: Query `WizzCentral_Merchant_Notification_Logs` table

---

## 📞 Contact & Support

- **Email**: dev@wizzcentral.com
- **Slack**: #wizzcentral-support
- **Documentation**: [GitHub Wiki](https://github.com/wizz/docs)
- **Emergency**: +964 XXX XXX XXXX

---

**Created**: November 23, 2025  
**Last Updated**: November 23, 2025  
**Version**: 1.0.0  
**Author**: WizzCentral Development Team
