#!/bin/bash

# Correct Lambda Deployment Script for whizzAI
# Fixes ZIP structure issues and ensures proper handler path

set -e

echo "🚀 whizzAI Correct Lambda Deployment"
echo "===================================="
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials expired. Please login:"
    echo "   aws sso login"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS credentials valid (Account: $ACCOUNT_ID)"
echo ""

# Configuration
FUNCTION_NAME="whizz-ai-agent-suggestion"
REGION="us-east-1"
BUCKET_NAME="whizz-ai-deployments-${ACCOUNT_ID}"

# Navigate to backend directory
cd "$(dirname "$0")"
BACKEND_DIR=$(pwd)

echo "2️⃣ Building Lambda package with CORRECT structure..."
echo "   Current directory: $BACKEND_DIR"

# Clean workspace
rm -rf dist/
rm -f lambda-deployment.zip
mkdir -p dist/

# Copy handler and service files (NOT the src/ wrapper!)
echo "   → Copying handlers and services..."
if [ -d "src/handlers" ]; then
    cp -r src/handlers dist/
else
    echo "❌ Error: src/handlers directory not found!"
    exit 1
fi

if [ -d "src/services" ]; then
    cp -r src/services dist/
else
    echo "❌ Error: src/services directory not found!"
    exit 1
fi

# Create minimal production package.json
echo "   → Creating production package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "whizz-ai-agent",
  "version": "1.0.0",
  "description": "whizzAI Agent Suggestion Lambda",
  "main": "handlers/agent-suggestion-handler.js",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0"
  }
}
EOF

# Install production dependencies ONLY
echo "   → Installing production dependencies..."
cd dist
npm install --production --omit=dev --no-package-lock 2>&1 | grep -v "npm WARN" || true
cd ..

# Verify critical files exist
echo "   → Verifying structure..."
if [ ! -f "dist/handlers/agent-suggestion-handler.js" ]; then
    echo "❌ Error: Handler file missing!"
    exit 1
fi

if [ ! -f "dist/services/bedrock-agent-service.js" ]; then
    echo "❌ Error: Service file missing!"
    exit 1
fi

if [ ! -d "dist/node_modules/@aws-sdk/client-bedrock-runtime" ]; then
    echo "❌ Error: Bedrock SDK not installed!"
    exit 1
fi

echo "✅ Structure verified:"
echo "   ✓ handlers/agent-suggestion-handler.js"
echo "   ✓ services/bedrock-agent-service.js"
echo "   ✓ node_modules/@aws-sdk/client-bedrock-runtime/"

# Create ZIP from INSIDE dist directory (critical!)
echo "   → Creating deployment ZIP..."
cd dist
zip -q -r ../lambda-deployment.zip . \
    -x "*.git*" \
    -x "*.DS_Store" \
    -x "package.json" \
    -x "package-lock.json" \
    -x "*/tests/*" \
    -x "*/test/*" \
    -x "*/*.test.js" \
    -x "*/*.md"
cd ..

# Check ZIP size
PACKAGE_SIZE=$(du -h lambda-deployment.zip | cut -f1)
echo "✅ Lambda package created (size: $PACKAGE_SIZE)"

# Verify ZIP structure
echo ""
echo "3️⃣ Verifying ZIP structure..."
unzip -l lambda-deployment.zip | head -15
echo "   ..."
echo ""

# Create S3 bucket if needed
echo "4️⃣ Uploading to S3..."
if ! aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "   Creating bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION
fi

aws s3 cp lambda-deployment.zip "s3://$BUCKET_NAME/lambda-deployment.zip"
echo "✅ Uploaded to s3://$BUCKET_NAME/lambda-deployment.zip"
echo ""

# Check if Lambda function exists
echo "5️⃣ Deploying to Lambda..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "   Updating existing function..."
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --s3-bucket $BUCKET_NAME \
        --s3-key lambda-deployment.zip \
        --region $REGION \
        --output json > /tmp/lambda-update.json
    
    echo "✅ Lambda function updated"
    
    # Wait for update to complete
    echo "   Waiting for update to complete..."
    aws lambda wait function-updated \
        --function-name $FUNCTION_NAME \
        --region $REGION 2>/dev/null || true
    
    echo "✅ Update complete"
    
else
    echo "   Creating new Lambda function..."
    
    # Get or create execution role
    ROLE_NAME="whizz-ai-agent-role"
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        echo "   Creating IAM role..."
        
        # Create trust policy
        cat > /tmp/trust-policy.json << 'EOF'
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
            --role-name $ROLE_NAME \
            --assume-role-policy-document file:///tmp/trust-policy.json \
            --output json > /tmp/role-create.json
        
        ROLE_ARN=$(cat /tmp/role-create.json | grep -o '"Arn": "[^"]*"' | cut -d'"' -f4)
        
        # Attach basic execution policy
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create and attach Bedrock policy
        cat > /tmp/bedrock-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
EOF
        
        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name BedrockAccess \
            --policy-document file:///tmp/bedrock-policy.json
        
        echo "✅ IAM role created: $ROLE_ARN"
        echo "   Waiting 10 seconds for IAM propagation..."
        sleep 10
    fi
    
    # Create Lambda function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler handlers/agent-suggestion-handler.handler \
        --timeout 30 \
        --memory-size 512 \
        --code S3Bucket=$BUCKET_NAME,S3Key=lambda-deployment.zip \
        --region $REGION \
        --output json > /tmp/lambda-create.json
    
    echo "✅ Lambda function created"
fi

# Get function details
echo ""
echo "6️⃣ Function details:"
aws lambda get-function-configuration \
    --function-name $FUNCTION_NAME \
    --region $REGION \
    --query '{Name:FunctionName,Runtime:Runtime,Handler:Handler,Memory:MemorySize,Timeout:Timeout,LastModified:LastModified}' \
    --output table

# Clean up
echo ""
echo "7️⃣ Cleaning up..."
rm -rf dist/
echo "✅ Cleaned temporary files"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ DEPLOYMENT SUCCESSFUL                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Handler: handlers/agent-suggestion-handler.handler"
echo "Package Size: $PACKAGE_SIZE"
echo ""
echo "📝 Next steps:"
echo "   1. Test the function:"
echo "      aws lambda invoke --function-name $FUNCTION_NAME \\"
echo "        --payload '{\"userType\":\"customer\",\"message\":\"test\"}' \\"
echo "        response.json"
echo ""
echo "   2. Check logs:"
echo "      aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
