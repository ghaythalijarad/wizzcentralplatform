# AWS Bedrock Access - Action Required

## 🚨 Current Status
**Date**: November 13, 2025  
**Issue**: Model use case details not submitted for Anthropic Claude 3 Sonnet  
**Error**: `ResourceNotFoundException: Model use case details have not been submitted`

## ✅ What You Need to Do NOW

### Step 1: Submit Use Case Form (5 minutes)

I've opened the AWS Bedrock console for you. Complete these steps:

1. **Find Claude 3 Sonnet**
   - Already open in the browser tab
   - Look for "Claude 3 Sonnet" model card
   - Click on it

2. **Submit Use Case Form**
   - Click "Submit use case details" button
   - Fill in the form:

   ```
   Use Case Title:
   Customer Support AI Assistant for whizzCentralPlatform
   
   Use Case Description:
   Intelligent AI-powered suggestion system that provides real-time response 
   recommendations to customer support agents. The system analyzes customer 
   inquiries and conversation history to suggest contextually appropriate 
   responses, improving support quality and response time.
   
   Industry: Technology/Software as a Service (SaaS)
   
   Expected Monthly Usage: < 1 Million tokens
   
   Business Type: Commercial Application
   ```

3. **Submit and Wait**
   - Click "Submit"
   - Typical approval time: **5-15 minutes**

### Step 2: Check When Access is Granted

**Option A - Automatic Monitoring** (Recommended)
```bash
cd backend
./check-bedrock-access.sh
```
This script will check every 2 minutes and notify you when access is granted.

**Option B - Manual Check**
```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --region us-east-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/test.json
```

### Step 3: Redeploy Lambda (Once Access Granted)

```bash
cd backend
./deploy-ai-agent.sh dev
```

### Step 4: Test in UI

1. Go to: http://localhost:3000/pages/support.html
2. Click the purple AI button (🪄)
3. You should get a real AI-generated suggestion!

---

## 🔍 Verification Commands

**Check available models:**
```bash
aws bedrock list-foundation-models \
  --region us-east-1 \
  --by-provider anthropic \
  --query 'modelSummaries[?contains(modelId, `claude-3-sonnet`)].{ModelId:modelId,Name:modelName}' \
  --output table
```

**Test model invocation:**
```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --region us-east-1 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json && cat /tmp/bedrock-test.json | jq
```

---

## 📊 Timeline

| Time | Action | Status |
|------|--------|--------|
| Now | Submit use case form | ⏳ **ACTION REQUIRED** |
| +5-15 min | AWS reviews and approves | ⏳ Waiting |
| +16 min | Run check script or manual test | ⏳ Pending |
| +17 min | Redeploy Lambda | ⏳ Pending |
| +18 min | Test AI in UI | ⏳ Pending |

---

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ `check-bedrock-access.sh` reports "SUCCESS"
2. ✅ Manual invoke-model command returns JSON response (not error)
3. ✅ Lambda CloudWatch logs show successful Bedrock API calls
4. ✅ AI button in UI returns actual suggestions (not error message)

---

## 📞 If You Get Stuck

**Still getting error after 20+ minutes?**
- Check AWS Console notifications for any issues
- Verify IAM role has `bedrock:InvokeModel` permission
- Try submitting the form again

**Form not appearing?**
- URL: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/models
- Search for "Claude 3 Sonnet"
- Look for "Get started" or "Submit use case" button

---

## 🚀 What Happens After Approval

Once approved, the AI assistant will:
- Generate contextually relevant response suggestions
- Analyze conversation history
- Provide confidence scores for suggestions
- Support both customer and merchant conversations
- Work in real-time as agents chat with users

**The UI is already complete and waiting!** 🎉
