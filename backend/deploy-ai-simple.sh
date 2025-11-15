#!/bin/bash

# Simple AI Agent Deployment Script
# This bypasses Serverless Framework issues and uses direct AWS CLI

set -e

echo "🚀 Simple whizzAI Backend Deployment"
echo "===================================="
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials expired. Please login with SSO:"
    echo ""
    echo "Try one of these commands:"
    echo "   aws sso login"
    echo "   aws sso login --profile wizz-drivers-ghayth-dev"
    echo "   aws sso login --profile wizz-merchants-dev"
    echo ""
    echo "After logging in, run this script again."
    exit 1
fi

# Show which account we're using
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null)
echo "✅ AWS credentials valid"
echo "   Account: $ACCOUNT_ID"
echo "   Identity: $USER_ARN"
echo ""

# Variables
STACK_NAME="whizz-ai-agent-dev"
REGION="us-east-1"
AGENT_ID="TNJAPTVUDC"
ALIAS_ID="N8PJCRRDVW"
COGNITO_POOL="us-east-1_Cp9YnOQWi"

echo "2️⃣ Checking if stack exists..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION > /dev/null 2>&1; then
    echo "⚠️  Stack exists. Deleting old stack first..."
    aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION
    echo "⏳ Waiting for stack deletion..."
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $REGION 2>/dev/null || true
    echo "✅ Old stack deleted"
fi
echo ""

echo "3️⃣ Packaging Lambda function (optimized)..."
# Create deployment package with only required dependencies
cd "$(dirname "$0")"
rm -f ai-agent-lambda.zip
rm -rf lambda-package
mkdir -p lambda-package

# Copy only the Lambda code
echo "  → Copying Lambda handler and services..."
cp -r src/ lambda-package/

# Install only production dependencies for Bedrock
echo "  → Installing production dependencies..."
cd lambda-package
cat > package.json << 'EOF'
{
  "name": "whizz-ai-agent",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0"
  }
}
EOF

npm install --production --no-optional --no-package-lock
cd ..

# Create zip excluding dev dependencies and unnecessary files
echo "  → Creating deployment package..."
cd lambda-package
zip -q -r ../ai-agent-lambda.zip . -x "*.git*" "*.DS_Store" "package.json" "package-lock.json"
cd ..

# Cleanup
rm -rf lambda-package

# Check package size
PACKAGE_SIZE=$(du -h ai-agent-lambda.zip | cut -f1)
echo "✅ Lambda package created (size: $PACKAGE_SIZE)"
echo ""

echo "4️⃣ Uploading to S3..."
BUCKET_NAME="whizz-ai-deployments-$(aws sts get-caller-identity --query Account --output text)"

# Create bucket if it doesn't exist
if ! aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    echo "Creating S3 bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION
fi

aws s3 cp ai-agent-lambda.zip "s3://$BUCKET_NAME/ai-agent-lambda.zip"
echo "✅ Uploaded to S3"
echo ""

echo "5️⃣ Creating CloudFormation template..."
cat > /tmp/ai-agent-stack.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: whizzAI Agent Backend

Parameters:
  S3Bucket:
    Type: String
  AgentId:
    Type: String
  AliasId:
    Type: String
  CognitoPool:
    Type: String

Resources:
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: BedrockAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - bedrock:InvokeModel
                  - bedrock:InvokeModelWithResponseStream
                Resource: 'arn:aws:bedrock:*::foundation-model/*'

  AgentSuggestionFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: whizz-ai-agent-suggestion
      Runtime: nodejs18.x
      Handler: handlers/agent-suggestion-handler.handler
      Code:
        S3Bucket: !Ref S3Bucket
        S3Key: ai-agent-lambda.zip
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          BEDROCK_AGENT_ID: !Ref AgentId
          BEDROCK_AGENT_ALIAS_ID: !Ref AliasId

  ApiGateway:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: whizz-ai-agent-api
      ProtocolType: HTTP
      CorsConfiguration:
        AllowOrigins:
          - '*'
        AllowMethods:
          - GET
          - POST
          - OPTIONS
        AllowHeaders:
          - '*'

  ApiIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref ApiGateway
      IntegrationType: AWS_PROXY
      IntegrationUri: !GetAtt AgentSuggestionFunction.Arn
      PayloadFormatVersion: '2.0'

  ApiRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref ApiGateway
      RouteKey: 'POST /agent-suggestion'
      Target: !Sub 'integrations/${ApiIntegration}'

  ApiStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref ApiGateway
      StageName: dev
      AutoDeploy: true

  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AgentSuggestionFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*'

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/dev'
    Export:
      Name: WhizzAIApiEndpoint
EOF
echo "✅ Template created"
echo ""

echo "6️⃣ Deploying CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file:///tmp/ai-agent-stack.yaml \
  --parameters \
    ParameterKey=S3Bucket,ParameterValue=$BUCKET_NAME \
    ParameterKey=AgentId,ParameterValue=$AGENT_ID \
    ParameterKey=AliasId,ParameterValue=$ALIAS_ID \
    ParameterKey=CognitoPool,ParameterValue=$COGNITO_POOL \
  --capabilities CAPABILITY_IAM \
  --region $REGION

echo "⏳ Waiting for stack creation..."
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION

echo ""
echo "✅ Deployment complete!"
echo ""

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

echo "🎉 whizzAI Backend Deployed Successfully!"
echo "========================================"
echo ""
echo "API Endpoint: $API_ENDPOINT/agent-suggestion"
echo ""
echo "Next steps:"
echo "1. Update frontend/pages/support.html line ~2394"
echo "2. Replace: const AI_API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE';"
echo "3. With:    const AI_API_ENDPOINT = '$API_ENDPOINT/agent-suggestion';"
echo ""
echo "Save this to .env.bedrock:"
echo "AI_API_ENDPOINT=$API_ENDPOINT/agent-suggestion"

# Save to .env.bedrock
echo "AI_API_ENDPOINT=$API_ENDPOINT/agent-suggestion" >> ../.env.bedrock

echo ""
echo "✅ Configuration saved to .env.bedrock"
