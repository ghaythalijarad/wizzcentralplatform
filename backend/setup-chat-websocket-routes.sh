#!/bin/bash
# Setup WebSocket routes for WizzCentral Chat WebSocket API
# API ID: 7ysrz3rspi
# Endpoint: wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev

set -e

API_ID="7ysrz3rspi"
REGION="us-east-1"
PROFILE="wizz-drivers-ghayth-dev"
ACCOUNT_ID="031857856164"

# Lambda function ARNs (reusing existing Lambda functions)
CONNECT_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:WizzUser-WebSocketConnect-dev"
DISCONNECT_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:WizzUser-WebSocketDisconnect-dev"
DEFAULT_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:WizzUser-WebSocketDefault-dev"

echo "🚀 Setting up WebSocket routes for Chat API..."
echo "API ID: $API_ID"
echo ""

# Step 1: Create integrations
echo "📦 Creating Lambda integrations..."

# Create $connect integration
CONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $CONNECT_LAMBDA_ARN \
  --profile $PROFILE \
  --query 'IntegrationId' \
  --output text)
echo "✅ $connect integration created: $CONNECT_INTEGRATION_ID"

# Create $disconnect integration
DISCONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $DISCONNECT_LAMBDA_ARN \
  --profile $PROFILE \
  --query 'IntegrationId' \
  --output text)
echo "✅ $disconnect integration created: $DISCONNECT_INTEGRATION_ID"

# Create $default integration (for chat messages)
DEFAULT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $DEFAULT_LAMBDA_ARN \
  --profile $PROFILE \
  --query 'IntegrationId' \
  --output text)
echo "✅ $default integration created: $DEFAULT_INTEGRATION_ID"

# Step 2: Create routes
echo ""
echo "🛣️  Creating WebSocket routes..."

# Create $connect route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$connect' \
  --target "integrations/$CONNECT_INTEGRATION_ID" \
  --profile $PROFILE > /dev/null
echo "✅ $connect route created"

# Create $disconnect route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$disconnect' \
  --target "integrations/$DISCONNECT_INTEGRATION_ID" \
  --profile $PROFILE > /dev/null
echo "✅ $disconnect route created"

# Create $default route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$default' \
  --target "integrations/$DEFAULT_INTEGRATION_ID" \
  --profile $PROFILE > /dev/null
echo "✅ $default route created"

# Create chat-specific routes (all go to $default handler)
echo ""
echo "💬 Creating chat-specific routes..."

for route in "chat_driver_connect" "chat_agent_connect" "chat_message" "chat_typing" "chat_session_close"
do
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "$route" \
    --target "integrations/$DEFAULT_INTEGRATION_ID" \
    --profile $PROFILE > /dev/null
  echo "✅ $route route created"
done

# Step 3: Grant API Gateway permission to invoke Lambda functions
echo ""
echo "🔐 Granting API Gateway permissions to invoke Lambda functions..."

# Grant permission for $connect
aws lambda add-permission \
  --function-name WizzUser-WebSocketConnect-dev \
  --statement-id ApiGatewayInvoke-Chat-Connect \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
  --profile $PROFILE > /dev/null 2>&1 || echo "⚠️  Permission already exists for Connect"

# Grant permission for $disconnect
aws lambda add-permission \
  --function-name WizzUser-WebSocketDisconnect-dev \
  --statement-id ApiGatewayInvoke-Chat-Disconnect \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
  --profile $PROFILE > /dev/null 2>&1 || echo "⚠️  Permission already exists for Disconnect"

# Grant permission for $default and chat routes
aws lambda add-permission \
  --function-name WizzUser-WebSocketDefault-dev \
  --statement-id ApiGatewayInvoke-Chat-Default \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
  --profile $PROFILE > /dev/null 2>&1 || echo "⚠️  Permission already exists for Default"

echo ""
echo "✅ WebSocket Chat API setup complete!"
echo ""
echo "🌐 WebSocket Endpoint: wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev"
echo ""
echo "📋 Routes configured:"
echo "   - \$connect"
echo "   - \$disconnect"
echo "   - \$default"
echo "   - chat_driver_connect"
echo "   - chat_agent_connect"
echo "   - chat_message"
echo "   - chat_typing"
echo "   - chat_session_close"
echo ""
echo "🧪 Test with: wscat -c wss://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev"
