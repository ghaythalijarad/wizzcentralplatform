# Order Stream Processor Deployment Guide

## Prerequisites Checklist ✅

Before deploying the order stream processor, ensure you have:

### 1. AWS Credentials Configured
```bash
# Check if AWS credentials are configured
aws sts get-caller-identity

# If not configured, set up AWS credentials:
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key  
# Enter default region: us-east-1
# Enter default output format: json
```

### 2. Required AWS Permissions
Your AWS user/role needs the following permissions:
- DynamoDB: Full access to WizzOrders_dev table and streams
- Lambda: Create, update, and manage functions
- IAM: Create and manage roles for Lambda execution
- API Gateway: Manage connections for WebSocket notifications

### 3. Existing Infrastructure
- ✅ WizzOrders_dev DynamoDB table exists
- ✅ WhizzDrivers_dev DynamoDB table exists  
- ✅ WizzUser_websocket_connections_dev table exists
- ✅ WebSocket API Gateway endpoint is configured

## Deployment Methods

### Method 1: Serverless Framework (Recommended)
```bash
# 1. Navigate to backend directory
cd /Users/ghaythallaheebi/wizzcentralplatform/backend

# 2. Install dependencies
npm install

# 3. Deploy only the order stream processor function
npx serverless deploy --function orderStreamProcessor --stage dev

# 4. Deploy the entire stack (alternative)
npx serverless deploy --stage dev
```

### Method 2: Manual AWS CLI Deployment
```bash
# 1. Enable DynamoDB streams on WizzOrders_dev table
aws dynamodb modify-table \
    --table-name WizzOrders_dev \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    --region us-east-1

# 2. Create IAM role for Lambda
aws iam create-role \
    --role-name OrderStreamProcessorRole \
    --assume-role-policy-document file://lambda-trust-policy.json

# 3. Attach policies to the role
aws iam attach-role-policy \
    --role-name OrderStreamProcessorRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
    --role-name OrderStreamProcessorRole \
    --policy-name DynamoDBStreamPolicy \
    --policy-document file://dynamodb-streams-policy.json

# 4. Deploy Lambda function
aws lambda create-function \
    --function-name OrderStreamProcessor \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/OrderStreamProcessorRole \
    --handler src/handlers/order-stream-processor.handler \
    --zip-file fileb://order-stream-processor-manual.zip \
    --timeout 60 \
    --memory-size 512 \
    --environment Variables='{"STAGE":"dev","ORDERS_TABLE":"WizzOrders_dev","DRIVERS_TABLE":"WhizzDrivers_dev","WEBSOCKET_CONNECTIONS_TABLE":"WizzUser_websocket_connections_dev","WEBSOCKET_ENDPOINT":"https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev"}'

# 5. Create event source mapping
aws lambda create-event-source-mapping \
    --function-name OrderStreamProcessor \
    --event-source-arn STREAM_ARN_FROM_STEP_1 \
    --starting-position LATEST \
    --batch-size 10
```

### Method 3: Using Deployment Script
```bash
# Run the automated deployment script
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
chmod +x deploy-order-stream-processor.sh
./deploy-order-stream-processor.sh
```

## Verification Steps

### 1. Check DynamoDB Streams
```bash
# Verify streams are enabled
aws dynamodb describe-table --table-name WizzOrders_dev --query 'Table.StreamSpecification'
```

### 2. Check Lambda Function
```bash
# Verify function exists and is configured
aws lambda get-function --function-name OrderStreamProcessor

# Check event source mappings
aws lambda list-event-source-mappings --function-name OrderStreamProcessor
```

### 3. Test the System
```bash
# Run the test script
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
node simple-test.js
```

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Found**
   ```bash
   aws configure
   # OR
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_DEFAULT_REGION=us-east-1
   ```

2. **DynamoDB Table Not Found**
   - Verify table name is exactly: `WizzOrders_dev`
   - Check the correct AWS region: `us-east-1`

3. **Lambda Function Already Exists**
   ```bash
   # Update existing function
   aws lambda update-function-code \
       --function-name OrderStreamProcessor \
       --zip-file fileb://order-stream-processor-manual.zip
   ```

4. **Event Source Mapping Issues**
   ```bash
   # List existing mappings
   aws lambda list-event-source-mappings --function-name OrderStreamProcessor
   
   # Delete and recreate if needed
   aws lambda delete-event-source-mapping --uuid MAPPING_UUID
   ```

## Files Reference

- `order-stream-processor-manual.zip` - Lambda deployment package
- `src/handlers/order-stream-processor.js` - Main Lambda function
- `serverless.yml` - Serverless framework configuration
- `deploy-order-stream-processor.sh` - Automated deployment script

## Next Steps After Deployment

1. **Monitor CloudWatch Logs**
   - Go to AWS CloudWatch Console
   - Find log group: `/aws/lambda/OrderStreamProcessor`
   - Monitor for function execution and errors

2. **Test Order Assignment Flow**
   - Create an order in WizzCentral Platform
   - Change order status to `ready_for_pickup`
   - Verify driver assignment is triggered
   - Check WizzDriver app receives assignment notification

3. **Performance Monitoring**
   - Monitor DynamoDB stream metrics
   - Track Lambda function duration and errors
   - Monitor WebSocket connection success rates

## Support

If you encounter issues during deployment:
1. Check CloudWatch logs for detailed error messages
2. Verify all AWS resources exist and have correct permissions
3. Ensure the WizzDriver app is properly configured to receive WebSocket messages
4. Test with the provided test scripts before using in production
