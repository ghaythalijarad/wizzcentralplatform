#!/bin/bash

# Check Bedrock Access Script
# Polls AWS Bedrock API every 2 minutes to check if Claude access is granted

echo "🔍 Checking AWS Bedrock Claude 3 Sonnet access..."
echo "   This will check every 2 minutes until access is granted"
echo ""

ATTEMPT=1
MAX_ATTEMPTS=10

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS at $(date +%H:%M:%S)..."
    
    # Try to invoke the model
    RESULT=$(aws bedrock-runtime invoke-model \
        --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
        --region us-east-1 \
        --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' \
        --cli-binary-format raw-in-base64-out \
        /tmp/bedrock-check.json 2>&1)
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SUCCESS! Claude 3 Sonnet access is now ACTIVE!"
        echo ""
        echo "🎉 You can now use the AI assistant in whizzCentralPlatform"
        echo ""
        echo "📋 Next step: Redeploy the Lambda function"
        echo "   Run: ./deploy-ai-agent.sh dev"
        echo ""
        exit 0
    else
        if echo "$RESULT" | grep -q "use case details"; then
            echo "   ⏳ Still waiting for use case approval..."
        else
            echo "   ⚠️  Unexpected error: $RESULT"
        fi
        
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo "   Waiting 2 minutes before next check..."
            sleep 120
        fi
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "⏱️  Max attempts reached. Access might take longer than expected."
echo "   Check manually: aws bedrock-runtime invoke-model --model-id anthropic.claude-3-sonnet-20240229-v1:0 ..."
