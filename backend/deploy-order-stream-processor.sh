#!/bin/bash

# Deploy Order Stream Processor for Driver Assignment System
# This script deploys the Lambda function and configures DynamoDB streams

set -e

echo "🚀 Deploying Order Stream Processor for Driver Assignment System"
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
ORDERS_TABLE="WizzOrders_dev"
LAMBDA_FUNCTION_NAME="wizzcentral-unified-chat-dev-orderStreamProcessor"
LAMBDA_ZIP_FILE="order-stream-processor-manual.zip"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Region: $REGION"
echo "  Orders Table: $ORDERS_TABLE"
echo "  Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "  Deployment Package: $LAMBDA_ZIP_FILE"
echo ""

# Step 1: Check if DynamoDB table exists and get ARN
echo -e "${BLUE}🔍 Step 1: Checking DynamoDB table and streams...${NC}"

TABLE_STATUS=$(aws dynamodb describe-table --table-name "$ORDERS_TABLE" --region "$REGION" --query 'Table.TableStatus' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$TABLE_STATUS" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ Table $ORDERS_TABLE not found!${NC}"
    echo "Please create the table first or update the table name in the script."
    exit 1
fi

echo -e "${GREEN}✅ Table $ORDERS_TABLE exists (Status: $TABLE_STATUS)${NC}"

# Check if streams are enabled
STREAM_STATUS=$(aws dynamodb describe-table --table-name "$ORDERS_TABLE" --region "$REGION" --query 'Table.StreamSpecification.StreamEnabled' --output text 2>/dev/null || echo "false")

if [ "$STREAM_STATUS" = "false" ] || [ "$STREAM_STATUS" = "None" ]; then
    echo -e "${YELLOW}⚠️  DynamoDB streams not enabled on $ORDERS_TABLE${NC}"
    echo "Enabling streams..."
    
    aws dynamodb modify-table \
        --table-name "$ORDERS_TABLE" \
        --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
        --region "$REGION"
    
    echo -e "${GREEN}✅ DynamoDB streams enabled${NC}"
    
    # Wait for table to be updated
    echo "Waiting for table update to complete..."
    aws dynamodb wait table-exists --table-name "$ORDERS_TABLE" --region "$REGION"
else
    echo -e "${GREEN}✅ DynamoDB streams already enabled${NC}"
fi

# Get the stream ARN
STREAM_ARN=$(aws dynamodb describe-table --table-name "$ORDERS_TABLE" --region "$REGION" --query 'Table.LatestStreamArn' --output text)
echo "Stream ARN: $STREAM_ARN"

# Step 2: Check if Lambda function exists
echo -e "\n${BLUE}🔍 Step 2: Checking Lambda function...${NC}"

FUNCTION_EXISTS=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region "$REGION" 2>/dev/null && echo "true" || echo "false")

if [ "$FUNCTION_EXISTS" = "false" ]; then
    echo -e "${YELLOW}⚠️  Lambda function $LAMBDA_FUNCTION_NAME not found${NC}"
    echo "Creating Lambda function..."
    
    # Check if deployment package exists
    if [ ! -f "$LAMBDA_ZIP_FILE" ]; then
        echo -e "${RED}❌ Deployment package $LAMBDA_ZIP_FILE not found!${NC}"
        echo "Please run the build script first to create the deployment package."
        exit 1
    fi
    
    # Create IAM role if it doesn't exist
    ROLE_NAME="wizzcentral-order-stream-processor-role"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$ROLE_ARN" = "NOT_FOUND" ]; then
        echo "Creating IAM role..."
        
        # Create trust policy
        cat > trust-policy.json << EOF
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
            --assume-role-policy-document file://trust-policy.json
        
        # Attach basic execution role
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        # Create and attach DynamoDB policy
        cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:*:table/$ORDERS_TABLE",
        "arn:aws:dynamodb:$REGION:*:table/$ORDERS_TABLE/index/*",
        "arn:aws:dynamodb:$REGION:*:table/$ORDERS_TABLE/stream/*",
        "arn:aws:dynamodb:$REGION:*:table/WhizzDrivers_dev",
        "arn:aws:dynamodb:$REGION:*:table/WhizzDrivers_dev/index/*",
        "arn:aws:dynamodb:$REGION:*:table/WizzUser_websocket_connections_dev",
        "arn:aws:dynamodb:$REGION:*:table/WizzUser_websocket_connections_dev/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "arn:aws:execute-api:$REGION:*:*/dev/*/*"
    }
  ]
}
EOF

        aws iam put-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-name "DynamoDBStreamPolicy" \
            --policy-document file://dynamodb-policy.json
        
        ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$ROLE_NAME"
        
        echo "Waiting for IAM role to be available..."
        sleep 10
        
        rm trust-policy.json dynamodb-policy.json
    fi
    
    echo "Creating Lambda function..."
    aws lambda create-function \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --runtime nodejs18.x \
        --role "$ROLE_ARN" \
        --handler "src/handlers/order-stream-processor.handler" \
        --zip-file fileb://"$LAMBDA_ZIP_FILE" \
        --description "Monitors order status changes and automatically assigns drivers" \
        --timeout 60 \
        --memory-size 512 \
        --environment Variables="{
            STAGE=dev,
            ORDERS_TABLE=$ORDERS_TABLE,
            DRIVERS_TABLE=WhizzDrivers_dev,
            WEBSOCKET_CONNECTIONS_TABLE=WizzUser_websocket_connections_dev,
            WEBSOCKET_ENDPOINT=https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev
        }" \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Lambda function created${NC}"
else
    echo -e "${GREEN}✅ Lambda function already exists${NC}"
    echo "Updating function code..."
    
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file fileb://"$LAMBDA_ZIP_FILE" \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Lambda function code updated${NC}"
fi

# Step 3: Create event source mapping
echo -e "\n${BLUE}🔍 Step 3: Configuring DynamoDB stream trigger...${NC}"

# Check if event source mapping exists
EVENT_SOURCE_UUID=$(aws lambda list-event-source-mappings \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$REGION" \
    --query "EventSourceMappings[?EventSourceArn=='$STREAM_ARN'].UUID" \
    --output text)

if [ -z "$EVENT_SOURCE_UUID" ] || [ "$EVENT_SOURCE_UUID" = "None" ]; then
    echo "Creating event source mapping..."
    
    aws lambda create-event-source-mapping \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --event-source-arn "$STREAM_ARN" \
        --starting-position LATEST \
        --batch-size 10 \
        --maximum-batching-window-in-seconds 5 \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Event source mapping created${NC}"
else
    echo -e "${GREEN}✅ Event source mapping already exists (UUID: $EVENT_SOURCE_UUID)${NC}"
fi

# Step 4: Test the deployment
echo -e "\n${BLUE}🧪 Step 4: Testing deployment...${NC}"

echo "Getting function information..."
aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region "$REGION" --query 'Configuration.[FunctionName,Runtime,Handler,State]' --output table

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "================================================================="
echo "Order Stream Processor has been successfully deployed."
echo ""
echo "📋 Summary:"
echo "  ✅ DynamoDB streams enabled on $ORDERS_TABLE"
echo "  ✅ Lambda function deployed: $LAMBDA_FUNCTION_NAME"
echo "  ✅ Event source mapping configured"
echo ""
echo "🚀 Next Steps:"
echo "1. Test the system by creating an order with status 'ready_for_pickup'"
echo "2. Monitor CloudWatch logs for the Lambda function"
echo "3. Verify driver assignment functionality in the WizzDriver app"
echo ""
echo "📊 Monitoring:"
echo "  CloudWatch Logs: /aws/lambda/$LAMBDA_FUNCTION_NAME"
echo "  DynamoDB Metrics: $ORDERS_TABLE stream metrics"
echo ""
