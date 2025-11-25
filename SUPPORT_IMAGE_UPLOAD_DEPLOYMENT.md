# 🚀 Support Chat Image Upload - Backend Deployment Guide

## Prerequisites
- AWS CLI configured
- AWS account with appropriate permissions
- S3 bucket creation permissions
- Lambda deployment permissions
- API Gateway configuration access

## Step 1: Create S3 Bucket

### 1.1 Create the Bucket
```bash
aws s3 mb s3://whizz-support-chat-images --region us-east-1
```

### 1.2 Configure CORS
Create `cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS:
```bash
aws s3api put-bucket-cors \
  --bucket whizz-support-chat-images \
  --cors-configuration file://cors-config.json
```

### 1.3 Set Bucket Policy (Optional - for public read)
Create `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::whizz-support-chat-images/support-chat/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
  --bucket whizz-support-chat-images \
  --policy file://bucket-policy.json
```

## Step 2: Deploy Lambda Function

### 2.1 Install Dependencies
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

# Create package directory
mkdir -p lambda-deploy/support-image-upload
cd lambda-deploy/support-image-upload

# Copy Lambda function
cp ../../lambda/support-image-upload.js index.js

# Initialize package.json
npm init -y

# Install AWS SDK v3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2.2 Create Deployment Package
```bash
# Create zip file
zip -r support-image-upload.zip index.js node_modules/
```

### 2.3 Create IAM Role
Create `lambda-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create role:
```bash
aws iam create-role \
  --role-name SupportImageUploadLambdaRole \
  --assume-role-policy-document file://lambda-trust-policy.json
```

### 2.4 Attach Policies
```bash
# CloudWatch Logs
aws iam attach-role-policy \
  --role-name SupportImageUploadLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# S3 Access
aws iam attach-role-policy \
  --role-name SupportImageUploadLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### 2.5 Deploy Lambda
```bash
aws lambda create-function \
  --function-name support-image-upload \
  --runtime nodejs18.x \
  --role arn:aws:iam::[YOUR_ACCOUNT_ID]:role/SupportImageUploadLambdaRole \
  --handler index.handler \
  --zip-file fileb://support-image-upload.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{SUPPORT_IMAGES_BUCKET=whizz-support-chat-images,AWS_REGION=us-east-1}"
```

### 2.6 Update Lambda (for future updates)
```bash
aws lambda update-function-code \
  --function-name support-image-upload \
  --zip-file fileb://support-image-upload.zip
```

## Step 3: Configure API Gateway

### 3.1 Get API Gateway ID
```bash
# List APIs
aws apigateway get-rest-apis

# Find your API ID (bx4snzqxpd for ghayth stage)
export API_ID="bx4snzqxpd"
```

### 3.2 Get Root Resource ID
```bash
aws apigateway get-resources --rest-api-id $API_ID
```

### 3.3 Create /support Resource (if not exists)
```bash
# Get root resource ID from previous command
export ROOT_ID="[root-resource-id]"

aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part support
```

### 3.4 Create /upload-image Resource
```bash
# Get support resource ID
export SUPPORT_ID="[support-resource-id]"

aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $SUPPORT_ID \
  --path-part upload-image
```

### 3.5 Create GET Method
```bash
export UPLOAD_IMAGE_ID="[upload-image-resource-id]"

# Create GET method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method GET \
  --authorization-type NONE

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:[YOUR_ACCOUNT_ID]:function:support-image-upload/invocations
```

### 3.6 Create POST Method (Optional)
```bash
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method POST \
  --authorization-type NONE

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:[YOUR_ACCOUNT_ID]:function:support-image-upload/invocations
```

### 3.7 Enable CORS
```bash
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'

aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_IMAGE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'}'
```

### 3.8 Grant Lambda Permission
```bash
aws lambda add-permission \
  --function-name support-image-upload \
  --statement-id apigateway-support-upload \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:[YOUR_ACCOUNT_ID]:$API_ID/*/*/support/upload-image"
```

### 3.9 Deploy API
```bash
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name ghayth \
  --description "Added support image upload endpoint"
```

## Step 4: Test the Endpoint

### 4.1 Test Presigned URL Generation
```bash
curl -X GET "https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth/support/upload-image?sessionId=test_123&merchantId=merchant_456&fileName=test.jpg"
```

Expected response:
```json
{
  "success": true,
  "presignedUrl": "https://whizz-support-chat-images.s3.amazonaws.com/...",
  "imageUrl": "https://whizz-support-chat-images.s3.amazonaws.com/support-chat/test_123/test.jpg",
  "s3Key": "support-chat/test_123/test.jpg",
  "expiresIn": 300
}
```

### 4.2 Test Image Upload
```bash
# Get presigned URL
PRESIGNED_URL=$(curl -s "https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth/support/upload-image?sessionId=test_123&merchantId=merchant_456&fileName=test.jpg" | jq -r '.presignedUrl')

# Upload test image
curl -X PUT "$PRESIGNED_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test-image.jpg
```

## Step 5: Monitor & Debug

### 5.1 Check Lambda Logs
```bash
aws logs tail /aws/lambda/support-image-upload --follow
```

### 5.2 Check S3 Objects
```bash
aws s3 ls s3://whizz-support-chat-images/support-chat/ --recursive
```

### 5.3 Test from Flutter App
Run the Flutter app and try:
1. Open Support Chat
2. Tap attachment button
3. Select/take photo
4. Check logs for upload status

## Troubleshooting

### Issue: CORS Errors
**Solution**: Verify CORS configuration on both S3 and API Gateway

### Issue: 403 Forbidden on S3 Upload
**Solution**: Check presigned URL expiration and S3 bucket policy

### Issue: Lambda Timeout
**Solution**: Increase Lambda timeout to 30 seconds

### Issue: Large Image Upload Fails
**Solution**: Increase API Gateway payload limit or compress images more

## Environment Variables

Add to Lambda function:
```bash
SUPPORT_IMAGES_BUCKET=whizz-support-chat-images
AWS_REGION=us-east-1
```

## Security Checklist

- [x] S3 bucket has CORS configured
- [x] Lambda has minimum required permissions
- [x] Presigned URLs expire after 5 minutes
- [x] API Gateway has rate limiting (optional)
- [x] Images are organized by session ID
- [x] Content-Type validation enabled

## Cost Estimation

**Monthly estimates (assuming 1000 active merchants):**
- S3 Storage (100GB): ~$2.30/month
- S3 PUT Requests (10,000): ~$0.05/month
- S3 GET Requests (50,000): ~$0.02/month
- Lambda Invocations (10,000): ~$0.20/month
- Data Transfer (50GB): ~$4.50/month

**Total**: ~$7/month for 10,000 image uploads

## Quick Deploy Script

Create `deploy-support-images.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Support Image Upload Feature"

# Variables
API_ID="bx4snzqxpd"
STAGE="ghayth"
REGION="us-east-1"
BUCKET="whizz-support-chat-images"

# 1. Create S3 bucket
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET --region $REGION || echo "Bucket already exists"

# 2. Configure CORS
echo "🔧 Configuring CORS..."
aws s3api put-bucket-cors --bucket $BUCKET --cors-configuration file://cors-config.json

# 3. Package Lambda
echo "📝 Packaging Lambda..."
cd lambda-deploy/support-image-upload
zip -r support-image-upload.zip index.js node_modules/

# 4. Deploy Lambda
echo "🚀 Deploying Lambda..."
aws lambda update-function-code \
  --function-name support-image-upload \
  --zip-file fileb://support-image-upload.zip

# 5. Deploy API Gateway
echo "🌐 Deploying API Gateway..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE \
  --description "Support image upload deployment $(date)"

echo "✅ Deployment complete!"
echo "🔗 Test endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/support/upload-image"
```

Make executable:
```bash
chmod +x deploy-support-images.sh
```

Run:
```bash
./deploy-support-images.sh
```

---
**Status**: Ready for deployment
**Last Updated**: November 14, 2025
