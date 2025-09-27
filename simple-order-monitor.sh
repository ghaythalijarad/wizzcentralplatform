#!/bin/bash
# Simple Order Monitoring Script using AWS CLI

echo "🚀 Real-time Order Monitoring System"
echo "===================================="
echo ""
echo "📱 Make sure WizzDriver app is running!"
echo "🛒 Place orders through customer app and confirm through merchant app"
echo "👀 Monitoring WizzOrders table for changes..."
echo ""

# Store previous scan results
PREV_COUNT=0
PREV_HASH=""

monitor_orders() {
    while true; do
        # Get current timestamp
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        
        # Scan orders table
        CURRENT_SCAN=$(aws dynamodb scan \
            --table-name WizzOrders \
            --filter-expression "attribute_exists(PK) AND begins_with(PK, :prefix)" \
            --expression-attribute-values '{":prefix": {"S": "ORDER#"}}' \
            --region us-east-1 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            # Count orders
            CURRENT_COUNT=$(echo "$CURRENT_SCAN" | jq '.Items | length' 2>/dev/null || echo "0")
            
            # Create a hash of the current state
            CURRENT_HASH=$(echo "$CURRENT_SCAN" | jq -c '.Items | sort_by(.PK.S)' | md5)
            
            # Check for changes
            if [ "$CURRENT_COUNT" != "$PREV_COUNT" ] || [ "$CURRENT_HASH" != "$PREV_HASH" ]; then
                echo "[$TIMESTAMP] 🔄 Orders table changed! Analyzing..."
                
                # Extract and display order information
                echo "$CURRENT_SCAN" | jq -r '.Items[] | 
                    "  📦 Order: " + (.PK.S | gsub("ORDER#"; "")) +
                    " | Status: " + (.status.S // "unknown") +
                    " | Customer: " + (.customerName.S // "N/A") +
                    " | Store: " + (.storeName.S // "N/A") +
                    " | Driver: " + (if .driverId.S then .driverId.S else "NOT ASSIGNED" end) +
                    " | Total: " + (.total.N // "0") + " IQD"
                ' 2>/dev/null
                
                echo "[$TIMESTAMP] 📊 Total Orders: $CURRENT_COUNT"
                
                # Check for orders ready for assignment
                READY_ORDERS=$(echo "$CURRENT_SCAN" | jq '[.Items[] | select(.status.S == "confirmed" or .status.S == "ready_for_pickup")] | length' 2>/dev/null || echo "0")
                ASSIGNED_ORDERS=$(echo "$CURRENT_SCAN" | jq '[.Items[] | select(has("driverId") and .driverId.S != null)] | length' 2>/dev/null || echo "0")
                
                echo "[$TIMESTAMP] 🎯 Ready for Assignment: $READY_ORDERS | Already Assigned: $ASSIGNED_ORDERS"
                
                # Check for connected drivers
                CONNECTED_DRIVERS=$(aws dynamodb scan \
                    --table-name WizzUser_websocket_connections_dev \
                    --filter-expression "attribute_exists(driverId) AND connectionStatus = :status" \
                    --expression-attribute-values '{":status": {"S": "connected"}}' \
                    --select COUNT \
                    --region us-east-1 \
                    --query 'Count' \
                    --output text 2>/dev/null || echo "0")
                
                echo "[$TIMESTAMP] 👥 Connected Drivers: $CONNECTED_DRIVERS"
                echo ""
                
                # Update previous values
                PREV_COUNT="$CURRENT_COUNT"
                PREV_HASH="$CURRENT_HASH"
            else
                echo "[$TIMESTAMP] ✅ Monitoring... (no changes detected)"
            fi
        else
            echo "[$TIMESTAMP] ❌ Error accessing DynamoDB"
        fi
        
        # Wait 5 seconds before next check
        sleep 5
    done
}

echo "🔄 Starting continuous monitoring (checking every 5 seconds)..."
echo "Press Ctrl+C to stop"
echo ""

# Start monitoring
monitor_orders
