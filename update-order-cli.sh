#!/bin/bash
# Simple script to update order status using AWS CLI

ORDER_ID="7652780b-ce26-44c2-8825-c15b8c5d3308"
TABLE_NAME="WizzOrders"

echo "🚀 Updating order status to trigger driver assignment..."
echo "📦 Order ID: $ORDER_ID"

# Update order status to ready_for_pickup
echo "🔄 Changing status from 'confirmed' to 'ready_for_pickup'..."

aws dynamodb update-item \
  --table-name "$TABLE_NAME" \
  --key '{
    "PK": {"S": "ORDER#'"$ORDER_ID"'"},
    "SK": {"S": "META"}
  }' \
  --update-expression "SET #status = :status, updatedAt = :updatedAt, readyAt = :readyAt" \
  --expression-attribute-names '{
    "#status": "status"
  }' \
  --expression-attribute-values '{
    ":status": {"S": "ready_for_pickup"},
    ":updatedAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"'"},
    ":readyAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"'"}
  }' \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Order status updated successfully!"
    echo "📋 New status: ready_for_pickup"
    echo ""
    echo "🎯 This should trigger automatic driver assignment if:"
    echo "  1. DynamoDB streams are enabled (✅ confirmed)"
    echo "  2. Lambda function is deployed and configured"
    echo "  3. Event source mapping is active"
    echo "  4. Available drivers are online"
    echo ""
    echo "⏳ Waiting 10 seconds to check if assignment occurred..."
    sleep 10
    
    # Check if driver was assigned
    echo "🔍 Checking if driver was assigned..."
    aws dynamodb get-item \
      --table-name "$TABLE_NAME" \
      --key '{
        "PK": {"S": "ORDER#'"$ORDER_ID"'"},
        "SK": {"S": "META"}
      }' \
      --projection-expression "driverId, assignedAt, #status" \
      --expression-attribute-names '{
        "#status": "status"
      }' \
      --region us-east-1 \
      --output table
else
    echo "❌ Failed to update order status"
    exit 1
fi
