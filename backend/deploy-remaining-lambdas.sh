#!/bin/bash
# Deploy remaining Lambda functions for push notification system

cd /Users/ghaythallaheebi/wizzcentralplatform/backend

REGION="us-east-1"
ROLE_ARN="arn:aws:iam::031857856164:role/WizzCentral-Lambda-Role"
PINPOINT_APP_ID="4dd08f1e7468474283e6e9bb04146574"

echo "Deploying remaining Lambda functions..."

# Function to deploy a Lambda function
deploy_function() {
    local function_name=$1
    local source_file=$2
    local description=$3
    
    echo "📦 Preparing $function_name..."
    
    # Clean and prepare temp directory
    rm -rf temp_lambda
    mkdir -p temp_lambda
    
    # Copy function code and requirements
    cp lambda/$source_file temp_lambda/lambda_function.py
    cp lambda/requirements.txt temp_lambda/
    
    # Install dependencies and create zip
    cd temp_lambda
    pip install -r requirements.txt -t . --quiet
    zip -r ../${function_name}.zip . > /dev/null 2>&1
    cd ..
    
    # Deploy to AWS
    echo "🚀 Deploying $function_name..."
    aws lambda create-function \
        --function-name $function_name \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://${function_name}.zip \
        --description "$description" \
        --environment Variables="{PINPOINT_APPLICATION_ID=$PINPOINT_APP_ID}" \
        --timeout 30 \
        --region $REGION \
        --query 'FunctionName' \
        --output text
    
    if [ $? -eq 0 ]; then
        echo "✅ $function_name deployed successfully"
    else
        echo "❌ Failed to deploy $function_name"
    fi
    
    # Cleanup
    rm -f ${function_name}.zip
    echo ""
}

# Deploy each function
deploy_function "send_notification_to_drivers" "send_notification_to_drivers.py" "Send push notifications to all drivers using Pinpoint"
deploy_function "send_regional_promotion" "send_regional_promotion.py" "Send targeted promotions to drivers in specific regions"
deploy_function "handle_promotion_creation" "handle_promotion_creation.py" "DynamoDB stream trigger for promotion creation events"

# Cleanup temp directory
rm -rf temp_lambda

echo "🎉 Deployment complete!"
echo ""
echo "📋 Summary of deployed functions:"
aws lambda list-functions --query 'Functions[?contains(FunctionName, `send_`) || contains(FunctionName, `handle_`) || contains(FunctionName, `register_`)].FunctionName' --output table --region $REGION

echo ""
echo "🔗 Next steps:"
echo "1. Set up DynamoDB stream trigger for handle_promotion_creation function"
echo "2. Create API Gateway endpoints for the Lambda functions"
echo "3. Configure Firebase FCM/APNs in the Flutter app"
echo "4. Test the complete push notification flow"
