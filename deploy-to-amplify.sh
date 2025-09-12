#!/bin/bash

# WizzCentral Platform - Amplify Deployment Script
echo "🚀 Deploying WizzCentral Platform to AWS Amplify..."

# Step 1: Create Amplify App (if it doesn't exist)
echo "📋 Creating Amplify App..."
APP_OUTPUT=$(aws amplify create-app \
  --name "WizzCentral-Platform" \
  --description "WizzCentral Business Management Platform with Live Chat Support" \
  --platform WEB \
  --build-spec file://amplify.yml \
  --enable-branch-auto-build \
  2>/dev/null || echo "App may already exist")

# Extract App ID
APP_ID=$(aws amplify list-apps --query 'apps[?name==`WizzCentral-Platform`].appId' --output text)

if [ -z "$APP_ID" ]; then
    echo "❌ Failed to create or find Amplify app"
    exit 1
fi

echo "✅ Amplify App ID: $APP_ID"

# Step 2: Create main branch
echo "📋 Creating main branch..."
aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name main \
  --framework "React" \
  --enable-auto-build \
  2>/dev/null || echo "Branch may already exist"

# Step 3: Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy.zip
cd dist && zip -r ../deploy.zip . && cd ..

# Step 4: Deploy to Amplify
echo "🚀 Starting deployment..."
DEPLOYMENT_ID=$(aws amplify start-deployment \
  --app-id $APP_ID \
  --branch-name main \
  --source-url "file://deploy.zip" \
  --query 'deploymentId' \
  --output text)

echo "✅ Deployment started with ID: $DEPLOYMENT_ID"

# Step 5: Wait for deployment and get URL
echo "⏳ Waiting for deployment to complete..."
aws amplify wait deployment-deployed --app-id $APP_ID --deployment-id $DEPLOYMENT_ID

# Get the app URL
APP_URL=$(aws amplify get-app --app-id $APP_ID --query 'app.defaultDomain' --output text)
FULL_URL="https://$APP_URL"

echo ""
echo "🎉 Deployment Complete!"
echo "📱 Your WizzCentral Platform is now live at:"
echo "🌐 $FULL_URL"
echo ""
echo "🔧 App ID: $APP_ID"
echo "📋 Branch: main"
echo "🆔 Deployment ID: $DEPLOYMENT_ID"
echo ""

# Optional: Open in browser (macOS)
read -p "🌐 Open in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "$FULL_URL"
fi
