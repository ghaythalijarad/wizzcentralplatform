# Customer App Integration - Files to Share

## What to Provide Your Friend

Here are the essential files and information your friend needs to integrate their customer app with your WizzCentral Platform:

### 📋 Required Files to Share

1. **`CUSTOMER_APP_API_GUIDE.md`** - Complete API documentation
2. **`customer-app-config.json`** - Configuration file with all endpoints and settings
3. **`CUSTOMER_APP_INTEGRATION_PLAN.md`** - Integration strategy and communication flow

### 🔧 Key Information to Communicate

#### API Base URL

```
https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev
```

#### Authentication Details

- **User Pool ID:** `us-east-1_aX8X9oQTV`
- **Client ID:** `3u9frkvcn18lidj5dpm1a94mf2`
- **Region:** `us-east-1`
- **Authentication Method:** AWS Cognito JWT tokens

#### Essential Endpoints Your Friend Needs

1. **Authentication:**
   - `POST /auth/register` - Register new customers
   - `POST /auth/login` - Customer login
   - `POST /auth/refresh` - Refresh tokens

2. **Merchant Discovery:**
   - `GET /merchants` - List all available merchants
   - `GET /merchants/{businessId}` - Get merchant details
   - `GET /merchants/{businessId}/products` - Get merchant menu/products

3. **Order Management:**
   - `POST /orders` - Create new orders
   - `GET /customers/{customerId}/orders` - Get customer order history
   - `GET /orders/{orderId}` - Get specific order details
   - `POST /orders/{orderId}/cancel` - Cancel orders

### 🚀 Next Steps for Your Friend

1. **Review the API Guide:** Start with `CUSTOMER_APP_API_GUIDE.md`
2. **Use Configuration:** Import `customer-app-config.json` into their Flutter app
3. **Implement Authentication:** Set up AWS Cognito authentication first
4. **Test Endpoints:** Start with merchant listing and product fetching
5. **Implement Order Flow:** Add order creation and management
6. **Add Real-time Updates:** Integrate WebSocket for live order tracking

### 📱 Flutter Implementation Tips

Your friend should:

- Use `http` package for API calls
- Use `aws_amplify_auth` for Cognito authentication
- Use `web_socket_channel` for real-time updates
- Implement secure token storage
- Handle network errors gracefully

### 🔍 Testing Strategy

1. **Start Simple:** Test merchant listing first
2. **Add Authentication:** Implement login/register
3. **Test Order Flow:** Create test orders
4. **Add Real-time:** Implement WebSocket connections
5. **Handle Errors:** Test error scenarios

### 🛠️ Development Workflow

```
1. Set up authentication → 2. Load merchants → 3. Show products → 
4. Create orders → 5. Track orders → 6. Handle updates
```

### 📞 Support

- Share this repository access if needed
- Provide direct communication channel for questions
- Consider setting up a shared Slack/Discord for quick questions

### ⚠️ Important Notes

1. **Environment:** Currently using development environment
2. **Rate Limits:** No rate limits set yet, but implement reasonable request spacing
3. **Error Handling:** All endpoints return consistent error format
4. **Token Expiry:** Access tokens expire, implement refresh logic
5. **Real-time:** WebSocket URL will be provided once deployed

### 🧪 Ready to Test

Your friend can immediately start with:

- `GET /merchants` - to see available restaurants/merchants
- Authentication endpoints for user management
- Basic order creation flow

---

**Everything your friend needs is now ready for integration!** 🎉
