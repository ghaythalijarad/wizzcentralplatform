# WebSocket Local Testing Checklist

## ✅ Setup Complete

- [x] WebSocket endpoint is reachable (426 response)
- [x] Local server is running on port 8080
- [x] Browser opened in Incognito mode

## 🧪 Testing Instructions

### 1. Open Browser DevTools
Press `Cmd+Option+J` (Mac) or `F12` (Windows/Linux)

### 2. Run Diagnostic Commands

```javascript
// Check version and functions
window.checkConnectionStatus()
```

**Expected Output:**
```
=== CONNECTION STATUS DIAGNOSTIC ===
Page Version: 1763060500_MERCHANT_WS_FIX_COMPLETE
merchantChatWS readyState: 1 (1=OPEN, 3=CLOSED)
✅ Correct version loaded with all functions!
====================================
```

```javascript
// Check WebSocket state
merchantChatWS.readyState
```

**Expected Result:** `1` (WebSocket.OPEN = Connected)

### 3. Visual Check

Look at the **top-right corner** of the page:

- ✅ **Green dot** + "متصل" = **Working!**
- ❌ **Yellow pulsing dot** + "جاري الاتصال..." = **Not connected**
- ❌ **Red dot** + "غير متصل" = **Disconnected**

### 4. Console Logs Check

Look for these success messages in the console:

```
✅ Merchant chat WebSocket connected
📍 Active endpoint: wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
✅ CONNECTION STATE: merchantChatWS is OPEN (readyState: 1)
```

## 📊 Test Results

### ✅ SUCCESS = All of these pass:
- [ ] `window.checkConnectionStatus()` exists and runs
- [ ] `merchantChatWS.readyState` equals `1`
- [ ] UI shows green dot and "متصل"
- [ ] No errors in console
- [ ] No "Close code 1006" errors
- [ ] No timeout messages

### ❌ FAILURE = Any of these occur:
- [ ] `window.checkConnectionStatus` is undefined
- [ ] `merchantChatWS.readyState` is `3`, `0`, or undefined
- [ ] UI stuck on "جاري الاتصال..."
- [ ] Console shows "Close code 1006"
- [ ] Console shows timeout after 10 seconds

## 🎯 Next Steps

### If ALL tests pass ✅

**Deploy to production:**
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
git add -A
git commit -m "fix: WebSocket connection verified working locally - v1763060500"
git push origin main
git push amplify main
```

Then wait 2-5 minutes for Amplify build and test production.

### If ANY test fails ❌

**Troubleshooting steps:**

1. **Check WebSocket readyState:**
   ```javascript
   merchantChatWS.readyState
   // 0 = CONNECTING (wait a moment)
   // 1 = OPEN (good!)
   // 2 = CLOSING
   // 3 = CLOSED (error)
   ```

2. **Check for close event:**
   ```javascript
   merchantChatWS.onclose = (e) => console.log('Close code:', e.code, 'Reason:', e.reason)
   ```

3. **Look for specific errors:**
   - "Close code 1006" = Authentication/authorization issue (shouldn't happen, we verified 426)
   - "Timeout after 10s" = Connection not established
   - "onerror" = Network or protocol error

4. **Share the errors** and we'll debug together

## 🛑 Stop Local Server

When done testing:
```bash
lsof -ti:8080 | xargs kill -9
```

## 📝 Notes

- Local URL: http://localhost:8080/frontend/pages/support.html
- Production URL: https://main.d3nnkgw9rvy0ew.amplifyapp.com/pages/support.html
- WebSocket URL: wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
- Version: 1763060500_MERCHANT_WS_FIX_COMPLETE
