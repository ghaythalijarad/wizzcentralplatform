# 🔑 How to Get Your FCM Server Key - Step by Step Guide

**Estimated Time**: 5 minutes  
**Difficulty**: Easy

---

## 📋 Prerequisites

- Access to Firebase Console
- Admin access to your WhizzMerchants Firebase project

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Firebase Console

1. Open your browser (Chrome, Safari, Firefox, etc.)
2. Navigate to: **https://console.firebase.google.com/**
3. Sign in with your Google account (if not already signed in)

**Direct Link**: [Firebase Console](https://console.firebase.google.com/)

---

### Step 2: Select Your Project

1. You'll see a list of your Firebase projects
2. Look for your **WhizzMerchants** project
3. Click on the project card to open it

**What to look for**:
- Project name: Likely "WhizzMerchants" or similar
- If you have multiple projects, look for the one used by your WhizzMerchants mobile app

**Screenshot Reference**:
```
┌─────────────────────────────────────┐
│  🔥 Firebase Projects               │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────┐              │
│  │  WhizzMerchants  │ ← Click this │
│  │  Project ID: ... │              │
│  └──────────────────┘              │
│                                     │
└─────────────────────────────────────┘
```

---

### Step 3: Open Project Settings

1. Look at the **top-left corner** of the Firebase Console
2. You'll see a **gear icon (⚙️)** next to "Project Overview"
3. Click the **gear icon (⚙️)**
4. Select **"Project settings"** from the dropdown menu

**Visual Guide**:
```
┌────────────────────────────────────────┐
│ 🔥 Project Overview    [⚙️ Settings ▼] │ ← Click the gear icon
├────────────────────────────────────────┤
│                                        │
│  Dropdown menu appears:                │
│  ┌──────────────────────┐             │
│  │ Project settings     │ ← Click this│
│  │ Users and permissions│             │
│  │ Usage and billing    │             │
│  └──────────────────────┘             │
└────────────────────────────────────────┘
```

---

### Step 4: Navigate to Cloud Messaging Tab

1. You're now in **Project Settings**
2. Look at the **horizontal tabs** at the top:
   - General
   - Service accounts
   - **Cloud Messaging** ← Click this tab
   - Integrations
3. Click on the **"Cloud Messaging"** tab

**Visual Guide**:
```
┌────────────────────────────────────────────────────┐
│ Project Settings                                   │
├────────────────────────────────────────────────────┤
│ [General] [Service accounts] [Cloud Messaging] ... │
│                                   ↑                │
│                            Click this tab          │
└────────────────────────────────────────────────────┘
```

---

### Step 5: Find the Server Key

Once you're in the **Cloud Messaging** tab, scroll down to find:

#### Option A: Cloud Messaging API (Legacy) - RECOMMENDED

Look for a section called **"Cloud Messaging API (Legacy)"**

You should see:
```
┌─────────────────────────────────────────────────┐
│ Cloud Messaging API (Legacy)                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ Server key:                                     │
│ ┌────────────────────────────────────────────┐ │
│ │ AAAA...very-long-key...xyz                 │ │
│ └────────────────────────────────────────────┘ │
│                            [📋 Copy] [👁 Show] │
│                                                 │
│ Sender ID:                                      │
│ ┌────────────────────────────────────────────┐ │
│ │ 123456789012                               │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**What to copy**: The **Server key** value (starts with "AAAA..." and is very long)

#### Option B: If You Don't See the Server Key

If you don't see the "Cloud Messaging API (Legacy)" section or Server key:

1. Look for a message saying **"Cloud Messaging API (Legacy) is disabled"**
2. You'll see a button or link to **"Enable"** or **"Manage API in Google Cloud Console"**
3. Click to enable it
4. After enabling, the Server key will appear

**Alternative Path**:
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Cloud Messaging API (Legacy) is disabled     │
│                                                 │
│ To use the legacy API, you need to enable it:  │
│                                                 │
│           [Enable Cloud Messaging API]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Step 6: Copy Your Server Key

1. Click the **"Show"** button next to the Server key (if hidden)
2. Click the **📋 Copy icon** or **manually select and copy** the entire key
3. The key looks like:
   ```
   AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Starts with "AAAA"
   - Very long (around 150+ characters)
   - Contains letters, numbers, and some special characters

**⚠️ IMPORTANT**: 
- Copy the **entire key** - don't miss any characters
- Don't share this key publicly
- This key gives access to send notifications to your app

---

## ✅ Step 7: Configure the Key

Now that you have your FCM Server Key copied, run this command in your terminal:

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./configure-fcm-key.sh YOUR_COPIED_KEY_HERE
```

**Replace** `YOUR_COPIED_KEY_HERE` with the actual key you just copied.

**Example**:
```bash
./configure-fcm-key.sh AAAAxxx...your-actual-key...xxx
```

---

## 🧪 Step 8: Test It Works

After configuring the key, test it immediately:

```bash
./quick-test-push.sh
```

**Expected Success Output**:
```
📱 Response:
{
  "success": true,
  "message": "Push notifications sent to 6 merchants",
  "sent": 6,      ← Should be 6 (not 0)
  "failed": 0,    ← Should be 0 (not 6)
  "total": 6
}
```

**What changed**:
- **Before**: `"sent": 0, "failed": 6` ❌
- **After**: `"sent": 6, "failed": 0` ✅

---

## 🎯 Visual Summary

```
Firebase Console Flow:
┌────────────────────────────────────────────────────┐
│                                                    │
│  1. Open: console.firebase.google.com             │
│                    ↓                               │
│  2. Select: WhizzMerchants Project                │
│                    ↓                               │
│  3. Click: ⚙️ Settings → Project settings         │
│                    ↓                               │
│  4. Click: Cloud Messaging tab                    │
│                    ↓                               │
│  5. Find: Cloud Messaging API (Legacy)            │
│                    ↓                               │
│  6. Copy: Server key (starts with AAAA...)        │
│                    ↓                               │
│  7. Run: ./configure-fcm-key.sh YOUR_KEY          │
│                    ↓                               │
│  8. Test: ./quick-test-push.sh                    │
│                    ↓                               │
│          ✅ SUCCESS!                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Problem 1: Can't Find Cloud Messaging Tab

**Solution**: 
- Make sure you're in **Project Settings** (gear icon)
- Look for tabs at the top of the page
- If you don't see it, try refreshing the page

### Problem 2: No Server Key Visible

**Possible Causes**:
1. Cloud Messaging API (Legacy) is disabled
   - **Fix**: Click "Enable" button in the Cloud Messaging section

2. Wrong project selected
   - **Fix**: Go back and select the correct WhizzMerchants project

3. Insufficient permissions
   - **Fix**: You need to be an Owner or Editor of the Firebase project

### Problem 3: Key Doesn't Work After Configuration

**Check**:
```bash
# Verify the key was saved
aws lambda get-function-configuration \
  --function-name whizz-central-send-promotion-notification \
  --query 'Environment.Variables.FCM_SERVER_KEY' \
  --region us-east-1 \
  --no-cli-pager
```

Should show your actual key (not "YOUR_FCM_SERVER_KEY")

### Problem 4: Still Getting Failed Notifications

**Possible Issues**:
1. Device tokens are expired
   - **Fix**: Have merchants re-login to WhizzMerchants app

2. Wrong Firebase project
   - **Fix**: Make sure the Server key is from the same Firebase project as WhizzMerchants app

3. Firebase project misconfigured
   - **Fix**: Check that Firebase Cloud Messaging is properly set up for your app

---

## 📸 Need Visual Help?

If you're having trouble finding anything, here's what each section looks like:

### Firebase Console Home
- URL shows: `console.firebase.google.com`
- You see project cards with project names
- Top navigation has: "Project Overview", Settings icon

### Project Settings Page
- URL shows: `console.firebase.google.com/project/YOUR-PROJECT/settings/general`
- Tabs at top: General, Service accounts, Cloud Messaging, etc.
- Left sidebar shows: Authentication, Firestore, Storage, etc.

### Cloud Messaging Tab
- URL shows: `.../settings/cloudmessaging`
- Shows: Server key, Sender ID
- May show: APNs certificates section (for iOS)

---

## ✅ Success Checklist

- [ ] Opened Firebase Console
- [ ] Selected correct WhizzMerchants project
- [ ] Navigated to Project Settings
- [ ] Found Cloud Messaging tab
- [ ] Located Server key (starts with AAAA...)
- [ ] Copied entire Server key
- [ ] Ran `./configure-fcm-key.sh YOUR_KEY`
- [ ] Saw success message from configure script
- [ ] Ran `./quick-test-push.sh`
- [ ] Saw `"sent": 6, "failed": 0` in response

---

## 🎉 Once Complete

After successfully configuring the FCM key and seeing the test pass:

1. **Open WhizzCentralPlatform**:
   ```bash
   open http://localhost:8080/frontend/pages/promotions.html
   ```

2. **Create a Test Campaign**:
   - Click "Create Campaign"
   - Fill in campaign details
   - ✅ "Send push notification to merchants" should be checked
   - Click "Create Campaign"

3. **Check Your Phone**:
   - Merchants with WhizzMerchants app will receive the notification
   - Beautiful formatted notification with emoji
   - Tapping opens the app

---

## 📞 Need More Help?

If you're still stuck after following this guide:

1. **Take a screenshot** of what you see in Firebase Console
2. **Check** which Firebase project you're in
3. **Verify** you have admin access to the project
4. **Share** the error message you're seeing

---

**Good luck! You're one step away from completing the push notification system!** 🚀

---

**Last Updated**: November 22, 2025  
**Guide Version**: 1.0  
**Estimated Time to Complete**: 5 minutes
