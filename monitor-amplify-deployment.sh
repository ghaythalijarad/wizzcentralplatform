#!/bin/bash

# Monitor AWS Amplify Deployment Status

APP_ID="d2f5oacwil9cbi"
BRANCH="main"
REGION="us-east-1"

echo "🚀 Monitoring AWS Amplify Deployment"
echo "========================================"
echo "App ID: $APP_ID"
echo "Branch: $BRANCH"
echo "Region: $REGION"
echo ""

# Get latest job ID
JOB_ID=$(aws amplify list-jobs --app-id $APP_ID --branch-name $BRANCH --region $REGION --max-items 1 --query 'jobSummaries[0].jobId' --output text)

echo "📋 Latest Job ID: $JOB_ID"
echo ""

# Monitor deployment
while true; do
    STATUS=$(aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID --region $REGION --query 'job.summary.status' --output text)
    
    case $STATUS in
        "SUCCEED")
            echo "✅ Deployment SUCCESSFUL!"
            echo ""
            echo "🌐 Production URL:"
            echo "   https://main.d2f5oacwil9cbi.amplifyapp.com/pages/promotions.html"
            echo ""
            echo "🧪 Test push notifications now!"
            break
            ;;
        "FAILED")
            echo "❌ Deployment FAILED"
            echo ""
            echo "📊 View details:"
            aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID --region $REGION --query 'job.steps[*].[stepName,status]' --output table
            break
            ;;
        "PENDING"|"PROVISIONING"|"RUNNING")
            echo "⏳ Status: $STATUS ($(date '+%H:%M:%S'))"
            sleep 5
            ;;
        *)
            echo "⚠️  Unknown status: $STATUS"
            sleep 5
            ;;
    esac
done
