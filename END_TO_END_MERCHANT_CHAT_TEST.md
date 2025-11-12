# 🚀 END-TO-END MERCHANT CHAT TEST GUIDE

**Date**: November 11, 2025, 19:40 UTC
**Objective**: Test merchant chat from Flutter app → WhizzCentral → Reply back to app

---

## 📋 PREPARATION CHECKLIST

Before testing, ensure:
- [ ] Flutter merchant app is running on iOS simulator
- [ ] Support dashboard is open at `http://localhost:3000/pages/support.html`
- [ ] You have 2 terminal windows open

---

## 🔧 STEP-BY-STEP TEST PROCEDURE

### **Terminal 1: Monitor Lambda Logs**

Run this command to watch Lambda logs in real-time:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./monitor-merchant-chat.sh
```

**OR manually:**

```bash
aws logs tail /aws/lambda/wizzcentral-websocket-dev-liveChatConnect \
  --follow \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --format short
```

**Keep this terminal visible** while testing!

---

### **Terminal 2: Check Recent Logs** (Optional)

To see what happened in the last 5 minutes:

```bash
aws logs tail /aws/lambda/wizzcentral-websocket-dev-liveChatConnect \
  --since 5m \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --format short
```

---

## 📱 FLUTTER APP TEST

### **Step 1: Open Chat Support**

In the iOS simulator:
1. Tap **Profile** (bottom navigation)
2. Tap **About App**
3. Tap **Chat Support**

**Watch Terminal 1 for:**
```
🏪 Merchant connecting to live chat: <connectionId>
Storing merchant connection in DynamoDB...
Creating merchant chat session...
✅ Chat session created in chat-sessions-dev
✅ Notified agents of new merchant session
```

**Expected in Flutter app:**
- Status changes to: "Connected to Support"
- Chat input field is enabled

---

### **Step 2: Send Test Message**

In the Flutter chat screen, type:
```
Hello from merchant app - testing end-to-end chat!
```

Tap **Send**.

**Watch Terminal 1 for:**
```
💬 Chat message from <connectionId>
Parsed message: {...}
✅ Stored message in DynamoDB
✅ Sent message to all agents
```

**Expected in Flutter app:**
- Message appears in chat with timestamp
- Shows as "Sent"

---

## 💻 SUPPORT DASHBOARD TEST

### **Step 3: Verify Session in Dashboard**

Switch to your browser with support dashboard:

**Expected:**
- "ACTIVE CONVERSATIONS" shows: `(1)` or higher
- New conversation appears with:
  - 🏪 Merchant icon
  - Your business name
  - Your business email  
  - Source: "whizzMerchants"
  - Preview of your message

---

### **Step 4: Open Conversation**

Click on the merchant conversation.

**Expected:**
- Right panel shows conversation view
- Your test message appears with:
  - Timestamp
  - Sender: Your business name
  - Message content
  - Left-aligned (from customer/merchant)

---

### **Step 5: Reply from Dashboard**

In the message input at the bottom:
1. Type: `Hello merchant! I received your message. How can I help you today?`
2. Press **Enter** or click **Send**

**Watch Terminal 1 for:**
```
📤 Agent sending message to session: <sessionId>
✅ Message delivered to merchant connection: <connectionId>
```

**Expected in Dashboard:**
- Your reply appears in conversation
- Right-aligned (from agent)
- Shows timestamp

---

### **Step 6: Verify Reply in Flutter App**

Switch back to iOS simulator.

**Expected in Flutter chat:**
- Agent message appears automatically
- Right-aligned (from support)
- Shows timestamp
- May show "Support Agent" as sender

---

## 🔄 BIDIRECTIONAL TEST

### **Step 7: Continue Conversation**

**From Flutter app**, send:
```
Great! I have a question about my menu items.
```

**From Dashboard**, reply:
```
I'd be happy to help with your menu items. What would you like to know?
```

**Verify:**
- [ ] Messages appear instantly in both places
- [ ] Timestamps are correct
- [ ] No errors in Lambda logs
- [ ] Both sides can send/receive smoothly

---

## ✅ SUCCESS CRITERIA

The test is **successful** when:

1. ✅ **Connection**: Merchant connects and sees "Connected to Support"
2. ✅ **Merchant → Dashboard**: Messages flow from app to dashboard
3. ✅ **Dashboard → Merchant**: Replies flow from dashboard to app
4. ✅ **Lambda Logs**: Show merchant connections and message delivery
5. ✅ **No Errors**: No errors in Lambda logs or browser console
6. ✅ **Real-time**: Messages appear within 1-2 seconds

---

## 🐛 TROUBLESHOOTING

### If merchant doesn't connect:

**Check Flutter Console:**
```
Look for:
🔗 SupportChat: Connecting to WebSocket...
🤝 SupportChat: Sending handshake: {...}
❌ WebSocket error: ...
```

**Check Lambda Logs:**
```
Look for:
- Connection attempt logs
- Error messages
- Authentication issues
```

### If messages don't appear in dashboard:

**Check Browser Console (F12):**
```javascript
// Look for:
- WebSocket connection status
- Incoming message events
- JavaScript errors
```

**Check Lambda Logs:**
```
Look for:
💬 Chat message from <connectionId>
✅ Sent message to all agents
```

### If replies don't reach Flutter app:

**Check Lambda Logs:**
```
Look for:
📤 Agent sending message to session
✅ Message delivered to merchant connection
❌ Error sending to connection
```

**Check Flutter Console:**
```
Look for:
📨 SupportChat: Received message: {...}
```

---

## 📊 MONITORING COMMANDS

### Check Active WebSocket Connections:

```bash
aws dynamodb scan \
  --table-name websocket-connections-dev \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --filter-expression "attribute_exists(userType)" \
  --projection-expression "connectionId,userType,userId,authenticated"
```

### Check Active Chat Sessions:

```bash
aws dynamodb scan \
  --table-name chat-sessions-dev \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --filter-expression "attribute_exists(merchantId)" \
  --projection-expression "sessionId,merchantName,merchantEmail,status,createdAt"
```

### Check Recent Messages:

```bash
aws dynamodb scan \
  --table-name chat-messages-dev \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --max-items 10 \
  --projection-expression "messageId,sessionId,message,senderType,timestamp"
```

---

## 🎯 NEXT STEPS AFTER SUCCESSFUL TEST

Once the test succeeds:

1. ✅ **Document the success** with screenshots
2. ✅ **Test edge cases**:
   - Multiple merchants connecting simultaneously
   - Long messages
   - Special characters in messages
   - Disconnection and reconnection
3. ✅ **Performance test**:
   - Send multiple messages quickly
   - Verify message ordering
4. ✅ **Clean up test data** if needed

---

## 📞 READY TO START?

1. **Open Terminal 1** - Run monitoring script
2. **Open Terminal 2** - Keep for ad-hoc commands
3. **Open iOS Simulator** - Navigate to Chat Support
4. **Open Browser** - Support dashboard ready
5. **Start the test!** Follow steps above

**Let me know what you see at each step!** 🚀

