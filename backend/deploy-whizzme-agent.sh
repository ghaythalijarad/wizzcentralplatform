#!/bin/bash

################################################################################
# WhizzMe AI Agent Deployment Script
# Deploys AWS Bedrock-powered AI agent for WhizzMerchants support
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE="${1:-dev}"
REGION="${2:-us-east-1}"
PROFILE="${3:-wizz-drivers-ghayth-dev}"
STACK_NAME="whizzme-agent-${STAGE}"
TEMPLATE_FILE="template-whizzme-simple.yaml"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         WhizzMe AI Agent Deployment Script                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Stage:${NC} $STAGE"
echo -e "${GREEN}Region:${NC} $REGION"
echo -e "${GREEN}Stack:${NC} $STACK_NAME"
echo ""

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check SAM CLI
if ! command -v sam &> /dev/null; then
    echo -e "${RED}❌ SAM CLI not found. Please install it first.${NC}"
    echo ""
    echo "Install SAM CLI:"
    echo "  brew install aws-sam-cli"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Validate AWS credentials
echo -e "${YELLOW}[2/6] Validating AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile "$PROFILE" &> /dev/null; then
    echo -e "${RED}❌ AWS credentials expired or invalid${NC}"
    echo ""
    echo "Please login with SSO:"
    echo -e "  ${GREEN}aws sso login --profile $PROFILE${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
echo -e "${GREEN}✅ AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}[3/6] Installing dependencies...${NC}"

# Create a clean lambda directory
LAMBDA_DIR="lambda-package"
rm -rf "$LAMBDA_DIR"
mkdir -p "$LAMBDA_DIR"

# Copy only necessary files
echo "Copying Lambda handler and services..."
cp -r src "$LAMBDA_DIR/"

# Copy minimal package.json
cp lambda-package.json "$LAMBDA_DIR/package.json"

# Install only production dependencies in lambda directory
cd "$LAMBDA_DIR"
npm install --production --no-optional
cd ..

echo -e "${GREEN}✅ Lambda package prepared ($(du -sh $LAMBDA_DIR | cut -f1))${NC}"
echo ""

# Build SAM application
echo -e "${YELLOW}[4/6] Building SAM application...${NC}"
sam build \
    --template-file "$TEMPLATE_FILE" \
    --profile "$PROFILE" \
    --region "$REGION"

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Deploy CloudFormation stack
echo -e "${YELLOW}[5/6] Deploying CloudFormation stack...${NC}"
sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        Stage="$STAGE" \
    --no-fail-on-empty-changeset \
    --resolve-s3 \
    --profile "$PROFILE" \
    --region "$REGION"

echo -e "${GREEN}✅ Stack deployed successfully${NC}"
echo ""

# Get stack outputs
echo -e "${YELLOW}[6/6] Retrieving API endpoint...${NC}"
CHAT_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ChatEndpoint`].OutputValue' \
    --output text)

API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text)

if [ -n "$CHAT_ENDPOINT" ]; then
    echo -e "${GREEN}✅ Chat Endpoint: $CHAT_ENDPOINT${NC}"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}API Endpoints:${NC}"
    echo -e "  Base URL: ${GREEN}${API_ENDPOINT}${NC}"
    echo -e "  Chat: ${GREEN}${CHAT_ENDPOINT}${NC}"
    echo -e "  Health: ${GREEN}${API_ENDPOINT}/whizzme/health${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Update Flutter app with this endpoint:"
    echo -e "   ${GREEN}whizzme_service.dart${NC} -> AI_ENDPOINT_PROD = '$CHAT_ENDPOINT'"
    echo ""
    echo "2. Test the endpoint:"
    echo -e "   ${GREEN}curl -X POST $CHAT_ENDPOINT \\${NC}"
    echo -e "   ${GREEN}     -H 'Content-Type: application/json' \\${NC}"
    echo -e "   ${GREEN}     -d '{\"message\":\"How do I process refunds?\",\"userType\":\"merchant\",\"category\":\"orders\"}'${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Could not retrieve API endpoint. Check AWS Console.${NC}"
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
