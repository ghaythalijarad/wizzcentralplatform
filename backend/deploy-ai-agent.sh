#!/bin/bash

# ============================================================================
# WhizzMe Agent - Unified Deployment Script (SAM-based)
# ============================================================================
# This is the SINGLE SOURCE OF TRUTH for deploying the WhizzMe backend
# 
# Features:
#   - Clean ZIP packaging with correct handler paths
#   - AWS Bedrock Runtime (not Agents) permissions
#   - No Cognito auth (open API for MVP)
#   - Proper CORS configuration
#   - CloudFormation stack management
#
# Usage:
#   ./deploy-ai-agent.sh [dev|staging|prod]
#
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE="${1:-dev}"
STACK_NAME="whizzme-agent-${STAGE}"
REGION="us-east-1"
TEMPLATE_FILE="template-ai-agent.yaml"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         whizzAI Agent - Unified Deployment                 ║${NC}"
echo -e "${BLUE}║         Single Source of Truth (SAM-based)                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Stage:${NC} $STAGE"
echo -e "${GREEN}Region:${NC} $REGION"
echo -e "${GREEN}Stack:${NC} $STACK_NAME"
echo ""

# ============================================================================
# Step 1: Validate AWS Credentials
# ============================================================================
echo -e "${YELLOW}[1/7]${NC} Validating AWS credentials..."

if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials expired or invalid${NC}"
    echo ""
    echo "Please login with SSO:"
    echo "  aws sso login"
    echo ""
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
echo -e "${GREEN}✅ Authenticated${NC}"
echo "   Account: $ACCOUNT_ID"
echo "   User: $USER_ARN"
echo ""

# ============================================================================
# Step 2: Clean Previous Builds
# ============================================================================
echo -e "${YELLOW}[2/7]${NC} Cleaning previous builds..."

cd "$(dirname "$0")"
rm -f lambda-deployment.zip
rm -rf .aws-sam
rm -rf lambda-package

echo -e "${GREEN}✅ Clean${NC}"
echo ""

# ============================================================================
# Step 3: Create Lambda Package with Correct Structure
# ============================================================================
echo -e "${YELLOW}[3/7]${NC} Creating Lambda deployment package..."

# Create temporary package directory
mkdir -p lambda-package

# Copy source files (KEEP src/ directory structure)
echo "   → Copying Lambda code with src/ structure..."
mkdir -p lambda-package/src
cp -r src/handlers lambda-package/src/
cp -r src/services lambda-package/src/

# Create minimal package.json for Lambda
echo "   → Installing runtime dependencies..."
cd lambda-package
cat > package.json << 'EOF'
{
  "name": "whizz-ai-agent-lambda",
  "version": "1.0.0",
  "description": "whizzAI Agent Lambda Runtime",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0"
  }
}
EOF

# Install only production dependencies
npm install --production --no-optional --quiet

# Remove package files (not needed in Lambda)
rm -f package.json package-lock.json

# Create ZIP with correct structure (src/ at root, plus node_modules/)
echo "   → Creating deployment ZIP..."
zip -q -r ../lambda-deployment.zip . -x "*.git*" "*.DS_Store"
cd ..

# Verify ZIP contents - check for src/handlers structure
echo "   → Verifying package structure..."
echo "   Checking for src/handlers/agent-suggestion-handler.js:"
unzip -l lambda-deployment.zip | grep "src/handlers/agent-suggestion-handler.js" || echo "   ⚠️  WARNING: Handler file not found at expected path"
echo ""
echo "   First 30 entries in ZIP:"
unzip -l lambda-deployment.zip | head -35

PACKAGE_SIZE=$(du -h lambda-deployment.zip | cut -f1)
echo -e "${GREEN}✅ Package created${NC} (Size: $PACKAGE_SIZE)"
echo ""

# Cleanup
rm -rf lambda-package

# ============================================================================
# Step 4: Create/Verify S3 Bucket
# ============================================================================
echo -e "${YELLOW}[4/7]${NC} Preparing S3 deployment bucket..."

BUCKET_NAME="whizz-ai-deployments-${ACCOUNT_ID}"

if ! aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "   → Creating bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION
    
    # Enable versioning for rollback capability
    aws s3api put-bucket-versioning \
        --bucket $BUCKET_NAME \
        --versioning-configuration Status=Enabled
else
    echo "   → Using existing bucket: $BUCKET_NAME"
fi

# Upload Lambda package
echo "   → Uploading Lambda package..."
aws s3 cp lambda-deployment.zip "s3://$BUCKET_NAME/lambda-deployment-${STAGE}.zip" --quiet

echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# ============================================================================
# Step 5: Validate CloudFormation Template
# ============================================================================
echo -e "${YELLOW}[5/7]${NC} Validating CloudFormation template..."

if ! aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION > /dev/null; then
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Template valid${NC}"
echo ""

# ============================================================================
# Step 6: Deploy CloudFormation Stack
# ============================================================================
echo -e "${YELLOW}[6/7]${NC} Deploying CloudFormation stack..."

# Check if stack exists
if aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION > /dev/null 2>&1; then
    
    echo "   → Updating existing stack..."
    OPERATION="update"
    
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters \
            ParameterKey=Stage,ParameterValue=$STAGE \
            ParameterKey=S3Bucket,ParameterValue=$BUCKET_NAME \
            ParameterKey=S3Key,ParameterValue="lambda-deployment-${STAGE}.zip" \
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
        --region $REGION
    
    echo "   → Waiting for stack update..."
    aws cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME \
        --region $REGION
else
    echo "   → Creating new stack..."
    OPERATION="create"
    
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters \
            ParameterKey=Stage,ParameterValue=$STAGE \
            ParameterKey=S3Bucket,ParameterValue=$BUCKET_NAME \
            ParameterKey=S3Key,ParameterValue="lambda-deployment-${STAGE}.zip" \
        --capabilities CAPABILITY_IAM \
        --region $REGION
    
    echo "   → Waiting for stack creation..."
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $REGION
fi

echo -e "${GREEN}✅ Stack ${OPERATION}d successfully${NC}"
echo ""

# ============================================================================
# Step 7: Get Stack Outputs
# ============================================================================
echo -e "${YELLOW}[7/7]${NC} Retrieving deployment information..."

STACK_INFO=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0]')

API_URL=$(echo $STACK_INFO | jq -r '.Outputs[] | select(.OutputKey=="ApiUrl") | .OutputValue')
FUNCTION_NAME=$(echo $STACK_INFO | jq -r '.Outputs[] | select(.OutputKey=="FunctionName") | .OutputValue')

echo -e "${GREEN}✅ Deployment complete${NC}"
echo ""

# ============================================================================
# Deployment Summary
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Deployment Summary                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Stack Name:${NC}      $STACK_NAME"
echo -e "${GREEN}API Endpoint:${NC}    $API_URL/agent-suggestion"
echo -e "${GREEN}Lambda Function:${NC} $FUNCTION_NAME"
echo -e "${GREEN}Region:${NC}          $REGION"
echo -e "${GREEN}Stage:${NC}           $STAGE"
echo ""

# ============================================================================
# Test Commands
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Commands                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Test the API:${NC}"
echo "curl -X POST ${API_URL}/agent-suggestion \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"userType\": \"customer\","
echo "    \"message\": \"My delivery is late\","
echo "    \"conversationHistory\": []"
echo "  }'"
echo ""
echo -e "${YELLOW}View Lambda logs:${NC}"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
echo -e "${YELLOW}Update frontend endpoint:${NC}"
echo "Update frontend/pages/support.html line ~2308:"
echo "const AI_API_ENDPOINT = '${API_URL}/agent-suggestion';"
echo ""

# ============================================================================
# Next Steps
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Next Steps                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Test the API endpoint above"
echo "2. Update frontend with new endpoint URL"
echo "3. Deploy frontend to see AI suggestions in action"
echo "4. Monitor CloudWatch logs for any issues"
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
