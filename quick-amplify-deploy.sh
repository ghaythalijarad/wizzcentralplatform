#!/bin/bash

# 🚀 Quick AWS Amplify Setup for whizzCentralPlatform
# This script helps you deploy via AWS Console

echo "🚀 AWS Amplify Deployment Helper"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Deployment Information:${NC}"
echo "   App Name: whizzCentralPlatform"
echo "   Repository: https://github.com/whizzgo/whizzCentralPlatform"
echo "   Branch: main"
echo "   Region: us-east-1"
echo ""

echo -e "${GREEN}✅ Your code is already pushed to GitHub!${NC}"
echo ""

echo -e "${YELLOW}🌐 Choose your deployment method:${NC}"
echo ""
echo "1. AWS Console (Recommended - Easy & Visual)"
echo "2. AWS CLI (Advanced - Automated)"
echo ""
read -p "Select method (1 or 2): " METHOD

if [ "$METHOD" = "1" ]; then
    echo ""
    echo -e "${BLUE}📝 AWS Console Deployment Steps:${NC}"
    echo ""
    echo "Step 1: Open AWS Amplify Console"
    echo "   → https://console.aws.amazon.com/amplify/home?region=us-east-1"
    echo ""
    echo "Step 2: Click 'New app' → 'Host web app'"
    echo ""
    echo "Step 3: Select 'GitHub' and authorize if needed"
    echo ""
    echo "Step 4: Select repository:"
    echo "   → Organization: whizzgo"
    echo "   → Repository: whizzCentralPlatform"
    echo "   → Branch: main"
    echo ""
    echo "Step 5: Build settings are already configured in amplify.yml"
    echo "   → Just click 'Next'"
    echo ""
    echo "Step 6: Review and click 'Save and deploy'"
    echo ""
    echo "⏱️  Build will take ~3-5 minutes"
    echo ""
    echo -e "${GREEN}🎉 That's it! Your app will be live soon.${NC}"
    echo ""
    
    read -p "Press Enter to open AWS Amplify Console in browser... "
    open "https://console.aws.amazon.com/amplify/home?region=us-east-1"
    
elif [ "$METHOD" = "2" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  You need a GitHub Personal Access Token${NC}"
    echo ""
    echo "Create one at: https://github.com/settings/tokens"
    echo "Required permissions: repo, admin:repo_hook"
    echo ""
    read -p "Press Enter to open GitHub tokens page... "
    open "https://github.com/settings/tokens"
    echo ""
    read -p "Enter your GitHub token: " GITHUB_TOKEN
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ Token required for CLI deployment"
        exit 1
    fi
    
    echo ""
    echo "🚀 Creating Amplify app..."
    
    # Create app
    APP_OUTPUT=$(aws amplify create-app \
        --name "whizzCentralPlatform" \
        --repository "https://github.com/whizzgo/whizzCentralPlatform" \
        --access-token "$GITHUB_TOKEN" \
        --platform WEB \
        --region us-east-1 \
        --enable-branch-auto-build \
        --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        APP_ID=$(echo $APP_OUTPUT | jq -r '.app.appId')
        echo -e "${GREEN}✅ App created: $APP_ID${NC}"
        
        # Create branch
        echo "📝 Creating main branch..."
        aws amplify create-branch \
            --app-id $APP_ID \
            --branch-name main \
            --enable-auto-build \
            --region us-east-1
        
        # Start deployment
        echo "🚀 Starting deployment..."
        aws amplify start-job \
            --app-id $APP_ID \
            --branch-name main \
            --job-type RELEASE \
            --region us-east-1
        
        APP_DOMAIN=$(aws amplify get-app --app-id $APP_ID --region us-east-1 --query 'app.defaultDomain' --output text)
        
        echo ""
        echo -e "${GREEN}🎉 Deployment started!${NC}"
        echo ""
        echo "📊 Your app will be available at:"
        echo "   https://main.$APP_DOMAIN"
        echo ""
        echo "Monitor progress:"
        echo "   https://console.aws.amazon.com/amplify/home?region=us-east-1#$APP_ID"
    else
        echo -e "${YELLOW}⚠️  Error creating app. Trying to use existing app...${NC}"
        echo "$APP_OUTPUT"
        
        # Try to find existing app
        APP_ID=$(aws amplify list-apps --region us-east-1 --query "apps[?name=='whizzCentralPlatform'].appId" --output text)
        
        if [ -n "$APP_ID" ]; then
            echo -e "${GREEN}✅ Found existing app: $APP_ID${NC}"
            echo "🚀 Starting new deployment..."
            
            aws amplify start-job \
                --app-id $APP_ID \
                --branch-name main \
                --job-type RELEASE \
                --region us-east-1
            
            APP_DOMAIN=$(aws amplify get-app --app-id $APP_ID --region us-east-1 --query 'app.defaultDomain' --output text)
            echo ""
            echo "📊 Deployment started!"
            echo "   https://main.$APP_DOMAIN"
        fi
    fi
else
    echo "Invalid selection"
    exit 1
fi

echo ""
echo "📖 For detailed instructions, see: AMPLIFY_DEPLOYMENT_GUIDE.md"
