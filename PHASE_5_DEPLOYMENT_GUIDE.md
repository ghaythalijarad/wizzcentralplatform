# 🚀 Phase 5: API Deployment Guide

**Document Version**: 1.0  
**Last Updated**: November 4, 2025  
**Deployment Target**: AWS Lambda + API Gateway

---

## 📋 Pre-Deployment Checklist

Before deploying the Phase 5 API endpoints, ensure you have:

- [x] AWS CLI configured with appropriate credentials
- [x] SAM CLI installed (`brew install aws-sam-cli`)
- [x] Node.js 18.x or higher
- [x] DynamoDB table `WizzCentral_Regions` created
- [x] All Phase 1-4 files in place
- [x] Required IAM permissions

---

## 📂 Required Files

Ensure these files exist in your backend folder:

```
backend/
├── regions-db-schema.js          ✅ Phase 1
├── regions-service.js             ✅ Phase 2
├── regions-api-handler.js         ✅ Phase 5 (updated)
├── regions-api-tests.js           ✅ Phase 5 (new)
├── package.json                   ⏳ To create
└── template-regions-api.yaml      ⏳ To create
```

---

## 🔧 Step 1: Create package.json

Create `/backend/package.json`:

```json
{
  "name": "wizzcentral-regions-api",
  "version": "1.0.0",
  "description": "WizzCentral Regions Management API",
  "main": "regions-api-handler.js",
  "scripts": {
    "test": "node regions-api-tests.js",
    "test:watch": "nodemon regions-api-tests.js",
    "lint": "eslint *.js",
    "deploy:dev": "sam deploy --config-env dev",
    "deploy:prod": "sam deploy --config-env prod"
  },
  "dependencies": {
    "aws-sdk": "^2.1489.0"
  },
  "devDependencies": {
    "eslint": "^8.53.0",
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🔧 Step 2: Create SAM Template

Create `/backend/template-regions-api.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: WizzCentral Regions API - Phase 5

Parameters:
  StageName:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Deployment stage name
  
  RegionsTableName:
    Type: String
    Default: WizzCentral_Regions
    Description: DynamoDB table name for regions

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        REGIONS_TABLE: !Ref RegionsTableName
        STAGE: !Ref StageName
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
  Api:
    Cors:
      AllowOrigin: "'*'"
      AllowHeaders: "'*'"
      AllowMethods: "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"

Resources:
  # ---------------------------
  # Lambda Function
  # ---------------------------
  RegionsAPIFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub wizzcentral-regions-api-${StageName}
      CodeUri: ./
      Handler: regions-api-handler.handler
      Description: Regions Management API with hierarchical support
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref RegionsTableName
      Events:
        # GET /regions/hierarchy
        GetHierarchy:
          Type: HttpApi
          Properties:
            Path: /regions/hierarchy
            Method: GET
            ApiId: !Ref RegionsHttpApi
        
        # GET /regions/active
        GetActive:
          Type: HttpApi
          Properties:
            Path: /regions/active
            Method: GET
            ApiId: !Ref RegionsHttpApi
        
        # GET /regions/summary
        GetSummary:
          Type: HttpApi
          Properties:
            Path: /regions/summary
            Method: GET
            ApiId: !Ref RegionsHttpApi
        
        # GET /regions (list all)
        GetRegions:
          Type: HttpApi
          Properties:
            Path: /regions
            Method: GET
            ApiId: !Ref RegionsHttpApi
        
        # GET /regions/:id
        GetRegionById:
          Type: HttpApi
          Properties:
            Path: /regions/{id}
            Method: GET
            ApiId: !Ref RegionsHttpApi
        
        # POST /regions (create)
        CreateRegion:
          Type: HttpApi
          Properties:
            Path: /regions
            Method: POST
            ApiId: !Ref RegionsHttpApi
        
        # PUT /regions/:id (update)
        UpdateRegion:
          Type: HttpApi
          Properties:
            Path: /regions/{id}
            Method: PUT
            ApiId: !Ref RegionsHttpApi
        
        # PATCH /regions/:id/toggleStatus
        ToggleStatus:
          Type: HttpApi
          Properties:
            Path: /regions/{id}/toggleStatus
            Method: PATCH
            ApiId: !Ref RegionsHttpApi
        
        # DELETE /regions/:id
        DeleteRegion:
          Type: HttpApi
          Properties:
            Path: /regions/{id}
            Method: DELETE
            ApiId: !Ref RegionsHttpApi

  # ---------------------------
  # HTTP API Gateway
  # ---------------------------
  RegionsHttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: !Ref StageName
      CorsConfiguration:
        AllowOrigins:
          - '*'
        AllowHeaders:
          - '*'
        AllowMethods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
          - OPTIONS
        MaxAge: 600

  # ---------------------------
  # CloudWatch Log Group
  # ---------------------------
  RegionsAPILogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/lambda/wizzcentral-regions-api-${StageName}
      RetentionInDays: 30

Outputs:
  RegionsAPIEndpoint:
    Description: Regions API Gateway endpoint URL
    Value: !Sub https://${RegionsHttpApi}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/
    Export:
      Name: !Sub ${AWS::StackName}-ApiEndpoint
  
  RegionsFunctionArn:
    Description: Regions API Lambda Function ARN
    Value: !GetAtt RegionsAPIFunction.Arn
    Export:
      Name: !Sub ${AWS::StackName}-FunctionArn
  
  ApiId:
    Description: HTTP API ID
    Value: !Ref RegionsHttpApi
    Export:
      Name: !Sub ${AWS::StackName}-ApiId
```

---

## 🔧 Step 3: Install Dependencies

```bash
cd backend
npm install
```

---

## 🧪 Step 4: Run Tests Locally

```bash
# Run test suite
npm test

# Expected output:
# 🧪 Starting Regions API Test Suite
# ✅ Test: GET /regions/hierarchy
# ✅ Test: GET /regions/active
# ✅ Test: PATCH /regions/:id/toggleStatus
# ...
# 📊 Test Suite Summary
# Total Tests: 12
# ✅ Passed: 12
```

---

## 🚀 Step 5: Deploy to AWS

### Option A: Quick Deploy

```bash
cd backend

# Build
sam build -t template-regions-api.yaml

# Deploy (guided - first time)
sam deploy --guided \
  --template-file template-regions-api.yaml \
  --stack-name wizzcentral-regions-api-dev \
  --capabilities CAPABILITY_IAM

# Follow prompts:
# Stack Name: wizzcentral-regions-api-dev
# AWS Region: us-east-1
# Parameter StageName: dev
# Parameter RegionsTableName: WizzCentral_Regions
# Confirm changes: Y
# Allow SAM CLI IAM role creation: Y
# Save arguments to configuration: Y
```

### Option B: Deploy with Config File

Create `samconfig.toml`:

```toml
version = 0.1

[default.deploy.parameters]
stack_name = "wizzcentral-regions-api-dev"
s3_prefix = "wizzcentral-regions-api"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "StageName=dev RegionsTableName=WizzCentral_Regions"
confirm_changeset = true

[staging.deploy.parameters]
stack_name = "wizzcentral-regions-api-staging"
s3_prefix = "wizzcentral-regions-api"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "StageName=staging RegionsTableName=WizzCentral_Regions"
confirm_changeset = true

[prod.deploy.parameters]
stack_name = "wizzcentral-regions-api-prod"
s3_prefix = "wizzcentral-regions-api"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "StageName=prod RegionsTableName=WizzCentral_Regions"
confirm_changeset = true
```

Then deploy:

```bash
# Dev
sam deploy --config-env default

# Staging
sam deploy --config-env staging

# Production
sam deploy --config-env prod
```

---

## 🧪 Step 6: Test Deployed API

After deployment, SAM will output your API endpoint URL:

```
Outputs
---------------------------------------------------------------------
Key                 RegionsAPIEndpoint
Description         Regions API Gateway endpoint URL
Value               https://abc123.execute-api.us-east-1.amazonaws.com/dev/
---------------------------------------------------------------------
```

### Test with cURL

```bash
# Set your API endpoint
export API_URL="https://abc123.execute-api.us-east-1.amazonaws.com/dev"

# Test 1: Get hierarchy
curl -X GET "$API_URL/regions/hierarchy"

# Test 2: Get active regions
curl -X GET "$API_URL/regions/active"

# Test 3: Toggle status
curl -X PATCH "$API_URL/regions/REG_001/toggleStatus" \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'

# Test 4: Get summary
curl -X GET "$API_URL/regions/summary"
```

### Test with Postman

1. Import the collection: `PHASE_5_POSTMAN_COLLECTION.json` (see below)
2. Set `{{baseUrl}}` variable to your API endpoint
3. Run all tests in the collection

---

## 📊 Step 7: Monitor Deployment

### CloudWatch Logs

```bash
# View logs
sam logs --stack-name wizzcentral-regions-api-dev --tail

# Or use AWS Console
# CloudWatch → Log Groups → /aws/lambda/wizzcentral-regions-api-dev
```

### CloudWatch Metrics

Monitor these metrics:

- **Invocations**: Total API calls
- **Errors**: Failed requests
- **Duration**: Response time (avg, p95, p99)
- **Throttles**: Rate limit hits

### Set Up Alarms

```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name regions-api-errors-high \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🔒 Step 8: Add Authentication (Optional)

### Option A: API Key

```yaml
# Add to template-regions-api.yaml
RegionsHttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    # ...existing config...
    Auth:
      ApiKeyRequired: true

ApiKey:
  Type: AWS::ApiGateway::ApiKey
  Properties:
    Name: wizzcentral-regions-api-key
    Enabled: true

UsagePlan:
  Type: AWS::ApiGateway::UsagePlan
  Properties:
    UsagePlanName: regions-api-plan
    Throttle:
      RateLimit: 100
      BurstLimit: 200
    ApiStages:
      - ApiId: !Ref RegionsHttpApi
        Stage: !Ref StageName
```

### Option B: Cognito JWT

```yaml
# Add to template-regions-api.yaml
RegionsHttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    # ...existing config...
    Auth:
      Authorizers:
        CognitoAuthorizer:
          IdentitySource: $request.header.Authorization
          JwtConfiguration:
            issuer: !Sub https://cognito-idp.${AWS::Region}.amazonaws.com/${CognitoUserPoolId}
            audience:
              - !Ref CognitoUserPoolClient
      DefaultAuthorizer: CognitoAuthorizer
```

---

## 🔄 Step 9: Update Frontend Configuration

Update your frontend to use the deployed API:

```javascript
// frontend/config/api.js
export const API_CONFIG = {
  development: {
    regionsEndpoint: 'https://abc123.execute-api.us-east-1.amazonaws.com/dev'
  },
  staging: {
    regionsEndpoint: 'https://def456.execute-api.us-east-1.amazonaws.com/staging'
  },
  production: {
    regionsEndpoint: 'https://ghi789.execute-api.us-east-1.amazonaws.com/prod'
  }
};

const env = process.env.NODE_ENV || 'development';
export const REGIONS_API_URL = API_CONFIG[env].regionsEndpoint;
```

```javascript
// frontend/regions-admin-panel.js
const API_BASE_URL = REGIONS_API_URL;

// Update API calls
async getCompleteHierarchy() {
  const response = await fetch(`${API_BASE_URL}/regions/hierarchy`);
  return response.json();
}

async getActiveRegions(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/regions/active?${params}`);
  return response.json();
}

async toggleRegionStatus(regionId, status) {
  const response = await fetch(`${API_BASE_URL}/regions/${regionId}/toggleStatus`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return response.json();
}
```

---

## 📦 Step 10: Postman Collection

Create `PHASE_5_POSTMAN_COLLECTION.json`:

```json
{
  "info": {
    "name": "WizzCentral Regions API - Phase 5",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://abc123.execute-api.us-east-1.amazonaws.com/dev",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Get Complete Hierarchy",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/regions/hierarchy",
          "host": ["{{baseUrl}}"],
          "path": ["regions", "hierarchy"]
        }
      }
    },
    {
      "name": "Get Active Regions",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/regions/active",
          "host": ["{{baseUrl}}"],
          "path": ["regions", "active"]
        }
      }
    },
    {
      "name": "Get Active Regions (Hierarchical)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/regions/active?includeHierarchy=true",
          "host": ["{{baseUrl}}"],
          "path": ["regions", "active"],
          "query": [
            {
              "key": "includeHierarchy",
              "value": "true"
            }
          ]
        }
      }
    },
    {
      "name": "Toggle Region Status",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"INACTIVE\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/regions/REG_001/toggleStatus",
          "host": ["{{baseUrl}}"],
          "path": ["regions", "REG_001", "toggleStatus"]
        }
      }
    },
    {
      "name": "Get Region Summary",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/regions/summary",
          "host": ["{{baseUrl}}"],
          "path": ["regions", "summary"]
        }
      }
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'regions-service'"

**Solution**:
```bash
# Ensure all files are in the same directory
ls -la backend/
# Should show:
# regions-db-schema.js
# regions-service.js
# regions-api-handler.js
```

### Issue: "DynamoDB table not found"

**Solution**:
```bash
# Verify table exists
aws dynamodb describe-table --table-name WizzCentral_Regions

# If not, create it
node backend/create-regions-table.js
```

### Issue: "Lambda timeout"

**Solution**:
```yaml
# Increase timeout in template
Globals:
  Function:
    Timeout: 60  # Increase from 30 to 60
```

### Issue: "CORS error in browser"

**Solution**:
```yaml
# Ensure CORS is enabled in template
RegionsHttpApi:
  Properties:
    CorsConfiguration:
      AllowOrigins:
        - 'https://yourfrontend.com'  # Or '*' for development
```

---

## ✅ Deployment Verification Checklist

After deployment, verify:

- [ ] API endpoint URL is accessible
- [ ] GET /regions/hierarchy returns data
- [ ] GET /regions/active returns only active regions
- [ ] PATCH /regions/:id/toggleStatus works with cascade
- [ ] CloudWatch logs are being written
- [ ] Error responses are properly formatted
- [ ] CORS headers are present in responses
- [ ] Response times are acceptable (<2s for hierarchy)
- [ ] Frontend can successfully call all endpoints
- [ ] Status toggle updates are reflected in database

---

## 📈 Performance Optimization

### Enable API Caching

```yaml
RegionsHttpApi:
  Properties:
    # Add caching
    CacheClusterEnabled: true
    CacheClusterSize: '0.5'
```

### Add CloudFront CDN

```yaml
CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - Id: RegionsAPI
          DomainName: !Sub ${RegionsHttpApi}.execute-api.${AWS::Region}.amazonaws.com
      DefaultCacheBehavior:
        TargetOriginId: RegionsAPI
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingOptimized
```

---

## 🔄 Rolling Updates

To update the API without downtime:

```bash
# 1. Build new version
sam build -t template-regions-api.yaml

# 2. Deploy with gradual rollout
sam deploy \
  --template-file template-regions-api.yaml \
  --stack-name wizzcentral-regions-api-prod \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides "DeploymentPreference=Canary10Percent5Minutes"
```

---

## 📝 Rollback Procedure

If deployment fails or has issues:

```bash
# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name wizzcentral-regions-api-dev

# Or delete and redeploy
sam delete --stack-name wizzcentral-regions-api-dev
sam deploy --guided
```

---

## 🎉 Success!

You have successfully deployed Phase 5 API endpoints!

**Next Steps**:
1. Update frontend to use deployed endpoints
2. Set up monitoring alerts
3. Configure authentication
4. Test with real users
5. Move to Phase 6 (if applicable)

---

**Deployment Status**: ✅ **READY FOR PRODUCTION**

**Support**: For issues, check CloudWatch logs or contact DevOps team.
