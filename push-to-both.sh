#!/bin/bash

# 🚀 Push to Both GitHub Repositories Script
# This script pushes to BOTH remotes for whizzCentralPlatform

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Pushing to BOTH GitHub Repositories${NC}"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}❌ Not in a git repository${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📌 Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes!${NC}"
    echo ""
    read -p "Do you want to commit them first? (y/n): " COMMIT_NOW
    
    if [ "$COMMIT_NOW" = "y" ] || [ "$COMMIT_NOW" = "Y" ]; then
        echo ""
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Pushing without committing changes${NC}"
    fi
    echo ""
fi

# Show what will be pushed
echo -e "${BLUE}📊 Last 3 commits:${NC}"
git log --oneline -3
echo ""

# Push to origin (whizzgo/whizzCentralPlatform)
echo -e "${BLUE}📤 Pushing to origin (whizzgo/whizzCentralPlatform)...${NC}"
if git push origin $CURRENT_BRANCH; then
    echo -e "${GREEN}✅ Pushed to origin successfully${NC}"
else
    echo -e "${YELLOW}❌ Failed to push to origin${NC}"
    exit 1
fi
echo ""

# Push to amplify (ghaythalijarad/wizzcentralplatform)
echo -e "${BLUE}📤 Pushing to amplify (ghaythalijarad/wizzcentralplatform)...${NC}"
if git push amplify $CURRENT_BRANCH; then
    echo -e "${GREEN}✅ Pushed to amplify successfully${NC}"
else
    echo -e "${YELLOW}❌ Failed to push to amplify${NC}"
    exit 1
fi
echo ""

# Ask if user wants to trigger Amplify deployment
echo -e "${YELLOW}🚀 Do you want to trigger AWS Amplify deployment?${NC}"
read -p "(y/n): " TRIGGER_DEPLOY

if [ "$TRIGGER_DEPLOY" = "y" ] || [ "$TRIGGER_DEPLOY" = "Y" ]; then
    echo ""
    echo -e "${BLUE}🚀 Triggering Amplify deployment...${NC}"
    
    JOB_OUTPUT=$(aws amplify start-job \
        --app-id d2f5oacwil9cbi \
        --branch-name main \
        --job-type RELEASE \
        --region us-east-1 \
        --output json)
    
    JOB_ID=$(echo $JOB_OUTPUT | jq -r '.jobSummary.jobId')
    
    echo -e "${GREEN}✅ Deployment started!${NC}"
    echo ""
    echo -e "${BLUE}📊 Deployment Details:${NC}"
    echo "   Job ID: $JOB_ID"
    echo "   App ID: d2f5oacwil9cbi"
    echo "   Status: Building..."
    echo ""
    echo "   Monitor: https://console.aws.amazon.com/amplify/home?region=us-east-1#d2f5oacwil9cbi"
    echo ""
    
    # Ask if user wants to monitor
    read -p "Monitor build status? (y/n): " MONITOR
    
    if [ "$MONITOR" = "y" ] || [ "$MONITOR" = "Y" ]; then
        echo ""
        echo -e "${BLUE}🔄 Monitoring deployment (Ctrl+C to stop)...${NC}"
        echo ""
        
        while true; do
            STATUS=$(aws amplify get-job \
                --app-id d2f5oacwil9cbi \
                --branch-name main \
                --job-id $JOB_ID \
                --region us-east-1 \
                --query 'job.summary.status' \
                --output text 2>/dev/null || echo "UNKNOWN")
            
            TIMESTAMP=$(date '+%H:%M:%S')
            
            case $STATUS in
                "SUCCEED")
                    echo -e "[$TIMESTAMP] ${GREEN}✅ Deployment SUCCESS!${NC}"
                    echo ""
                    echo -e "${GREEN}🎉 Your app is live at:${NC}"
                    echo "   https://main.d2f5oacwil9cbi.amplifyapp.com"
                    break
                    ;;
                "FAILED")
                    echo -e "[$TIMESTAMP] ${YELLOW}❌ Deployment FAILED${NC}"
                    echo "   Check logs: https://console.aws.amazon.com/amplify/home?region=us-east-1#d2f5oacwil9cbi"
                    exit 1
                    ;;
                "RUNNING")
                    echo -e "[$TIMESTAMP] ${BLUE}🔄 Building...${NC}"
                    ;;
                "PENDING")
                    echo -e "[$TIMESTAMP] ${YELLOW}⏳ Pending...${NC}"
                    ;;
                *)
                    echo -e "[$TIMESTAMP] ${YELLOW}❓ Status: $STATUS${NC}"
                    ;;
            esac
            
            sleep 10
        done
    fi
fi

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 All Done!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "  ✅ Pushed to whizzgo/whizzCentralPlatform"
echo "  ✅ Pushed to ghaythalijarad/wizzcentralplatform"
if [ "$TRIGGER_DEPLOY" = "y" ] || [ "$TRIGGER_DEPLOY" = "Y" ]; then
    echo "  ✅ Triggered AWS Amplify deployment"
fi
echo ""
