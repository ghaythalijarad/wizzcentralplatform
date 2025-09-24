#!/bin/bash

echo "🎯 Driver Assignment System - Quick Setup"
echo "========================================="

# Check if running in the correct directory
if [ ! -f "serverless.yml" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Creating deployment package for manual upload..."

# Create a temporary directory for the package
mkdir -p deployment-package
cp -r src deployment-package/
cp package.json deployment-package/
cp package-lock.json deployment-package/ 2>/dev/null || true

# Create the zip file
cd deployment-package
zip -r ../order-stream-processor-manual.zip .
cd ..
rm -rf deployment-package

echo "✅ Deployment package created: order-stream-processor-manual.zip"
echo ""
echo "📋 Manual Deployment Steps:"
echo "1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda/"
echo "2. Create a new function:"
echo "   - Function name: wizzcentral-order-stream-processor"
echo "   - Runtime: Node.js 18.x"
echo "   - Architecture: x86_64"
echo "3. Upload the deployment package: order-stream-processor-manual.zip"
echo "4. Set the handler: src/handlers/order-stream-processor.handler"
echo "5. Configure environment variables:"
echo "   - ORDERS_TABLE: WizzOrders_dev"
echo "   - DRIVERS_TABLE: WhizzDrivers_dev"
echo "   - WEBSOCKET_CONNECTIONS_TABLE: WizzUser_websocket_connections_dev"
echo "   - WEBSOCKET_ENDPOINT: https://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev"
echo "6. Set timeout to 60 seconds and memory to 512 MB"
echo "7. Add IAM permissions for DynamoDB and WebSocket API"
echo ""
echo "📊 Next Steps:"
echo "1. Enable DynamoDB streams on WizzOrders_dev table"
echo "2. Create event source mapping to trigger the Lambda function"
echo "3. Test with order status changes"
echo ""
echo "📖 For detailed instructions, see: DRIVER_ASSIGNMENT_SETUP_GUIDE.md"
