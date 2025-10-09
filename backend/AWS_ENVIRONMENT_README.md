# AWS Environment Configuration for WizzApp

This directory contains AWS configuration files that are shared across all WizzApp projects:
- **WhizzMerchants** (Merchant App Backend)
- **WhizzCustomers** (Customer/Food App Backend)
- **WhizzDrivers** (Driver App / Hadhir Backend)
- **WizzCentralPlatform** (Admin Platform Backend)

## 📁 Files

### `.env`
Contains AWS profile configuration variables that can be loaded by various tools (VS Code, Copilot, deployment scripts, etc.)

### `set_aws_env.sh`
Shell script to quickly switch between AWS environments in your terminal.

## 🚀 Quick Start

### 1. Verify AWS SSO Configuration

Check that your AWS SSO is configured:
```bash
aws sts get-caller-identity --profile ghayth-dev2
```

If not authenticated, run:
```bash
aws sso login --profile ghayth-dev2
```

### 2. Set Your Environment

Use the convenience script to set your AWS environment:

```bash
# In any backend directory (WhizzMerchants, WhizzCustomers, etc.)
source set_aws_env.sh dev
```

This will:
- Set `AWS_PROFILE=ghayth-dev2`
- Set `AWS_DEFAULT_REGION=us-east-1`
- Set `AWS_ACCOUNT_ID=146152253137`
- Display confirmation of the active environment

### 3. Verify Active Environment

```bash
source set_aws_env.sh status
```

Or check directly:
```bash
aws sts get-caller-identity
```

## 🔄 Switching Environments

### Available Environments

| Environment | Command | Account ID | Status |
|------------|---------|------------|--------|
| **Your Dev** | `source set_aws_env.sh dev` | 146152253137 | ✅ Active |
| **Mohammed's Dev** | `source set_aws_env.sh mohammed` | 031857856164 | ✅ Active |
| **Staging** | `source set_aws_env.sh stg` | TBD | ❌ Not Created |
| **Production** | `source set_aws_env.sh prod` | TBD | ❌ Not Created |

### Quick Commands

```bash
# Switch to your dev account
source set_aws_env.sh dev
# or
source set_aws_env.sh d

# Switch to Mohammed's dev account
source set_aws_env.sh mohammed
# or
source set_aws_env.sh m

# Check current environment
source set_aws_env.sh status

# Show help
source set_aws_env.sh help
```

## 📋 Environment Variables

After running `source set_aws_env.sh dev`, these environment variables are set:

```bash
AWS_PROFILE=ghayth-dev2
AWS_DEFAULT_REGION=us-east-1
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=146152253137
```

These variables are automatically used by:
- AWS CLI commands
- AWS SDKs (boto3, aws-sdk-js, etc.)
- Serverless Framework
- SAM CLI
- Deployment scripts

## 🛠️ Using with Deployment Scripts

All deployment scripts will automatically use the active AWS profile:

```bash
# Example: Deploy WhizzMerchants backend
source set_aws_env.sh dev
cd /Users/ghaythallaheebi/Desktop/whizzMerchants/backend
sam deploy --profile $AWS_PROFILE

# Example: Deploy Lambda function
aws lambda update-function-code \
  --function-name my-function \
  --zip-file fileb://function.zip \
  --profile $AWS_PROFILE
```

## 🎯 Best Practices

### 1. **Always Source the Script**
Use `source` (or `.`) to run the script so environment variables persist:
```bash
source set_aws_env.sh dev  # ✅ Correct
./set_aws_env.sh dev       # ❌ Won't work (variables won't persist)
```

### 2. **Check Before Deploying**
Always verify your environment before deploying:
```bash
source set_aws_env.sh status
aws sts get-caller-identity
```

### 3. **Use Separate Terminals for Different Environments**
If you need to work with multiple AWS accounts simultaneously, use different terminal windows/tabs, each with its own environment set.

### 4. **Update .env When Creating New Environments**
When you create staging or production AWS accounts:
1. Update the `.env` file with the correct account IDs
2. Uncomment the staging/production sections
3. Update the `set_aws_env.sh` functions to remove the "not created" errors

## 🔐 Security Notes

### ✅ These files are safe to commit:
- `set_aws_env.sh` - Only contains configuration, no secrets
- `.env` - Only contains profile names and account IDs (public info)

### ❌ Never commit:
- AWS credentials
- Service account keys
- Private keys
- Secrets Manager values
- API tokens

### 🛡️ AWS SSO Benefits:
- No long-term credentials stored locally
- Temporary session tokens
- Centralized access management
- Easy revocation

## 📖 Common Tasks

### Deploy to Dev Environment
```bash
source set_aws_env.sh dev
aws sso login --profile $AWS_PROFILE  # If needed
# Run your deployment command
```

### List Resources in Current Environment
```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[*].FunctionName'

# List DynamoDB tables
aws dynamodb list-tables

# List S3 buckets
aws s3 ls
```

### Switch Accounts Mid-Session
```bash
# Start with your dev account
source set_aws_env.sh dev
# ... do some work ...

# Switch to Mohammed's account
source set_aws_env.sh mohammed
aws sso login --profile $AWS_PROFILE
# ... do more work ...
```

## 🆘 Troubleshooting

### "The security token included in the request is expired"
```bash
aws sso login --profile $AWS_PROFILE
```

### "Profile not found"
```bash
# Reconfigure SSO
aws configure sso --profile ghayth-dev2
```

### "Unable to locate credentials"
```bash
# Make sure you've sourced the script
source set_aws_env.sh dev

# Then login
aws sso login --profile $AWS_PROFILE
```

### Environment variables not persisting
Make sure you're using `source` or `.` before the script:
```bash
source set_aws_env.sh dev  # ✅ Correct
. set_aws_env.sh dev       # ✅ Also correct
./set_aws_env.sh dev       # ❌ Won't work
```

## 🚀 Next Steps

1. **Focus on Dev First**: Deploy and test all apps in your `ghayth-dev2` account
2. **Create Staging**: When ready, create a staging AWS account via AWS Organizations
3. **Create Production**: Finally, create production account with strict access controls
4. **Update Configuration**: Update `.env` files with new account IDs

## 📞 Need Help?

- Check AWS SSO status: `aws configure list`
- View current caller identity: `aws sts get-caller-identity`
- List configured profiles: `aws configure list-profiles`
- View profile details: `cat ~/.aws/config`

---

**Last Updated**: Created for initial dev environment setup
**Current Environment**: Dev only (ghayth-dev2)
**Future Environments**: Staging and Production (to be created)
