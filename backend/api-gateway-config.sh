#!/bin/bash

# WizzCentral Campaign API Gateway Configuration
# API ID: 3ub762it80

# Resource IDs
API_ID="3ub762it80"
ROOT_RESOURCE_ID="t96a4hifhd"
CAMPAIGNS_RESOURCE_ID="x6rsxr"
CONDITIONS_RESOURCE_ID="peqxso"
ANALYTICS_RESOURCE_ID="tyjd7r"
PUBLIC_RESOURCE_ID="lalocg"

# Lambda Function ARNs
ACCOUNT_ID="031857856164"
REGION="us-east-1"

CAMPAIGN_API_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:wizzcentral-campaign-campaign-api"
CONDITION_ENGINE_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:wizzcentral-campaign-condition-engine-api"
ANALYTICS_API_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:wizzcentral-campaign-analytics-api"
PUBLIC_API_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:wizzcentral-campaign-campaign-public-api"

echo "🌐 WizzCentral Campaign API Gateway Configuration"
echo "================================================="
echo "API ID: $API_ID"
echo "Root Resource ID: $ROOT_RESOURCE_ID"
echo ""
echo "📋 Resources:"
echo "• /campaigns - Resource ID: $CAMPAIGNS_RESOURCE_ID"
echo "• /conditions - Resource ID: $CONDITIONS_RESOURCE_ID" 
echo "• /analytics - Resource ID: $ANALYTICS_RESOURCE_ID"
echo "• /public - Resource ID: $PUBLIC_RESOURCE_ID"
echo ""
echo "🔧 Lambda Functions:"
echo "• Campaign API: $CAMPAIGN_API_ARN"
echo "• Condition Engine: $CONDITION_ENGINE_ARN"
echo "• Analytics API: $ANALYTICS_API_ARN"
echo "• Public API: $PUBLIC_API_ARN"
