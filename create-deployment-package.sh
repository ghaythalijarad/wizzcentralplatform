#!/bin/bash

# WizzCentral Platform - Create Deployment Package
# This script creates a deployment package for AWS Amplify manual upload

echo "🚀 Creating WizzCentral Platform Deployment Package..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found"
    echo "Please ensure the frontend files have been copied to dist/"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../wizzcentral-platform-deployment.zip . -x "*.DS_Store" "*.log" "**/node_modules/**"

cd ..

# Verify package was created
if [ -f "wizzcentral-platform-deployment.zip" ]; then
    echo "✅ Deployment package created successfully!"
    echo "📁 Package location: $(pwd)/wizzcentral-platform-deployment.zip"
    echo "📊 Package size: $(du -h wizzcentral-platform-deployment.zip | cut -f1)"
    echo ""
    echo "🌐 Next Steps:"
    echo "1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/"
    echo "2. Click 'Create new app'"
    echo "3. Choose 'Deploy without Git provider'"
    echo "4. Upload the created zip file"
    echo "5. Deploy your application!"
    echo ""
    echo "📋 Manual Deployment Instructions:"
    echo "   - App name: WizzCentral-Platform"
    echo "   - Environment: production"
    echo "   - Package: wizzcentral-platform-deployment.zip"
else
    echo "❌ Error: Failed to create deployment package"
    exit 1
fi
