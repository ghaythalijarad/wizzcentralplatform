#!/bin/bash

# Simple Amplify Deployment without complex commands
echo "🚀 WizzCentral Platform - Simple Amplify Deployment"

# Set AWS pager to none
export AWS_PAGER=""

# Get or create the app
echo "📋 Setting up Amplify app..."

# Try to create app (will fail if exists, that's OK)
aws amplify create-app \
  --name "WizzCentral-Platform" \
  --description "WizzCentral Business Management Platform" \
  --platform WEB \
  --no-cli-pager \
  > /dev/null 2>&1

# Create zip package for manual upload
echo "📦 Creating deployment package..."
cd dist && zip -r ../wizzcentral-platform.zip . && cd ..

echo "✅ Deployment package created: wizzcentral-platform.zip"
echo ""
echo "🎯 Next Steps:"
echo "1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo "2. Find or create 'WizzCentral-Platform' app"
echo "3. Upload the zip file: wizzcentral-platform.zip"
echo "4. Your platform will be deployed automatically"
echo ""

# Try to get app info
echo "📋 Checking for existing apps..."
aws amplify list-apps --no-cli-pager --output table 2>/dev/null || echo "Use AWS Console to check apps"
