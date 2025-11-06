#!/bin/bash
# Cleanup Legacy JavaScript Files
# Date: November 5, 2025

cd "$(dirname "$0")"

echo "=== REMOVING LEGACY JAVASCRIPT FILES ==="
echo ""

# Mapbox testing files (V2 system)
rm -f test-mapbox-api.js test-mapbox-quick.js test-mapbox-simple.js
echo "✅ Removed Mapbox testing files"

# Documentation/demonstration JS files
rm -f FINAL_SYSTEM_DEMONSTRATION.js LIVE_CHAT_AGENT_REGISTRATION_SUCCESS.js
echo "✅ Removed documentation JS files"

# Status/diagnostic files
rm -f status-summary.js status-fields-verification.js
rm -f driver-assignment-fixes-summary.js
rm -f final-status-report.js final-system-validation.js 
rm -f final-validation-report.js final-websocket-validation.js
echo "✅ Removed status/diagnostic files"

# Testing/debugging files
rm -f test-login.js test-cognito-login.js test-dynamodb-connection.js
rm -f debug-websocket.js debug-websocket-connections.js websocket-diagnostic.js
rm -f quick-diagnosis.js diagnose-assignment-issue.js
echo "✅ Removed testing/debugging files"

# Manual operation scripts (one-time use)
rm -f add-online-status-fields.js update-driver-status-fields.js 
rm -f update-driver-status-v2.js update-driver-to-online.js
rm -f update-order-status.js
rm -f populate-sample-orders.js execute-population.js
rm -f simple-confirmed-order.js simple-create-driver.js quick-create-driver.js
rm -f create-fake-driver-connection.js create-order-and-assign-driver.js
rm -f assign-driver-to-order.js manual-assignment-trigger.js
rm -f sync-to-aws-dynamodb.js
echo "✅ Removed manual operation scripts"

# Flutter validation files
rm -f flutter-driver-simulator.js flutter-validation-guide.js
echo "✅ Removed Flutter validation files"

# Other legacy/test files
rm -f local-chat-bridge.js simple-server.js
rm -f verify-auto-assignment-config.js verify-aws-table.js
rm -f validate-orders-system.js
echo "✅ Removed other legacy files"

echo ""
echo "=== CLEANUP COMPLETE: 42 JavaScript files removed ==="
