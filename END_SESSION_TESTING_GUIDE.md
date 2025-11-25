# End Session Quick Testing Guide 🧪

## How to Test End Session Functionality

### Prerequisites:
- ✅ Support dashboard open: `http://localhost:3000/pages/support.html`
- ✅ Active chat session (from driver or merchant app)
- ✅ Browser notifications enabled
- ✅ Developer console open (F12)

---

## 🚀 Quick Test Steps

### 1. **Visual Check** (5 seconds)
```
Open support dashboard → Select active session → Look for "End Session" button in header
```
**Expected**: Red "✕ End Session" button visible in top-right of chat area

---

### 2. **Basic Flow Test** (30 seconds)

1. **Click "End Session" button**
   - Expected: Confirmation dialog appears
   - Message: "Are you sure you want to end the chat session with [Customer Name]?"

2. **Click "OK"**
   - Expected: System message appears in chat: "Session ended by agent"
   - Expected: Input box disappears
   - Expected: Title changes to "[Customer Name] - Closed"
   - Expected: End Session button disappears

3. **Wait 2 seconds**
   - Expected: Chat clears to "Session Ended" empty state
   - Message: "You closed this chat session"

4. **Check sidebar**
   - Expected: Session removed from "Active Conversations"
   - Expected: Session appears in "Closed Sessions (Last 2h)"

---

### 3. **Console Verification** (15 seconds)

Open browser console and look for these logs:

```javascript
✅ Added system message: "Session ended by agent"
📁 Moved session to closed sessions archive
📤 Sent session end message: {action: "chat_session_close", ...}
✅ Session ended by agent: session_xyz123
🔔 Showing notification: Session Ended, You closed the chat with...
✅ Browser notification sent
```

---

### 4. **Browser Notification Check** (5 seconds)

Look for desktop notification:
```
Title: "Session Ended"
Body: "You closed the chat with [Customer Name]"
Icon: WhizzCentral favicon
```

---

### 5. **Closed Session Archive Test** (15 seconds)

1. Scroll down sidebar to "Closed Sessions (Last 2h)"
2. **Check counter badge** - should show "1"
3. **Click the closed session**
   - Expected: Chat opens in read-only mode
   - Expected: Archive icon in avatar
   - Expected: "Closed by agent" subtitle
   - Expected: Input box not visible
   - Expected: End Session button not visible
4. **View chat history** - all messages should be preserved

---

### 6. **WebSocket Verification** (20 seconds)

1. Open **Network tab** → **WS** filter
2. Click on active WebSocket connection
3. Click "End Session"
4. Look for **sent frame** with:
   ```json
   {
     "action": "chat_session_close",
     "sessionId": "...",
     "closedByUserType": "agent",
     "timestamp": "..."
   }
   ```
5. Check backend sends acknowledgment (optional)

---

### 7. **Merchant vs Driver Routing** (30 seconds)

**Test Driver Session:**
```javascript
// In console before ending:
console.log('Is merchant:', activeChatSessions.get(currentSessionId).userType === 'merchant');
// Should be: false

// After clicking End Session:
// Look for: 📤 Sent session end message
// Verify sent via wsManager (driver WebSocket)
```

**Test Merchant Session:**
```javascript
// In console:
console.log('Is merchant:', activeChatSessions.get(currentSessionId).userType === 'merchant');
// Should be: true

// After clicking End Session:
// Look for: 📤 Sent merchant session end message
// Verify sent via merchantChatWS
```

---

### 8. **Cancel Test** (10 seconds)

1. Select active session
2. Click "End Session"
3. **Click "Cancel"** in confirmation dialog
4. **Expected**: Nothing happens, session remains active
5. **Expected**: No console logs about closure
6. **Expected**: Button still visible

---

## 🐛 Troubleshooting

### Problem: Button Not Visible
**Check**:
```javascript
// In console:
document.getElementById('endSessionBtn')
// Should return: <button> element

document.getElementById('endSessionBtn').style.display
// Should be: "block" (not "none")

window.RBAC.isReadOnly()
// Should be: false (not true)
```

### Problem: Nothing Happens When Clicking
**Check**:
```javascript
// In console:
typeof window.endChatSession
// Should be: "function"

currentSessionId
// Should be: "session_xyz123..." (not null)

activeChatSessions.has(currentSessionId)
// Should be: true
```

### Problem: No WebSocket Message Sent
**Check**:
```javascript
// In console:
wsManager
// Should be: LiveChatSocket object (not null)

wsManager.ws.readyState
// Should be: 1 (OPEN)

merchantChatWS?.readyState
// Should be: 1 (OPEN) for merchant sessions
```

### Problem: Session Not Removed
**Check**:
```javascript
// After ending:
setTimeout(() => {
  console.log('Still in active:', activeChatSessions.has(sessionId));
  console.log('Now in closed:', closedSessions.has(sessionId));
}, 3000);
// Should be: false, true
```

---

## ✅ Success Criteria

All of these should happen:
- [x] Confirmation dialog appears
- [x] System message added to chat
- [x] WebSocket message sent (check Network tab)
- [x] Input box hidden
- [x] End Session button hidden  
- [x] Title updated to show "Closed"
- [x] Session removed from active list (after 2s)
- [x] Session added to closed list
- [x] Browser notification shown
- [x] Console logs all success messages
- [x] Can view closed session (read-only)

---

## 🎯 One-Line Test

```javascript
// Run in console with active session:
endChatSession(); // Click OK → Watch for system message + UI changes
```

---

## 📸 What You Should See

### Before End Session:
```
┌─────────────────────────────────────┐
│ 👤 John Doe              [✕ End]   │ ← Button visible
├─────────────────────────────────────┤
│ Chat messages...                    │
├─────────────────────────────────────┤
│ [Type message...] [Send]            │ ← Input visible
└─────────────────────────────────────┘
```

### After End Session (immediate):
```
┌─────────────────────────────────────┐
│ 🔒 John Doe - Closed                │ ← Title changed, button gone
├─────────────────────────────────────┤
│ Chat messages...                    │
│ [System] Session ended by agent     │ ← New message
├─────────────────────────────────────┤
│                                     │ ← No input
└─────────────────────────────────────┘
```

### After 2 Seconds:
```
┌─────────────────────────────────────┐
│ Select a conversation               │
├─────────────────────────────────────┤
│         ✓                           │
│    Session Ended                    │
│ You closed this chat session        │
│ Select another conversation...      │
└─────────────────────────────────────┘
```

---

**Ready to test!** Open support dashboard and click "End Session" on any active chat.

**Time to complete**: ~2 minutes for full test suite
