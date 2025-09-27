#!/bin/bash
# Manual Driver Assignment Script for WizzOrders

ORDER_ID="7652780b-ce26-44c2-8825-c15b8c5d3308"
ORDERS_TABLE="WizzOrders"
DRIVERS_TABLE="WizzUser_drivers_dev"
WEBSOCKET_TABLE="WizzUser_websocket_connections_dev"

echo "🚀 Manual Driver Assignment System"
echo "=====================================\n"

# Step 1: Check current order status
echo "📦 Checking current order status..."
ORDER_STATUS=$(aws dynamodb get-item \
  --table-name "$ORDERS_TABLE" \
  --key '{"PK": {"S": "ORDER#'"$ORDER_ID"'"}, "SK": {"S": "META"}}' \
  --query 'Item.status.S' \
  --output text \
  --region us-east-1 2>/dev/null)

if [ -z "$ORDER_STATUS" ]; then
    echo "❌ Order not found!"
    exit 1
fi

echo "📋 Current order status: $ORDER_STATUS"

# Check if already assigned
CURRENT_DRIVER=$(aws dynamodb get-item \
  --table-name "$ORDERS_TABLE" \
  --key '{"PK": {"S": "ORDER#'"$ORDER_ID"'"}, "SK": {"S": "META"}}' \
  --query 'Item.driverId.S' \
  --output text \
  --region us-east-1 2>/dev/null)

if [ "$CURRENT_DRIVER" != "None" ] && [ ! -z "$CURRENT_DRIVER" ]; then
    echo "⚠️ Order already assigned to driver: $CURRENT_DRIVER"
    echo "Continuing anyway for demonstration..."
fi

# Step 2: Find available drivers
echo "\n🔍 Looking for available drivers..."

# First, let's find any drivers in the system
DRIVERS=$(aws dynamodb scan \
  --table-name "$DRIVERS_TABLE" \
  --projection-expression "driverId, driverName, #status" \
  --expression-attribute-names '{"#status": "status"}' \
  --region us-east-1 \
  --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Found drivers in system"
    # Extract first available driver ID
    AVAILABLE_DRIVER=$(echo "$DRIVERS" | grep -o '"driverId":{"S":"[^"]*"' | head -1 | sed 's/.*"S":"\([^"]*\)".*/\1/')
    
    if [ ! -z "$AVAILABLE_DRIVER" ]; then
        echo "🎯 Selected driver: $AVAILABLE_DRIVER"
        
        # Step 3: Assign driver to order
        echo "\n📝 Assigning driver to order..."
        
        ASSIGN_RESULT=$(aws dynamodb update-item \
          --table-name "$ORDERS_TABLE" \
          --key '{"PK": {"S": "ORDER#'"$ORDER_ID"'"}, "SK": {"S": "META"}}' \
          --update-expression "SET driverId = :driverId, #status = :status, assignedAt = :assignedAt, updatedAt = :updatedAt" \
          --expression-attribute-names '{"#status": "status"}' \
          --expression-attribute-values '{
            ":driverId": {"S": "'"$AVAILABLE_DRIVER"'"},
            ":status": {"S": "assigned_to_driver"},
            ":assignedAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"'"},
            ":updatedAt": {"S": "'"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"'"}
          }' \
          --region us-east-1 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "✅ Driver assignment successful!"
            echo "🎉 Order $ORDER_ID is now assigned to driver $AVAILABLE_DRIVER"
            
            # Step 4: Verify assignment
            echo "\n🔍 Verifying assignment..."
            UPDATED_ORDER=$(aws dynamodb get-item \
              --table-name "$ORDERS_TABLE" \
              --key '{"PK": {"S": "ORDER#'"$ORDER_ID"'"}, "SK": {"S": "META"}}' \
              --projection-expression "#status, driverId, assignedAt" \
              --expression-attribute-names '{"#status": "status"}' \
              --region us-east-1 \
              --output json 2>/dev/null)
            
            if [ $? -eq 0 ]; then
                echo "📊 Assignment verification:"
                echo "$UPDATED_ORDER" | grep -E '"status"|"driverId"|"assignedAt"' | sed 's/^/  /'
            fi
            
            echo "\n🎯 Next Steps:"
            echo "  1. Driver should receive notification via WebSocket"
            echo "  2. Driver can accept/reject in WizzDriver mobile app"  
            echo "  3. Order status will update based on driver response"
            echo "\n📱 Check the WizzDriver app for assignment notification!"
            
        else
            echo "❌ Failed to assign driver to order"
        fi
    else
        echo "❌ No drivers found in the system"
    fi
else
    echo "❌ Error accessing drivers table"
fi

echo "\n🏁 Manual assignment process completed!"
