# 🚀 FLUTTER APP → CENTRAL PLATFORM TESTING GUIDE

## ✅ CURRENT STATUS (No Restart/Deploy Needed!)

**Central Platform:** HTTP 200 - ✅ Online  
**WebSocket API:** HTTP 426 - ✅ Ready for WebSocket connections  
**Flutter App:** ✅ Starting up...

## 📱 STEP-BY-STEP TESTING (5 minutes)

### Step 1: Wait for Flutter App to Load (30 seconds)
```bash
# Check if app is running
ps aux | grep "flutter run" | grep -v grep
```

### Step 2: Open iPhone Simulator
- Look for iPhone simulator window
- Should show the Hadhir driver app loading

### Step 3: Authenticate Driver (CRITICAL STEP!)
The live chat requires a logged-in driver:

**Option A: Login with existing account**
- If you see login screen, use valid credentials

**Option B: Create test account**
- Look for orange button "إنشاء حساب تجريبي مباشر" 
- Or use registration flow

**Test Credentials (if available):**
- Email: `testdriver@example.com`
- Password: `TestPass123!`

### Step 4: Navigate to Live Chat
1. **Main screen** → Tap "More" tab (أكثر)
2. **Support section** → Tap "Live Chat" (الدردشة المباشرة)
3. **Wait for connection** → Look for "connected" status

### Step 5: Send Test Message
1. **Type message:** `"🧪 Test from Flutter app - [current time]"`
2. **Send message** → Tap send button
3. **Watch for confirmation** → Message should appear in chat

### Step 6: Check Central Platform
1. **Open browser** → Go to: `https://main.d2f5oacwil9cbi.amplifyapp.com/frontend/support.html`
2. **Login to Central Platform** (if required)
3. **Go to Support tab** → Look for incoming messages
4. **Verify message appears** → Should see your test message

## 🔍 DEBUGGING CONSOLE LOGS

Watch Flutter console for these logs:

### ✅ SUCCESS LOGS:
```
🔐 JWT token obtained successfully
✅ WebSocket connected successfully with JWT authentication
📤 Sent driver authentication
📤 Message sent via WebSocket
```

### ❌ ERROR LOGS TO WATCH FOR:
```
❌ No valid Cognito session found
⚠️ No AWS Cognito token available - driver must login first
❌ WebSocket connection failed: 401
```

## ⚡ QUICK VERIFICATION COMMANDS

```bash
# Check Flutter app status
ps aux | grep "flutter run" | head -1

# Check Central Platform status
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://main.d2f5oacwil9cbi.amplifyapp.com"

# Check iPhone simulator is running
ps aux | grep Simulator | head -1
```

## 🚨 TROUBLESHOOTING

### If Flutter App Won't Start:
```bash
cd /Users/ghaythallaheebi/Desktop/hadhir
flutter clean
flutter pub get
flutter run --device-id 00008110-001C79140284801E
```

### If Login Fails:
- Try creating new account through registration flow
- Check network connectivity
- Verify AWS Cognito is working

### If WebSocket Connection Fails:
- Ensure driver is logged in first
- Check console for JWT token errors
- Verify AppConfig.enableAWSIntegration = true

### If Message Not Received:
- Refresh Central Platform page
- Check browser developer console
- Verify correct session ID in messages

## 🎯 EXPECTED RESULT

**Complete Success Flow:**
1. Flutter app loads ✅
2. Driver logs in ✅
3. Live chat connects ✅
4. Message sent ✅
5. Message appears in Central Platform ✅

**Total Time:** 2-3 minutes after authentication

## 📞 CENTRAL PLATFORM LINKS

- **Main Platform:** https://main.d2f5oacwil9cbi.amplifyapp.com
- **Support Page:** https://main.d2f5oacwil9cbi.amplifyapp.com/frontend/support.html
- **Login Page:** https://main.d2f5oacwil9cbi.amplifyapp.com/frontend/pages/login.html

---

**🚀 Ready to test! No deployment needed - everything is live and operational.**
