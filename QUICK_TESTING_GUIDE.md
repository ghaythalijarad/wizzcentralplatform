# Quick Testing Guide - WebSocket Message Reception

## 🚀 Test the Fix Right Now

### 1. Open the Support Dashboard
```bash
# Open in Chrome/Safari
open http://localhost:8080/pages/support.html
# or navigate to your deployed URL
```

### 2. Open Browser Console (F12 or Cmd+Option+I)

### 3. Verify Connection
Look for these console messages:
```
🚀 Initializing production live chat system with LiveChatSocket...
🔌 LiveChatSocket connecting (attempt 1): wss://...
✅ LiveChatSocket connected successfully
🔌 WebSocket connected, adding debug listeners
✅ Debug event listeners attached to EventBus
```

### 4. Check Connection State
Run in console:
```javascript
console.log('WebSocket State:', window.liveChatSocket?.ws?.readyState);
// Should output: WebSocket State: 1
// 1 = OPEN (connected)
```

### 5. Send Test Message from Flutter App
1. Open WhizzDriver app on simulator/device
2. Start a support chat session
3. Send a message like: "Test message from driver"

### 6. Watch Support Dashboard
You should see:
- 🔍 Console log: `DEBUG: chat_message event:`
- 📱 New session appears in left panel
- 💬 Message appears when you click the session
- 🔴 Unread badge shows "1"

### 7. Verify Message Details
Run in console:
```javascript
// Check sessions
const sessions = window.ChatSessionService?.sessions;
console.log('All sessions:', Object.keys(sessions || {}));

// Check active session messages
const activeId = window.liveChatSocket?.sessionService?.activeSessionId;
console.log('Active session messages:', sessions?.[activeId]?.messages);
```

## 🐛 If Messages Don't Appear

### Quick Diagnostic
```javascript
// 1. Verify WebSocket is open
console.log('WS State:', window.liveChatSocket?.ws?.readyState); // Should be 1

// 2. Check if ChatSessionService exists
console.log('Service exists:', !!window.ChatSessionService);

// 3. Check connection info
console.log('Connection:', window.liveChatSocket?.getConnectionInfo());

// 4. Check EventBus
console.log('EventBus exists:', !!window.EventBus);
```

### Manual Test Message
Force a test message to see if UI updates work:
```javascript
// This bypasses the network and tests just the UI
window.liveChatSocket?._handleChatMessage({
    sessionId: 'manual_test_' + Date.now(),
    senderType: 'driver',
    senderName: 'Manual Test Driver',
    messageText: 'This is a manually injected test message',
    driverName: 'Test Driver',
    timestamp: new Date().toISOString(),
    metadata: {
        source: 'wizzdriver_app'
    }
});

// Check if it appears in sessions
console.log('Test session created:',  Object.keys(window.ChatSessionService?.sessions || {}));
```

## ✅ Expected Console Output

### On Page Load
```
🚀 Production Support page initializing...
🚀 Initializing production live chat system with LiveChatSocket...
⏳ Waiting for LiveChatSocket... (attempt 1)
[LiveChatSocket] Initialized with enhanced error handling and reconnection
🔌 LiveChatSocket connecting (attempt 1): wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev?businessId=...
✅ LiveChatSocket connected successfully
[LiveChatSocket] State: connecting → connected (websocket_open)
🔌 WebSocket connected, adding debug listeners
✅ Debug event listeners attached to EventBus
✅ LiveChatSocket connected successfully as support agent
📤 Requested active sessions
```

### When Message Arrives
```
🔍 DEBUG: chat_message event: {
    sessionId: "session_xxx",
    senderType: "user",
    senderName: "Driver Name",
    messageText: "Test message",
    timestamp: "2025-11-13T..."
}
📱 Created new verified session for incoming message: session_xxx
💬 New message in verified session: session_xxx {text: "Test message", ...}
```

## 📊 Success Indicators

- ✅ No errors in console
- ✅ WebSocket state = 1 (OPEN)
- ✅ Debug event listeners attached
- ✅ Sessions appear in left panel
- ✅ Messages appear in chat view
- ✅ Unread badges update
- ✅ Can click sessions to view messages

## 🔴 Red Flags

- ❌ WebSocket state ≠ 1
- ❌ "Connection timeout" errors
- ❌ "LiveChatSocket not available" errors
- ❌ No debug event listeners message
- ❌ Sessions array is empty after sending message
- ❌ Console errors about undefined functions

## 📞 Quick Support Commands

### Force Reconnect
```javascript
window.liveChatSocket?.disconnect();
window.liveChatSocket?.connect();
```

### View Stats
```javascript
console.log('Stats:', window.liveChatSocket?.stats);
// Shows: messagesReceived, messagesSent, reconnects, errors
```

### List All Sessions
```javascript
Object.entries(window.ChatSessionService?.sessions || {}).forEach(([id, session]) => {
    console.log(`Session ${id}:`, {
        driverName: session.driverName,
        status: session.status,
        messageCount: session.messages?.length
    });
});
```

## 🎯 Final Check

If everything works, you should be able to:
1. ✅ See driver sessions in left panel
2. ✅ Click session to open chat
3. ✅ See driver messages in chat view
4. ✅ Send reply message (agent → driver)
5. ✅ See typing indicators
6. ✅ Close sessions

## 📝 Report Issues

If it still doesn't work, collect this info:
```javascript
// Copy/paste this entire output when reporting issues
console.log('=== DEBUG INFO ===');
console.log('WebSocket State:', window.liveChatSocket?.ws?.readyState);
console.log('Connection Info:', window.liveChatSocket?.getConnectionInfo());
console.log('Session Service:', !!window.ChatSessionService);
console.log('EventBus:', !!window.EventBus);
console.log('Sessions:', Object.keys(window.ChatSessionService?.sessions || {}));
console.log('Active Session:', window.liveChatSocket?.sessionService?.activeSessionId);
console.log('Live Chat Socket:', !!window.liveChatSocket);
console.log('=== END DEBUG INFO ===');
```

## 🚀 Ready to Test!

The fix has been applied. Open the support dashboard and send a test message from the Flutter app!
