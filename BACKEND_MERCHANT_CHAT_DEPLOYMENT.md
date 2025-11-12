# Backend Testing & Deployment Guide - Merchant Chat Support

## 🎯 What Was Added to Backend

### Changes Made

**File Modified:** `/backend/src/handlers/chat-websocket-handler.js`

#### 1. Added `chat_merchant_connect` Route
```javascript
case 'chat_merchant_connect':
    return await handleMerchantConnect(connectionId, message, apiGatewayClient);
```

#### 2. New `handleMerchantConnect` Function
This function handles merchant connections to support chat:

**Features:**
- Creates or retrieves chat session for merchant
- Stores merchant info (ID, name, email)
- Updates WebSocket connection table
- Sends confirmation messages
- Notifies support agents of new merchant session

**Session Structure:**
```javascript
{
    sessionId: "chat_merchant_business_xxx_timestamp",
    userId: "business_1756392075844_vdIqud6gyu",
    userType: "merchant",
    userDisplayName: "أسواق الكرادة",
    merchantId: "business_1756392075844_vdIqud6gyu",
    merchantName: "أسواق الكرادة",
    merchantEmail: "merchant@example.com",
    status: "active",
    createdAt: "2025-11-11T...",
    lastMessageAt: "2025-11-11T...",
    agentId: null,
    agentName: null,
    unreadAgent: 0,
    unreadMerchant: 0,
    context: {
        app: "whizzMerchants",
        merchantId: "...",
        merchantName: "...",
        merchantEmail: "..."
    }
}
```

---

## 🚀 Deployment Steps

### Option 1: Using Deployment Script (Recommended)

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./deploy-merchant-chat-support.sh
```

### Option 2: Manual Deployment

```bash
# 1. Navigate to backend directory
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# 2. Create deployment package
mkdir -p deploy-temp
cp -r src deploy-temp/
cd deploy-temp

# 3. Install dependencies (if needed)
npm install --production

# 4. Create zip file
zip -r ../chat-websocket-handler.zip . -x "*.git*" "*.DS_Store"

# 5. Deploy to AWS Lambda
aws lambda update-function-code \
    --function-name chat-websocket-handler \
    --zip-file fileb://chat-websocket-handler.zip \
    --region us-east-1

# 6. Wait for update
aws lambda wait function-updated \
    --function-name chat-websocket-handler \
    --region us-east-1

# 7. Cleanup
cd ..
rm -rf deploy-temp chat-websocket-handler.zip
```

---

## 🧪 Backend Testing

### Test 1: Verify Lambda Function Exists

```bash
aws lambda get-function \
    --function-name chat-websocket-handler \
    --region us-east-1
```

**Expected:** Function details returned

### Test 2: Check Function Configuration

```bash
aws lambda get-function-configuration \
    --function-name chat-websocket-handler \
    --region us-east-1 \
    --query '{Runtime:Runtime,Handler:Handler,Timeout:Timeout,MemorySize:MemorySize}'
```

**Expected:**
```json
{
    "Runtime": "nodejs18.x",
    "Handler": "handlers/chat-websocket-handler.handler",
    "Timeout": 30,
    "MemorySize": 256
}
```

### Test 3: Check Environment Variables

```bash
aws lambda get-function-configuration \
    --function-name chat-websocket-handler \
    --region us-east-1 \
    --query 'Environment.Variables'
```

**Expected:** Should include:
- `CHAT_SESSIONS_TABLE`
- `CHAT_MESSAGES_TABLE`
- `WEBSOCKET_CONNECTIONS_TABLE`

### Test 4: Verify DynamoDB Tables

```bash
# Check ChatSessions table
aws dynamodb describe-table \
    --table-name ChatSessions \
    --region us-east-1 \
    --query 'Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount}'

# Check ChatMessages table
aws dynamodb describe-table \
    --table-name ChatMessages \
    --region us-east-1 \
    --query 'Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount}'

# Check WebSocketConnections table
aws dynamodb describe-table \
    --table-name WebSocketConnections \
    --region us-east-1 \
    --query 'Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount}'
```

**Expected:** All tables show `Status: "ACTIVE"`

### Test 5: Test WebSocket Endpoint

```bash
# Test connection (will timeout but shows endpoint is reachable)
wscat -c "wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev?userType=test&userId=test123"
```

**Expected:** Connection established or auth error (means endpoint is working)

---

## 📊 Monitoring & Logs

### Watch Lambda Logs in Real-Time

```bash
aws logs tail /aws/lambda/chat-websocket-handler --follow
```

### View Recent Errors

```bash
aws logs filter-log-events \
    --log-group-name /aws/lambda/chat-websocket-handler \
    --filter-pattern "ERROR" \
    --start-time $(date -u -v-1H +%s)000 \
    --max-items 20
```

### Search for Merchant Connections

```bash
aws logs filter-log-events \
    --log-group-name /aws/lambda/chat-websocket-handler \
    --filter-pattern "Merchant connecting" \
    --start-time $(date -u -v-1H +%s)000
```

### Check Specific Session

```bash
aws dynamodb get-item \
    --table-name ChatSessions \
    --key '{"sessionId": {"S": "chat_merchant_business_xxx"}}' \
    --region us-east-1
```

---

## 🔍 End-to-End Testing

### Step 1: Deploy Backend Changes

```bash
./deploy-merchant-chat-support.sh
```

**Watch for:**
```
✅ Deployment complete!
```

### Step 2: Monitor Logs

```bash
# In a separate terminal, watch logs
aws logs tail /aws/lambda/chat-websocket-handler --follow
```

### Step 3: Connect from Merchant App

1. Open merchant app
2. Navigate to Chat Support
3. Watch logs for connection

**Expected Logs:**
```
📨 WebSocket event received: $connect
🔗 New WebSocket connection: abc123
✅ Connection stored: merchant:business_xxx

📨 WebSocket event received: $default
📨 Processing message: chat_merchant_connect
🏪 Merchant connecting to support chat
✅ Merchant chat session created: chat_merchant_xxx
```

### Step 4: Send Test Message

1. In merchant app, type: "Test message from merchant"
2. Tap send

**Expected Logs:**
```
📨 Processing message: chat_message
💬 Processing chat message
✅ Message stored: msg_xxx
✅ Broadcasting to session participants
```

### Step 5: Check DynamoDB

```bash
# Check session was created
aws dynamodb scan \
    --table-name ChatSessions \
    --filter-expression "userType = :type" \
    --expression-attribute-values '{":type":{"S":"merchant"}}' \
    --region us-east-1 \
    --max-items 5

# Check message was stored
aws dynamodb query \
    --table-name ChatMessages \
    --key-condition-expression "sessionId = :sid" \
    --expression-attribute-values '{":sid":{"S":"chat_merchant_xxx"}}' \
    --region us-east-1
```

### Step 6: Verify Dashboard Receives Message

1. Open support dashboard
2. Check chat list
3. Should see merchant session
4. Open session, verify message visible

---

## ⚠️ Troubleshooting

### Issue: Deployment Fails

**Check:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check Lambda function exists
aws lambda list-functions --query 'Functions[?FunctionName==`chat-websocket-handler`]'
```

### Issue: Connection Fails

**Check:**
```bash
# Verify WebSocket API
aws apigatewayv2 get-apis --query 'Items[?Name==`ChatWebSocket`]'

# Check IAM permissions
aws lambda get-policy --function-name chat-websocket-handler
```

### Issue: Messages Not Routing

**Check:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/chat-websocket-handler --follow

# Verify DynamoDB permissions
aws lambda get-function-configuration \
    --function-name chat-websocket-handler \
    --query 'Role'
```

### Issue: "Unknown message type: chat_merchant_connect"

**Solution:** Backend not updated. Redeploy:
```bash
./deploy-merchant-chat-support.sh
```

---

## 🎯 Success Criteria

### ✅ Backend is working if:

1. **Deployment succeeds**
   ```bash
   aws lambda get-function --function-name chat-websocket-handler
   # Returns function details
   ```

2. **Merchant connects**
   ```
   Logs show: "🏪 Merchant connecting to support chat"
   ```

3. **Session created**
   ```
   Logs show: "✅ Merchant chat session created"
   ```

4. **Messages stored**
   ```bash
   aws dynamodb query --table-name ChatMessages --key-condition-expression "sessionId = :sid"
   # Returns messages
   ```

5. **Dashboard receives**
   - Support dashboard shows merchant session
   - Messages appear in real-time

---

## 📈 Performance Metrics

### Monitor These

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=chat-websocket-handler \
    --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Sum

# Lambda errors
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=chat-websocket-handler \
    --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Sum

# Lambda duration
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --dimensions Name=FunctionName,Value=chat-websocket-handler \
    --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average,Maximum
```

---

## 📋 Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Lambda logs show merchant connections
- [ ] DynamoDB sessions created
- [ ] Messages stored in database
- [ ] Dashboard receives messages
- [ ] No errors in CloudWatch
- [ ] Performance metrics normal

---

## 🔄 Rollback Plan

If deployment causes issues:

```bash
# List previous versions
aws lambda list-versions-by-function \
    --function-name chat-websocket-handler

# Rollback to previous version
aws lambda update-function-configuration \
    --function-name chat-websocket-handler \
    --description "Rollback to version N"

# Or republish previous code
aws lambda publish-version \
    --function-name chat-websocket-handler
```

---

**Ready to deploy?** Run:
```bash
./deploy-merchant-chat-support.sh
```

Then test end-to-end with merchant app! 🚀
