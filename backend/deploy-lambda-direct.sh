#!/bin/bash

# Deploy Lambda function directly using AWS CLI
# This bypasses Serverless Framework issues

set -e

FUNCTION_NAME="wizzcentral-websocket-dev-liveChatConnect"
REGION="us-east-1"
PROFILE="wizz-drivers-ghayth-dev"

echo "🚀 Starting Lambda deployment for $FUNCTION_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create deployment package
echo "📦 Creating deployment package..."
cd src/handlers
zip -q -r ../../lambda-package.zip websocket-connections.js
cd ../..

# Check if package was created
if [ ! -f lambda-package.zip ]; then
    echo "❌ Failed to create deployment package"
    exit 1
fi

PACKAGE_SIZE=$(ls -lh lambda-package.zip | awk '{print $5}')
echo "✅ Package created: lambda-package.zip ($PACKAGE_SIZE)"

# Update Lambda function code
echo ""
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://lambda-package.zip \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query '{FunctionName:FunctionName, LastModified:LastModified, CodeSize:CodeSize}' \
    --output table

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Lambda function updated successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Test the merchant chat from Flutter app"
    echo "2. Monitor CloudWatch logs for '🏪 Merchant connecting...'"
    echo "3. Check support dashboard for incoming sessions"
    echo ""
    echo "🔍 Monitor logs with:"
    echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION --profile $PROFILE"
else
    echo ""
    echo "❌ Failed to update Lambda function"
    exit 1
fi

# Cleanup
rm -f lambda-package.zip
echo "🧹 Cleaned up deployment package"
