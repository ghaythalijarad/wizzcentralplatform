#!/bin/bash

# Amazon Connect Infrastructure Deployment Script
# This script deploys the Amazon Connect infrastructure for WizzCentral Customer Support

set -e

# Configuration
STACK_NAME="wizzcentral-connect-infrastructure"
TEMPLATE_FILE="aws-connect-infrastructure.yaml"
REGION="${AWS_REGION:-us-east-1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@wizzcentral.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Please run 'aws configure' first."
    fi
    
    # Check if template file exists
    if [ ! -f "$TEMPLATE_FILE" ]; then
        error "CloudFormation template file '$TEMPLATE_FILE' not found."
    fi
    
    log "Prerequisites check passed."
}

# Validate CloudFormation template
validate_template() {
    log "Validating CloudFormation template..."
    
    if aws cloudformation validate-template --template-body file://$TEMPLATE_FILE --region $REGION > /dev/null; then
        log "Template validation successful."
    else
        error "Template validation failed."
    fi
}

# Check if stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null
}

# Deploy or update stack
deploy_stack() {
    local action
    local parameters="ParameterKey=AdminEmail,ParameterValue=$ADMIN_EMAIL"
    
    if stack_exists; then
        action="update"
        log "Stack exists. Updating stack '$STACK_NAME'..."
        
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://$TEMPLATE_FILE \
            --parameters $parameters \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $REGION
    else
        action="create"
        log "Creating new stack '$STACK_NAME'..."
        
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://$TEMPLATE_FILE \
            --parameters $parameters \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $REGION
    fi
    
    log "Stack $action initiated. Waiting for completion..."
    
    # Wait for stack operation to complete
    if [ "$action" = "create" ]; then
        aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION
    else
        aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION
    fi
    
    log "Stack $action completed successfully."
}

# Get stack outputs
get_stack_outputs() {
    log "Retrieving stack outputs..."
    
    local outputs=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output table)
    
    echo "$outputs"
    
    # Save outputs to file for later use
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output json > stack-outputs.json
    
    log "Stack outputs saved to stack-outputs.json"
}

# Configure Connect instance
configure_connect_instance() {
    log "Configuring Amazon Connect instance..."
    
    # Get Connect instance ID from stack outputs
    local instance_id=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ConnectInstanceId`].OutputValue' \
        --output text)
    
    if [ -z "$instance_id" ]; then
        error "Could not retrieve Connect instance ID from stack outputs."
    fi
    
    log "Connect instance ID: $instance_id"
    
    # Update environment configuration
    cat > connect-config.env << EOF
# Amazon Connect Configuration
CONNECT_INSTANCE_ID=$instance_id
CONNECT_INSTANCE_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ConnectInstanceArn`].OutputValue' \
    --output text)
CONNECT_REGION=$REGION
AWS_REGION=$REGION

# Lambda Function ARNs
USER_CONTEXT_LOOKUP_FUNCTION_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserContextLookupFunctionArn`].OutputValue' \
    --output text)

# CCP URL (will be available after instance is fully provisioned)
CONNECT_CCP_URL=https://$instance_id.my.connect.aws/ccp-v2/
EOF
    
    log "Configuration saved to connect-config.env"
    
    # Create a simple test script
    cat > test-connect-setup.sh << 'EOF'
#!/bin/bash
# Test Amazon Connect setup

source connect-config.env

echo "Testing Amazon Connect instance..."
aws connect describe-instance --instance-id $CONNECT_INSTANCE_ID --region $CONNECT_REGION

echo "Testing Lambda function..."
aws lambda get-function --function-name $(basename $USER_CONTEXT_LOOKUP_FUNCTION_ARN) --region $CONNECT_REGION

echo "Connect CCP URL: $CONNECT_CCP_URL"
echo "Setup test completed."
EOF
    
    chmod +x test-connect-setup.sh
    log "Test script created: test-connect-setup.sh"
}

# Update support page configuration
update_support_page() {
    log "Updating support page configuration..."
    
    # Get instance ID
    local instance_id=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ConnectInstanceId`].OutputValue' \
        --output text)
    
    if [ -f "frontend/support.js" ]; then
        # Update the CCP URL in support.js
        sed -i.bak "s|ccpUrl:.*|ccpUrl: 'https://$instance_id.my.connect.aws/ccp-v2/',|" frontend/support.js
        log "Updated support.js with new CCP URL"
    fi
    
    # Create configuration update script
    cat > update-frontend-config.js << EOF
// Update frontend configuration with Amazon Connect details
const fs = require('fs');

const config = {
    connectInstanceId: '$instance_id',
    connectRegion: '$REGION',
    ccpUrl: 'https://$instance_id.my.connect.aws/ccp-v2/',
    apiEndpoint: 'https://your-api-domain.com/api/chat', // Update with your API Gateway endpoint
};

// Update config file
fs.writeFileSync('frontend/connect-config.json', JSON.stringify(config, null, 2));
console.log('Frontend configuration updated');
EOF
    
    node update-frontend-config.js
    log "Frontend configuration updated"
}

# Create deployment summary
create_deployment_summary() {
    log "Creating deployment summary..."
    
    cat > AMAZON_CONNECT_DEPLOYMENT_COMPLETE.md << EOF
# Amazon Connect Deployment Complete

## Deployment Summary
- **Stack Name**: $STACK_NAME
- **Region**: $REGION
- **Deployment Date**: $(date)
- **Admin Email**: $ADMIN_EMAIL

## Resources Created
- Amazon Connect Instance
- Lambda Functions for user context lookup
- IAM Roles and Policies
- CloudWatch Log Groups

## Next Steps

### 1. Access Amazon Connect Console
Visit the Amazon Connect console to complete setup:
https://console.aws.amazon.com/connect/home?region=$REGION

### 2. Configure Contact Flows
- Create contact flows for different user types (customer, driver, merchant)
- Set up routing profiles and queues
- Configure agent permissions

### 3. Update Frontend Configuration
- The support page has been updated with the new CCP URL
- Test the CCP integration in the support interface
- Configure API endpoints for chat initiation

### 4. Test the Integration
Run the test script:
\`\`\`bash
./test-connect-setup.sh
\`\`\`

### 5. Deploy Flutter App Updates
Follow the Flutter integration guide:
- Update API endpoints
- Implement Amazon Connect Chat SDK
- Test mobile app integration

## Configuration Files
- \`connect-config.env\`: Environment variables
- \`stack-outputs.json\`: CloudFormation outputs
- \`frontend/connect-config.json\`: Frontend configuration

## Support URLs
- **CCP URL**: https://$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`ConnectInstanceId`].OutputValue' --output text).my.connect.aws/ccp-v2/
- **Admin Portal**: https://$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`ConnectInstanceId`].OutputValue' --output text).my.connect.aws/

## Troubleshooting
If you encounter issues:
1. Check AWS CloudFormation console for stack events
2. Verify IAM permissions
3. Check Lambda function logs in CloudWatch
4. Test API endpoints independently

## Monitoring
Monitor the deployment using:
- CloudWatch metrics for Lambda functions
- Amazon Connect metrics in the console
- API Gateway metrics (when deployed)

Deployment completed successfully! 🎉
EOF
    
    log "Deployment summary created: AMAZON_CONNECT_DEPLOYMENT_COMPLETE.md"
}

# Main deployment function
main() {
    log "Starting Amazon Connect infrastructure deployment..."
    log "Stack Name: $STACK_NAME"
    log "Region: $REGION"
    log "Admin Email: $ADMIN_EMAIL"
    
    check_prerequisites
    validate_template
    deploy_stack
    get_stack_outputs
    configure_connect_instance
    update_support_page
    create_deployment_summary
    
    log "🎉 Amazon Connect infrastructure deployment completed successfully!"
    log "📖 Check AMAZON_CONNECT_DEPLOYMENT_COMPLETE.md for next steps"
    log "🧪 Run './test-connect-setup.sh' to test the setup"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "delete")
        log "Deleting stack '$STACK_NAME'..."
        aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION
        log "Stack deletion initiated. Monitor progress in AWS console."
        ;;
    "status")
        log "Checking stack status..."
        aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].StackStatus' --output text
        ;;
    "outputs")
        get_stack_outputs
        ;;
    "test")
        if [ -f "test-connect-setup.sh" ]; then
            ./test-connect-setup.sh
        else
            error "Test script not found. Run deployment first."
        fi
        ;;
    *)
        echo "Usage: $0 [deploy|delete|status|outputs|test]"
        echo "  deploy  - Deploy or update the infrastructure (default)"
        echo "  delete  - Delete the infrastructure"
        echo "  status  - Check stack status"
        echo "  outputs - Show stack outputs"
        echo "  test    - Run setup test"
        exit 1
        ;;
esac
