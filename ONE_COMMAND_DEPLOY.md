# 🚀 One-Command AI Deployment

## Quick Start (2 Commands)

### Step 1: Login to AWS
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend
./aws-login.sh
```

**The script will:**
- Check if you're already logged in
- Show you SSO profile options
- Guide you through login
- Verify your credentials

### Step 2: Deploy AI Backend
```bash
./deploy-ai-simple.sh
```

**The script will:**
- ✅ Verify AWS credentials
- 📦 Package Lambda function
- ☁️ Upload to S3
- 🚀 Deploy CloudFormation stack
- 📝 Save API endpoint automatically
- ✅ Display next steps

## What Happens

1. **Lambda Function Created**: `whizz-ai-agent-suggestion`
2. **API Gateway Created**: HTTP API with CORS
3. **IAM Role Created**: With Bedrock permissions
4. **API Endpoint Saved**: To `.env.bedrock`

## After Deployment

The script will output something like:
```
✅ Deployment complete!

🎉 whizzAI Backend Deployed Successfully!
========================================

API Endpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion

Next steps:
1. Update frontend/pages/support.html line ~2394
2. Replace: const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE';
3. With:    const AI_API_ENDPOINT = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

Copy the API endpoint and update the frontend file.

## Common Issues

### "AWS credentials expired"
**Solution**: Run `./aws-login.sh` again

### "Stack already exists"
**Solution**: The script automatically deletes old stacks. If it fails, manually delete:
```bash
aws cloudformation delete-stack --stack-name whizz-ai-agent-dev --region us-east-1
aws cloudformation wait stack-delete-complete --stack-name whizz-ai-agent-dev --region us-east-1
./deploy-ai-simple.sh
```

### "Lambda handler not found"
**Solution**: Verify files exist:
```bash
ls -la src/handlers/agent-suggestion-handler.js
ls -la src/services/bedrock-agent-service.js
```

## Test the Deployment

After updating the frontend endpoint, test it:

1. Open `frontend/pages/support.html` in browser
2. Wait for a customer message to arrive
3. AI panel should appear automatically
4. Suggestion should be displayed

## Configuration Details

- **Bedrock Agent ID**: `TNJAPTVUDC`
- **Agent Alias ID**: `N8PJCRRDVW`
- **Model**: Claude 3.5 Sonnet v2
- **Region**: `us-east-1`
- **Cognito Pool**: `us-east-1_Cp9YnOQWi`

## Manual Deployment (If Scripts Fail)

If the scripts don't work, you can deploy manually:

### 1. Package Lambda
```bash
cd backend
zip -r ai-agent.zip src/ node_modules/ -x "*.git*"
```

### 2. Upload to S3
```bash
BUCKET="whizz-ai-$(aws sts get-caller-identity --query Account --output text)"
aws s3 mb "s3://$BUCKET" --region us-east-1 || true
aws s3 cp ai-agent.zip "s3://$BUCKET/"
```

### 3. Deploy CloudFormation
```bash
aws cloudformation create-stack \
  --stack-name whizz-ai-agent-dev \
  --template-body file://template-ai-agent.yaml \
  --parameters \
    ParameterKey=S3Bucket,ParameterValue=$BUCKET \
    ParameterKey=AgentId,ParameterValue=TNJAPTVUDC \
    ParameterKey=AliasId,ParameterValue=N8PJCRRDVW \
    ParameterKey=CognitoPool,ParameterValue=us-east-1_Cp9YnOQWi \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### 4. Wait for Completion
```bash
aws cloudformation wait stack-create-complete \
  --stack-name whizz-ai-agent-dev \
  --region us-east-1
```

### 5. Get API Endpoint
```bash
aws cloudformation describe-stacks \
  --stack-name whizz-ai-agent-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

---

## ⚡ TL;DR

```bash
cd backend
./aws-login.sh        # Login to AWS
./deploy-ai-simple.sh # Deploy everything
```

Then update the API endpoint in `frontend/pages/support.html` line ~2394.

**That's it!** 🎉
