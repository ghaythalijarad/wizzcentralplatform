# Message Delivery Debugging Guide

## Issue: Messages Not Being Delivered to WhizzDriver App

### Enhanced Debugging Added ✅

I've added comprehensive debugging to the `sendMessage()` function in `support.html`. The console will now show:

```javascript
🚗 Sending message to driver/customer session: [sessionId]
🔍 DEBUG: wsManager exists? [true/false]
🔍 DEBUG: wsManager.connected? [true/false]
🔍 DEBUG: wsManager.ws? [WebSocket object or undefined]
🔍 DEBUG: wsManager.ws.readyState? [0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED]
📤 Sending chat message: [full message object]
📤 Send result: [true/false]
```

### Step-by-Step Debugging Process

#### 1. Hard Refresh Browser
```bash
# The server has been restarted with updated code
# Press Cmd + Shift + R in Safari/Chrome to clear cache
```

#### 2. Open Browser Console
- Right-click → Inspect Element → Console tab
- Keep console open while testing

#### 3. Check Connection Status

Look for these messages when page loads:
```
✅ LiveChatSocket connected successfully as support agent
✅ Successfully joined live chat channel
🔗 Connection status update: connected - Connected to live chat as support agent
```

**Expected Status Indicator:**
- Top-right corner should show GREEN dot with "Connected to live chat as support agent"
- If ORANGE (connecting) or RED (disconnected), click "Reconnect" button

#### 4. Check Active Session

When you select a chat session, console should show:
```
📱 Selecting chat session: [Driver Name]
```

Verify:
- Session card is highlighted (blue border)
- Chat input box is visible at bottom
- Chat header shows driver name

#### 5. Try Sending a Message

Type a message and press Enter or click Send button. Console should show:

**✅ EXPECTED (Working):**
```
🚗 Sending message to driver/customer session: session_xxx
🔍 DEBUG: wsManager exists? true
🔍 DEBUG: wsManager.connected? true
🔍 DEBUG: wsManager.ws? WebSocket
🔍 DEBUG: wsManager.ws.readyState? 1
📤 Sending chat message: {action: "send_message", type: "CHAT_MESSAGE", ...}
📤 LiveChatSocket sent: CHAT_MESSAGE
📤 Send result: true
```

**❌ PROBLEM SCENARIOS:**

**Scenario A: wsManager doesn't exist**
```
🔍 DEBUG: wsManager exists? false
❌ wsManager not available!
```
**FIX:** Click "Reconnect" button or reload page

**Scenario B: Not connected**
```
🔍 DEBUG: wsManager.connected? false
🔍 DEBUG: wsManager.ws.readyState? 0 or 3
📤 Message queued (not connected): CHAT_MESSAGE
```
**FIX:** Wait for connection, or click "Reconnect"

**Scenario C: Send fails**
```
📤 Send result: false
❌ Failed to send message - wsManager.send() returned false
```
**FIX:** Check WebSocket backend logs

#### 6. Check WebSocket Backend

The message is sent to:
```
wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
```

**Message Format Sent:**
```json
{
  "action": "send_message",
  "type": "CHAT_MESSAGE",
  "sessionId": "session_xxx",
  "messageText": "Hello",
  "text": "Hello",
  "senderType": "agent",
  "senderName": "Support Agent",
  "userType": "agent",
  "agentId": "support_agent_xxx",
  "timestamp": "2025-11-13T...",
  "payload": {
    "sessionId": "session_xxx",
    "text": "Hello",
    "senderType": "agent",
    "userType": "agent",
    "senderName": "Support Agent",
    "timestamp": "2025-11-13T..."
  }
}
```

#### 7. Check WhizzDriver App

The Flutter app should be listening for messages with:
- `type: "CHAT_MESSAGE"` or `action: "send_message"`
- `sessionId` matching the current chat session
- `senderType: "agent"` to identify it's from support

### Common Issues & Fixes

#### Issue 1: "Empty message" echoes appear
**Cause:** Agent messages being processed as customer messages
**Status:** ✅ FIXED (agent messages now filtered out in `handleChatMessage()`)

#### Issue 2: Message appears in dashboard but not in Flutter app
**Possible Causes:**
1. Flutter app not subscribed to correct channel/sessionId
2. Flutter app filtering out agent messages incorrectly
3. Backend not routing message to Flutter app
4. Flutter WebSocket disconnected

**Debug Steps:**
```javascript
// In Flutter app, check WebSocket connection:
// - Is connection open?
// - What messages are being received?
// - Is onMessage handler called?
```

#### Issue 3: Connection shows "Connecting..." forever
**Cause:** WebSocket handshake failing
**Fix:** 
1. Check if endpoint is correct in line 677 of support.html
2. Verify AWS API Gateway is running
3. Check network tab for WebSocket errors

#### Issue 4: No active sessions appear
**Cause:** Test/mock sessions being filtered out
**Status:** ✅ WORKING AS DESIGNED
**Note:** Only real Flutter app sessions (with `source: 'wizzdriver_app'` or `userType: 'driver'`) will appear

### Testing Checklist

- [ ] Hard refresh browser (Cmd + Shift + R)
- [ ] Check connection status (GREEN dot)
- [ ] Open browser console
- [ ] Select an active chat session
- [ ] Type a test message
- [ ] Check console for debug output
- [ ] Verify wsManager.connected is true
- [ ] Verify wsManager.ws.readyState is 1 (OPEN)
- [ ] Verify send result is true
- [ ] Check Flutter app console for incoming message
- [ ] Verify message appears in Flutter app UI

### Message Flow Diagram

```
Support Dashboard                WebSocket Server              WhizzDriver App
     |                                  |                            |
     | 1. Type message                  |                            |
     |--------------------------------->|                            |
     |                                  |                            |
     | 2. wsManager.send()              |                            |
     |   {type: CHAT_MESSAGE}           |                            |
     |--------------------------------->|                            |
     |                                  |                            |
     |                                  | 3. Route to session        |
     |                                  |--------------------------->|
     |                                  |                            |
     |                                  |                            | 4. Display message
     |                                  |                            |
     | 5. Echo back (FILTERED OUT)      |                            |
     |<---------------------------------|                            |
```

### Quick Test Command

After hard refresh, paste this in browser console:
```javascript
// Check WebSocket status
console.log('wsManager exists:', !!window.wsManager || !!window.liveChatSocket);
console.log('Connected:', window.liveChatSocket?.connected);
console.log('WebSocket state:', window.liveChatSocket?.ws?.readyState);
console.log('Active sessions:', window.activeChatSessions?.size);
console.log('Current session:', window.currentSessionId);

// Try manual send (replace SESSION_ID with actual session ID)
if (window.liveChatSocket) {
    window.liveChatSocket.send({
        action: 'send_message',
        type: 'CHAT_MESSAGE',
        sessionId: 'SESSION_ID_HERE',
        text: 'Test from console',
        senderType: 'agent'
    });
}
```

### Next Steps

1. **Hard refresh** the browser to load updated debugging code
2. **Open console** and watch for debug messages
3. **Try sending** a message and report what you see
4. **Share console output** if message still not delivered

The enhanced debugging will help us pinpoint exactly where the message delivery is failing!
