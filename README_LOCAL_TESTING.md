# WebSocket Fix - Local Testing Approach

## ✅ You're Right - Test Local First!

Instead of repeatedly deploying to Amplify and waiting for builds, we should:

1. **Test locally** → Fix any issues → Deploy once

## 🚀 Quick Start

```bash
# Step 1: Test the WebSocket endpoint
./test-websocket-endpoint.sh

# Step 2: Start local server and test in browser
./test-local.sh
```

## 📋 What to Test in Browser

Open DevTools Console (Cmd+Option+J) and run:

```javascript
// Verify version loaded
window.checkConnectionStatus()
// Expected: ✅ Correct version loaded with all functions!

// Check WebSocket connection
merchantChatWS.readyState
// Expected: 1 (OPEN = Connected)
// If 3 (CLOSED) or 0 (CONNECTING forever) = Problem

// Check UI status
document.getElementById('connectionStatus').textContent
// Expected: "متصل" (Connected in Arabic)
```

## 🎯 Success Criteria

Before pushing to Amplify, ensure:
- ✅ `window.checkConnectionStatus()` exists and runs
- ✅ `merchantChatWS.readyState` equals `1` (OPEN)
- ✅ UI shows "متصل" not "جاري الاتصال..."
- ✅ No 403 or timeout errors in console
- ✅ No close code 1006 errors

## 🔧 If WebSocket Fails (403 Error)

The WebSocket endpoint might be returning 403 Forbidden.

**Fix in AWS Console:**
1. Go to API Gateway → WebSocket API `bx4snzqxpd`
2. Routes → `$connect`
3. Set Authorization to `NONE`
4. Deploy to stage `ghayth`

**Test the fix:**
```bash
./test-websocket-endpoint.sh
# Should show: ✅ Endpoint returns 426 (Upgrade Required)
```

## 📦 Once Working Locally → Deploy

```bash
# Commit all changes
git add -A
git commit -m "fix: WebSocket connection verified working locally - v1763060500"

# Push to both repositories
git push origin main
git push amplify main

# Wait for Amplify build (2-5 min), then verify
./verify-deployment.sh
```

## 📁 Files Created

- `test-local.sh` - Local development server
- `test-websocket-endpoint.sh` - Endpoint diagnostics  
- `verify-deployment.sh` - Production verification
- `LOCAL_TESTING_WORKFLOW.md` - Complete documentation

## 💡 Why This Approach is Better

**Before:** Deploy → Wait → Check → Fix → Deploy → Wait → Check...
- Takes 5-10 minutes per iteration
- Hard to debug production issues
- Amplify caching causes confusion

**Now:** Test Local → Fix → Deploy Once
- Instant feedback (no build wait)
- Easy to debug with DevTools
- Verify working before deploying
- Deploy with confidence

## 🆘 Troubleshooting

**Issue:** `window.checkConnectionStatus` is undefined
**Fix:** Hard refresh (Cmd+Shift+R) or open in Incognito mode

**Issue:** `merchantChatWS.readyState` is `3` (CLOSED)
**Cause:** WebSocket endpoint returns 403 or connection refused
**Fix:** Run `./test-websocket-endpoint.sh` for diagnosis

**Issue:** Stuck on "جاري الاتصال..." (Connecting...)
**Cause:** Connection timeout (10 seconds), likely 403 error
**Fix:** Check AWS API Gateway $connect route authorization

Read `LOCAL_TESTING_WORKFLOW.md` for detailed troubleshooting.
