#!/bin/bash

# Deploy Support Image Upload Lambda Function
# This script deploys the support-image-upload.js Lambda function to AWS

set -e

FUNCTION_NAME="support-image-upload"
REGION="us-east-1"
PROFILE="wizz-drivers-ghayth-dev"
RUNTIME="nodejs18.x"
HANDLER="support-image-upload.handler"
ROLE_ARN="arn:aws:iam::590183703569:role/whizz-lambda-execution-role"
BUCKET_NAME="whizz-support-chat-images"

echo "🚀 Starting Lambda deployment for $FUNCTION_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to lambda directory
cd lambda

# Install dependencies
echo "📦 Installing dependencies..."
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Create deployment package
echo "📦 Creating deployment package..."
zip -q -r support-image-upload-package.zip support-image-upload.js node_modules/

# Check if package was created
if [ ! -f support-image-upload-package.zip ]; then
    echo "❌ Failed to create deployment package"
    exit 1
fi

PACKAGE_SIZE=$(ls -lh support-image-upload-package.zip | awk '{print $5}')
echo "✅ Package created: support-image-upload-package.zip ($PACKAGE_SIZE)"

# Check if function exists
echo "🔍 Checking if Lambda function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1; then
    echo "🔄 Function exists, updating code..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://support-image-upload-package.zip \
        --profile "$PROFILE" \
        --region "$REGION"
    
    echo "🔧 Updating environment variables..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment Variables="{SUPPORT_IMAGES_BUCKET=$BUCKET_NAME,AWS_REGION=$REGION}" \
        --profile "$PROFILE" \
        --region "$REGION"
else
    echo "🆕 Function does not exist, creating..."
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file fileb://support-image-upload-package.zip \
        --environment Variables="{SUPPORT_IMAGES_BUCKET=$BUCKET_NAME,AWS_REGION=$REGION}" \
        --profile "$PROFILE" \
        --region "$REGION"
fi

echo ""
echo "✅ Lambda function deployed successfully!"
echo "📋 Function Name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo "🪣 S3 Bucket: $BUCKET_NAME"

# Test the function
echo ""
echo "🧪 Testing the function..."
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{"httpMethod":"GET","queryStringParameters":{"sessionId":"test","merchantId":"test","fileName":"test.jpg","fileType":"image/jpeg"}}' \
    --profile "$PROFILE" \
    --region "$REGION" \
    test-response.json

if [ -f test-response.json ]; then
    echo "📋 Test Response:"
    cat test-response.json | jq .
    rm test-response.json
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
rm support-image-upload-package.zip

echo "🎉 Deployment completed successfully!"
