#!/bin/bash
# Deploy Push Notification Lambda Functions to AWS
# Usage: ./deploy-push-notifications.sh [environment]
# Example: ./deploy-push-notifications.sh dev

set -e

ENVIRONMENT="${1:-dev}"
STACK_NAME="WizzCentral-PushNotifications-${ENVIRONMENT}"
REGION="us-east-1"
PROFILE="wizz-drivers-ghayth-dev"

echo "🚀 Deploying Push Notification Lambda Functions"
echo "   Environment: ${ENVIRONMENT}"
echo "   Stack Name: ${STACK_NAME}"
echo "   Region: ${REGION}"
echo ""

# Check if Firebase secret exists
echo "🔐 Checking for Firebase credentials in Secrets Manager..."
if ! aws secretsmanager describe-secret --secret-id firebase-service-account --region ${REGION} --profile ${PROFILE} &>/dev/null; then
    echo ""
    echo "⚠️  Firebase credentials not found in Secrets Manager!"
    echo "   Creating secret from config file..."
    
    if [ ! -f "config/wizz-business-app-firebase-adminsdk.json" ]; then
        echo "❌ Error: config/wizz-business-app-firebase-adminsdk.json not found!"
        echo "   Please ensure the Firebase service account file exists."
        exit 1
    fi
    
    aws secretsmanager create-secret \
        --name firebase-service-account \
        --description "Firebase Admin SDK service account for push notifications" \
        --secret-string file://config/wizz-business-app-firebase-adminsdk.json \
        --region ${REGION} \
        --profile ${PROFILE}
    
    echo "✅ Firebase credentials stored in Secrets Manager"
else
    echo "✅ Firebase credentials found in Secrets Manager"
fi

echo ""
echo "📦 Installing Lambda dependencies..."
cd backend/lambda
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   Dependencies already installed"
fi
cd ../..

echo ""
echo "🏗️  Building SAM application..."
sam build --template push-notification-template.yaml --profile ${PROFILE}

echo ""
echo "🚀 Deploying to AWS..."
sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name ${STACK_NAME} \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${REGION} \
    --profile ${PROFILE} \
    --parameter-overrides Environment=${ENVIRONMENT} \
    --resolve-s3 \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

echo ""
echo "📊 Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} \
    --profile ${PROFILE} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Deployment Information:"
echo "   API Gateway URL: ${API_URL}"
echo "   Region: ${REGION}"
echo "   Stack Name: ${STACK_NAME}"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update frontend/pages/promotions.html with the API Gateway URL:"
echo "      const API_BASE_URL = '${API_URL}';"
echo ""
echo "   2. Test the endpoints:"
echo "      curl -X POST ${API_URL}/api/merchants/send-info-notification \\"
echo "           -H 'Content-Type: application/json' \\"
echo "           -H 'Authorization: Bearer YOUR-JWT-TOKEN' \\"
echo "           -d '{...}'"
echo ""
echo "   3. Push changes to Git:"
echo "      git add frontend/pages/promotions.html"
echo "      git commit -m 'Update API endpoint for production'"
echo "      git push origin main && git push amplify main"
echo ""

# Save API URL to a file for easy reference
echo "${API_URL}" > .api-gateway-url.txt
echo "💾 API Gateway URL saved to .api-gateway-url.txt"
