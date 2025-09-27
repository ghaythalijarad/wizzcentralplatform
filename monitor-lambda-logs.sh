#!/bin/bash
# Monitor Lambda Function Logs for Driver Assignment Processing

echo "🔍 Monitoring Lambda Function Logs for Driver Assignment"
echo "======================================================="
echo ""

# Check if there are stream processor functions
echo "📋 Available Lambda functions for order processing:"
aws lambda list-functions --region us-east-1 --query 'Functions[?contains(FunctionName, `stream`) || contains(FunctionName, `order`) || contains(FunctionName, `processor`)].FunctionName' --output table

echo ""
echo "🔄 Starting real-time log monitoring..."
echo "💡 This will show Lambda function executions triggered by DynamoDB streams"
echo ""

# Function to monitor logs
monitor_function_logs() {
    local function_name=$1
    echo "📊 Monitoring: $function_name"
    
    # Tail logs for the function
    aws logs tail "/aws/lambda/$function_name" --follow --region us-east-1 --since 1m 2>/dev/null &
    local pid=$!
    
    return $pid
}

# List of potential function names to monitor
FUNCTIONS=(
    "order-receiver-stream-processor-dev-v1"
    "wizzcentral-unified-chat-dev-orderStreamProcessor" 
    "order-stream-processor"
    "driver-assignment-processor"
)

# Start monitoring all relevant functions
for func in "${FUNCTIONS[@]}"; do
    # Check if function exists
    if aws lambda get-function --function-name "$func" --region us-east-1 >/dev/null 2>&1; then
        echo "✅ Found function: $func"
        monitor_function_logs "$func"
    else
        echo "⚠️ Function not found: $func"
    fi
done

echo ""
echo "🎯 Monitoring active. When orders are placed and confirmed:"
echo "  1. Customer places order → Status: 'pending'"
echo "  2. Merchant confirms order → Status: 'confirmed'"
echo "  3. Order ready for pickup → Status: 'ready_for_pickup'"
echo "  4. DynamoDB stream triggers Lambda function"
echo "  5. Lambda function processes driver assignment"
echo "  6. Driver gets WebSocket notification"
echo ""
echo "📱 Make sure your WizzDriver app is running!"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Keep the script running
wait
