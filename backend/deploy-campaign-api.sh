#!/bin/bash

# WizzCentral Campaign API Deployment Script
# Author: WizzCentral Dev Team

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE=${1:-dev}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-default}

echo -e "${BLUE}🚀 WizzCentral Campaign API Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Stage: ${YELLOW}$STAGE${NC}"
echo -e "Region: ${YELLOW}$REGION${NC}"
echo -e "AWS Profile: ${YELLOW}$AWS_PROFILE${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+: https://nodejs.org/"
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo -e "${RED}❌ Serverless Framework is not installed${NC}"
    echo "Install with: npm install -g serverless"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured for profile: $AWS_PROFILE${NC}"
    echo "Run: aws configure --profile $AWS_PROFILE"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Create campaign tables
echo -e "${BLUE}📊 Step 1: Creating campaign tables...${NC}"
if [ -f "create-campaign-tables.js" ]; then
    node create-campaign-tables.js --sample-data
    echo -e "${GREEN}✅ Campaign tables created${NC}"
else
    echo -e "${YELLOW}⚠️  Campaign table script not found, skipping...${NC}"
fi
echo ""

# Step 2: Validate Lambda functions
echo -e "${BLUE}🔍 Step 2: Validating Lambda functions...${NC}"
LAMBDA_DIR="lambda"
if [ ! -d "$LAMBDA_DIR" ]; then
    echo -e "${RED}❌ Lambda directory not found${NC}"
    exit 1
fi

# Check required Lambda functions
REQUIRED_LAMBDAS=(
    "campaign-api.js"
    "condition-engine-api.js"
    "analytics-api.js"
    "campaign-public-api.js"
)

for lambda in "${REQUIRED_LAMBDAS[@]}"; do
    if [ -f "$LAMBDA_DIR/$lambda" ]; then
        echo -e "${GREEN}✅ Found: $lambda${NC}"
        # Basic syntax check
        node -c "$LAMBDA_DIR/$lambda"
        echo -e "${GREEN}✅ Syntax valid: $lambda${NC}"
    else
        echo -e "${RED}❌ Missing: $lambda${NC}"
        exit 1
    fi
done
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}📦 Step 3: Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  No package.json found, skipping...${NC}"
fi
echo ""

# Step 4: Deploy with Serverless
echo -e "${BLUE}🚀 Step 4: Deploying Campaign APIs...${NC}"
if [ -f "serverless.campaigns.yml" ]; then
    echo -e "${YELLOW}Deploying to stage: $STAGE${NC}"
    
    # Deploy using the campaign-specific serverless config
    serverless deploy --config serverless.campaigns.yml --stage $STAGE --region $REGION --aws-profile $AWS_PROFILE
    
    echo -e "${GREEN}✅ Campaign APIs deployed successfully${NC}"
    
    # Get deployment info
    echo -e "${BLUE}📋 Getting deployment information...${NC}"
    serverless info --config serverless.campaigns.yml --stage $STAGE --region $REGION --aws-profile $AWS_PROFILE
    
else
    echo -e "${RED}❌ serverless.campaigns.yml not found${NC}"
    exit 1
fi
echo ""

# Step 5: Test deployment
echo -e "${BLUE}🧪 Step 5: Testing deployment...${NC}"
echo "Basic connectivity tests will be performed..."

# Get the API Gateway URL from serverless info
API_URL=$(serverless info --config serverless.campaigns.yml --stage $STAGE --region $REGION --aws-profile $AWS_PROFILE | grep -o 'https://[a-z0-9]*.execute-api.*amazonaws.com' | head -1)

if [ ! -z "$API_URL" ]; then
    echo -e "${GREEN}API Gateway URL: $API_URL${NC}"
    
    # Test health endpoint
    echo "Testing health endpoint..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/$STAGE/campaigns/health" || echo "000")
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check returned status: $HTTP_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine API URL${NC}"
fi
echo ""

# Step 6: Generate configuration file
echo -e "${BLUE}📝 Step 6: Generating configuration file...${NC}"
cat > campaign-api-config.json << EOF
{
  "stage": "$STAGE",
  "region": "$REGION",
  "apiUrl": "$API_URL",
  "deploymentTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "endpoints": {
    "campaigns": "$API_URL/$STAGE/campaigns",
    "conditions": "$API_URL/$STAGE/conditions",
    "analytics": "$API_URL/$STAGE/analytics",
    "public": "$API_URL/$STAGE/public"
  }
}
EOF

echo -e "${GREEN}✅ Configuration saved to campaign-api-config.json${NC}"
echo ""

# Summary
echo -e "${BLUE}🎉 Deployment Summary${NC}"
echo -e "${BLUE}====================${NC}"
echo -e "Stage: ${GREEN}$STAGE${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "API URL: ${GREEN}$API_URL${NC}"
echo ""
echo -e "${BLUE}Available Endpoints:${NC}"
echo -e "• Campaign Management: ${GREEN}$API_URL/$STAGE/campaigns${NC}"
echo -e "• Condition Engine: ${GREEN}$API_URL/$STAGE/conditions${NC}"
echo -e "• Analytics: ${GREEN}$API_URL/$STAGE/analytics${NC}"
echo -e "• Public API: ${GREEN}$API_URL/$STAGE/public${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update frontend configuration with the API URL"
echo "2. Test all endpoints with authentication"
echo "3. Set up monitoring and alerts"
echo "4. Configure custom domain (optional)"
echo ""
echo -e "${GREEN}✅ Campaign API deployment completed successfully!${NC}"
