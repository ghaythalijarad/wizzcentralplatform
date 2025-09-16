#!/bin/bash

# Enhanced WebSocket Handler Deployment Script
# Replaces the existing WizzUser-WebSocketDefault-dev function with chat support

set -e

echo "🚀 Deploying Enhanced WebSocket Handler with Chat Support"
echo "======================================================"

# Configuration
FUNCTION_NAME="wizzcentral-websocket-sam-dev-WebSocketHandler-DOc4Cll3vGOn"
REGION="us-east-1"
HANDLER_FILE="src/handlers/enhanced-websocket-default.js"

# Check if we're in the backend directory
if [ ! -f "$HANDLER_FILE" ]; then
    echo "❌ Error: $HANDLER_FILE not found. Please run this script from the backend directory."
    exit 1
fi

echo "📦 Creating deployment package..."

# Create temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy the enhanced handler as index.js (since the function expects index.handler)
cp "$HANDLER_FILE" "$TEMP_DIR/index.js"

# Create a minimal package.json for the Lambda
cat > "$TEMP_DIR/package.json" << 'EOF'
{
  "name": "enhanced-websocket-handler",
  "version": "1.0.0",
  "description": "Enhanced WebSocket handler with chat support",
  "main": "src/handlers/enhanced-websocket-default.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/lib-dynamodb": "^3.400.0",
    "@aws-sdk/client-apigatewaymanagementapi": "^3.400.0"
  }
}
EOF

# Create the deployment zip
cd "$TEMP_DIR"
echo "📁 Creating zip file..."
zip -r function.zip . > /dev/null

echo "☁️  Updating Lambda function: $FUNCTION_NAME"

# Update the Lambda function code
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region "$REGION" \
    --output table \
    --query '{FunctionName:FunctionName,LastModified:LastModified,CodeSize:CodeSize}'

echo ""
echo "🔧 Updating function configuration..."

# Update environment variables (using proper shell escaping)
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment 'Variables={CHAT_SESSIONS_TABLE=chat-sessions-dev,CHAT_MESSAGES_TABLE=chat-messages-dev,WEBSOCKET_CONNECTIONS_TABLE=websocket-connections-dev,STAGE=dev}' \
    --region "$REGION" \
    --output table \
    --query '{FunctionName:FunctionName,Environment:Environment.Variables}' > /dev/null

echo ""
echo "🔐 Updating IAM permissions for DynamoDB access..."

# Get the function's role
ROLE_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.Role' --output text)
ROLE_NAME=$(echo "$ROLE_ARN" | rev | cut -d'/' -f1 | rev)

echo "Function role: $ROLE_NAME"

# Create IAM policy for chat tables
cat > "$TEMP_DIR/chat-policy.json" << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:*:table/chat-sessions-dev",
                "arn:aws:dynamodb:us-east-1:*:table/chat-sessions-dev/index/*",
                "arn:aws:dynamodb:us-east-1:*:table/chat-messages-dev", 
                "arn:aws:dynamodb:us-east-1:*:table/chat-messages-dev/index/*",
                "arn:aws:dynamodb:us-east-1:*:table/websocket-connections-dev",
                "arn:aws:dynamodb:us-east-1:*:table/websocket-connections-dev/index/*"
            ]
        }
    ]
}
EOF

# Create or update the policy
POLICY_NAME="ChatTablesAccess"
POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME"

echo "Creating/updating IAM policy: $POLICY_NAME"
aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file://"$TEMP_DIR/chat-policy.json" \
    --region "$REGION" 2>/dev/null || \
aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file://"$TEMP_DIR/chat-policy.json" \
    --set-as-default \
    --region "$REGION" > /dev/null

echo "Attaching policy to role: $ROLE_NAME"
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN" \
    --region "$REGION" 2>/dev/null || echo "Policy already attached"

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Enhanced WebSocket Handler Deployed Successfully!"
echo ""
echo "🔧 Configuration:"
echo "   Function: $FUNCTION_NAME"
echo "   Region: $REGION"
echo "   Chat Tables: ChatSessions, ChatMessages, WebSocketConnections"
echo ""
echo "📱 Your Flutter app can now:"
echo "   • Connect to: wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev"
echo "   • Send chat_init messages to start sessions"
echo "   • Send chat_message to communicate with agents"
echo "   • Use join_channel to register as driver"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test the Flutter app connection"
echo "   2. Connect as an agent via Central Platform"
echo "   3. Send test messages between driver and agent"
echo ""
echo "🔍 Monitor logs with:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
