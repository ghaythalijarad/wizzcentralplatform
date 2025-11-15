# whizzAI Agent - Unified Deployment Guide

**Single Source of Truth: SAM-based Infrastructure**

## 📋 Overview

The whizzAI Agent backend is now deployed using **AWS SAM (Serverless Application Model)** as the single authoritative infrastructure-as-code definition. This ensures consistency across all environments and eliminates configuration drift.

### Architecture Decision

✅ **Chosen: SAM Template** (`template-ai-agent.yaml`)
- ✅ Simple, declarative syntax
- ✅ Native AWS CloudFormation support
- ✅ Direct integration with AWS CLI
- ✅ No third-party dependencies
- ✅ Built-in stack rollback

❌ **Deprecated: Serverless Framework** (`serverless.ai-agent.yml`)
- Marked as deprecated
- Kept for reference only
- Will be removed in future version

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. AWS CLI configured with SSO
aws sso login

# 2. Node.js 18.x installed
node --version  # Should show v18.x

# 3. Required npm packages
cd backend
npm install
```

### Deploy to Dev Environment

```bash
cd backend
./deploy-ai-agent.sh dev
```

### Deploy to Other Environments

```bash
# Staging
./deploy-ai-agent.sh staging

# Production
./deploy-ai-agent.sh prod
```

---

## 📁 File Structure

```
backend/
├── deploy-ai-agent.sh              # ✅ Single deployment script (USE THIS)
├── template-ai-agent.yaml          # ✅ SAM template (SOURCE OF TRUTH)
├── serverless.ai-agent.yml         # ❌ DEPRECATED - Do not use
├── deploy-ai-simple.sh             # ❌ OLD - Delete after migration
├── src/
│   ├── handlers/
│   │   └── agent-suggestion-handler.js
│   └── services/
│       └── bedrock-agent-service.js
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

All environment variables are defined in the SAM template:

| Variable | Value | Description |
|----------|-------|-------------|
| `STAGE` | dev/staging/prod | Deployment environment |
| `MODEL_ID` | anthropic.claude-3-sonnet-20240229-v1:0 | Bedrock model ID |
| `AWS_REGION` | us-east-1 | AWS region |

### IAM Permissions

The Lambda function has the following Bedrock permissions:

```yaml
- bedrock:InvokeModel
- bedrock:InvokeModelWithResponseStream
```

**Resources:**
- `arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`
- `arn:aws:bedrock:us-east-1::foundation-model/*`

### API Gateway Configuration

- **Type:** HTTP API (REST)
- **Authentication:** None (MVP mode)
- **CORS:** Enabled for all origins
- **Methods:** POST, GET, OPTIONS
- **Endpoints:**
  - `POST /agent-suggestion` - Get AI response suggestion
  - `GET /health` - Health check endpoint

---

## 📦 Deployment Process

### What Happens During Deployment

1. **Validate AWS Credentials**
   - Checks SSO authentication
   - Displays account and user info

2. **Clean Previous Builds**
   - Removes old ZIP files
   - Cleans SAM build artifacts

3. **Create Lambda Package**
   - Copies source code (`src/`)
   - Installs runtime dependencies
   - Creates ZIP with correct structure:
     ```
     lambda-deployment.zip
     ├── src/
     │   ├── handlers/
     │   │   └── agent-suggestion-handler.js
     │   └── services/
     │       └── bedrock-agent-service.js
     └── node_modules/
         └── @aws-sdk/
             └── client-bedrock-runtime/
     ```

4. **Upload to S3**
   - Creates/uses bucket: `whizz-ai-deployments-{ACCOUNT_ID}`
   - Enables versioning for rollback
   - Uploads deployment package

5. **Validate Template**
   - CloudFormation syntax check
   - Parameter validation

6. **Deploy CloudFormation Stack**
   - Creates or updates stack: `whizz-ai-agent-{STAGE}`
   - Waits for completion
   - Handles rollback on failure

7. **Display Outputs**
   - API endpoint URL
   - Lambda function name
   - Test commands

### Deployment Output

```
╔════════════════════════════════════════════════════════════╗
║                  Deployment Summary                        ║
╚════════════════════════════════════════════════════════════╝

Stack Name:      whizz-ai-agent-dev
API Endpoint:    https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion
Lambda Function: whizz-ai-agent-dev
Region:          us-east-1
Stage:           dev
```

---

## 🧪 Testing

### Test the API Endpoint

```bash
# Replace {API_URL} with your actual endpoint from deployment output
curl -X POST https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion \
  -H 'Content-Type: application/json' \
  -d '{
    "userType": "customer",
    "message": "My delivery is very late",
    "conversationHistory": []
  }'
```

### Expected Response

```json
{
  "success": true,
  "suggestion": "I sincerely apologize for the delay with your delivery. Let me help you track your order right away...",
  "confidence": 0.92,
  "timestamp": "2025-11-13T10:30:00Z"
}
```

### View Lambda Logs

```bash
# Replace {FUNCTION_NAME} with your function name
aws logs tail /aws/lambda/whizz-ai-agent-dev --follow
```

### Health Check

```bash
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/health
```

---

## 🔄 Update Process

### Making Code Changes

```bash
# 1. Edit code in src/
vim src/services/bedrock-agent-service.js

# 2. Test locally (optional)
npm test

# 3. Deploy changes
./deploy-ai-agent.sh dev

# 4. Test deployed changes
curl -X POST https://{API_URL}/agent-suggestion -d '...'
```

### Updating Infrastructure

```bash
# 1. Edit SAM template
vim template-ai-agent.yaml

# 2. Validate template
aws cloudformation validate-template \
  --template-body file://template-ai-agent.yaml

# 3. Deploy updated stack
./deploy-ai-agent.sh dev
```

---

## 🎯 Frontend Integration

### Update Frontend Endpoint

After deployment, update the API endpoint in the frontend:

**File:** `frontend/pages/support.html` (line ~2308)

```javascript
// OLD - Replace with new endpoint
const AI_API_ENDPOINT = 'https://OLD_URL.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';

// NEW - Use deployment output
const AI_API_ENDPOINT = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion';
```

**Or better - Use environment-based configuration:**

```javascript
const AI_ENDPOINTS = {
  dev: 'https://abc123-dev.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion',
  staging: 'https://xyz789-staging.execute-api.us-east-1.amazonaws.com/staging/agent-suggestion',
  prod: 'https://prod123.execute-api.us-east-1.amazonaws.com/prod/agent-suggestion'
};

const AI_API_ENDPOINT = AI_ENDPOINTS[window.ENVIRONMENT || 'dev'];
```

---

## 🔐 Security Considerations

### Current State (MVP)

- ❌ **No authentication** - API is publicly accessible
- ✅ **CORS enabled** - Allows requests from any origin
- ✅ **IAM roles** - Lambda has minimal Bedrock permissions

### Production Recommendations

1. **Add API Key Authentication**
   ```yaml
   AgentApi:
     Properties:
       Auth:
         ApiKeyRequired: true
   ```

2. **Add Cognito Authentication**
   ```yaml
   AgentApi:
     Properties:
       Auth:
         DefaultAuthorizer: CognitoAuthorizer
         Authorizers:
           CognitoAuthorizer:
             UserPoolArn: !Sub 'arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}'
   ```

3. **Restrict CORS Origins**
   ```yaml
   Cors:
     AllowOrigin: "'https://app.whizz.com'"
   ```

4. **Add Rate Limiting**
   - Use API Gateway throttling
   - Set burst and rate limits

---

## 📊 Monitoring

### CloudWatch Metrics

```bash
# View Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=whizz-ai-agent-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# View Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=whizz-ai-agent-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### CloudWatch Logs Insights

```sql
-- Find errors
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- Measure response times
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration)
```

---

## 🐛 Troubleshooting

### Deployment Fails

**Issue:** `Stack creation failed`

**Solution:**
```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name whizz-ai-agent-dev \
  --max-items 10

# Check IAM permissions
aws iam get-user

# Validate template
aws cloudformation validate-template \
  --template-body file://template-ai-agent.yaml
```

### Lambda Handler Error

**Issue:** `Cannot find module 'src/handlers/agent-suggestion-handler'`

**Solution:**
- Verify ZIP structure: `unzip -l lambda-deployment.zip`
- Ensure handler path matches: `src/handlers/agent-suggestion-handler.handler`
- Redeploy: `./deploy-ai-agent.sh dev`

### Bedrock Permission Denied

**Issue:** `User: ... is not authorized to perform: bedrock:InvokeModel`

**Solution:**
```bash
# Check Lambda role permissions
aws iam get-role --role-name whizz-ai-agent-dev-AgentSuggestionFunctionRole-XYZ

# Verify Bedrock model access
aws bedrock list-foundation-models --region us-east-1
```

### API Gateway 502 Error

**Issue:** API returns 502 Bad Gateway

**Solution:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/whizz-ai-agent-dev --since 10m

# Test Lambda directly
aws lambda invoke \
  --function-name whizz-ai-agent-dev \
  --payload '{"body":"{\"message\":\"test\"}"}' \
  response.json
```

---

## 🗑️ Cleanup

### Delete Dev Environment

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name whizz-ai-agent-dev

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name whizz-ai-agent-dev

# Delete S3 bucket (optional)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws s3 rb "s3://whizz-ai-deployments-${ACCOUNT_ID}" --force
```

---

## 📚 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Bedrock Runtime API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html)
- [Claude 3 Sonnet Documentation](https://docs.anthropic.com/claude/docs/models-overview)
- [API Gateway CORS Configuration](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

---

## 🤝 Contributing

When making changes to the infrastructure:

1. ✅ **Always edit** `template-ai-agent.yaml`
2. ✅ **Always deploy** using `./deploy-ai-agent.sh`
3. ❌ **Never edit** `serverless.ai-agent.yml` (deprecated)
4. ✅ **Test thoroughly** in dev before promoting to staging/prod
5. ✅ **Document changes** in this README

---

## 📞 Support

For issues or questions:
1. Check CloudWatch Logs first
2. Review troubleshooting section
3. Contact DevOps team
4. Create JIRA ticket with logs attached

---

**Last Updated:** November 13, 2025  
**Maintained By:** whizzAI Team  
**Single Source of Truth:** `template-ai-agent.yaml` + `deploy-ai-agent.sh`
