# Wizz Central Platform - Customer App Integration Plan

This document outlines the plan for integrating a new customer-facing application with the Wizz Central Platform.

## 1. Communication Flow

The customer app will communicate with the central platform via a REST API for most actions and will use WebSockets for real-time updates on order status.

1. **Customer Action (App -> API):** The customer browses merchants, adds items to their cart, and places an order using the new customer-facing API endpoints.
2. **Order Injection (API -> System):** The backend receives the order, validates it, processes payment, and injects it into the existing order management system.
3. **Merchant Notification (System -> Merchant App):** The platform instantly notifies the relevant merchant of the new order via the existing WebSocket connection.
4. **Status Updates (Merchant/Driver -> API):** The merchant accepts the order, and later a driver picks it up. These status changes are sent back to the platform's API.
5. **Customer Notification (System -> Customer App):** The platform pushes real-time status updates (e.g., "Order Confirmed," "Out for Delivery") to the customer's app via a new WebSocket connection.

## 2. Customer API - Endpoint Design

We will create a new set of API endpoints under the `/customers` or `/api` path.

### Authentication

- `POST /customers/signup`: Register a new customer account.
- `POST /customers/login`: Authenticate a customer and receive a JWT token.
- `GET /customers/me`: Get the current customer's profile information.

### Merchants & Products

- `GET /merchants`: Get a list of all available merchants, possibly with filters for location or cuisine.
- `GET /merchants/{businessId}`: Get detailed information for a single merchant.
- `GET /merchants/{businessId}/products`: Get the product catalog/menu for a specific merchant.

### Orders

- `POST /orders`: Create a new order. The request body will be similar to the test scripts but will be tied to the authenticated customer.
- `GET /orders`: Get the authenticated customer's order history.
- `GET /orders/{orderId}`: Get the details and real-time status of a specific order.

## 3. Backend Implementation Tasks

- [ ] **Create Customer Table:** Set up a new DynamoDB table for customer data (profile, authentication details, etc.).
- [ ] **Implement Authentication:** Configure AWS Cognito User Pools for customer sign-up and login.
- [ ] **Build API Endpoints:** Develop the Lambda functions and API Gateway routes for the endpoints listed above.
- [ ] **Extend Real-Time Service:** Add logic to the WebSocket service to manage customer connections and push order status updates to them.

## 4. Next Steps

1. **Confirm Backend Structure:** Review the existing backend code in the `/backend` directory to determine the best way to add the new functionality.
2. **Implement Authentication:** Start by setting up the Cognito User Pool.
3. **Build Core Endpoints:** Begin with the `GET /merchants` and `GET /merchants/{businessId}/products` endpoints so the customer app can display data.
