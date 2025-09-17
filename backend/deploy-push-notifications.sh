#!/bin/bash
# Deployment script for WizzCentral Push Notification System

echo "🚀 Deploying WizzCentral Push Notification System..."

# Set AWS region
AWS_REGION="us-east-1"
PINPOINT_APP_NAME="WizzCentral-PushNotifications"

# Create Pinpoint application
echo "📱 Creating Pinpoint application..."
PINPOINT_APP_ID=$(aws pinpoint create-app \
    --create-application-request Name=$PINPOINT_APP_NAME \
    --region $AWS_REGION \
    --query 'ApplicationResponse.Id' \
    --output text)

echo "✅ Pinpoint Application ID: $PINPOINT_APP_ID"

# Create DynamoDB tables
echo "🗄️ Creating DynamoDB tables..."

# Promotions table
aws dynamodb create-table \
    --table-name WizzCentral_Promotions \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# Campaigns table
aws dynamodb create-table \
    --table-name WizzCentral_Campaigns \
    --attribute-definitions \
        AttributeName=campaignId,AttributeType=S \
    --key-schema \
        AttributeName=campaignId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Promotion analytics table
aws dynamodb create-table \
    --table-name WizzCentral_Promotion_Analytics \
    --attribute-definitions \
        AttributeName=promotionId,AttributeType=S \
        AttributeName=sentAt,AttributeType=S \
    --key-schema \
        AttributeName=promotionId,KeyType=HASH \
        AttributeName=sentAt,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

# Promotion logs table
aws dynamodb create-table \
    --table-name WizzCentral_Promotion_Logs \
    --attribute-definitions \
        AttributeName=promotionId,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=promotionId,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION

echo "✅ DynamoDB tables created"

# Create IAM roles and policies
echo "🔐 Creating IAM roles..."

# Lambda execution role
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

aws iam create-role \
    --role-name WizzCentral-Lambda-Role \
    --assume-role-policy-document file://lambda-trust-policy.json

# Lambda policy for Pinpoint and DynamoDB
cat > lambda-permissions-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "pinpoint:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/WizzCentral_*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "arn:aws:lambda:*:*:function:*"
        }
    ]
}
EOF

aws iam put-role-policy \
    --role-name WizzCentral-Lambda-Role \
    --policy-name WizzCentral-Lambda-Permissions \
    --policy-document file://lambda-permissions-policy.json

echo "✅ IAM roles created"

# Package and deploy Lambda functions
echo "📦 Packaging Lambda functions..."

# Function 1: Register Device
mkdir -p deploy/register-device
cp lambda/register_device.py deploy/register-device/lambda_function.py
cd deploy/register-device
pip install -r ../../lambda/requirements.txt -t .
zip -r ../register-device.zip .
cd ../../

# Function 2: Send Notification to Drivers
mkdir -p deploy/send-notification-drivers
cp lambda/send_notification_to_drivers.py deploy/send-notification-drivers/lambda_function.py
cd deploy/send-notification-drivers
pip install -r ../../lambda/requirements.txt -t .
zip -r ../send-notification-drivers.zip .
cd ../../

# Function 3: Send Regional Promotion
mkdir -p deploy/send-regional-promotion
cp lambda/send_regional_promotion.py deploy/send-regional-promotion/lambda_function.py
cd deploy/send-regional-promotion
pip install -r ../../lambda/requirements.txt -t .
zip -r ../send-regional-promotion.zip .
cd ../../

# Function 4: Handle Promotion Creation
mkdir -p deploy/handle-promotion-creation
cp lambda/handle_promotion_creation.py deploy/handle-promotion-creation/lambda_function.py
cd deploy/handle-promotion-creation
pip install -r ../../lambda/requirements.txt -t .
zip -r ../handle-promotion-creation.zip .
cd ../../

echo "✅ Lambda functions packaged"

# Deploy Lambda functions
echo "☁️ Deploying Lambda functions..."

LAMBDA_ROLE_ARN=$(aws iam get-role --role-name WizzCentral-Lambda-Role --query 'Role.Arn' --output text)

# Deploy register device function
aws lambda create-function \
    --function-name register_device \
    --runtime python3.11 \
    --role $LAMBDA_ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://deploy/register-device.zip \
    --timeout 30 \
    --environment Variables="{PINPOINT_APPLICATION_ID=$PINPOINT_APP_ID}" \
    --region $AWS_REGION

# Deploy send notification to drivers function
aws lambda create-function \
    --function-name send_notification_to_drivers \
    --runtime python3.11 \
    --role $LAMBDA_ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://deploy/send-notification-drivers.zip \
    --timeout 60 \
    --environment Variables="{PINPOINT_APPLICATION_ID=$PINPOINT_APP_ID}" \
    --region $AWS_REGION

# Deploy send regional promotion function
aws lambda create-function \
    --function-name send_regional_promotion \
    --runtime python3.11 \
    --role $LAMBDA_ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://deploy/send-regional-promotion.zip \
    --timeout 60 \
    --environment Variables="{PINPOINT_APPLICATION_ID=$PINPOINT_APP_ID,PROMOTIONS_ANALYTICS_TABLE=WizzCentral_Promotion_Analytics}" \
    --region $AWS_REGION

# Deploy handle promotion creation function
aws lambda create-function \
    --function-name handle_promotion_creation \
    --runtime python3.11 \
    --role $LAMBDA_ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://deploy/handle-promotion-creation.zip \
    --timeout 60 \
    --environment Variables="{PINPOINT_APPLICATION_ID=$PINPOINT_APP_ID,PROMOTION_LOGS_TABLE=WizzCentral_Promotion_Logs}" \
    --region $AWS_REGION

echo "✅ Lambda functions deployed"

# Create DynamoDB stream trigger
echo "🔗 Setting up DynamoDB stream trigger..."

PROMOTIONS_TABLE_STREAM_ARN=$(aws dynamodb describe-table \
    --table-name WizzCentral_Promotions \
    --region $AWS_REGION \
    --query 'Table.LatestStreamArn' \
    --output text)

aws lambda create-event-source-mapping \
    --event-source-arn $PROMOTIONS_TABLE_STREAM_ARN \
    --function-name handle_promotion_creation \
    --starting-position LATEST \
    --region $AWS_REGION

echo "✅ DynamoDB stream trigger configured"

# Create API Gateway
echo "🌐 Creating API Gateway..."

API_ID=$(aws apigatewayv2 create-api \
    --name WizzCentral-Promotions-API \
    --protocol-type HTTP \
    --cors-configuration AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*" \
    --region $AWS_REGION \
    --query 'ApiId' \
    --output text)

# Create API Gateway integrations for Lambda functions
aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:$AWS_REGION:$(aws sts get-caller-identity --query Account --output text):function:register_device" \
    --payload-format-version 2.0 \
    --region $AWS_REGION

# Create routes
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /register-device" \
    --target "integrations/$(aws apigatewayv2 get-integrations --api-id $API_ID --query 'Items[0].IntegrationId' --output text)" \
    --region $AWS_REGION

# Deploy API
aws apigatewayv2 create-deployment \
    --api-id $API_ID \
    --stage-name prod \
    --region $AWS_REGION

API_URL="https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"

echo "✅ API Gateway deployed at: $API_URL"

# Clean up deployment files
rm -rf deploy/
rm lambda-trust-policy.json
rm lambda-permissions-policy.json

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "- Pinpoint Application ID: $PINPOINT_APP_ID"
echo "- API Gateway URL: $API_URL"
echo "- Lambda Functions: register_device, send_notification_to_drivers, send_regional_promotion, handle_promotion_creation"
echo "- DynamoDB Tables: WizzCentral_Promotions, WizzCentral_Campaigns, WizzCentral_Promotion_Analytics, WizzCentral_Promotion_Logs"
echo ""
echo "🔧 Next Steps:"
echo "1. Update your Flutter app with the API Gateway URL"
echo "2. Configure Firebase Cloud Messaging in your Flutter app"
echo "3. Test device registration and push notifications"
echo "4. Deploy the FastAPI promotion management system"
