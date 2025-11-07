#!/bin/bash
# Deploy Regions API Lambda Function

set -e

FUNCTION_NAME="WizzCentral-RegionsAPI"
REGION="us-east-1"
AWS_PROFILE="wizz-drivers-ghayth-dev"
RUNTIME="nodejs18.x"
HANDLER="lambda-regions-api.handler"
TABLE_NAME="WizzCentral_Regions"

echo "🚀 Deploying Regions API Lambda..."
echo "   Function: $FUNCTION_NAME"
echo "   Region: $REGION"
echo ""

# Create deployment package directory
DEPLOY_DIR="/tmp/regions-api-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy Lambda code
echo "📦 Packaging Lambda function..."
cp backend/lambda-regions-api.js "$DEPLOY_DIR/index.js"
cp backend/lambda-regions-api-package.json "$DEPLOY_DIR/package.json"

# Install dependencies
cd "$DEPLOY_DIR"
npm install --production --no-package-lock

# Create ZIP
echo "🗜️  Creating deployment package..."
zip -r -q lambda-regions-api.zip .

# Check if function exists
echo "🔍 Checking if function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --profile "$AWS_PROFILE" --region "$REGION" >/dev/null 2>&1; then
    echo "♻️  Updating existing function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://lambda-regions-api.zip \
        --profile "$AWS_PROFILE" \
        --region "$REGION"
    
    echo "⚙️  Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --handler "$HANDLER" \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={REGIONS_TABLE=$TABLE_NAME,AWS_REGION=$REGION,NODE_ENV=production}" \
        --profile "$AWS_PROFILE" \
        --region "$REGION"
else
    echo "🆕 Creating new function..."
    
    # Get or create execution role
    ROLE_NAME="WizzCentral-RegionsAPI-Role"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --profile "$AWS_PROFILE" --query 'Role.Arn' --output text 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        echo "📝 Creating IAM role..."
        
        # Create trust policy
        cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file:///tmp/trust-policy.json \
            --profile "$AWS_PROFILE"
        
        # Attach policies
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
            --profile "$AWS_PROFILE"
        
        # Create DynamoDB policy
        cat > /tmp/dynamodb-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:$REGION:*:table/$TABLE_NAME*"
    }
  ]
}
EOF
        
        aws iam put-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-name "DynamoDBAccess" \
            --policy-document file:///tmp/dynamodb-policy.json \
            --profile "$AWS_PROFILE"
        
        ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --profile "$AWS_PROFILE" --query 'Role.Arn' --output text)
        
        echo "⏳ Waiting for IAM role to propagate..."
        sleep 10
    fi
    
    echo "🔨 Creating Lambda function..."
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file fileb://lambda-regions-api.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment "Variables={REGIONS_TABLE=$TABLE_NAME,AWS_REGION=$REGION,NODE_ENV=production}" \
        --profile "$AWS_PROFILE" \
        --region "$REGION"
fi

# Create or update Function URL
echo "🌐 Configuring Function URL..."
FUNCTION_URL=$(aws lambda list-function-url-configs \
    --function-name "$FUNCTION_NAME" \
    --profile "$AWS_PROFILE" \
    --region "$REGION" \
    --query 'FunctionUrlConfigs[0].FunctionUrl' \
    --output text 2>/dev/null || echo "None")

if [ "$FUNCTION_URL" = "None" ]; then
    echo "🆕 Creating Function URL..."
    FUNCTION_URL=$(aws lambda create-function-url-config \
        --function-name "$FUNCTION_NAME" \
        --auth-type NONE \
        --cors 'AllowOrigins=["*"],AllowMethods=["*"],AllowHeaders=["*"],MaxAge=86400' \
        --profile "$AWS_PROFILE" \
        --region "$REGION" \
        --query 'FunctionUrl' \
        --output text)
    
    # Add resource-based policy to allow public invocation
    aws lambda add-permission \
        --function-name "$FUNCTION_NAME" \
        --statement-id "FunctionURLAllowPublicAccess" \
        --action "lambda:InvokeFunctionUrl" \
        --principal "*" \
        --function-url-auth-type NONE \
        --profile "$AWS_PROFILE" \
        --region "$REGION" 2>/dev/null || true
else
    echo "✅ Function URL already exists"
fi

echo ""
echo "=" | tr '\n' '=' | cut -c1-60
echo ""
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "=" | tr '\n' '=' | cut -c1-60
echo "Function URL: $FUNCTION_URL"
echo ""
echo "📝 Update your frontend/config.js with:"
echo "   API_BASE_URL: '$FUNCTION_URL'"
echo ""
echo "🧪 Test the API:"
echo "   curl \"${FUNCTION_URL}api/regions?limit=5\""
echo ""
