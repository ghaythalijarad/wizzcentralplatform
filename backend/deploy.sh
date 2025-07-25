#!/bin/bash

# WizzCentral Backend Deployment Script
# This script deploys the backend to AWS using the provided credentials

set -e  # Exit on any error

echo "🚀 WizzCentral Backend Deployment"
echo "=================================="

# Load environment variables
if [ -f .env ]; then
    echo "🔧 Loading environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ No .env file found. Please ensure .env file exists with AWS credentials."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if serverless is available
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Configure AWS credentials for this session
echo "🔧 Configuring AWS credentials..."
export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_REGION

# Test AWS connection
echo "🔗 Testing AWS connection..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Failed to connect to AWS. Please check your credentials in .env file."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ Connected to AWS Account: $ACCOUNT_ID"

# Validate Cognito User Pool
echo "🔍 Validating Cognito User Pool..."
if aws cognito-idp describe-user-pool --user-pool-id $COGNITO_USER_POOL_ID &> /dev/null; then
    echo "✅ Cognito User Pool validated: $COGNITO_USER_POOL_ID"
else
    echo "❌ Failed to access Cognito User Pool: $COGNITO_USER_POOL_ID"
    echo "Please check your COGNITO_USER_POOL_ID in .env file."
    exit 1
fi

# Show deployment info
echo ""
echo "📋 Deployment Configuration:"
echo "  AWS Account: $ACCOUNT_ID"
echo "  Region: $AWS_REGION"
echo "  Stage: ${STAGE:-dev}"
echo "  Cognito User Pool: $COGNITO_USER_POOL_ID"
echo "  Cognito Client: $COGNITO_CLIENT_ID"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "❌ Deployment cancelled by user."
    exit 0
fi

# Deploy to AWS
echo "🚀 Deploying to AWS..."
echo "This may take several minutes..."

if serverless deploy --stage ${STAGE:-dev}; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    
    # Get the API Gateway URL
    echo "📊 Getting deployment information..."
    API_INFO=$(serverless info --stage ${STAGE:-dev})
    API_URL=$(echo "$API_INFO" | grep -o 'https://[^/]*\.execute-api\.[^/]*\.amazonaws\.com/[^/]*' | head -1)
    
    if [ ! -z "$API_URL" ]; then
        echo "🌐 API Base URL: $API_URL"
        echo ""
        echo "📋 Available Authentication Endpoints:"
        echo "  POST $API_URL/auth/login"
        echo "  POST $API_URL/auth/register"
        echo "  POST $API_URL/auth/refresh"
        echo "  POST $API_URL/auth/forgot-password"
        echo "  POST $API_URL/auth/reset-password"
        echo "  POST $API_URL/auth/change-password"
        echo ""
        echo "📋 Available API Endpoints:"
        echo "  GET  $API_URL/users/profile"
        echo "  GET  $API_URL/merchants"
        echo "  GET  $API_URL/drivers"
        echo "  GET  $API_URL/customers"
        echo "  GET  $API_URL/orders"
        echo "  GET  $API_URL/promotions"
        echo "  GET  $API_URL/support/tickets"
        echo "  GET  $API_URL/support/faqs"
        echo "  GET  $API_URL/support/knowledge-base"
        echo "  GET  $API_URL/analytics/dashboard"
        echo ""
        
        # Save API URL to a file for frontend integration
        echo "$API_URL" > api-url.txt
        echo "💾 API URL saved to api-url.txt for frontend integration"
    fi
    
    echo "💡 Next Steps:"
    echo "  1. Test authentication with demo credentials:"
    echo "     Email: demo@wizz.com"
    echo "     Password: demo123"
    echo "  2. Update your frontend to use the API URL above"
    echo "  3. Create admin users and test the platform"
    echo ""
    echo "🔧 Useful Commands:"
    echo "  serverless logs -f login --stage ${STAGE:-dev}  - View login function logs"
    echo "  serverless remove --stage ${STAGE:-dev}         - Remove all AWS resources"
    echo "  npm run dev                                      - Run locally for development"
    echo ""
    
    # Test a basic endpoint
    echo "🧪 Testing deployment with a basic health check..."
    if curl -s -f "$API_URL/auth/login" > /dev/null 2>&1; then
        echo "✅ API Gateway is responding"
    else
        echo "⚠️  API Gateway test failed, but deployment completed"
    fi
    
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    echo ""
    echo "🔧 Common issues:"
    echo "  - Check AWS credentials in .env file"
    echo "  - Ensure you have proper AWS permissions"
    echo "  - Verify Cognito User Pool exists"
    echo "  - Check for resource limits in your AWS account"
    exit 1
fi

echo "✅ WizzCentral Backend deployment complete!"
