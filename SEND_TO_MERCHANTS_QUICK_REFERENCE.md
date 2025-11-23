# 🚀 "Send to Merchants" - Quick Reference Card

## 🎯 What It Does
Sends push notifications from WizzCentral to merchants' WhizzMerchants mobile apps.

---

## 📍 How to Access
1. Navigate to: **Promotions & Campaigns** page
2. Click: **"Send to Merchants"** button (top of page)
3. Fill form → Click "Send to Merchants"

---

## 📝 Required Fields
| Field | Description | Example |
|-------|-------------|---------|
| **Type** | Category of notification | Policy Update |
| **Title** | Notification heading | "New Commission Policy" |
| **Message** | Notification body | "Starting December 1st..." |
| **Target** | Who receives it | All Merchants |

---

## 🎯 Targeting Options

| Option | Description | Typical Count |
|--------|-------------|---------------|
| **All** | All active merchants | 150 |
| **Active** | Orders in last 30 days | 90 (60%) |
| **Inactive** | No orders in 30 days | 60 (40%) |
| **New** | Joined in last 14 days | 10 (7%) |
| **By City** | Specific city | 45 (Najaf) |
| **By Category** | Business type | 78 (Restaurants) |

---

## 🔔 Notification Types

| Type | Icon | Priority | Use Case |
|------|------|----------|----------|
| **Information** | ℹ️ | Normal | General updates |
| **Warning** | ⚠️ | Normal | Non-critical alerts |
| **Urgent** | 🚨 | High | Critical issues |
| **Feature** | ✨ | Normal | New capabilities |
| **Policy** | 📋 | Normal-High | Terms/regulations |

---

## ⚡ Quick Commands

### Test with Single Merchant
```javascript
Target: Custom
Business IDs: ['business_1756336745961_ywix4oy9aa']
```

### Test by City
```javascript
Target: By City
City: Najaf
```

### Schedule for Later
```javascript
Send Time: Scheduled
Scheduled Time: [Select future date/time]
```

---

## 📊 Success Metrics

| Metric | Good | Needs Attention |
|--------|------|-----------------|
| **Delivery Rate** | >95% | <90% |
| **Failure Rate** | <5% | >10% |
| **Response Time** | <3 sec | >5 sec |

---

## 🐛 Common Issues

### "No merchants targeted"
- **Fix**: Try "All Merchants" first
- **Check**: Verify merchants exist in database

### "High failure rate"
- **Fix**: Clean up old device tokens
- **Check**: Ask merchants to log in again

### "iOS not receiving"
- **Fix**: Check FCM iOS configuration
- **Check**: Verify APNs certificate

---

## 🔐 Permissions Required

**Role**: `campaigns_admin:write`

✅ Administrator  
✅ Marketing Manager  
❌ Support Agent  
❌ Viewer  

---

## 📁 Files

| File | Purpose |
|------|---------|
| `promotions.html` (line 1426) | UI & Modal |
| `local-dev-server.js` (line 918) | API Endpoint |
| `merchant-info-notification.js` | Lambda Function |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `WhizzMerchants_Businesses` | Merchant list (Read) |
| `WhizzMerchants_DeviceTokens` | FCM tokens (Read) |
| `WizzCentral_Merchant_Notification_Logs` | Activity log (Write) |

---

## 🧪 Testing Steps

1. **Open Modal**: Click "Send to Merchants"
2. **Fill Form**: Type: Info, Title: "Test", Message: "Test message"
3. **Select Target**: All Merchants
4. **Check Preview**: Verify text appears correctly
5. **Send**: Click "Send to Merchants" button
6. **Verify**: Check success alert shows stats

---

## 📱 What Merchants See

```
┌─────────────────────────────────────┐
│ WhizzMerchants         Now          │
│ ─────────────────────────────────   │
│ 📋 New Commission Policy            │
│ Starting December 1st, 2025...      │
└─────────────────────────────────────┘
```

---

## 🆘 Emergency Contacts

- **Dev Team**: dev@wizzcentral.com
- **Slack**: #wizzcentral-support
- **Logs**: Terminal running `local-dev-server.js`

---

## 📖 Full Documentation

For detailed explanations, see:
- **[Complete Guide](./SEND_TO_MERCHANTS_COMPLETE_GUIDE.md)**
- **[System Logic](./MERCHANT_NOTIFICATION_SYSTEM_EXPLANATION.md)**
- **[Flow Diagram](./MERCHANT_NOTIFICATION_FLOW_DIAGRAM.md)**

---

**Version**: 1.0.0  
**Last Updated**: November 23, 2025
