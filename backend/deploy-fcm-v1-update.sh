#!/bin/zsh

echo "🚀 Deploy FCM V1 Push Notification Lambda"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FUNCTION_NAME="whizz-central-send-promotion-notification"
REGION="us-east-1"
SERVICE_ACCOUNT_FILE="lambda/firebase-service-account.json"

# Check if service account file exists
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "${RED}❌ Firebase service account file not found!${NC}"
    echo ""
    echo "Please download it first:"
    echo "1. Go to: https://console.firebase.google.com/"
    echo "2. Select 'wizz business' project"
    echo "3. Go to: Settings ⚙️ → Project settings → Service accounts"
    echo "4. Click 'Generate new private key'"
    echo "5. Save the file as: $SERVICE_ACCOUNT_FILE"
    echo ""
    exit 1
fi

echo "${GREEN}✅ Found Firebase service account file${NC}"
echo ""

# Extract credentials from JSON
echo "${BLUE}📝 Extracting Firebase credentials...${NC}"

# Use Python or Node.js to parse JSON (whichever is available)
if command -v python3 &> /dev/null; then
    CLIENT_EMAIL=$(python3 -c "import json; print(json.load(open('$SERVICE_ACCOUNT_FILE'))['client_email'])")
    PRIVATE_KEY=$(python3 -c "import json; print(json.load(open('$SERVICE_ACCOUNT_FILE'))['private_key'])")
    PROJECT_ID=$(python3 -c "import json; print(json.load(open('$SERVICE_ACCOUNT_FILE'))['project_id'])")
elif command -v node &> /dev/null; then
    CLIENT_EMAIL=$(node -e "console.log(require('./$SERVICE_ACCOUNT_FILE').client_email)")
    PRIVATE_KEY=$(node -e "console.log(require('./$SERVICE_ACCOUNT_FILE').private_key)")
    PROJECT_ID=$(node -e "console.log(require('./$SERVICE_ACCOUNT_FILE').project_id)")
else
    echo "${RED}❌ Neither Python nor Node.js found. Please install one of them.${NC}"
    exit 1
fi

echo "${GREEN}✅ Extracted credentials${NC}"
echo "  • Project ID: $PROJECT_ID"
echo "  • Client Email: $CLIENT_EMAIL"
echo ""

# Create deployment package
echo "${BLUE}📦 Creating deployment package...${NC}"
cd lambda
rm -f ../promotion-push-notification-v1.zip
zip -r ../promotion-push-notification-v1.zip send-promotion-push-notification-v1.js > /dev/null
cd ..

echo "${GREEN}✅ Deployment package created${NC}"
echo ""

# Update Lambda function code
echo "${BLUE}🔄 Updating Lambda function code...${NC}"

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://promotion-push-notification-v1.zip \
    --region $REGION \
    --no-cli-pager > /dev/null

echo "${GREEN}✅ Lambda code updated${NC}"
echo ""

# Update handler to use the new file
echo "${BLUE}🔄 Updating Lambda handler...${NC}"

aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --handler send-promotion-push-notification-v1.handler \
    --region $REGION \
    --no-cli-pager > /dev/null

echo "${GREEN}✅ Lambda handler updated${NC}"
echo ""

# Update environment variables with Firebase credentials
echo "${BLUE}🔐 Updating environment variables...${NC}"

aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={DEVICE_TOKENS_TABLE=WhizzMerchants_DeviceTokens,FIREBASE_PROJECT_ID=$PROJECT_ID,FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL,FIREBASE_PRIVATE_KEY=$PRIVATE_KEY}" \
    --region $REGION \
    --no-cli-pager > /dev/null

echo "${GREEN}✅ Environment variables updated${NC}"
echo ""

# Wait for update to complete
echo "${YELLOW}⏳ Waiting for Lambda to be ready...${NC}"
sleep 5

# Cleanup
rm -f promotion-push-notification-v1.zip

echo ""
echo "${GREEN}=====================================${NC}"
echo "${GREEN}✅ FCM V1 Deployment Complete!${NC}"
echo "${GREEN}=====================================${NC}"
echo ""
echo "📋 Summary:"
echo "  • Lambda Function: $FUNCTION_NAME"
echo "  • API Version: FCM V1 (Modern)"
echo "  • Firebase Project: $PROJECT_ID"
echo "  • Authentication: Service Account"
echo ""
echo "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Test the function:"
echo "   ./quick-test-push.sh"
echo ""
echo "2. Check CloudWatch logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo ""
echo "3. Test from WhizzCentralPlatform UI:"
echo "   open http://localhost:8080/frontend/pages/promotions.html"
echo ""
echo "${GREEN}🎉 Ready to send push notifications!${NC}"
