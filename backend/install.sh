#!/bin/bash

# WizzCentral Backend Installation Script
echo "🚀 Installing WizzCentral Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    echo "✅ Node.js version $NODE_VERSION is compatible"
else
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to 18.x or higher."
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install and configure AWS CLI."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'."
    exit 1
fi

echo "✅ AWS CLI is configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Install Serverless Framework globally if not present
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Serverless Framework"
        exit 1
    fi
    
    echo "✅ Serverless Framework installed"
fi

# Create environment file template
if [ ! -f .env ]; then
    echo "📝 Creating environment file template..."
    cat > .env << EOL
# WizzCentral Backend Environment Variables
JWT_SECRET=wizzcentral-super-secret-key-$(date +%s)
STAGE=dev
REGION=us-east-1

# Email Configuration (Update with your verified SES email)
FROM_EMAIL=noreply@wizzcentral.com

# Optional: Custom domain
# DOMAIN_NAME=api.wizzcentral.com
EOL
    echo "✅ Environment file created (.env)"
    echo "⚠️  Please update the .env file with your configuration"
fi

# Check if SES email is verified (optional)
echo "📧 Checking SES email verification..."
SES_IDENTITIES=$(aws ses list-identities --region us-east-1 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ SES is accessible"
    echo "📝 Make sure to verify your sending email address in SES:"
    echo "   aws ses verify-email-identity --email-address noreply@wizzcentral.com"
else
    echo "⚠️  SES verification check failed (this is optional for development)"
fi

# Test serverless configuration
echo "🔧 Validating Serverless configuration..."
serverless print > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Serverless configuration is valid"
else
    echo "❌ Serverless configuration has errors"
    echo "Please check serverless.yml file"
    exit 1
fi

echo ""
echo "🎉 WizzCentral Backend installation completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Update the .env file with your configuration"
echo "2. Verify your SES email address:"
echo "   aws ses verify-email-identity --email-address your-email@domain.com"
echo "3. Deploy the backend:"
echo "   npm run deploy"
echo "4. Start local development:"
echo "   npm run dev"
echo ""
echo "📚 Documentation: See README.md for detailed information"
echo "🆘 Support: Create an issue if you encounter problems"
echo ""
echo "🚀 Happy coding!"
