#!/bin/bash

# Enhanced Amazon Connect Chat System Deployment Script
# This script deploys the enhanced backend with file attachments, chat history, and real-time features

set -e

echo "🚀 Starting Enhanced Amazon Connect Chat System Deployment"
echo "=========================================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework is not installed. Installing..."
    npm install -g serverless
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Verify AWS credentials
echo "🔑 Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured properly."
    echo "Please run 'aws configure' to set up your credentials."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"
echo "✅ AWS Region: $AWS_REGION"

# Set deployment stage
STAGE=${1:-dev}
echo "🎯 Deployment Stage: $STAGE"

# Deploy the enhanced Amazon Connect system
echo ""
echo "🔧 Deploying Enhanced Amazon Connect Chat System..."
echo "=================================================="

# Deploy using serverless
echo "📦 Deploying serverless functions and resources..."
serverless deploy --config serverless.amazon-connect-enhanced.yml --stage $STAGE --verbose

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Enhanced Amazon Connect Chat System deployed successfully!"
    echo "==========================================================="
    
    # Get deployment outputs
    echo ""
    echo "📊 Deployment Information:"
    echo "========================="
    
    # Get API Gateway endpoint
    API_ENDPOINT=$(serverless info --config serverless.amazon-connect-enhanced.yml --stage $STAGE | grep -E "https://.*\.execute-api\." | head -1 | awk '{print $NF}')
    echo "🌐 Enhanced Chat API Endpoint: $API_ENDPOINT"
    
    # Get WebSocket endpoint
    WS_ENDPOINT=$(serverless info --config serverless.amazon-connect-enhanced.yml --stage $STAGE | grep -E "wss://.*\.execute-api\." | head -1 | awk '{print $NF}')
    echo "🔗 WebSocket Endpoint: $WS_ENDPOINT"
    
    # Get S3 bucket name
    S3_BUCKET="wizzcentral-amazon-connect-enhanced-chat-files-$STAGE"
    echo "📁 Chat Files S3 Bucket: $S3_BUCKET"
    
    # List DynamoDB tables
    echo ""
    echo "🗄️  DynamoDB Tables Created:"
    echo "============================"
    aws dynamodb list-tables --query "TableNames[?contains(@, 'wizzcentral-amazon-connect-enhanced')]" --output table
    
    # Test basic connectivity
    echo ""
    echo "🧪 Testing Basic Connectivity..."
    echo "==============================="
    
    if [ ! -z "$API_ENDPOINT" ]; then
        # Test health endpoint (if it exists)
        echo "Testing API connectivity..."
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health" || echo "000")
        
        if [ "$HTTP_STATUS" = "200" ]; then
            echo "✅ API Gateway is responding"
        else
            echo "⚠️  API Gateway health check returned status: $HTTP_STATUS"
        fi
    fi
    
    # Create sample agent data
    echo ""
    echo "👥 Creating Sample Agent Data..."
    echo "==============================="
    
    # Sample agent data
    cat > /tmp/sample_agent.json << EOF
{
    "agentId": "agent-001",
    "name": "Sarah Agent",
    "email": "sarah.agent@wizzcentral.com",
    "status": "available",
    "currentQueue": "general",
    "skills": ["english", "arabic", "technical_support"],
    "languages": ["en", "ar"],
    "maxConcurrentChats": 5,
    "currentChats": 0,
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
}
EOF

    # Insert sample agent into DynamoDB
    AGENT_TABLE="wizzcentral-amazon-connect-enhanced-agents-$STAGE"
    aws dynamodb put-item \
        --table-name "$AGENT_TABLE" \
        --item file:///tmp/sample_agent.json \
        --condition-expression "attribute_not_exists(agentId)" 2>/dev/null || echo "⚠️  Sample agent already exists"
    
    echo "✅ Sample agent created: agent-001"
    
    # Clean up temporary file
    rm /tmp/sample_agent.json
    
    # Display next steps
    echo ""
    echo "🎯 Next Steps:"
    echo "=============="
    echo "1. Update your frontend configuration with the new endpoints:"
    echo "   - Enhanced Chat API: $API_ENDPOINT"
    echo "   - WebSocket URL: $WS_ENDPOINT"
    echo "   - Files Bucket: $S3_BUCKET"
    echo ""
    echo "2. Test the enhanced features:"
    echo "   - File attachments in chat"
    echo "   - Chat history and export"
    echo "   - Real-time typing indicators"
    echo "   - Agent status management"
    echo ""
    echo "3. Configure Amazon Connect:"
    echo "   - Ensure contact flows are updated"
    echo "   - Configure agent routing rules"
    echo "   - Set up monitoring and alerts"
    echo ""
    echo "4. Frontend Integration:"
    echo "   - Update amazon-connect-chat.js with new endpoints"
    echo "   - Test enhanced chat features"
    echo "   - Configure real-time WebSocket connections"
    
    # Create configuration file for frontend
    echo ""
    echo "📝 Creating Frontend Configuration..."
    echo "===================================="
    
    cat > ../frontend/amazon-connect-enhanced-config.js << EOF
// Enhanced Amazon Connect Chat Configuration
// Auto-generated on $(date)

window.AMAZON_CONNECT_ENHANCED_CONFIG = {
    // API Endpoints
    apiEndpoint: '$API_ENDPOINT',
    websocketEndpoint: '$WS_ENDPOINT',
    
    // AWS Resources
    filesS3Bucket: '$S3_BUCKET',
    region: '$AWS_REGION',
    
    // Amazon Connect
    connectInstanceId: '35281ded-3770-4eb9-ab23-9c7415f8cb9b',
    contactFlowId: '67330f39-fe8c-4f0f-b824-3d50731b08d9',
    
    // Feature Flags
    features: {
        fileAttachments: true,
        chatHistory: true,
        typingIndicators: true,
        readReceipts: true,
        agentRouting: true,
        multiLanguage: true,
        analytics: true
    },
    
    // File Upload Settings
    fileUpload: {
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },
    
    // Chat Settings
    chat: {
        maxMessageLength: 2000,
        typingIndicatorTimeout: 3000,
        presenceUpdateInterval: 30000,
        reconnectAttempts: 5,
        reconnectDelay: 1000
    }
};

console.log('Enhanced Amazon Connect configuration loaded:', window.AMAZON_CONNECT_ENHANCED_CONFIG);
EOF
    
    echo "✅ Configuration file created: ../frontend/amazon-connect-enhanced-config.js"
    
else
    echo ""
    echo "❌ Deployment failed!"
    echo "==================="
    echo "Please check the error messages above and try again."
    exit 1
fi

echo ""
echo "🎉 Enhanced Amazon Connect Chat System Deployment Complete!"
echo "==========================================================="
echo "Your enhanced chat system is now ready with:"
echo "✅ File attachment support"
echo "✅ Chat history and export"
echo "✅ Real-time typing indicators"
echo "✅ Agent management and routing"
echo "✅ WebSocket real-time features"
echo "✅ Analytics and monitoring"
echo ""
echo "Happy chatting! 🚀"
