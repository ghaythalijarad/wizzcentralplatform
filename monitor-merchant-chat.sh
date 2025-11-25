#!/bin/bash

# Monitor Lambda logs for merchant chat
echo "🔍 Monitoring Lambda Logs for Merchant Chat"
echo "==========================================="
echo ""
echo "Watching for:"
echo "  🏪 Merchant connections"
echo "  💬 Chat messages"
echo "  🔔 Agent notifications"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Monitor the Lambda function logs
aws logs tail /aws/lambda/wizzcentral-websocket-dev-liveChatConnect \
  --follow \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --format short \
  --filter-pattern "merchant|Merchant|chat_merchant|ERROR|error"
