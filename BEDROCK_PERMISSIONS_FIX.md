# 🔧 Bedrock Agent Permissions Fix Guide

## Problem Summary
The Lambda function `whizz-ai-agent-suggestion` cannot invoke the Bedrock Agent `TNJAPTVUDC` due to access denied errors, despite having multiple IAM policies attached.

## Root Cause
Bedrock Agents require **resource-based permissions** (similar to S3 bucket policies) to allow specific IAM principals to invoke them. IAM role policies alone are not sufficient.

---

## Solution: Add Resource Policy to Bedrock Agent

### Option 1: AWS Console (Easiest) ⭐

1. **Navigate to Bedrock**
   - Open AWS Console
   - Go to Amazon Bedrock service
   - Region: us-east-1

2. **Find Your Agent**
   - Click "Agents" in the left sidebar
   - Find agent with ID: `TNJAPTVUDC`
   - Click on the agent name

3. **Add Permissions**
   - Look for "Permissions" or "Resource policy" tab
   - Click "Edit" or "Add permission"
   - Add this policy:
   
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowLambdaInvoke",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::031857856164:role/whizz-ai-agent-dev-LambdaExecutionRole-2jshFGEZz4sn"
      },
      "Action": "bedrock:InvokeAgent",
      "Resource": "arn:aws:bedrock:us-east-1:031857856164:agent/TNJAPTVUDC"
    }
  ]
}
```

4. **Save and Test**
   - Save the policy
   - Wait 30 seconds
   - Run the test command below

---

### Option 2: AWS CLI

```bash
# Check if Bedrock Agents support resource policies
AWS_PROFILE=wizz-drivers-ghayth-dev aws bedrock-agent get-agent \
  --agent-id TNJAPTVUDC \
  --region us-east-1

# If supported, update the resource policy
# (Note: As of 2025, this might require AWS Bedrock API updates)
```

---

### Option 3: Alternative Solution - Use Bedrock Runtime Directly

If the agent doesn't support resource policies, we can bypass the agent and call Claude directly:

#### Update `bedrock-agent-service.js`:

```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const REGION = 'us-east-1';
const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

const client = new BedrockRuntimeClient({ region: REGION });

async function getAISuggestion(context) {
  try {
    const prompt = buildPrompt(context);
    
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return {
      success: true,
      suggestion: responseBody.content[0].text,
      confidence: 0.9,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

#### Update Lambda Package:

```bash
cd backend/lambda-package
npm install --production @aws-sdk/client-bedrock-runtime
cd ..
cd lambda-package && zip -r ../ai-agent-lambda.zip . && cd ..
AWS_PROFILE=wizz-drivers-ghayth-dev aws lambda update-function-code \
  --function-name whizz-ai-agent-suggestion \
  --zip-file fileb://ai-agent-lambda.zip \
  --region us-east-1
```

#### Update IAM Policy:

```bash
AWS_PROFILE=wizz-drivers-ghayth-dev aws iam put-role-policy \
  --role-name whizz-ai-agent-dev-LambdaExecutionRole-2jshFGEZz4sn \
  --policy-name BedrockRuntimePolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "bedrock:InvokeModel"
        ],
        "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
      }
    ]
  }' \
  --region us-east-1
```

---

## Test After Fix

### Test Command:
```bash
curl -X POST https://c9zg7yodh3.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_final",
    "userType": "customer",
    "message": "My food delivery is very late, its been 90 minutes",
    "conversationHistory": []
  }'
```

### Expected Success Response:
```json
{
  "success": true,
  "suggestion": "I sincerely apologize for the delay with your order...",
  "reasoning": "Customer is frustrated about late delivery...",
  "confidence": 0.9,
  "timestamp": "2025-11-13T09:00:00.000Z"
}
```

### Check Lambda Logs:
```bash
AWS_PROFILE=wizz-drivers-ghayth-dev aws logs tail \
  /aws/lambda/whizz-ai-agent-suggestion \
  --region us-east-1 --since 2m --follow
```

---

## Quick Reference

**Agent ID**: `TNJAPTVUDC`  
**Agent Alias ID**: `N8PJCRRDVW`  
**Lambda Role**: `whizz-ai-agent-dev-LambdaExecutionRole-2jshFGEZz4sn`  
**API Endpoint**: `https://c9zg7yodh3.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion`  
**Region**: `us-east-1`  
**Account**: `031857856164`

---

## Next Steps After Fix

1. ✅ Test API endpoint returns success
2. ✅ Test frontend AI panel appears
3. ✅ Test "Use This" button inserts text
4. ✅ Test "Retry" button requests new suggestion
5. ✅ Commit changes to git
6. ✅ Push to Amplify for production deployment

---

*Choose Option 1 (AWS Console) for fastest results, or Option 3 (Bedrock Runtime) if agent resource policies aren't available.*
