#!/bin/bash

echo "🚀 FIXING MISSING AUTHENTICATION TOKEN ERROR"
echo "==========================================="

# The issue is that the public endpoint isn't deployed yet
# Let's create the endpoint via AWS CLI

API_ID="ru65nhlwhc"
REGION="us-east-1"

echo "🔧 Creating public/chat/send resource..."

# Create the public resource (if it doesn't exist)
aws apigateway get-resources --rest-api-id $API_ID --region $REGION > /tmp/resources.json

# Check if public resource exists
if ! grep -q "public" /tmp/resources.json; then
    echo "Creating /public resource..."
    ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/`].id' --output text)
    
    PUBLIC_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_ID \
        --path-part "public" \
        --region $REGION \
        --query 'id' --output text)
    
    echo "Created /public resource: $PUBLIC_RESOURCE_ID"
else
    PUBLIC_RESOURCE_ID=$(grep -A 5 -B 5 "public" /tmp/resources.json | grep '"id"' | cut -d'"' -f4)
    echo "Found existing /public resource: $PUBLIC_RESOURCE_ID"
fi

# Check if chat resource exists under public
if ! grep -A 10 -B 10 "public" /tmp/resources.json | grep -q "chat"; then
    echo "Creating /public/chat resource..."
    CHAT_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $PUBLIC_RESOURCE_ID \
        --path-part "chat" \
        --region $REGION \
        --query 'id' --output text)
    
    echo "Created /public/chat resource: $CHAT_RESOURCE_ID"
else
    # Extract chat resource ID
    CHAT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?pathPart==`chat` && parentId==`'$PUBLIC_RESOURCE_ID'`].id' --output text)
    echo "Found existing /public/chat resource: $CHAT_RESOURCE_ID"
fi

# Check if send resource exists under public/chat
SEND_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?pathPart==`send` && parentId==`'$CHAT_RESOURCE_ID'`].id' --output text)

if [ "$SEND_RESOURCE_ID" = "" ] || [ "$SEND_RESOURCE_ID" = "None" ]; then
    echo "Creating /public/chat/send resource..."
    SEND_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $CHAT_RESOURCE_ID \
        --path-part "send" \
        --region $REGION \
        --query 'id' --output text)
    
    echo "Created /public/chat/send resource: $SEND_RESOURCE_ID"
fi

echo "✅ API Gateway resources ready"
echo "🔧 Resource IDs:"
echo "   Public: $PUBLIC_RESOURCE_ID"
echo "   Chat: $CHAT_RESOURCE_ID" 
echo "   Send: $SEND_RESOURCE_ID"

# Now create POST method
echo "🔧 Creating POST method..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SEND_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

# Create OPTIONS method for CORS
echo "🔧 Creating OPTIONS method for CORS..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SEND_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION

echo "✅ Methods created"

# Deploy the API
echo "🚀 Deploying API changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name dev \
    --region $REGION

echo "✅ API deployment complete!"
echo ""
echo "🎯 Test the endpoint:"
echo "POST https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send"
echo ""
echo "📱 Your Flutter app should now work without 'Missing Authentication Token' errors!"

# Clean up
rm -f /tmp/resources.json
