# Wizz Central Platform

## Overview

The Wizz Central Platform is a comprehensive management system for handling customers, orders, drivers, merchants, and support operations.

## Architecture

- **Frontend**: Web dashboard located in `/frontend/`
- **Backend**: Serverless architecture using AWS Lambda and DynamoDB
- **Authentication**: AWS Cognito for user management
- **Database**: DynamoDB tables for data persistence
- **Mobile App**: Merchant app developed separately (will be integrated later)

## Quick Start

### Prerequisites

- Node.js 16+
- AWS CLI configured
- Valid AWS credentials

### Installation

```bash
npm install
```

### Development

```bash
# Start local development server
python3 -m http.server 8083

# Access the application
open http://localhost:8083/frontend/index.html
```

## Project Structure

```
frontend/
├── index.html              # Canonical login page
├── config.js              # Configuration settings
├── assets/
│   ├── js/
│   │   ├── auth-utils.js   # Authentication utilities
│   │   └── aws-utils.js    # AWS integration
│   └── css/               # Stylesheets
├── includes/
│   └── sidebar.html       # Navigation sidebar
├── pages/                 # Application pages
│   ├── dashboard.html     # Main dashboard
│   ├── customers.html     # Customer management
│   ├── orders.html        # Order management
│   ├── drivers.html       # Driver management
│   ├── merchants.html     # Merchant management
│   ├── promotions.html    # Promotions management
│   └── support.html       # Support system
└── Application JS files:
    ├── customers.js       # Customer management logic
    ├── orders.js          # Order management logic
    ├── dashboard.js       # Dashboard functionality
    ├── drivers.js         # Driver management logic
    ├── merchants.js       # Merchant management logic
    ├── promotions.js      # Promotions logic
    └── support.js         # Support functionality
```

## Authentication

- Uses AWS Cognito for authentication
- Tokens stored in sessionStorage (idToken, accessToken, refreshToken)
- Automatic redirect to login if unauthenticated
- Return URL system for post-login redirection

## Database

- Primary table: `WizzUser_users_dev` for customer data
- Status toggling functionality with real-time updates
- Error handling and fallback mechanisms

## Deployment

- Configured for AWS Amplify deployment
- Backend uses serverless architecture
- Frontend served as static content

## Support

For technical support and troubleshooting, refer to the in-app support system accessible through the dashboard.
Triggering new build to clear cache
