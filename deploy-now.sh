#!/bin/zsh

LOG_FILE="/tmp/lambda-deployment-$(date +%s).log"

echo "🔄 Starting Lambda Deployment" | tee "$LOG_FILE"
echo "======================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

echo "📦 Creating deployment package..." | tee -a "$LOG_FILE"
cd backend/src
rm -f ../../chat-websocket-handler.zip
zip -q -r ../../chat-websocket-handler.zip .
cd ../..

if [ -f "chat-websocket-handler.zip" ]; then
    SIZE=$(ls -lh chat-websocket-handler.zip | awk '{print $5}')
    echo "✅ Package created: $SIZE" | tee -a "$LOG_FILE"
else
    echo "❌ Failed to create package" | tee -a "$LOG_FILE"
    exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "☁️ Uploading to AWS Lambda..." | tee -a "$LOG_FILE"

aws lambda update-function-code \
    --function-name chat-websocket-handler \
    --zip-file fileb://chat-websocket-handler.zip \
    --region us-east-1 \
    >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ DEPLOYMENT SUCCESSFUL!" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "📝 Log file: $LOG_FILE" | tee -a "$LOG_FILE"
else
    echo "" | tee -a "$LOG_FILE"
    echo "❌ DEPLOYMENT FAILED" | tee -a "$LOG_FILE"
    echo "📝 Check log file: $LOG_FILE" | tee -a "$LOG_FILE"
    exit 1
fi
