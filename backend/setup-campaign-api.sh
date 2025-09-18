#!/bin/bash

# Campaign API Gateway Setup - Architecture Aligned
# Creates API Gateway endpoints for the new campaign management system

set -e

echo "🚀 Setting up Campaign Management API Gateway..."

# Configuration
API_NAME="WizzCentral-Campaign-Management"
REGION=${AWS_REGION:-us-east-1}
STAGE_NAME="prod"

# Get Lambda function ARNs (update these with your actual function ARNs)
CREATE_CAMPAIGN_FUNCTION="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:createCampaign"
GET_CAMPAIGNS_FUNCTION="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:getCampaigns"
REDEEM_CAMPAIGN_FUNCTION="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:redeemCampaign"
UPDATE_CAMPAIGN_FUNCTION="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:updateCampaign"

echo "📋 Creating REST API..."

# Create the REST API
API_ID=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "Campaign Management API for WizzCentral - Aligned Architecture" \
    --endpoint-configuration types=REGIONAL \
    --query 'id' \
    --output text)

echo "✅ API Created: $API_ID"

# Get the root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text)

echo "📂 Root resource: $ROOT_RESOURCE_ID"

# Create /campaigns resource
CAMPAIGNS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part campaigns \
    --query 'id' \
    --output text)

echo "📂 Created /campaigns resource: $CAMPAIGNS_RESOURCE_ID"

# Create /campaigns/active resource
ACTIVE_CAMPAIGNS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $CAMPAIGNS_RESOURCE_ID \
    --path-part active \
    --query 'id' \
    --output text)

echo "📂 Created /campaigns/active resource: $ACTIVE_CAMPAIGNS_RESOURCE_ID"

# Create /campaigns/{id} resource
CAMPAIGN_ID_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $CAMPAIGNS_RESOURCE_ID \
    --path-part '{id}' \
    --query 'id' \
    --output text)

echo "📂 Created /campaigns/{id} resource: $CAMPAIGN_ID_RESOURCE_ID"

# Create /campaigns/{id}/redeem resource
REDEEM_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $CAMPAIGN_ID_RESOURCE_ID \
    --path-part redeem \
    --query 'id' \
    --output text)

echo "📂 Created /campaigns/{id}/redeem resource: $REDEEM_RESOURCE_ID"

echo "🔧 Setting up methods and integrations..."

# Function to create method with Lambda integration
create_lambda_method() {
    local resource_id=$1
    local http_method=$2
    local lambda_arn=$3
    local function_name=$4
    
    echo "  🔗 Creating $http_method method for $function_name..."
    
    # Create method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $http_method \
        --authorization-type NONE \
        --no-api-key-required > /dev/null
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $http_method \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${lambda_arn}/invocations" > /dev/null
    
    # Add Lambda permission
    aws lambda add-permission \
        --function-name $function_name \
        --statement-id "apigateway-${API_ID}-${resource_id}-${http_method}" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query Account --output text):${API_ID}/*/*" \
        2>/dev/null || echo "    ⚠️ Permission may already exist"
}

# Create CORS preflight method
create_cors_method() {
    local resource_id=$1
    
    echo "  🌐 Adding CORS support..."
    
    # OPTIONS method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --authorization-type NONE > /dev/null
    
    # Mock integration for CORS
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' > /dev/null
    
    # Method response
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' > /dev/null
    
    # Integration response
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\"","method.response.header.Access-Control-Allow-Methods":"\"GET,POST,PUT,DELETE,OPTIONS\"","method.response.header.Access-Control-Allow-Origin":"\"*\""}' > /dev/null
}

# Setup all endpoints
echo "🎯 Setting up API endpoints..."

# POST /campaigns - Create campaign
create_lambda_method $CAMPAIGNS_RESOURCE_ID "POST" $CREATE_CAMPAIGN_FUNCTION "createCampaign"
create_cors_method $CAMPAIGNS_RESOURCE_ID

# GET /campaigns - Get all campaigns
create_lambda_method $CAMPAIGNS_RESOURCE_ID "GET" $GET_CAMPAIGNS_FUNCTION "getCampaigns"

# GET /campaigns/active - Get active campaigns
create_lambda_method $ACTIVE_CAMPAIGNS_RESOURCE_ID "GET" $GET_CAMPAIGNS_FUNCTION "getCampaigns"
create_cors_method $ACTIVE_CAMPAIGNS_RESOURCE_ID

# PUT /campaigns/{id} - Update campaign
create_lambda_method $CAMPAIGN_ID_RESOURCE_ID "PUT" $UPDATE_CAMPAIGN_FUNCTION "updateCampaign"
create_cors_method $CAMPAIGN_ID_RESOURCE_ID

# POST /campaigns/{id}/redeem - Redeem campaign
create_lambda_method $REDEEM_RESOURCE_ID "POST" $REDEEM_CAMPAIGN_FUNCTION "redeemCampaign"
create_cors_method $REDEEM_RESOURCE_ID

echo "🚀 Deploying API..."

# Create deployment
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --description "Campaign Management API - Architecture Aligned Deployment" \
    --query 'id' \
    --output text)

echo "✅ Deployment created: $DEPLOYMENT_ID"

# Get the API URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"

echo ""
echo "🎉 Campaign Management API Setup Complete!"
echo "================================================"
echo "📍 API ID: $API_ID"
echo "🌐 Base URL: $API_URL"
echo ""
echo "📋 Available Endpoints:"
echo "  POST   $API_URL/campaigns           # Create campaign"
echo "  GET    $API_URL/campaigns           # Get all campaigns"
echo "  GET    $API_URL/campaigns/active    # Get active campaigns"
echo "  PUT    $API_URL/campaigns/{id}      # Update campaign"
echo "  POST   $API_URL/campaigns/{id}/redeem # Redeem campaign"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update Lambda function ARNs in this script if needed"
echo "  2. Deploy Lambda functions with the provided code"
echo "  3. Test endpoints with the provided test scripts"
echo "  4. Update frontend to use new API endpoints"

# Save configuration
cat > campaign-api-config.json << EOF
{
  "apiId": "$API_ID",
  "region": "$REGION",
  "stage": "$STAGE_NAME",
  "baseUrl": "$API_URL",
  "endpoints": {
    "createCampaign": "$API_URL/campaigns",
    "getAllCampaigns": "$API_URL/campaigns",
    "getActiveCampaigns": "$API_URL/campaigns/active",
    "updateCampaign": "$API_URL/campaigns/{id}",
    "redeemCampaign": "$API_URL/campaigns/{id}/redeem"
  },
  "deploymentId": "$DEPLOYMENT_ID",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "💾 API configuration saved to campaign-api-config.json"
