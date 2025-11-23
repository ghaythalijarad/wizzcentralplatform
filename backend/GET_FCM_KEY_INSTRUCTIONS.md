# 🔑 How to Get FCM Server Key - Step by Step

## ❌ You're Currently Here (WRONG):
**Project Settings → Cloud Messaging → Apple app configuration**

This section shows APNs certificates for iOS - NOT what we need!

---

## ✅ Go Here Instead:

### Step 1: Stay in Project Settings
You're already in the right menu (Project Settings), good!

### Step 2: Look for "Cloud Messaging API (Legacy)"
Scroll down on the **Cloud Messaging** tab until you see:

```
Cloud Messaging API (Legacy)
```

### Step 3: Find the Server Key
Under "Cloud Messaging API (Legacy)" you'll see:

```
Server key: AAAA...your-key-here...
Sender ID: 123456789
```

### Step 4: Copy the Server Key
- Click the copy icon next to the Server key
- It looks like: `AAAAxxxxxxx:APA91bF...` (very long string)

---

## 🚨 If You Don't See "Cloud Messaging API (Legacy)":

### Option 1: Enable the Legacy API
1. Look for a button that says "Enable Cloud Messaging API (Legacy)"
2. Click it to enable
3. The Server key will appear

### Option 2: Use Cloud Messaging API (v1)
If Legacy API is not available, you might be using the new API:
1. Look for "Cloud Messaging API (V1)"
2. Check if it's enabled
3. If using V1, we'll need to update the Lambda code (let me know)

---

## 📸 What You Should See:

Look for a section that looks like this:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cloud Messaging API (Legacy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server key:  AAAAxxxxxxxxxxxxxxx:APA91bFxxxxxx... [COPY]
Sender ID:   123456789012
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Once You Have the Key:

Run this command in terminal:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./configure-fcm-key.sh YOUR_SERVER_KEY_HERE
```

Replace `YOUR_SERVER_KEY_HERE` with the key you copied.

---

## 🔍 Alternative: Search in Code

If you can't find it in Firebase Console, let's search the existing code:

```bash
# Search for FCM configuration in WhizzMerchants
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem
grep -r "AAAA" whizzMerchants/ --include="*.dart" --include="*.json" 2>/dev/null | head -5
```

Or check environment variables:

```bash
# Check if it's stored in AWS
aws ssm get-parameter --name /whizz/fcm-server-key --with-decryption 2>/dev/null
```

---

## 📞 Need Help?

Take a screenshot of what you see in the Cloud Messaging tab and I'll help you find the right key!
