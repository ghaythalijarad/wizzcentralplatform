# Lambda ZIP Deployment Issues & Better Solutions

## 🚨 Common ZIP File Problems

### 1. **File Structure Mismatch** (Current Issue)
```bash
# ❌ PROBLEM: Handler expects one path, ZIP has another
Handler Config: "handlers/agent-suggestion-handler.handler"
ZIP Structure:  "src/handlers/agent-suggestion-handler.js"
Result: "Cannot find module" error
```

### 2. **Node Modules Bloat**
```bash
# ❌ PROBLEM: Including dev dependencies
node_modules/ (150MB with devDependencies)
  ├── eslint/
  ├── prettier/
  ├── @types/
  └── ... (unnecessary packages)

# ✅ SOLUTION: Production only
node_modules/ (5MB production only)
  └── @aws-sdk/client-bedrock-runtime/
```

### 3. **Incorrect Zip Command**
```bash
# ❌ WRONG: Includes parent folder
zip -r lambda.zip lambda-package/
Result: lambda.zip/lambda-package/src/...

# ✅ CORRECT: Change to directory first
cd lambda-package && zip -r ../lambda.zip .
Result: lambda.zip/src/...
```

### 4. **Missing Dependencies**
```bash
# ❌ PROBLEM: Package.json missing SDK
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.450.0"
    // Missing bedrock-runtime!
  }
}

# ✅ SOLUTION: Explicit dependencies
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0"
  }
}
```

---

## ✅ Better Deployment Methods

### **Method 1: Direct S3 Upload with Correct Structure** (Recommended for simple deployments)

```bash
#!/bin/bash
set -e

echo "📦 Building Lambda package with correct structure..."

# Clean workspace
rm -rf dist/
mkdir -p dist/

# Copy ONLY the handler files (not the src/ wrapper)
cp -r src/* dist/

# Create minimal package.json
cat > dist/package.json << 'EOF'
{
  "name": "whizz-ai-agent",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0"
  }
}
EOF

# Install production dependencies
cd dist
npm install --production --omit=dev
cd ..

# Create ZIP from inside dist/ (correct structure)
cd dist
zip -r ../lambda-deployment.zip . -x "*.git*" "*.DS_Store"
cd ..

# Upload to S3
aws s3 cp lambda-deployment.zip s3://bucket/lambda.zip

# Update Lambda
aws lambda update-function-code \
  --function-name whizz-ai-agent-suggestion \
  --s3-bucket bucket \
  --s3-key lambda.zip

echo "✅ Deployed with correct handler: handlers/agent-suggestion-handler.handler"
```

---

### **Method 2: AWS SAM with Inline Build** (Best for production)

```yaml
# template-ai-agent.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  AgentSuggestionFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./  # SAM builds from current directory
      Handler: handlers/agent-suggestion-handler.handler
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          NODE_ENV: production
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: 'arn:aws:bedrock:*::foundation-model/*'
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /agent-suggestion
            Method: POST
            RestApiId: !Ref AgentApi

  AgentApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: dev
      Cors:
        AllowMethods: "'POST,OPTIONS'"
        AllowHeaders: "'Content-Type'"
        AllowOrigin: "'*'"

Outputs:
  ApiUrl:
    Value: !Sub 'https://${AgentApi}.execute-api.${AWS::Region}.amazonaws.com/dev'
```

**Deploy with SAM:**
```bash
# Build and package automatically
sam build

# Deploy with guided setup
sam deploy --guided

# Or automated
sam deploy \
  --stack-name whizz-ai-agent-dev \
  --capabilities CAPABILITY_IAM \
  --resolve-s3
```

---

### **Method 3: Serverless Framework** (Best for multi-environment)

```yaml
# serverless.yml
service: whizz-ai-agent

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  
  environment:
    NODE_ENV: production
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - bedrock:InvokeModel
          Resource: 'arn:aws:bedrock:*::foundation-model/*'

functions:
  agentSuggestion:
    handler: handlers/agent-suggestion-handler.handler
    timeout: 30
    memorySize: 512
    events:
      - http:
          path: /agent-suggestion
          method: post
          cors: true

# Automatically handles packaging!
package:
  patterns:
    - 'handlers/**'
    - 'services/**'
    - 'node_modules/@aws-sdk/**'
    - '!node_modules/**/tests/**'
    - '!**/*.test.js'
```

**Deploy:**
```bash
# Install serverless
npm install -g serverless

# Deploy to dev
serverless deploy --stage dev

# Deploy to production
serverless deploy --stage prod
```

---

## 🎯 Recommended Solution for whizzAI

I recommend **Method 1** (Direct S3 with correct structure) because:
1. ✅ No additional frameworks needed
2. ✅ Fast deployment
3. ✅ Explicit control over structure
4. ✅ Easy to debug

---

## 📝 Implementation Plan

### Step 1: Create New Deployment Script
```bash
backend/deploy-ai-correct.sh
```

### Step 2: Fix File Structure
```
Current (WRONG):
lambda.zip
  └── src/
      └── handlers/
          └── agent-suggestion-handler.js

New (CORRECT):
lambda.zip
  └── handlers/
      └── agent-suggestion-handler.js
  └── services/
      └── bedrock-agent-service.js
  └── node_modules/
      └── @aws-sdk/
```

### Step 3: Update CloudFormation Handler
```yaml
Handler: handlers/agent-suggestion-handler.handler
# Matches: handlers/agent-suggestion-handler.js exports.handler
```

### Step 4: Deploy
```bash
cd backend
chmod +x deploy-ai-correct.sh
./deploy-ai-correct.sh
```

---

## 🔍 Debugging ZIP Issues

### Check ZIP structure:
```bash
unzip -l lambda.zip | head -20
```

### Expected output:
```
handlers/agent-suggestion-handler.js
services/bedrock-agent-service.js
node_modules/@aws-sdk/client-bedrock-runtime/
package.json
```

### Test locally:
```bash
# Extract to temp folder
unzip lambda.zip -d /tmp/test-lambda

# Check handler exists at expected path
ls /tmp/test-lambda/handlers/agent-suggestion-handler.js

# Test require
node -e "require('/tmp/test-lambda/handlers/agent-suggestion-handler')"
```

---

## 📊 Deployment Method Comparison

| Method | Pros | Cons | Complexity | Speed |
|--------|------|------|------------|-------|
| **Manual ZIP** | Full control | Error-prone | Medium | Fast |
| **SAM** | AWS native, reliable | Learning curve | Medium | Medium |
| **Serverless** | Multi-env, plugins | Extra dependency | Low | Fast |
| **CDK** | Type-safe, powerful | Heavy, complex | High | Slow |
| **AWS Console** | Visual, simple | Not reproducible | Very Low | Slow |

**Winner for whizzAI: SAM** (Best balance of reliability and simplicity)

---

## 🚀 Next Steps

1. ✅ Create correct deployment script
2. ✅ Test locally first
3. ✅ Deploy to dev
4. ✅ Verify API works
5. ✅ Update frontend endpoint
6. ✅ Test end-to-end
