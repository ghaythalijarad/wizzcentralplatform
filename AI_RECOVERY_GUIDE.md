# 🚀 AI Integration - Quick Recovery Guide

## Current Status
✅ **Phase 1 Complete** - Bedrock Agent configured and ready
⚠️ **Phase 2 In Progress** - Backend deployment needs retry

## Your Credentials Expired - Here's How to Continue

### Step 1: Re-authenticate with AWS
```bash
aws sso login --profile wizz-drivers-ghayth-dev
```

### Step 2: Deploy AI Backend (Simple Method)
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./deploy-ai-simple.sh
```

This script will:
1. ✅ Check AWS credentials
2. 📦 Package Lambda function
3. ☁️ Upload to S3
4. 🚀 Deploy CloudFormation stack
5. 📝 Save API endpoint to `.env.bedrock`

### Step 3: Update Frontend
After deployment completes, you'll get an API endpoint like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion
```

Update `frontend/pages/support.html` line ~2394:
```javascript
// Before:
const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE';

// After:
const AI_API_ENDPOINT = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

### Step 4: Test
1. Open `frontend/pages/support.html` in browser
2. Wait for a customer message
3. AI panel should appear automatically with a suggestion
4. Click "Use This" to copy to input

## Alternative: Use Master Menu
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
./ai-integration.sh
# Select Option 2: Deploy Backend
```

## What's Already Done ✅

### Frontend Integration Complete
- ✅ AI panel HTML added (lines 710-745)
- ✅ AI CSS styles added (lines 437-600)
- ✅ AI JavaScript functions added (lines 2390-2550)
- ✅ Auto-trigger on customer messages (line 1006-1010)

### Backend Code Complete
- ✅ `backend/src/services/bedrock-agent-service.js`
- ✅ `backend/src/handlers/agent-suggestion-handler.js`
- ✅ AWS SDK installed (`@aws-sdk/client-bedrock-agent-runtime`)

### Bedrock Agent Configured
- ✅ Agent ID: `TNJAPTVUDC`
- ✅ Alias ID: `N8PJCRRDVW`
- ✅ Model: Claude 3.5 Sonnet v2
- ✅ Instructions: Iraqi food delivery context
- ✅ Status: PREPARED and ready to use

## Troubleshooting

### If deployment fails again:
```bash
# Check the error
aws cloudformation describe-stack-events \
  --stack-name whizz-ai-agent-dev \
  --region us-east-1 \
  --max-items 10

# Delete failed stack
aws cloudformation delete-stack \
  --stack-name whizz-ai-agent-dev \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name whizz-ai-agent-dev \
  --region us-east-1

# Try deployment again
./deploy-ai-simple.sh
```

### If Lambda handler error:
Check that these files exist:
```bash
ls -la backend/src/services/bedrock-agent-service.js
ls -la backend/src/handlers/agent-suggestion-handler.js
```

### If permissions error:
Your IAM role might need additional Bedrock permissions. The script creates them automatically.

## Quick Commands Reference

**Check AWS Login:**
```bash
aws sts get-caller-identity
```

**Check Bedrock Agent:**
```bash
aws bedrock-agent get-agent --agent-id TNJAPTVUDC --region us-east-1
```

**Check CloudFormation Stack:**
```bash
aws cloudformation describe-stacks --stack-name whizz-ai-agent-dev --region us-east-1
```

**Get API Endpoint:**
```bash
aws cloudformation describe-stacks \
  --stack-name whizz-ai-agent-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

## What Happens After Deployment

1. **Lambda Function Created**: `whizz-ai-agent-suggestion`
2. **API Gateway Created**: HTTP API with CORS enabled
3. **IAM Role Created**: With Bedrock invoke permissions
4. **API Endpoint Generated**: Saved to `.env.bedrock`

The AI will:
- 🤖 Auto-appear when customers send messages
- 💬 Generate contextual response suggestions
- 🎯 Use conversation history for better suggestions
- 🌍 Understand Iraqi food delivery context

## Need Help?

If you're stuck:
1. Make sure you're logged in: `aws sso login --profile wizz-drivers-ghayth-dev`
2. Check the deployment script output for errors
3. Verify the Lambda handler path is correct
4. Ensure IAM permissions are sufficient

---

**Remember**: You only need to run `./deploy-ai-simple.sh` after logging in with AWS SSO!
