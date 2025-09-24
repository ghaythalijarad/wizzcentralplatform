# Driver Assignment System - Setup Guide

## Overview
The Driver Assignment System automatically monitors the `WizzOrders_dev` DynamoDB table for order status changes and assigns available drivers when orders become ready for pickup.

## Architecture Components

### 1. Order Stream Processor (`src/handlers/order-stream-processor.js`)
- **Purpose**: Lambda function that processes DynamoDB stream events
- **Triggers**: Automatically triggered when order status changes
- **Actions**: 
  - Detects status changes to `ready_for_pickup`, `confirmed`, or `preparing_complete`
  - Calls the existing driver assignment service
  - Sends WebSocket notifications to all stakeholders

### 2. Driver Assignment Service (`src/services/driver-assignment-service.js`)
- **Purpose**: Core business logic for driver assignment
- **Features**:
  - Priority-based driver selection
  - Distance calculations
  - Availability checks
  - Fallback mechanisms
  - WebSocket notifications

### 3. WebSocket Integration (`src/handlers/websocket-connections.js`)
- **Purpose**: Real-time notifications to drivers, customers, restaurants, and admin
- **Features**:
  - Driver notifications for new assignments
  - Customer updates on order progress
  - Restaurant notifications
  - Admin alerts for failed assignments

## Deployment Steps

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Serverless Framework installed (`npm install -g serverless`)
3. Node.js 18.x or higher
4. Access to the following DynamoDB tables:
   - `WizzOrders_dev`
   - `WhizzDrivers_dev`
   - `WizzUser_websocket_connections_dev`

### Step 1: Install Dependencies
```bash
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
npm install
```

### Step 2: Configure AWS Profile (if needed)
```bash
# Check current AWS configuration
aws sts get-caller-identity

# If not configured, set up credentials
aws configure
```

### Step 3: Deploy the Lambda Function
```bash
# Option A: Using Serverless Framework (recommended)
serverless deploy --stage dev

# Option B: Manual deployment (if serverless fails)
# 1. Create deployment package
zip -r order-stream-processor.zip src/ package.json
# 2. Upload to AWS Lambda console
# 3. Set handler: src/handlers/order-stream-processor.handler
```

### Step 4: Enable DynamoDB Streams
```bash
# Enable streams on WizzOrders_dev table
aws dynamodb update-table \
  --table-name WizzOrders_dev \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region us-east-1

# Get the stream ARN
aws dynamodb describe-table \
  --table-name WizzOrders_dev \
  --region us-east-1 \
  --query 'Table.LatestStreamArn'
```

### Step 5: Create Event Source Mapping
```bash
# Replace STREAM_ARN with the ARN from step 4
# Replace FUNCTION_NAME with your deployed function name
aws lambda create-event-source-mapping \
  --function-name wizzcentral-unified-chat-dev-orderStreamProcessor \
  --event-source-arn STREAM_ARN \
  --starting-position LATEST \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5 \
  --region us-east-1
```

## Configuration

### Environment Variables
The Lambda function uses these environment variables:
- `ORDERS_TABLE`: WizzOrders_dev
- `DRIVERS_TABLE`: WhizzDrivers_dev
- `WEBSOCKET_CONNECTIONS_TABLE`: WizzUser_websocket_connections_dev
- `WEBSOCKET_ENDPOINT`: https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev

### IAM Permissions
The Lambda function needs these permissions:
- DynamoDB: Read/Write access to orders, drivers, and websocket connection tables
- DynamoDB Streams: Read access to WizzOrders_dev stream
- Execute API: ManageConnections for WebSocket notifications

## Testing

### 1. Local Testing
```bash
# Test the function locally
node simple-test.js
```

### 2. Manual Order Status Update
```bash
# Update an order status to trigger the system
aws dynamodb update-item \
  --table-name WizzOrders_dev \
  --key '{"PK":{"S":"ORDER#test123"},"SK":{"S":"ORDER#test123"}}' \
  --update-expression "SET #status = :status" \
  --expression-attribute-names '{"#status":"status"}' \
  --expression-attribute-values '{":status":{"S":"ready_for_pickup"}}' \
  --region us-east-1
```

### 3. Monitor Logs
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/wizzcentral-unified-chat-dev-orderStreamProcessor --follow
```

## Monitoring

### CloudWatch Metrics
- Lambda invocations
- Duration and memory usage
- Error rates
- DynamoDB stream processing

### CloudWatch Logs
- Order processing events
- Driver assignment attempts
- WebSocket notification status
- Error details

## Troubleshooting

### Common Issues

1. **Lambda Function Not Triggered**
   - Check if DynamoDB streams are enabled
   - Verify event source mapping exists
   - Check IAM permissions

2. **Driver Assignment Fails**
   - Verify driver data in WhizzDrivers_dev table
   - Check driver availability status
   - Review assignment logic in logs

3. **WebSocket Notifications Not Sent**
   - Verify WebSocket connections in database
   - Check WebSocket endpoint configuration
   - Review connection authentication

4. **AWS Credential Issues**
   - Verify AWS CLI configuration
   - Check IAM role permissions
   - Ensure correct AWS profile is used

### Log Analysis
```bash
# Search for specific order processing
aws logs filter-log-events \
  --log-group-name /aws/lambda/wizzcentral-unified-chat-dev-orderStreamProcessor \
  --filter-pattern "ORDER#12345"

# Check for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/wizzcentral-unified-chat-dev-orderStreamProcessor \
  --filter-pattern "ERROR"
```

## Success Indicators

✅ **System is working correctly when:**
1. Lambda function deploys successfully
2. DynamoDB streams are enabled and active
3. Event source mapping is created and enabled
4. Order status changes trigger the Lambda function
5. Available drivers receive WebSocket notifications
6. Orders get assigned to appropriate drivers
7. All stakeholders receive status updates

## Next Steps

After successful deployment:
1. Test with real order data
2. Monitor performance and optimize as needed
3. Set up alerting for failed assignments
4. Consider implementing driver preferences
5. Add analytics and reporting features

---

**Note**: This system integrates with existing WizzCentral Platform infrastructure and leverages the current driver assignment algorithms and WebSocket communication system.
