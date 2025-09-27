#!/bin/bash
# Dashboard for Order Monitoring

clear
echo "🎯 WizzCentral Driver Assignment Monitoring Dashboard"
echo "===================================================="
echo ""

show_status() {
    local timestamp=$(date '+%H:%M:%S')
    
    echo "🕐 Last Update: $timestamp"
    echo ""
    
    # Check current orders
    echo "📊 CURRENT ORDERS STATUS:"
    echo "------------------------"
    
    local orders_output=$(aws dynamodb scan \
        --table-name WizzOrders \
        --filter-expression "attribute_exists(PK) AND begins_with(PK, :prefix)" \
        --expression-attribute-values '{":prefix": {"S": "ORDER#"}}' \
        --region us-east-1 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local total_orders=$(echo "$orders_output" | jq '.Items | length' 2>/dev/null || echo "0")
        echo "📦 Total Orders: $total_orders"
        
        if [ "$total_orders" -gt 0 ]; then
            echo ""
            echo "Order Details:"
            echo "$orders_output" | jq -r '.Items[] | 
                "  🍽️  " + (.PK.S | gsub("ORDER#"; "")[0:8] + "...") +
                " | " + (.status.S // "unknown") +
                " | " + (.storeName.S // "Store") +
                " | " + (.customerName.S // "Customer") +
                " | " + (if .driverId.S then ("👤 " + .driverId.S[0:10] + "...") else "❌ No Driver" end) +
                " | " + (.total.N // "0") + " IQD"
            ' 2>/dev/null
        fi
        
        # Count by status
        local confirmed=$(echo "$orders_output" | jq '[.Items[] | select(.status.S == "confirmed")] | length' 2>/dev/null || echo "0")
        local ready=$(echo "$orders_output" | jq '[.Items[] | select(.status.S == "ready_for_pickup")] | length' 2>/dev/null || echo "0")
        local assigned=$(echo "$orders_output" | jq '[.Items[] | select(has("driverId") and .driverId.S != null)] | length' 2>/dev/null || echo "0")
        
        echo ""
        echo "Status Breakdown:"
        echo "  ✅ Confirmed: $confirmed"
        echo "  🚚 Ready for Pickup: $ready"
        echo "  👤 Assigned to Driver: $assigned"
    else
        echo "❌ Could not access orders table"
    fi
    
    echo ""
    echo "👥 DRIVER STATUS:"
    echo "----------------"
    
    # Check connected drivers
    local drivers_output=$(aws dynamodb scan \
        --table-name WizzUser_websocket_connections_dev \
        --filter-expression "attribute_exists(driverId) AND connectionStatus = :status" \
        --expression-attribute-values '{":status": {"S": "connected"}}' \
        --region us-east-1 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local connected_drivers=$(echo "$drivers_output" | jq '.Items | length' 2>/dev/null || echo "0")
        echo "🟢 Connected Drivers: $connected_drivers"
        
        if [ "$connected_drivers" -gt 0 ]; then
            echo ""
            echo "Connected Driver Details:"
            echo "$drivers_output" | jq -r '.Items[] | 
                "  👤 " + (.driverId.S // "Unknown") +
                " | Connected: " + (.connectedAt.S // "Unknown") +
                " | Connection: " + (.connectionId.S[0:8] + "...")
            ' 2>/dev/null
        fi
    else
        echo "❌ Could not access driver connections"
    fi
    
    echo ""
    echo "📱 WIZZDRIVER APP STATUS:"
    echo "------------------------"
    
    # Check if Flutter is running
    if pgrep -f "flutter run" > /dev/null; then
        echo "✅ WizzDriver app is running"
        echo "📲 Ready to receive driver assignment notifications"
    else
        echo "❌ WizzDriver app is not running"
        echo "💡 Start with: flutter run --debug"
    fi
    
    echo ""
    echo "🎯 MONITORING STATUS: ACTIVE"
    echo "📍 Watching for new orders from customers..."
    echo "🏪 Watching for merchant confirmations..."
    echo "🚚 Watching for automatic driver assignments..."
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
}

# Show initial status
show_status

echo "🔄 Auto-refresh every 10 seconds (Press Ctrl+C to stop)"
echo ""

# Auto-refresh loop
while true; do
    sleep 10
    clear
    echo "🎯 WizzCentral Driver Assignment Monitoring Dashboard"
    echo "===================================================="
    echo ""
    show_status
done
