# 🏪 WizzCentral Platform

A comprehensive multi-vendor marketplace and delivery platform built with modern web technologies and AWS serverless architecture.

## 🌟 Features

### 🎯 Core Platform
- **Multi-vendor marketplace** with merchant management
- **Real-time order tracking** and management
- **Driver assignment and tracking** system
- **Customer management** with order history
- **Promotion and discount** management
- **Support ticket system** with knowledge base
- **Analytics dashboard** with real-time insights

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Admin, Merchant, Driver, Customer)
- Password reset and email verification
- Secure API endpoints with proper validation

### 📱 Frontend Dashboard
- Responsive web dashboard
- Real-time data visualization
- Modern UI with clean design
- Mobile-friendly interface

### ⚡ Backend Architecture
- **Serverless AWS Lambda** functions
- **DynamoDB** for scalable data storage
- **Amazon SES** for email notifications
- **API Gateway** for RESTful APIs
- **AWS SDK v3** for modern cloud integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- AWS CLI configured
- Serverless Framework installed globally

### 🖥️ Frontend Setup
```bash
# Open the frontend in any web server
# The dashboard is built with vanilla HTML/CSS/JS
open index.html
```

### 🔧 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Deploy to AWS (requires AWS credentials)
npm run deploy

# For local development
npm run dev
```

## 📁 Project Structure

```
wizzcentralplatform/
├── 📱 Frontend (Dashboard)
│   ├── index.html          # Main dashboard
│   ├── dashboard.html      # Analytics dashboard
│   ├── merchants.html      # Merchant management
│   ├── drivers.html        # Driver management
│   ├── customers.html      # Customer management
│   ├── promotions.html     # Promotion management
│   ├── support.html        # Support system
│   └── styles/            # CSS and JavaScript files
│
└── 🔧 Backend (Serverless API)
    ├── src/
    │   ├── handlers/      # Lambda function handlers
    │   │   ├── auth.js    # Authentication endpoints
    │   │   ├── merchants.js
    │   │   ├── drivers.js
    │   │   ├── customers.js
    │   │   ├── orders.js
    │   │   ├── promotions.js
    │   │   └── support.js
    │   └── utils/         # Shared utilities
    │       ├── database.js
    │       ├── auth.js
    │       ├── email.js
    │       ├── response.js
    │       └── validation.js
    ├── serverless.yml     # AWS deployment configuration
    └── package.json
```

## 🔗 API Endpoints

### 🔐 Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/reset-password` - Confirm password reset

### 👥 User Management
- `GET /merchants` - List merchants
- `POST /merchants` - Create merchant
- `GET /drivers` - List drivers
- `POST /drivers` - Create driver
- `GET /customers` - List customers

### 📦 Order Management
- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}` - Update order

### 🎯 Promotions
- `GET /promotions` - List promotions
- `POST /promotions` - Create promotion
- `POST /promotions/validate` - Validate promotion code

### 🎧 Support System
- `GET /support/tickets` - List support tickets
- `POST /support/tickets` - Create support ticket
- `GET /support/faqs` - List FAQs
- `GET /support/knowledge-base` - Knowledge base articles

## 🛠️ Technology Stack

### Frontend
- **HTML5** with semantic markup
- **CSS3** with modern styling
- **Vanilla JavaScript** with ES6+
- **Responsive Design** for mobile compatibility

### Backend
- **Node.js 18+** runtime
- **AWS Lambda** for serverless functions
- **Amazon DynamoDB** for NoSQL database
- **Amazon SES** for email services
- **API Gateway** for HTTP endpoints
- **Serverless Framework** for deployment

### Libraries & Dependencies
- **AWS SDK v3** - Modern AWS service integration
- **Joi** - Data validation
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token management
- **uuid** - Unique ID generation

## 🔧 Configuration

### Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=your-profile

# Database Tables (auto-created by Serverless)
USERS_TABLE=wizzcentral-users-dev
MERCHANTS_TABLE=wizzcentral-merchants-dev
ORDERS_TABLE=wizzcentral-orders-dev
# ... other tables
```

### AWS Permissions Required
- DynamoDB read/write access
- SES email sending permissions
- Lambda execution role
- API Gateway management

## 📈 Deployment

### Development
```bash
cd backend
npm run dev  # Runs serverless offline
```

### Production
```bash
cd backend
npm run deploy  # Deploys to AWS
```

### Testing
```bash
cd backend
npm test  # Runs test suite
npm run lint  # Code linting
```

## 🧪 API Testing

Use the included test script to verify all endpoints:
```bash
cd backend
./test-api.sh
```

## 📊 Current Status

✅ **Authentication System** - Fully functional  
✅ **User Management** - Complete  
✅ **Order Management** - Operational  
✅ **Promotion System** - Working  
✅ **Support System** - Active  
✅ **API Deployment** - Successful  
✅ **Error Handling** - Robust  

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**WizzCentral Team** - *Initial work*

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the knowledge base in the support system
- Contact the development team

---

**Built with ❤️ by the WizzCentral Team**
