# 🔧 Backend Fix: Merchant Sessions Not Appearing

## 🐛 Issue Found

The support dashboard was showing **"0 active conversations"** even after merchants sent messages because the backend's `sendActiveSessions()` function was only returning driver-specific fields and **missing merchant information**.

---

## ✅ Fix Applied

**File:** `whizzCentralPlatform/backend/src/handlers/chat-websocket-handler.js`  
**Function:** `sendActiveSessions()` (lines 835-848)

### Before (Bug):
```javascript
const sessions = (result.Items || []).map(session => ({
    sessionId: session.sessionId,
    driverName: session.driverName || session.userDisplayName,  // ❌ Missing merchantName
    driverId: session.driverId || session.userId,
    driverPhone: session.driverPhone || '',
    // ❌ Missing: userType, merchantId, merchantName, merchantEmail
    status: session.status,
    createdAt: session.createdAt,
    lastMessageAt: session.lastMessageAt || session.createdAt,
    agentId: session.agentId,
    agentName: session.agentName,
    unreadAgent: session.unreadAgent || 0,
    unreadDriver: session.unreadDriver || 0
}));
```

### After (Fixed):
```javascript
const sessions = (result.Items || []).map(session => ({
    sessionId: session.sessionId,
    userType: session.userType || 'driver',           // ✅ Added
    driverName: session.driverName || session.userDisplayName,
    driverId: session.driverId || session.userId,
    driverPhone: session.driverPhone || '',
    merchantId: session.merchantId,                   // ✅ Added
    merchantName: session.merchantName,               // ✅ Added
    merchantEmail: session.merchantEmail,             // ✅ Added
    userId: session.userId,                           // ✅ Added
    status: session.status,
    createdAt: session.createdAt,
    lastMessageAt: session.lastMessageAt || session.createdAt,
    agentId: session.agentId,
    agentName: session.agentName,
    unreadAgent: session.unreadAgent || 0,
    unreadDriver: session.unreadDriver || 0
}));
```

---

## 🚀 Deployment Steps

### Option 1: Using the Deployment Script (Recommended)

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./deploy-merchant-chat-fix.sh
```

### Option 2: Manual Deployment

```bash
# Navigate to backend directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Clean up
rm -rf temp-deploy chat-websocket-handler-deployment.zip

# Create deployment structure
mkdir -p temp-deploy/src/handlers
cp src/handlers/chat-websocket-handler.js temp-deploy/src/handlers/
cp package.json temp-deploy/

# Install dependencies
cd temp-deploy
npm install --production

# Create ZIP
zip -r ../chat-websocket-handler-deployment.zip . -x "*.DS_Store"
cd ..

# Deploy to AWS
aws lambda update-function-code \
    --function-name chat-websocket-handler \
    --zip-file fileb://chat-websocket-handler-deployment.zip \
    --region us-east-1
```

### Option 3: Using AWS Console

1. Navigate to AWS Lambda Console: https://console.aws.amazon.com/lambda/
2. Go to `us-east-1` region
3. Find function: `chat-websocket-handler`
4. Upload the ZIP file: `chat-websocket-handler-deployment.zip`
5. Click "Deploy"

---

## 🧪 Testing After Deployment

### Step 1: Verify Deployment
```bash
aws lambda get-function \
    --function-name chat-websocket-handler \
    --region us-east-1 \
    --query 'Configuration.[LastModified,CodeSize]'
```

### Step 2: Test the Fix

1. **Open Support Dashboard:**
   ```
   http://localhost:3000/pages/support.html
   ```
   - Should show: "Connected to live chat as support agent"

2. **Send Message from Merchant App:**
   - Open WhizzMerchants app
   - Navigate to: Menu → About App → Chat Support
   - Send: "Hello, testing after backend fix"

3. **Check Support Dashboard:**
   - Within 1-2 seconds, session should appear
   - Should show business name (not "Unknown")
   - Counter should update from 0 to 1

### Step 3: Check Browser Console

Should see:
```javascript
📋 Received active sessions
📱 New genuine app session: {
  id: "session_...",
  customer: "Your Business Name",  // ✅ Not "Unknown"
  userType: "merchant",             // ✅ Present
  ...
}
💬 Processing incoming chat message
```

Should NOT see:
```javascript
🚫 Filtered out session: ...
```

---

## 📊 What This Fixes

| Before | After |
|--------|-------|
| ❌ Sessions sent to dashboard without userType | ✅ Sessions include userType field |
| ❌ Merchant info (ID, name, email) missing | ✅ All merchant fields included |
| ❌ Dashboard filters out merchant sessions | ✅ Dashboard accepts merchant sessions |
| ❌ Shows "Unknown" or generic name | ✅ Shows actual business name |
| ❌ Counter stays at 0 | ✅ Counter updates correctly |

---

## 🔍 Troubleshooting

### Issue: Deployment fails with AWS CLI error
**Solution:** Ensure AWS CLI is configured:
```bash
aws configure list
aws sts get-caller-identity
```

### Issue: Lambda function not found
**Solution:** Verify function exists:
```bash
aws lambda list-functions --region us-east-1 | grep chat-websocket
```

### Issue: Sessions still not appearing
**Solutions:**
1. Clear browser cache and reload dashboard
2. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/chat-websocket-handler --follow --region us-east-1
   ```
3. Verify merchant app is sending correct handshake
4. Check DynamoDB for session records:
   ```bash
   aws dynamodb scan --table-name ChatSessions --region us-east-1 --max-items 5
   ```

---

## 📝 Files Modified

1. **Backend Handler:**
   - `/backend/src/handlers/chat-websocket-handler.js` (line 835-848)

2. **Support Dashboard:**
   - `/frontend/pages/support.html` (multiple functions updated)

3. **Deployment Script:**
   - `/deploy-merchant-chat-fix.sh` (new file)

---

## ✅ Verification Checklist

- [ ] Backend code updated with merchant fields
- [ ] Deployment package created
- [ ] Lambda function deployed to AWS
- [ ] Support dashboard reloaded
- [ ] Merchant message sent from app
- [ ] Session appears on dashboard
- [ ] Business name displays correctly
- [ ] Counter updates from 0 to 1
- [ ] Messages display in chat view
- [ ] Reply works bidirectionally

---

## 🎯 Expected Result

**Before Fix:**
```
ACTIVE CONVERSATIONS (0)
└── No active conversations
    New conversations will appear here...
```

**After Fix:**
```
ACTIVE CONVERSATIONS (1)
└── TB  Test Business
        Hello, testing after backend fix
        Just now                          ●
```

---

## 📞 Next Steps

1. **Deploy the backend fix** (use one of the options above)
2. **Wait 10-15 seconds** for Lambda to update
3. **Refresh support dashboard**
4. **Send test message from merchant app**
5. **Verify session appears with correct business name**

---

*Last Updated: November 11, 2025 - Backend Fix for Merchant Sessions*
