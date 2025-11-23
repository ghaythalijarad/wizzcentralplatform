# Push Notification Deployment Issue - FIXED

## Problem
After deploying to AWS Amplify, the push notification feature showed "Failed to load" error when trying to send notifications. The system worked perfectly on localhost but failed in production.

## Root Cause
The frontend code had `API_BASE_URL` hardcoded to `http://localhost:3000`, which doesn't exist on AWS Amplify since it only hosts static files.

## Solution Applied

### 1. ✅ Fixed Frontend API URL Detection
**File**: `frontend/pages/promotions.html`

Changed from:
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

To environment-aware detection:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'  // Local development
    : 'https://your-api-gateway-url.amazonaws.com/prod'; // AWS API Gateway
```

### 2. 📝 Created Deployment Resources

Created the following files to help with Lambda deployment:

1. **`push-notification-template.yaml`** - AWS SAM template
   - Defines Lambda functions
   - Creates API Gateway
   - Sets up IAM roles
   - Configures CloudWatch logs and alarms

2. **`deploy-push-notifications.sh`** - Automated deployment script
   - Checks for Firebase credentials
   - Builds and deploys Lambda functions
   - Outputs API Gateway URL for easy configuration

3. **`PUSH_NOTIFICATION_LAMBDA_DEPLOYMENT.md`** - Complete guide
   - Step-by-step deployment instructions
   - Architecture diagram
   - Troubleshooting tips
   - Cost estimation

## Next Steps to Complete Deployment

### Step 1: Deploy Lambda Functions
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Make sure you're logged in to AWS
aws sso login --profile wizz-drivers-ghayth-dev

# Run deployment script
./deploy-push-notifications.sh dev
```

This will:
- Upload Firebase credentials to AWS Secrets Manager
- Build the Lambda functions
- Deploy via AWS SAM
- Output the API Gateway URL

### Step 2: Update Frontend with API Gateway URL
After deployment completes, you'll get an API Gateway URL like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod
```

Update `frontend/pages/promotions.html` line ~2471:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://YOUR-ACTUAL-API-GATEWAY-URL.execute-api.us-east-1.amazonaws.com/Prod';
```

### Step 3: Deploy to Amplify
```bash
git add .
git commit -m "Deploy push notification Lambda functions and update API endpoints"
git push origin main
git push amplify main
```

### Step 4: Test on Production
1. Go to: https://main.d2f5oacwil9cbi.amplifyapp.com/pages/promotions.html
2. Click "Send to Merchants" button
3. Fill in the notification details
4. Click "Send Notification"
5. Should see success message! ✅

## Architecture Overview

```
┌──────────────────────────────────────────┐
│   AWS Amplify (Static Hosting)          │
│   - promotions.html detects environment  │
│   - Uses API Gateway URL in production   │
└──────────────┬───────────────────────────┘
               │
               │ HTTPS POST
               ▼
┌──────────────────────────────────────────┐
│   AWS API Gateway                        │
│   - /api/merchants/send-info-notification│
│   - /api/discounts/:id/send-notification │
└──────────────┬───────────────────────────┘
               │
               │ Invokes
               ▼
┌──────────────────────────────────────────┐
│   AWS Lambda Functions                   │
│   1. merchant-info-notification.js       │
│   2. discount-push-notification.js       │
│   - Reads from Secrets Manager           │
│   - Queries DynamoDB                     │
│   - Sends FCM notifications              │
└──────────────┬───────────────────────────┘
               │
               ├──────────┬───────────┐
               │          │           │
               ▼          ▼           ▼
         Secrets     DynamoDB    Firebase FCM
         Manager     Tables      (Push Notifications)
```

## Files Modified

1. ✅ `frontend/pages/promotions.html` - Made API URL environment-aware
2. ✅ `push-notification-template.yaml` - SAM template (NEW)
3. ✅ `deploy-push-notifications.sh` - Deployment script (NEW)
4. ✅ `PUSH_NOTIFICATION_LAMBDA_DEPLOYMENT.md` - Complete guide (NEW)
5. ✅ `AMPLIFY_DEPLOYMENT_PUSH_FIX.md` - This summary (NEW)

## Testing Checklist

- [ ] Deploy Lambda functions with `./deploy-push-notifications.sh dev`
- [ ] Copy API Gateway URL from deployment output
- [ ] Update `frontend/pages/promotions.html` with API Gateway URL
- [ ] Commit and push to git
- [ ] Wait for Amplify build to complete
- [ ] Test on production URL
- [ ] Send test notification to merchants
- [ ] Verify notification received on iPhone

## Estimated Cost

Running the push notification system on AWS:
- **Lambda**: ~$0.20/month (Free Tier covers most usage)
- **API Gateway**: ~$3.50/month (1M requests)
- **Secrets Manager**: $0.40/month
- **Total**: ~$4.10/month

## Troubleshooting

### If deployment fails:
1. Check AWS credentials: `aws sts get-caller-identity --profile wizz-drivers-ghayth-dev`
2. Ensure SAM CLI is installed: `sam --version`
3. Check CloudFormation stack events in AWS Console

### If notifications still fail after deployment:
1. Check API Gateway URL is correct in frontend code
2. Verify CORS is enabled on API Gateway
3. Check Lambda CloudWatch logs for errors
4. Ensure DynamoDB tables are accessible
5. Verify Firebase credentials in Secrets Manager

## Success Criteria

✅ Push notification system works on both:
- **Local**: http://localhost:3000
- **Production**: https://main.d2f5oacwil9cbi.amplifyapp.com

## Current Status

- ✅ Frontend code fixed (environment detection)
- ✅ Deployment resources created
- ⏳ Waiting for Lambda deployment
- ⏳ Waiting for API Gateway URL update
- ⏳ Waiting for production testing

## Next Action

**Run the deployment script:**
```bash
./deploy-push-notifications.sh dev
```

Then follow the output instructions to update the API URL and push to git.
