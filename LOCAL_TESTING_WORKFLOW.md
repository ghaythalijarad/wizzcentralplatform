# Local Development & Testing Workflow

## 🎯 Purpose
This guide explains how to test WebSocket fixes locally before deploying to AWS Amplify.

## 📋 Prerequisites
- Python 3 installed (for local server)
- Chrome or Safari browser
- Terminal access

## 🚀 Quick Start

### Step 1: Test WebSocket Endpoint
First, verify the AWS WebSocket endpoint is accessible:

```bash
./test-websocket-endpoint.sh
```

**Expected Output:**
- ✅ Endpoint returns 426 (Upgrade Required) - Normal for WebSocket
- ❌ Endpoint returns 403 Forbidden - **Needs AWS fix** (see below)

### Step 2: Run Local Development Server
Start the local server and open the support page:

```bash
./test-local.sh
```

This will:
1. Start a Python HTTP server on port 8080
2. Open Chrome with the support page
3. Disable browser cache for testing

### Step 3: Test in Browser Console
Once the page loads, open DevTools (Cmd+Option+J) and run:

```javascript
// Check if the new version loaded
window.checkConnectionStatus()

// Expected output:
// ✅ Correct version loaded with all functions!
// Page Version: 1763060500_MERCHANT_WS_FIX_COMPLETE

// Check WebSocket state
merchantChatWS.readyState
// Expected: 1 (OPEN) - Connected successfully
// If 3 (CLOSED) or undefined - Connection failed
```

### Step 4: Verify UI Status
Look at the top-right corner of the page:
- ✅ **"متصل"** (Connected in Arabic) - Working!
- ❌ **"جاري الاتصال..."** (Connecting...) - Still failing

---

## 🔧 Troubleshooting

### Issue 1: WebSocket Returns 403 Forbidden

**Symptoms:**
- Connection timeout after 10 seconds
- Console shows: `❌ Close code 1006: Abnormal closure`
- UI stuck on "جاري الاتصال..." (Connecting...)

**Fix:**
1. Go to [AWS API Gateway Console](https://console.aws.amazon.com/apigateway)
2. Select **WebSocket API** with ID: `bx4snzqxpd`
3. Click **Routes** in left sidebar
4. Click **$connect** route
5. Under **Route Settings**, set:
   - **Authorization**: `NONE`
   - **API Key Required**: `No`
6. Click **Save**
7. Click **Actions** > **Deploy API**
8. Select stage: `ghayth`
9. Click **Deploy**

**Verify Fix:**
```bash
./test-websocket-endpoint.sh
# Should show: ✅ Endpoint returns 426 (Upgrade Required)
```

### Issue 2: Old Version Loading Locally

**Symptoms:**
- `window.checkConnectionStatus()` returns `undefined`
- Version shows old timestamp

**Fix:**
1. Hard refresh: **Cmd+Shift+R** (Chrome) or **Cmd+Option+E** (Safari)
2. Or open in Incognito/Private mode
3. Or clear browser cache:
   - Chrome: Settings > Privacy > Clear browsing data
   - Safari: Develop > Empty Caches

### Issue 3: WebSocket Connects Locally But Not on Amplify

**Cause:** Amplify CDN caching old version

**Fix:**
1. Add cache-busting query parameter:
   ```
   https://main.d3nnkgw9rvy0ew.amplifyapp.com/pages/support.html?v=1763060500
   ```

2. Or wait 5-10 minutes for CDN cache to expire

3. Or invalidate Amplify cache:
   ```bash
   # Via AWS Console
   # Amplify > App > Hosting > Invalidate cache
   ```

---

## 📦 Deployment Workflow

### ✅ Recommended: Test Local → Push to Amplify

**Step 1: Test Locally**
```bash
# Start local server
./test-local.sh

# In browser console, verify:
window.checkConnectionStatus()  // ✅ Correct version
merchantChatWS.readyState       // 1 (OPEN)
```

**Step 2: Commit Changes**
```bash
git add frontend/pages/support.html
git commit -m "fix: WebSocket connection with enhanced diagnostics - v1763060500"
```

**Step 3: Push to Both Remotes**
```bash
# Push to GitHub
git push origin main

# Push to Amplify (triggers deployment)
git push amplify main
```

**Step 4: Monitor Amplify Build**
1. Go to [Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app
3. Watch build progress (usually 2-5 minutes)

**Step 5: Verify Production**
Once build completes:
```bash
# Run verification script
./verify-deployment.sh

# Or manually test in browser (incognito mode):
# https://main.d3nnkgw9rvy0ew.amplifyapp.com/pages/support.html?nocache=123456
```

---

## 🔍 Diagnostic Commands

### Check Local Server Status
```bash
lsof -ti:8080  # Should return PID if running
```

### Stop Local Server
```bash
lsof -ti:8080 | xargs kill -9
```

### Check Git Status
```bash
git status
git log --oneline -5
```

### Check WebSocket Endpoint Directly
```bash
curl -I https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
# Expected: HTTP/1.1 426 Upgrade Required
# Bad: HTTP/1.1 403 Forbidden
```

### Test with wscat (WebSocket CLI)
```bash
# Install wscat
npm install -g wscat

# Test connection
wscat -c wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth

# Expected: Connected (press Ctrl+C to exit)
# If fails: Check AWS API Gateway settings
```

---

## 📊 Success Criteria

Before pushing to production, verify ALL of these:

- [ ] Local server starts without errors
- [ ] `window.checkConnectionStatus()` shows correct version
- [ ] `merchantChatWS.readyState` equals `1` (OPEN)
- [ ] UI shows "متصل" (Connected)
- [ ] Console has no 403 or timeout errors
- [ ] Can send/receive test messages
- [ ] Browser hard refresh still works

---

## 🆘 Need Help?

**Console Errors:**
- Check browser DevTools Console tab
- Look for red error messages
- Share the full error message for debugging

**Network Errors:**
- Check DevTools Network tab
- Filter by "WS" (WebSocket)
- Look for failed connections (red)
- Check response headers and status codes

**AWS Configuration:**
- Verify API Gateway settings
- Check Lambda function logs (if using authorizer)
- Review CloudWatch logs for WebSocket API

---

## 📝 Files in This Workflow

- `test-local.sh` - Start local development server
- `test-websocket-endpoint.sh` - Diagnose WebSocket endpoint
- `verify-deployment.sh` - Check production deployment
- `quick-push.sh` - Fast git push to both remotes
- `deploy-support.sh` - Deploy support page only

All scripts are executable and documented inline.
