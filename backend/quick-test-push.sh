#!/bin/zsh

echo "🧪 Quick Push Notification Test"
echo "================================"
echo ""

# Create test payload file (API Gateway format)
cat > /tmp/push-test-payload.json <<'EOF'
{
  "httpMethod": "POST",
  "body": "{\"campaignId\":\"test_123\",\"title\":\"Test Push Notification\",\"message\":\"Testing the push notification system from WhizzCentralPlatform\",\"type\":\"promotion\",\"targetAudience\":\"merchants\",\"data\":{\"campaignId\":\"test_123\",\"discountType\":\"percentage\",\"discountValue\":25,\"minimumOrderValue\":0,\"validUntil\":\"2025-12-31\"}}"
}
EOF

echo "📤 Sending test notification..."
echo ""

# Invoke Lambda directly
aws lambda invoke \
  --function-name whizz-central-send-promotion-notification \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/push-test-payload.json \
  --region us-east-1 \
  --no-cli-pager \
  /tmp/push-test-response.json

echo ""
echo "📱 Response:"
cat /tmp/push-test-response.json | jq '.' 2>/dev/null || cat /tmp/push-test-response.json
echo ""

# Cleanup
rm -f /tmp/push-test-payload.json

# Check CloudWatch logs
echo ""
echo "📋 Recent logs:"
aws logs tail /aws/lambda/whizz-central-send-promotion-notification \
  --since 1m \
  --format short \
  --region us-east-1 \
  --no-cli-pager 2>/dev/null | tail -20

rm -f /tmp/push-test-response.json
