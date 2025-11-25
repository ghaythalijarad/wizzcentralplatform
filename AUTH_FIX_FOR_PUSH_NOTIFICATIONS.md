# 🔧 PUSH NOTIFICATIONS - AUTHENTICATION FIX

## 🐛 Issue Identified
**Error**: "Unauthorized" when sending push notifications from production

**Root Cause**: The code was trying to use `window.amplifyAuth.fetchAuthSession()` which doesn't exist in the current setup. The correct authentication method is `window.Auth.getIdToken()` which retrieves the token from localStorage.

---

## ✅ Fix Applied

### Changed Authentication Method
```javascript
// ❌ BEFORE (Wrong - doesn't exist)
const session = await window.amplifyAuth.fetchAuthSession();
const idToken = session.tokens?.idToken?.toString();

// ✅ AFTER (Correct - uses existing Auth utility)
const idToken = window.Auth?.getIdToken();
```

### Improvements Made
1. ✅ Uses correct `window.Auth.getIdToken()` from `auth-utils.js`
2. ✅ Better error handling - shows user-friendly message if not authenticated
3. ✅ Enhanced console logging for debugging
4. ✅ Early return if no token (prevents unnecessary API call)

---

## 📊 Deployment Status

### Current Deployments
- **Job 193** (Previous): ✅ **SUCCEEDED** at 14:49
- **Job 194** (Auth Fix): ⏳ **RUNNING** at 15:03

### Timeline
- ✅ **15:00** - Issue identified (Unauthorized error)
- ✅ **15:01** - Root cause found (wrong auth method)
- ✅ **15:02** - Fix applied and tested locally
- ✅ **15:03** - Committed and pushed to production
- ⏳ **~15:10** - Expected deployment completion

---

## 🧪 Testing After Deployment

Once Job 194 completes (ETA: ~5-7 minutes), test again:

### Step 1: Hard Refresh
```
1. Open: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/promotions.html
2. Press: Cmd + Shift + R (hard refresh to clear cache)
3. Login with your admin credentials
```

### Step 2: Send Test Notification
```
1. Click "Send to Merchants" button
2. Fill in:
   - Title: "Authentication Test"
   - Body: "Testing fixed authentication"
   - Type: Info
   - Audience: All Merchants
3. Click "Send Notification"
```

### Step 3: Check Browser Console (F12)
Look for these logs:
```
✅ 🔐 Auth check: Auth object found
✅ 🎫 ID Token: Present (eyJra...)
✅ 🔑 Auth header set: Yes (Bearer ***)
✅ 📡 Response status: 200 OK
```

### Step 4: Verify Notification on iPhone
- Check WhizzMerchants app
- Notification should arrive within 5 seconds
- Should show correct title and body

---

## 🔍 What Changed in Code

### File: `frontend/pages/promotions.html`

**Line ~3167** (inside `sendMerchantInfoNotification` function):

```javascript
// Added proper authentication check
const idToken = window.Auth?.getIdToken();

console.log('🔐 Auth check:', window.Auth ? 'Auth object found' : 'Auth object missing');
console.log('🎫 ID Token:', idToken ? 'Present (' + idToken.substring(0, 20) + '...)' : 'Missing');

if (!idToken) {
    console.error('❌ No ID token available');
    alert('🔐 Authentication Required\n\nPlease log in and try again.');
    return false;
}

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`  // ✅ Now correctly set
};
```

---

## 🎯 Expected Outcome

### Before Fix
```
❌ Error: Unauthorized
❌ API returns 403/401
❌ No notification sent
```

### After Fix
```
✅ Authentication header sent correctly
✅ API returns 200 OK
✅ Notification sent to merchants
✅ Success message shown
✅ iPhone receives notification
```

---

## 🚨 Troubleshooting (If Issue Persists)

### Check 1: Token Exists in localStorage
Open browser console and run:
```javascript
console.log('ID Token:', localStorage.getItem('idToken') ? 'Present' : 'Missing');
```

**Solution if missing**: Log out and log back in

### Check 2: Token Not Expired
```javascript
const token = localStorage.getItem('idToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
```

**Solution if expired**: Log out and log back in

### Check 3: User Has Correct Role
```javascript
const token = localStorage.getItem('idToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User groups:', payload['cognito:groups']);
```

**Required role**: `campaigns_admin`  
**Solution**: Admin needs to add you to campaigns_admin group in Cognito

### Check 4: API Gateway Authorizer
Verify API Gateway is configured correctly:
```bash
aws apigateway get-authorizer \
  --rest-api-id 3t5u9t0pb8 \
  --authorizer-id <ID> \
  --region us-east-1
```

---

## 📝 Commit Details

**Commit**: `45a8a746e576874cee6c0c6d8eb27cdd51195a98`  
**Message**: "🔧 Fix: Use correct Auth.getIdToken() for push notifications"  
**Pushed to**: 
- GitHub (origin/main) ✅
- Amplify (amplify/main) ✅

---

## 🎉 Next Steps

1. ⏳ **WAIT** ~5 minutes for deployment to complete
2. ✅ **TEST** the fix on production
3. ✅ **VERIFY** notifications work on iPhone
4. ✅ **CELEBRATE** 🎊 if successful!

---

**Last Updated**: November 23, 2025 - 3:05 PM  
**Status**: Fix deployed, waiting for build to complete  
**ETA**: ~5-7 minutes
