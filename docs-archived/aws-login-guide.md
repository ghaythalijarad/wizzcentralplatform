# AWS Credentials Fix Guide

## Step 1: Refresh AWS SSO Login
```bash
aws sso login --profile default
```

## Step 2: Run DynamoDB Permissions Fix
```bash
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
./fix-dynamodb-permissions.sh
```

## Alternative Manual Method:

### Get Authenticated Role ARN:
```bash
aws cognito-identity describe-identity-pool \
    --identity-pool-id us-east-1:864073dc-423f-42ae-9b1a-67c1c913b38a \
    --region us-east-1 \
    --query 'Roles.authenticated' \
    --output text
```

### Create Policy:
```bash
aws iam create-policy \
    --policy-name WizzCentralPlatformDynamoDBAccess \
    --policy-document file://wizzcentral-platform-dynamodb-policy.json
```

### Attach Policy to Role:
```bash
aws iam attach-role-policy \
    --role-name [ROLE_NAME_FROM_STEP_1] \
    --policy-arn arn:aws:iam::[ACCOUNT_ID]:policy/WizzCentralPlatformDynamoDBAccess
```

## Required DynamoDB Permissions:
- `dynamodb:Scan` on WizzCentral_Platform_Discounts table
- `dynamodb:PutItem` on WizzCentral_Platform_Discounts table 
- `dynamodb:GetItem` on WizzCentral_Platform_Discounts table
- `dynamodb:UpdateItem` on WizzCentral_Platform_Discounts table
