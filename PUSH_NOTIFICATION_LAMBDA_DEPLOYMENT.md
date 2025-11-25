# Push Notification Lambda Deployment Guide

## Issue
The push notification system works on localhost but fails on AWS Amplify with "Failed to load" error.

## Root Cause
The frontend was hardcoded to use `http://localhost:3000` API endpoint, which doesn't exist on Amplify. The Lambda functions need to be deployed to AWS and the frontend needs to use the correct API Gateway URLs.

## Solution Steps

### 1. Deploy Lambda Functions to AWS

You have two Lambda functions that need to be deployed:

1. **`backend/lambda/merchant-info-notification.js`** - Sends info notifications to merchants
2. **`backend/lambda/discount-push-notification.js`** - Sends discount notifications to customers

#### Option A: Deploy via AWS SAM (Recommended)

Create a `template.yaml` file in the project root:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: WizzCentral Push Notification Lambdas

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: nodejs18.x
    Environment:
      Variables:
        FIREBASE_SERVICE_ACCOUNT_PATH: !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:firebase-service-account"
        DEVICE_TOKENS_TABLE: "WhizzMerchants_DeviceTokens"
        BUSINESSES_TABLE: "WhizzMerchants_Businesses"

Resources:
  # Merchant Information Notification Lambda
  MerchantInfoNotificationFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: WizzCentral-MerchantInfoNotification
      CodeUri: backend/lambda/
      Handler: merchant-info-notification.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: WhizzMerchants_DeviceTokens
        - DynamoDBReadPolicy:
            TableName: WhizzMerchants_Businesses
        - Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource: !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:firebase-service-account*"
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /api/merchants/send-info-notification
            Method: POST
            Auth:
              Authorizer: AWS_IAM

  # Discount Push Notification Lambda
  DiscountPushNotificationFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: WizzCentral-DiscountPushNotification
      CodeUri: backend/lambda/
      Handler: discount-push-notification.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: WhizzMerchants_DeviceTokens
        - DynamoDBReadPolicy:
            TableName: WhizzMerchants_Businesses
        - DynamoDBReadPolicy:
            TableName: WhizzMerchants_Discounts
        - Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource: !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:firebase-service-account*"
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /api/discounts/{discountId}/send-notification
            Method: POST
            Auth:
              Authorizer: AWS_IAM

Outputs:
  ApiGatewayUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

Deploy:
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Build and deploy
sam build
sam deploy --guided
```

#### Option B: Deploy via AWS Console

1. **Create Lambda Functions**:
   - Go to AWS Lambda Console
   - Create function: `WizzCentral-MerchantInfoNotification`
   - Runtime: Node.js 18.x
   - Upload `backend/lambda/merchant-info-notification.js` and `node_modules` (zip file)

2. **Set Environment Variables**:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/var/task/config/wizz-business-app-firebase-adminsdk.json
   DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens
   BUSINESSES_TABLE=WhizzMerchants_Businesses
   ```

3. **Create API Gateway**:
   - Go to API Gateway Console
   - Create REST API
   - Create resources and methods for each endpoint
   - Deploy to stage (e.g., `prod`)

### 2. Store Firebase Service Account in AWS Secrets Manager

```bash
# Upload Firebase service account to Secrets Manager
aws secretsmanager create-secret \
    --name firebase-service-account \
    --description "Firebase Admin SDK service account for push notifications" \
    --secret-string file://config/wizz-business-app-firebase-adminsdk.json \
    --profile wizz-drivers-ghayth-dev
```

### 3. Update Lambda Code to Read from Secrets Manager

Update both Lambda files to read Firebase credentials from Secrets Manager instead of file:

```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getFirebaseCredentials() {
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const command = new GetSecretValueCommand({ SecretId: 'firebase-service-account' });
    const response = await client.send(command);
    return JSON.parse(response.SecretString);
}

// Initialize Firebase Admin
const serviceAccount = await getFirebaseCredentials();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
```

### 4. Update Frontend with API Gateway URL

After deployment, update `frontend/pages/promotions.html`:

```javascript
// Replace this line:
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://your-api-gateway-url.amazonaws.com/prod'; // UPDATE THIS!

// With your actual API Gateway URL from SAM output:
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/Prod';
```

### 5. Configure CORS on API Gateway

Make sure your API Gateway has CORS enabled:

```json
{
  "Access-Control-Allow-Origin": "https://main.d2f5oacwil9cbi.amplifyapp.com",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}
```

### 6. Test the Deployment

```bash
# Test merchant notification endpoint
curl -X POST https://YOUR-API-GATEWAY-URL/Prod/api/merchants/send-info-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-JWT-TOKEN" \
  -d '{
    "notificationType": "info",
    "notificationTitle": "Test Notification",
    "notificationBody": "This is a test",
    "targetAudience": "all",
    "priority": "normal"
  }'
```

### 7. Push Changes to Git

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

git add frontend/pages/promotions.html
git commit -m "Fix: Make API URLs environment-aware for Amplify deployment"
git push origin main
git push amplify main
```

## Quick Fix for Testing (Temporary)

If you want to test immediately without deploying Lambda:

1. **Option 1**: Use your local server as API endpoint (requires ngrok):
   ```bash
   # Terminal 1: Start local server
   npm start
   
   # Terminal 2: Expose with ngrok
   ngrok http 3000
   
   # Update API_BASE_URL in promotions.html with ngrok URL
   ```

2. **Option 2**: Deploy only the frontend with mock data:
   - Comment out the push notification functionality temporarily
   - Add "Coming Soon" message to the buttons

## Verification Checklist

- [ ] Lambda functions deployed to AWS
- [ ] Firebase credentials stored in Secrets Manager
- [ ] API Gateway created with proper endpoints
- [ ] CORS configured on API Gateway
- [ ] Frontend updated with correct API Gateway URL
- [ ] DynamoDB tables accessible by Lambda
- [ ] IAM roles configured with proper permissions
- [ ] Test notification sent successfully from Amplify app

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Amplify                             │
│  https://main.d2f5oacwil9cbi.amplifyapp.com                 │
│                                                             │
│  ┌───────────────────────────────────────────┐             │
│  │  promotions.html (Static Frontend)        │             │
│  │  - Detects environment (Amplify vs Local) │             │
│  │  - Uses appropriate API_BASE_URL          │             │
│  └───────────────┬───────────────────────────┘             │
└──────────────────┼─────────────────────────────────────────┘
                   │
                   │ HTTPS Request
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS API Gateway (REST API)                     │
│  https://abc123xyz.execute-api.us-east-1.amazonaws.com      │
│                                                             │
│  Endpoints:                                                 │
│  - POST /api/merchants/send-info-notification               │
│  - POST /api/discounts/:discountId/send-notification        │
│  - GET /api/promotions                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Invokes
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS Lambda Functions                        │
│                                                             │
│  ┌──────────────────────────────────────────┐              │
│  │ merchant-info-notification.js            │              │
│  │ - Queries DynamoDB for merchant tokens   │              │
│  │ - Sends FCM notifications                │              │
│  └──────────────┬───────────────────────────┘              │
│                 │                                           │
│  ┌──────────────▼───────────────────────────┐              │
│  │ discount-push-notification.js            │              │
│  │ - Queries DynamoDB for discount data     │              │
│  │ - Sends targeted FCM notifications       │              │
│  └──────────────┬───────────────────────────┘              │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  ├─────────────────┐
                  │                 │
                  ▼                 ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│   AWS Secrets Manager   │  │      DynamoDB Tables     │
│                         │  │                          │
│ - Firebase credentials  │  │ - DeviceTokens          │
└─────────────────────────┘  │ - Businesses            │
                             │ - Discounts             │
                             └────────┬─────────────────┘
                                      │
                                      │ FCM Token
                                      ▼
                             ┌────────────────────────┐
                             │   Firebase Cloud       │
                             │   Messaging (FCM)      │
                             │                        │
                             │ - Delivers to devices  │
                             └────────┬───────────────┘
                                      │
                                      │ Push Notification
                                      ▼
                             ┌────────────────────────┐
                             │  WhizzMerchants App    │
                             │  (iPhone)              │
                             └────────────────────────┘
```

## Cost Estimation

- **Lambda**: ~$0.20/month (with Free Tier)
- **API Gateway**: ~$3.50/month (1M requests)
- **Secrets Manager**: $0.40/month
- **DynamoDB**: Included in existing tables
- **Total**: ~$4.10/month

## Troubleshooting

### Error: "Failed to load"
- Check browser console for actual error
- Verify API Gateway URL is correct
- Check CORS configuration
- Ensure Lambda has proper IAM permissions

### Error: "401 Unauthorized"
- Check if JWT token is being sent
- Verify Cognito authorizer configuration
- Ensure token is not expired

### Error: "500 Internal Server Error"
- Check Lambda CloudWatch logs
- Verify environment variables
- Ensure Firebase credentials are valid
- Check DynamoDB table permissions

## Next Steps

1. Deploy Lambda functions to AWS
2. Update frontend with API Gateway URL
3. Test from Amplify app
4. Monitor CloudWatch logs
5. Set up CloudWatch alarms for errors
