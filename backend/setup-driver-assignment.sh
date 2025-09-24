#!/bin/bash
# Driver Assignment System Setup Script

echo "🎯 Setting up Driver Assignment System"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
TABLE_NAME="WizzOrders_dev"
LAMBDA_FUNCTION_PREFIX="wizzcentral-unified-chat-dev"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Region: $REGION"
echo "   Orders Table: $TABLE_NAME"
echo "   Lambda Function: ${LAMBDA_FUNCTION_PREFIX}-orderStreamProcessor"
echo ""

# Step 1: Check if we have AWS CLI access
echo -e "${BLUE}🔍 Step 1: Checking AWS CLI access...${NC}"
if command -v aws &> /dev/null; then
    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "${GREEN}✅ AWS CLI configured and accessible${NC}"
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo "   Account ID: $ACCOUNT_ID"
    else
        echo -e "${YELLOW}⚠️ AWS CLI not configured or no access${NC}"
        echo "Proceeding with deployment anyway..."
    fi
else
    echo -e "${YELLOW}⚠️ AWS CLI not installed${NC}"
    echo "Proceeding with deployment anyway..."
fi

# Step 2: Install dependencies
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Step 3: Deploy serverless function
echo -e "${BLUE}🚀 Step 3: Deploying serverless function...${NC}"
echo "Running: serverless deploy --stage dev"
serverless deploy --stage dev

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Serverless function deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy serverless function${NC}"
    echo "Please check the serverless logs above for details"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Driver Assignment System deployment complete!${NC}"
echo ""
echo -e "${BLUE}📊 Next Steps:${NC}"
echo "1. Enable DynamoDB streams on WizzOrders_dev table manually via AWS Console"
echo "2. Create event source mapping for the Lambda function"
echo "3. Test the system by updating order statuses"
echo ""
echo -e "${BLUE}🧪 Testing the System:${NC}"
echo "1. Update an order status to 'ready_for_pickup', 'confirmed', or 'preparing_complete'"
echo "2. Check CloudWatch logs for the orderStreamProcessor function"
echo "3. Verify drivers receive notifications via WebSocket"
echo ""
echo -e "${GREEN}✨ The order stream processor is now deployed and ready!${NC}"
