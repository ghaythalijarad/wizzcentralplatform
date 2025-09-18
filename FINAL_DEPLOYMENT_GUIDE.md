# WizzCentral Campaign System - Final Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the complete WizzCentral Campaign Management System, including backend APIs, database infrastructure, and frontend integration.

## 📋 Prerequisites

### Required Tools
- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- Serverless Framework (`npm install -g serverless`)
- Git

### AWS Services Required
- DynamoDB (for campaign data storage)
- Lambda (for API functions)
- API Gateway (for HTTP endpoints)
- Cognito (for authentication)
- CloudWatch (for monitoring)

### Required Permissions
Your AWS user needs the following permissions:
- DynamoDB: Create/Read/Write/Delete tables
- Lambda: Create/Update/Delete functions
- API Gateway: Create/Update/Delete APIs
- IAM: Create/Update roles and policies
- CloudWatch: Create logs and metrics

## 🚀 Deployment Steps

### Step 1: Database Setup

First, create the campaign tables:

```bash
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
node create-campaign-tables.js --sample-data
```

This will create:
- `WizzCentral_Campaigns` - Main campaign storage
- `WizzCentral_Campaign_Conditions` - Advanced condition definitions
- `WizzCentral_Campaign_Usage` - Usage tracking and analytics
- `WizzCentral_Campaign_Analytics` - Performance metrics

### Step 2: Backend API Deployment

Deploy the campaign APIs using the automated script:

```bash
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
chmod +x deploy-campaign-api.sh
./deploy-campaign-api.sh dev us-east-1
```

This script will:
1. ✅ Check prerequisites (AWS CLI, Node.js, Serverless)
2. ✅ Verify AWS credentials
3. ✅ Ensure campaign tables exist
4. ✅ Install dependencies
5. ✅ Deploy Lambda functions and API Gateway
6. ✅ Configure authentication
7. ✅ Run integration tests

### Step 3: Frontend Integration

Update your frontend to use the new campaign API:

```html
<!-- Add to your HTML head -->
<script src="/frontend/campaign-api-client.js"></script>

<script>
// The client auto-initializes and integrates with existing services
window.addEventListener('campaignAPIReady', (event) => {
    console.log('✅ Campaign API is ready:', event.detail);
    
    // Test the connection
    window.campaignAPI.testConnection().then(result => {
        if (result.success) {
            console.log('✅ Campaign API connected successfully');
        } else {
            console.error('❌ Campaign API connection failed:', result.error);
        }
    });
});
</script>
```

### Step 4: Configuration

After deployment, update your configuration:

```javascript
// Update your application config
window.WIZZCENTRAL_CONFIG = {
    campaignApiUrl: 'https://your-api-gateway-url.amazonaws.com/dev',
    apiKey: 'wizzcentral_mobile_app_v1'
};
```

## 🧪 Testing the Deployment

### 1. Test Database Tables

Verify tables were created:

```bash
aws dynamodb list-tables --region us-east-1 | grep WizzCentral_Campaign
```

### 2. Test API Endpoints

Run the integration test script:

```bash
cd /Users/ghaythallaheebi/wizzcentralplatform/backend
./scripts/test-campaign-api.sh https://your-api-gateway-url.amazonaws.com/dev
```

### 3. Test Frontend Integration

Open your browser's developer console and check:

```javascript
// Check if the API client is loaded
console.log(window.campaignAPI);

// Test connection
window.campaignAPI.testConnection();

// Get eligible campaigns (this should work without authentication)
window.campaignAPI.getEligibleCampaigns('test_user', { value: 100 });
```

## 📊 Available API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/public/campaigns/validate` | Validate campaign eligibility |
| POST | `/public/campaigns/apply` | Apply campaign to order |
| POST | `/public/campaigns/eligible` | Get eligible campaigns for user |

### Authenticated Endpoints (Cognito JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/campaigns` | List all campaigns |
| POST | `/campaigns` | Create new campaign |
| GET | `/campaigns/{id}` | Get campaign details |
| PUT | `/campaigns/{id}` | Update campaign |
| DELETE | `/campaigns/{id}` | Delete campaign |
| POST | `/conditions/evaluate` | Evaluate campaign conditions |
| GET | `/analytics/dashboard` | Get dashboard analytics |

## 🔐 Authentication Setup

### For Public Endpoints
Use API key authentication:

```javascript
const response = await fetch('/public/campaigns/eligible', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        userId: 'user123',
        orderData: { value: 150 },
        apiKey: 'wizzcentral_mobile_app_v1'
    })
});
```

### For Authenticated Endpoints
Use Cognito JWT tokens:

```javascript
const response = await fetch('/campaigns', {
    headers: {
        'Authorization': `Bearer ${cognitoAccessToken}`,
        'Content-Type': 'application/json'
    }
});
```

## 🎯 Example Usage

### 1. Get Eligible Campaigns for a Customer

```javascript
const eligibleCampaigns = await window.campaignAPI.getEligibleCampaigns(
    'customer_123',
    { 
        value: 150,
        businessId: 'restaurant_456'
    }
);

console.log('Eligible campaigns:', eligibleCampaigns.data.eligible);
```

### 2. Validate a Specific Campaign

```javascript
const validation = await window.campaignAPI.validateCampaign(
    'WELCOME10',
    'customer_123',
    { value: 100 }
);

if (validation.eligible) {
    console.log('Campaign is valid, discount:', validation.eligibility.discount);
} else {
    console.log('Campaign not eligible:', validation.eligibility.reasons);
}
```

### 3. Apply Campaign to Order

```javascript
const application = await window.campaignAPI.applyCampaign(
    'WELCOME10',
    'customer_123',
    'order_789',
    150.00
);

if (application.success) {
    console.log('Campaign applied successfully:');
    console.log('Discount amount:', application.application.discountAmount);
    console.log('Final order value:', application.application.finalOrderValue);
}
```

## 🔧 Configuration Options

### Environment Variables

Set these in your Serverless configuration:

```yaml
# serverless.campaigns.yml
provider:
  environment:
    STAGE: ${self:provider.stage}
    CAMPAIGNS_TABLE: WizzCentral_Campaigns
    CONDITIONS_TABLE: WizzCentral_Campaign_Conditions
    USAGE_TABLE: WizzCentral_Campaign_Usage
    ANALYTICS_TABLE: WizzCentral_Campaign_Analytics
```

### API Client Configuration

```javascript
const campaignAPI = new CampaignAPIClient({
    baseURL: 'https://your-api-gateway-url.amazonaws.com/dev',
    apiKey: 'your_api_key',
    timeout: 30000
});

// Set auth token when user logs in
campaignAPI.setAuthToken(cognitoAccessToken);
```

## 📈 Monitoring and Maintenance

### CloudWatch Logs
Monitor Lambda function logs:

```bash
# View campaign API logs
serverless logs -f campaignApi --config serverless.campaigns.yml --stage dev

# View condition engine logs
serverless logs -f conditionEngineApi --config serverless.campaigns.yml --stage dev

# View analytics API logs
serverless logs -f analyticsApi --config serverless.campaigns.yml --stage dev
```

### DynamoDB Metrics
Monitor table performance in AWS Console:
- Read/Write capacity utilization
- Throttling events
- Error rates

### API Gateway Metrics
Monitor API performance:
- Request count
- Latency
- Error rates
- Cache hit/miss rates

## 🚨 Troubleshooting

### Common Issues

#### 1. "Table not found" errors
**Solution**: Ensure campaign tables are created:
```bash
node create-campaign-tables.js --sample-data
```

#### 2. "Unauthorized" errors
**Solution**: Check Cognito configuration in `serverless.campaigns.yml`:
```yaml
custom:
  stageConfigs:
    dev:
      cognitoUserPoolArn: "arn:aws:cognito-idp:us-east-1:YOUR_ACCOUNT:userpool/YOUR_POOL_ID"
```

#### 3. CORS errors
**Solution**: CORS is configured in the Serverless template. If issues persist, check:
- API Gateway CORS settings
- Browser network tab for actual error details

#### 4. "Invalid API key" errors
**Solution**: Use valid API keys defined in `campaign-public-api.js`:
- `wizzcentral_mobile_app_v1`
- `wizzcentral_web_app_v1`
- `merchant_app_integration_v1`

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'campaign-api:*');

// Or set debug flag
window.WIZZCENTRAL_DEBUG = true;
```

## 🎉 Success Checklist

After deployment, verify:

- [ ] ✅ All campaign tables exist in DynamoDB
- [ ] ✅ Lambda functions deployed successfully
- [ ] ✅ API Gateway endpoints responding
- [ ] ✅ Public endpoints work without authentication
- [ ] ✅ Authenticated endpoints require valid JWT
- [ ] ✅ Frontend API client auto-initializes
- [ ] ✅ Integration tests pass
- [ ] ✅ CloudWatch logs show successful requests
- [ ] ✅ Sample campaign data populated

## 📞 Support

If you encounter issues:

1. **Check the logs**: Use CloudWatch or `serverless logs`
2. **Verify configuration**: Ensure all environment variables are set
3. **Test individual components**: Use the provided test scripts
4. **Check AWS permissions**: Ensure proper IAM permissions

## 🔄 Updates and Maintenance

### Updating Campaign Logic
1. Modify Lambda function code
2. Run `serverless deploy`
3. Test endpoints
4. Monitor CloudWatch logs

### Adding New Endpoints
1. Add to Lambda handler
2. Update `serverless.campaigns.yml`
3. Deploy with `serverless deploy`
4. Update frontend API client if needed

### Database Schema Changes
1. Create migration script
2. Test on development environment
3. Plan downtime if required
4. Execute during maintenance window

---

## 🎯 Next Steps

With the campaign system deployed:

1. **Create your first campaign** using the admin interface
2. **Test with real customer data** in a staging environment
3. **Monitor performance** and optimize as needed
4. **Train your team** on the new capabilities
5. **Gradually roll out** to production traffic

The WizzCentral Campaign Management System is now **production-ready** and fully deployed! 🚀

---
*Deployment Guide v1.0 - September 18, 2025*
