# 🚀 Push Notification Quick Setup Guide

## Current Status: Lambda Deployed ✅ | FCM & API Gateway Pending ⏳

---

## 🎯 Complete Setup in 3 Steps

### Step 1: Get FCM Server Key 🔑
1. Open: https://console.firebase.google.com/
2. Select: **WhizzMerchants** project
3. Go to: **⚙️ Settings → Project Settings → Cloud Messaging**
4. Copy: **Server key**

### Step 2: Run Configuration Scripts 🛠️
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Configure FCM (paste your key from Step 1)
./configure-fcm-key.sh YOUR_FCM_SERVER_KEY

# Set up API Gateway
./setup-api-gateway.sh
```

### Step 3: Test Everything 🧪
```bash
# Test from terminal
./test-promotion-push-notification.sh

# Test from UI
open http://localhost:8080/frontend/pages/promotions.html
```

---

## 📋 What You Have Now

✅ Lambda function deployed and running  
✅ 6 active merchant device tokens ready  
✅ Frontend UI with push notification controls  
✅ IAM roles and permissions configured  
⏳ FCM key needs configuration  
⏳ API Gateway endpoint needs setup  

---

## 🎯 Success Checklist

- [ ] Get FCM Server Key from Firebase Console
- [ ] Run `./configure-fcm-key.sh YOUR_KEY`
- [ ] Run `./setup-api-gateway.sh`
- [ ] Update `promotions.html` with API Gateway URL
- [ ] Test with `./test-promotion-push-notification.sh`
- [ ] Create test campaign from UI
- [ ] Verify merchants receive notification

---

## 🆘 Quick Troubleshooting

**No FCM Key?**
```bash
# Check if key is set
aws lambda get-function-configuration \
  --function-name whizz-central-send-promotion-notification \
  --query 'Environment.Variables.FCM_SERVER_KEY'
```

**Lambda Not Working?**
```bash
# Check CloudWatch Logs
aws logs tail /aws/lambda/whizz-central-send-promotion-notification --follow
```

**No Device Tokens?**
- Have merchants log in to WhizzMerchants app
- Tokens are auto-registered on app login

---

## 📞 Key Commands

| Action | Command |
|--------|---------|
| Configure FCM | `./configure-fcm-key.sh YOUR_KEY` |
| Setup API Gateway | `./setup-api-gateway.sh` |
| Test System | `./test-promotion-push-notification.sh` |
| View Logs | `aws logs tail /aws/lambda/whizz-central-send-promotion-notification` |
| Check Tokens | `aws dynamodb scan --table-name WhizzMerchants_DeviceTokens` |

---

## 🎨 UI Features (Already Implemented!)

When creating a campaign in WhizzCentralPlatform, you'll see:

- ✅ **"Send push notification to merchants"** checkbox (checked by default)
- ✅ **Custom notification title** field (optional)
- ✅ **Custom notification message** field (optional)
- ✅ Auto-generated defaults based on campaign details
- ✅ Non-blocking - campaign still saves if push fails

---

## 📱 What Merchants Will See

When you create a promotion, merchants receive:

```
🎉 New Promotion: 25% Off!
Check out this amazing deal!
```

Tapping the notification opens WhizzMerchants app with campaign details.

---

## ⚡ Next Action

**Run these 2 commands to complete setup:**

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./configure-fcm-key.sh YOUR_FCM_SERVER_KEY
./setup-api-gateway.sh
```

Then you're done! 🎉

---

**Full documentation**: See `DEPLOYMENT_SUMMARY.md` for complete details.
