#!/bin/bash

echo "🌍 Deploying Central Platform Region API"
echo "========================================="
echo ""

# Set AWS Region
export AWS_REGION="us-east-1"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS CLI is configured"
echo "📍 Region: $AWS_REGION"
echo ""

# Step 1: Create/Verify DynamoDB Tables
echo "📊 Step 1: Setting up DynamoDB Tables..."
echo "----------------------------------------"
node setup-iraq-regions-dynamodb.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup DynamoDB tables"
    exit 1
fi

echo "✅ DynamoDB tables ready"
echo ""

# Step 2: Create Lambda Function
echo "🔧 Step 2: Creating Lambda Function Package..."
echo "-----------------------------------------------"

# Create temporary deployment directory
rm -rf temp-regions-api
mkdir -p temp-regions-api

# Copy Lambda handler
cp regions-central-api.js temp-regions-api/index.js
cp regions-service.js temp-regions-api/
cp regions-db-schema.js temp-regions-api/

# Create package.json
cat > temp-regions-api/package.json << EOF
{
  "name": "wizzcentral-regions-api",
  "version": "1.0.0",
  "description": "Central Platform Region API for WizzGo Apps",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1691.0"
  }
}
EOF

# Install dependencies
cd temp-regions-api
npm install --production
cd ..

# Create ZIP package
cd temp-regions-api
zip -r ../regions-api.zip . -x "*.git*" "node_modules/aws-sdk/*"
cd ..

echo "✅ Lambda package created: regions-api.zip"
echo ""

# Step 3: Create/Update Lambda Function
echo "☁️  Step 3: Deploying Lambda Function..."
echo "----------------------------------------"

# Check if Lambda function exists
if aws lambda get-function --function-name wizzcentral-regions-api 2>/dev/null; then
    echo "📝 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name wizzcentral-regions-api \
        --zip-file fileb://regions-api.zip \
        --region $AWS_REGION
else
    echo "🆕 Creating new Lambda function..."
    
    # Create Lambda execution role if it doesn't exist
    ROLE_ARN=$(aws iam get-role --role-name WizzCentral-Regions-Lambda-Role --query 'Role.Arn' --output text 2>/dev/null)
    
    if [ -z "$ROLE_ARN" ]; then
        echo "Creating IAM role for Lambda..."
        
        # Create trust policy
        cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create role
        aws iam create-role \
            --role-name WizzCentral-Regions-Lambda-Role \
            --assume-role-policy-document file://lambda-trust-policy.json
        
        # Attach policies
        aws iam attach-role-policy \
            --role-name WizzCentral-Regions-Lambda-Role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create DynamoDB policy
        cat > dynamodb-regions-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:$AWS_REGION:*:table/WizzCentral_Regions",
        "arn:aws:dynamodb:$AWS_REGION:*:table/WizzCentral_Regions/index/*",
        "arn:aws:dynamodb:$AWS_REGION:*:table/WizzCentral_RegionLogs"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    }
  ]
}
EOF
        
        aws iam put-role-policy \
            --role-name WizzCentral-Regions-Lambda-Role \
            --policy-name DynamoDBRegionsAccess \
            --policy-document file://dynamodb-regions-policy.json
        
        # Wait for role to be available
        echo "⏳ Waiting for IAM role to propagate..."
        sleep 10
        
        ROLE_ARN=$(aws iam get-role --role-name WizzCentral-Regions-Lambda-Role --query 'Role.Arn' --output text)
    fi
    
    # Create Lambda function
    aws lambda create-function \
        --function-name wizzcentral-regions-api \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://regions-api.zip \
        --timeout 30 \
        --memory-size 512 \
        --region $AWS_REGION \
        --environment "Variables={TABLE_NAME=WizzCentral_Regions,LOGS_TABLE=WizzCentral_RegionLogs}"
fi

echo "✅ Lambda function deployed"
echo ""

# Step 4: Create API Gateway
echo "🌐 Step 4: Setting up API Gateway..."
echo "------------------------------------"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='wizzcentral-regions-api'].ApiId" --output text 2>/dev/null)

if [ -z "$API_ID" ]; then
    echo "🆕 Creating new HTTP API..."
    
    # Create HTTP API
    API_ID=$(aws apigatewayv2 create-api \
        --name wizzcentral-regions-api \
        --protocol-type HTTP \
        --cors-configuration "AllowOrigins=*,AllowMethods=GET,POST,PUT,DELETE,AllowHeaders=*" \
        --query 'ApiId' \
        --output text)
    
    echo "✅ API created: $API_ID"
    
    # Get Lambda ARN
    LAMBDA_ARN=$(aws lambda get-function --function-name wizzcentral-regions-api --query 'Configuration.FunctionArn' --output text)
    
    # Create integration
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-uri $LAMBDA_ARN \
        --payload-format-version 2.0 \
        --query 'IntegrationId' \
        --output text)
    
    echo "✅ Integration created: $INTEGRATION_ID"
    
    # Create routes
    echo "Creating routes..."
    
    # GET /regions/active
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "GET /regions/active" \
        --target "integrations/$INTEGRATION_ID"
    
    # GET /regions/{id}
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "GET /regions/{id}" \
        --target "integrations/$INTEGRATION_ID"
    
    # Create default stage
    aws apigatewayv2 create-stage \
        --api-id $API_ID \
        --stage-name '$default' \
        --auto-deploy
    
    # Grant API Gateway permission to invoke Lambda
    aws lambda add-permission \
        --function-name wizzcentral-regions-api \
        --statement-id apigateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$AWS_REGION:*:$API_ID/*/*"
    
    echo "✅ Routes created"
else
    echo "✅ Using existing API: $API_ID"
fi

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --query 'ApiEndpoint' --output text)

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "📡 API Endpoint: $API_ENDPOINT"
echo ""
echo "Available Endpoints:"
echo "  GET  $API_ENDPOINT/regions/active"
echo "  GET  $API_ENDPOINT/regions/{id}"
echo ""
echo "🧪 Test Command:"
echo "  curl $API_ENDPOINT/regions/active"
echo ""
echo "📝 Update your Flutter app with this endpoint:"
echo "  static const String _centralApiUrl = '$API_ENDPOINT';"
echo ""

# Cleanup
rm -rf temp-regions-api
rm -f regions-api.zip
rm -f lambda-trust-policy.json
rm -f dynamodb-regions-policy.json

echo "✅ Cleanup complete"
echo ""
