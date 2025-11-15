#!/bin/bash
# Monitor Bedrock Anthropic Approval Status
# This script checks every minute if Anthropic model access has been approved

echo "🕐 Monitoring AWS Bedrock Anthropic approval..."
echo "⏰ Checking every 60 seconds..."
echo ""

attempt=1
max_attempts=20

while [ $attempt -le $max_attempts ]; do
    echo "[$attempt/$max_attempts] Testing at $(date +%H:%M:%S)..."
    
    # Test if we can invoke Claude model
    result=$(aws bedrock-runtime invoke-model \
        --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
        --region us-east-1 \
        --body '{"anthropic_version":"bedrock-2023-05-31","messages":[{"role":"user","content":[{"type":"text","text":"Hi"}]}],"max_tokens":10}' \
        /tmp/bedrock-test.json 2>&1)
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉🎉🎉 SUCCESS! Anthropic access is APPROVED! 🎉🎉🎉"
        echo ""
        echo "Response: $(cat /tmp/bedrock-test.json)"
        echo ""
        echo "✅ You can now test your AI agent!"
        echo ""
        echo "Test command:"
        echo "curl -X POST https://ocg3on3sf5.execute-api.us-east-1.amazonaws.com/dev/agent-suggestion \\"
        echo "  -H 'Content-Type: application/json' \\"
        echo "  -d '{\"userType\":\"customer\",\"message\":\"My delivery is late\",\"conversationHistory\":[]}'"
        exit 0
    else
        if echo "$result" | grep -q "Model use case details have not been submitted"; then
            echo "   ⏳ Still waiting for approval..."
        elif echo "$result" | grep -q "try again in 15 minutes"; then
            echo "   ⏳ Form submitted, waiting for approval..."
        else
            echo "   ❓ Unexpected response: $result"
        fi
    fi
    
    attempt=$((attempt + 1))
    
    if [ $attempt -le $max_attempts ]; then
        sleep 60
    fi
done

echo ""
echo "⏰ Monitoring timeout after 20 minutes."
echo "💡 Try manually testing: aws bedrock-runtime invoke-model --model-id anthropic.claude-3-sonnet-20240229-v1:0 --region us-east-1 ..."
