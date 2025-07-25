# WizzCentral Backend - AWS Serverless with Cognito Authentication

A comprehensive, production-ready backend for the WizzCentral food delivery management platform built with AWS Lambda, API Gateway, DynamoDB, and Cognito authentication.

## 🚀 Quick Deployment

### Prerequisites
- Node.js 18.x or higher
- AWS CLI configured
- AWS Account with Cognito User Pool

### 1. Installation & Deployment

```bash
# Navigate to backend directory
cd /Users/ghaythallaheebi/wizzcentralplatform/backend

# Install dependencies
npm install

# Deploy to AWS (credentials already configured)
./deploy.sh

# Test the deployed API
./test-api.sh
```

### 2. AWS Configuration

The backend is pre-configured with:
- **Cognito User Pool**: `us-east-1_2NdMHucPP`
- **Client ID**: `3rdgvci5bvi1v295dann1tdoc5`
- **AWS Region**: `us-east-1`
- **Stage**: `dev`

### 3. API Endpoints

After deployment, you'll get an API URL like:
`https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev`

#### Authentication Endpoints
- `POST /auth/login` - User login with Cognito
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Password reset
- `POST /auth/reset-password` - Confirm password reset
- `POST /auth/change-password` - Change password

#### Main API Endpoints
- `GET /users/profile` - User profile
- `GET /merchants` - Merchant management
- `GET /drivers` - Driver management  
- `GET /customers` - Customer management
- `GET /orders` - Order management
- `GET /promotions` - Promotion management
- `GET /support/tickets` - Support tickets
- `GET /support/faqs` - FAQ management
- `GET /support/knowledge-base` - Knowledge base
- `GET /analytics/dashboard` - Dashboard analytics

### 4. Testing Authentication

```bash
# Register a new user
curl -X POST [API_URL]/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@wizzcentral.com", 
    "password": "WizzAdmin123!",
    "role": "admin"
  }'

# Login
curl -X POST [API_URL]/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@wizzcentral.com",
    "password": "WizzAdmin123!"
  }'
```

## 🏗️ Architecture

### Core Technologies
- **AWS Lambda**: Serverless functions
- **API Gateway**: REST API with CORS
- **DynamoDB**: NoSQL database
- **Cognito**: User authentication
- **SES**: Email notifications
- **S3**: File storage

### Authentication Flow
1. User registers/logs in through Cognito
2. Cognito returns JWT access/ID tokens
3. Frontend sends tokens in Authorization header
4. Lambda authorizer validates tokens
5. User context added to requests

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, Support)
- Password reset functionality
- Secure API Gateway authorizer

### User Management
- User registration and login
- Profile management
- Password change
- Admin user management

### Merchant Management
- Merchant application processing
- Status workflow (pending → approved/rejected/under-review → suspended/reactivated)
- Email notifications for status changes
- Document upload support
- Analytics and reporting

### Driver Management
- Driver registration and verification
- Status tracking (online/offline/delivering)
- Performance metrics

### Customer Management
- Customer profiles
- Order history
- Preferences management

### Order Management
- Order creation and tracking
- Status updates
- Real-time notifications

### Promotion Management
- Discount campaigns
- Promotion codes
- Usage tracking and analytics

### Support System
- Ticket management
- Priority and category handling
- Internal notes and customer communication

## 📋 Prerequisites

- Node.js 18.x or higher
- AWS CLI configured with appropriate permissions
- Serverless Framework
- AWS Account with SES email verification

## 🛠️ Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

3. **Set up environment variables:**
   ```bash
   export JWT_SECRET="your-super-secret-jwt-key"
   export STAGE="dev"  # or "staging", "prod"
   ```

4. **Verify SES email addresses (for email notifications):**
   ```bash
   aws ses verify-email-identity --email-address noreply@wizzcentral.com
   ```

5. **Deploy the backend:**
   ```bash
   npm run deploy
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── auth.js       # Authentication endpoints
│   │   ├── users.js      # User management
│   │   ├── merchants.js  # Merchant management
│   │   ├── drivers.js    # Driver management
│   │   ├── customers.js  # Customer management
│   │   ├── orders.js     # Order management
│   │   ├── promotions.js # Promotion management
│   │   ├── support.js    # Support system
│   │   └── analytics.js  # Analytics & dashboard
│   └── utils/            # Utility functions
│       ├── database.js   # DynamoDB operations
│       ├── auth.js       # Authentication utilities
│       ├── email.js      # Email service
│       ├── response.js   # HTTP response helpers
│       └── validation.js # Input validation schemas
├── serverless.yml        # Serverless configuration
├── webpack.config.js     # Webpack configuration
└── package.json         # Dependencies and scripts
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/preferences` - Update user preferences
- `PUT /users/change-password` - Change password

### Merchants
- `GET /merchants` - Get all merchants (with filtering)
- `GET /merchants/{id}` - Get merchant details
- `POST /merchants` - Create new merchant
- `PUT /merchants/{id}` - Update merchant
- `PATCH /merchants/{id}/status` - Update merchant status
- `DELETE /merchants/{id}` - Delete merchant (soft delete)

### Drivers
- `GET /drivers` - Get all drivers
- `POST /drivers` - Create new driver
- `PUT /drivers/{id}` - Update driver
- `PATCH /drivers/{id}/status` - Update driver status

### Customers
- `GET /customers` - Get all customers
- `GET /customers/{id}` - Get customer details
- `PUT /customers/{id}` - Update customer

### Orders
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `PUT /orders/{id}` - Update order
- `PATCH /orders/{id}/status` - Update order status

### Promotions
- `GET /promotions` - Get all promotions
- `POST /promotions` - Create new promotion
- `PUT /promotions/{id}` - Update promotion

### Support
- `GET /support/tickets` - Get support tickets
- `POST /support/tickets` - Create support ticket
- `PUT /support/tickets/{id}` - Update ticket
- `POST /support/tickets/{id}/reply` - Reply to ticket

### Analytics
- `GET /analytics/dashboard` - Get dashboard statistics

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

### Users Table
- Primary Key: `id` (String)
- GSI: `email` (String)
- Attributes: name, email, password, role, status, profile, etc.

### Merchants Table
- Primary Key: `id` (String)
- GSI: `status` (String)
- Attributes: name, email, category, address, status, rating, etc.

### Drivers Table
- Primary Key: `id` (String)
- GSI: `status` (String)
- Attributes: name, email, vehicle info, status, location, etc.

### Orders Table
- Primary Key: `id` (String)
- GSI: `customerId` + `createdAt`, `merchantId` + `createdAt`
- Attributes: customer, merchant, items, status, total, etc.

## 🚀 Deployment

### Development
```bash
npm run dev          # Run locally with serverless-offline
npm run deploy       # Deploy to AWS
```

### Production
```bash
STAGE=prod npm run deploy
```

### Environment Variables
- `JWT_SECRET`: Secret key for JWT token signing
- `STAGE`: Deployment stage (dev/staging/prod)
- `REGION`: AWS region (default: us-east-1)

## 📧 Email Configuration

Configure SES for email notifications:

1. Verify your sending email address in SES
2. Update the `fromEmail` in `src/utils/email.js`
3. For production, move out of SES sandbox

## 🔍 Monitoring

- CloudWatch logs are automatically configured
- Custom metrics can be added using CloudWatch
- Error tracking and performance monitoring recommended

## 🧪 Testing

```bash
npm test            # Run unit tests
npm run lint        # Run ESLint
```

## 📈 Scaling Considerations

- DynamoDB auto-scaling enabled
- Lambda concurrency limits configured
- API Gateway throttling configured
- CloudFront CDN for static assets

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control
- Input validation with Joi
- Password hashing with bcrypt
- Rate limiting on API Gateway
- CORS configuration
- Secure headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact: support@wizzcentral.com

---

Built with ❤️ for the WizzCentral Platform
