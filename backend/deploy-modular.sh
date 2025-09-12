#!/bin/bash

# WizzCentral Platform Modular Deployment Script
# This script deploys the backend services in modular stacks to avoid CloudFormation resource limits

echo "🚀 Starting WizzCentral Platform Modular Deployment"
echo "=================================================="

# Set the stage (default to dev)
STAGE=${1:-dev}
echo "📋 Deploying to stage: $STAGE"

# Change to the backend directory
cd "$(dirname "$0")/backend" || exit 1

# Function to deploy a service and check for errors
deploy_service() {
    local service_file=$1
    local service_name=$2
    
    echo ""
    echo "🔧 Deploying $service_name..."
    echo "─────────────────────────────────────"
    
    if serverless deploy --config $service_file --stage $STAGE; then
        echo "✅ $service_name deployed successfully"
        return 0
    else
        echo "❌ Failed to deploy $service_name"
        return 1
    fi
}

# Deploy services in order of dependencies
echo ""
echo "📦 Deploying Core Services (Authentication, Users)"
deploy_service "serverless.core.yml" "Core Services" || exit 1

echo ""
echo "📦 Deploying Business Services (Merchants, Customers, Drivers, Products)"
deploy_service "serverless.business.yml" "Business Services" || exit 1

echo ""
echo "📦 Deploying Order Management"
deploy_service "serverless.orders.yml" "Order Services" || exit 1

echo ""
echo "📦 Deploying WebSocket Services (if exists)"
if [ -f "serverless.websocket.yml" ]; then
    deploy_service "serverless.websocket.yml" "WebSocket Services" || exit 1
else
    echo "⚠️  WebSocket service config not found, skipping..."
fi

echo ""
echo "📦 Deploying Notification Services"
deploy_service "serverless.notifications.yml" "Notification Services" || exit 1

echo ""
echo "📦 Deploying Support Services"
deploy_service "serverless.support.yml" "Support Services" || exit 1

echo ""
echo "🎉 All services deployed successfully!"
echo "======================================"

# Display service information
echo ""
echo "📊 Service Endpoints Summary:"
echo "─────────────────────────────"

for service in core business orders notifications support; do
    echo ""
    echo "🔗 $service service:"
    if serverless info --config "serverless.$service.yml" --stage $STAGE 2>/dev/null | grep -E "(endpoints|functions)" -A 10; then
        continue
    else
        echo "   ⚠️  Could not retrieve info for $service service"
    fi
done

echo ""
echo "✨ WizzCentral Platform deployment completed!"
echo "You can now test the individual services or proceed with frontend deployment."
