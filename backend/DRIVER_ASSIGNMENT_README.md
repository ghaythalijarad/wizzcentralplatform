# Driver Assignment System

## Overview

The Driver Assignment System is a comprehensive solution for automatically assigning drivers to orders when they become ready for pickup. It uses intelligent priority algorithms based on distance, driver rating, completion rate, and current workload to ensure optimal assignments.

## Architecture

### Core Components

1. **Driver Assignment Service** (`src/services/driver-assignment-service.js`)
   - Main assignment logic with priority algorithms
   - Real-time driver selection and fallback mechanisms
   - Analytics and performance tracking

2. **WebSocket Handler** (`src/handlers/websocket-connections.js`)
   - Real-time communication with drivers
   - Assignment requests and responses
   - Status updates and location tracking

3. **Order Status Trigger** (`src/handlers/order-status-trigger.js`)
   - Monitors order status changes
   - Automatically triggers assignment when orders are ready for pickup
   - Handles DynamoDB stream events

### Database Tables

- `WizzUser_websocket_connections_dev` - Active WebSocket connections
- `WizzUser_websocket_subscriptions_dev` - WebSocket subscriptions
- `WizzUser_orders_dev` - Order information
- `WizzUser_drivers_dev` - Driver profiles and status
- `WizzUser_driver_assignments_dev` - Assignment history and analytics

### WebSocket Endpoint

```
wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev
```

## Assignment Algorithm

### Priority Scoring

The system uses a weighted scoring algorithm to prioritize drivers:

- **Distance (40%)**: Closer drivers get higher priority
- **Rating (30%)**: Higher-rated drivers are preferred
- **Completion Rate (20%)**: Drivers with better completion rates score higher
- **Active Orders (10%)**: Drivers with fewer active orders are prioritized

### Configuration

```javascript
const ASSIGNMENT_CONFIG = {
    MAX_ASSIGNMENT_DISTANCE_KM: 15,    // Maximum assignment radius
    ASSIGNMENT_TIMEOUT_SECONDS: 30,    // Driver response timeout
    MAX_RETRY_ATTEMPTS: 3,             // Maximum fallback attempts
    PRIORITY_WEIGHTS: {
        distance: 0.4,
        rating: 0.3,
        completion_rate: 0.2,
        active_orders: 0.1
    }
};
```

## WebSocket Message Types

### Driver Assignment Request

```json
{
    "type": "driver_assignment",
    "action": "order_assignment_request",
    "data": {
        "orderId": "order-123",
        "assignmentId": "order-123_driver-456_1234567890",
        "restaurant": {
            "name": "Restaurant Name",
            "address": "Restaurant Address",
            "location": {"latitude": 33.2382, "longitude": 44.3748}
        },
        "customer": {
            "name": "Customer Name",
            "phone": "+9647901234567",
            "address": "Customer Address",
            "location": {"latitude": 33.2420, "longitude": 44.3800}
        },
        "order": {
            "items": [...],
            "totalAmount": 25000,
            "paymentMethod": "cash"
        },
        "distance": {
            "toRestaurant": 2.5,
            "toCustomer": 3.2,
            "total": 5.7
        },
        "timing": {
            "estimatedPickupTime": "2025-09-19T15:30:00Z",
            "estimatedDeliveryTime": "2025-09-19T16:00:00Z",
            "responseDeadline": "2025-09-19T15:01:00Z"
        },
        "earnings": {
            "base": 5.00,
            "distance": 8.55,
            "commission": 3.75,
            "total": 17.30,
            "currency": "USD"
        }
    }
}
```

### Driver Response

```json
{
    "type": "driver_assignment_response",
    "orderId": "order-123",
    "assignmentId": "order-123_driver-456_1234567890",
    "response": "accept", // or "decline"
    "reason": "optional decline reason",
    "estimatedPickupTime": "2025-09-19T15:25:00Z"
}
```

### Location Update

```json
{
    "type": "driver_location_update",
    "latitude": 33.2382,
    "longitude": 44.3748,
    "heading": 45,
    "speed": 25
}
```

### Status Update

```json
{
    "type": "driver_status_update",
    "status": "online" // online, offline, busy, break
}
```

### Order Status Update

```json
{
    "type": "order_status_update",
    "orderId": "order-123",
    "status": "picked_up", // picked_up, on_the_way, delivered, cancelled
    "location": {"latitude": 33.2382, "longitude": 44.3748}
}
```

## Driver Eligibility Criteria

### Driver Requirements

- Status: `online`
- Verified: `true`
- Active: `true`
- Within service radius (15km)
- Connection active within last 5 minutes
- Not exceeding maximum active orders:
  - Motorcycle: 2 orders
  - Car/Other: 1 order

### Order Requirements

- Status: `ready_for_pickup` or `confirmed`
- No existing driver assignment
- Not cancelled
- Valid delivery address
- Valid restaurant location

## Assignment Flow

1. **Order Ready**: Order status changes to `ready_for_pickup`
2. **Driver Search**: Find available drivers within service radius
3. **Priority Calculation**: Score drivers based on weighted criteria
4. **Assignment Attempt**: Send request to highest-priority driver
5. **Response Handling**: 
   - **Accept**: Complete assignment and update status
   - **Decline/Timeout**: Try next driver (up to 3 attempts)
6. **Fallback**: If all attempts fail, notify stakeholders and retry later

## Analytics and Monitoring

### Available Metrics

- Total assignments attempted
- Successful assignment rate
- Driver decline rate
- Response timeout rate
- Average attempts per order
- Assignment success by time period

### Getting Analytics

```javascript
const analytics = await getAssignmentAnalytics('24h'); // or '7d'
```

## Deployment

### Prerequisites

- AWS CLI configured
- Node.js 18+ installed
- DynamoDB tables created
- WebSocket API deployed

### Deploy System

```bash
# Deploy infrastructure
node deploy-driver-assignment.js

# Run tests
node test-driver-assignment.js
```

### Manual Deployment Steps

1. **Create DynamoDB Tables**:
   ```bash
   aws dynamodb create-table --cli-input-json file://table-schemas/driver-assignments.json
   ```

2. **Deploy Lambda Functions**:
   ```bash
   npm run deploy:driver-assignment
   ```

3. **Configure WebSocket Routes**:
   - Add routes for driver assignment messages
   - Update existing handler to include new message types

## Testing

### Unit Tests

```bash
# Run all tests
node test-driver-assignment.js

# Run specific test
npm test -- --grep "driver assignment"
```

### Integration Testing

1. **WebSocket Connection Test**:
   ```javascript
   const ws = new WebSocket('wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev');
   ws.send(JSON.stringify({type: 'authenticate', token: 'driver-token'}));
   ```

2. **Assignment Flow Test**:
   ```javascript
   await assignDriverToOrder('test-order-123');
   ```

### Load Testing

```bash
# Test with multiple concurrent assignments
npm run test:load
```

## Configuration

### Environment Variables

```bash
WEBSOCKET_CONNECTIONS_TABLE=WizzUser_websocket_connections_dev
ORDERS_TABLE=WizzUser_orders_dev
DRIVERS_TABLE=WizzUser_drivers_dev
ASSIGNMENT_HISTORY_TABLE=WizzUser_driver_assignments_dev
WEBSOCKET_ENDPOINT=wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev
```

### Tuning Parameters

- **MAX_ASSIGNMENT_DISTANCE_KM**: Adjust service radius
- **ASSIGNMENT_TIMEOUT_SECONDS**: Driver response timeout
- **PRIORITY_WEIGHTS**: Adjust scoring algorithm weights
- **MAX_RETRY_ATTEMPTS**: Maximum fallback attempts

## Monitoring

### CloudWatch Metrics

- Assignment success rate
- Average response time
- Driver decline rate
- System errors

### Alerts

- High driver decline rate (>50%)
- Assignment timeout rate (>30%)
- System errors (>5%)
- Low driver availability

## Troubleshooting

### Common Issues

1. **No Available Drivers**:
   - Check driver status (online/verified)
   - Verify service radius settings
   - Review connection timeouts

2. **Assignment Timeouts**:
   - Check driver app connectivity
   - Review timeout settings
   - Verify WebSocket message delivery

3. **High Decline Rate**:
   - Analyze decline reasons
   - Review earning calculations
   - Check distance calculations

### Debug Mode

```javascript
// Enable detailed logging
process.env.DEBUG_DRIVER_ASSIGNMENT = 'true';
```

## Security

### Authentication

- All WebSocket connections require JWT authentication
- Driver identity verified through Cognito
- Order access validated per driver permissions

### Data Protection

- Sensitive customer data encrypted in transit
- Driver location data anonymized in logs
- Assignment history includes audit trail

## Performance

### Optimization

- Driver queries use efficient indexes
- WebSocket messages are lightweight
- Assignment decisions cached temporarily
- Stale connections cleaned up automatically

### Scalability

- Supports thousands of concurrent drivers
- Horizontal scaling via Lambda
- DynamoDB auto-scaling enabled
- WebSocket connection pooling

## Future Enhancements

### Planned Features

1. **Geographic Zones**: Zone-based assignment optimization
2. **Machine Learning**: Predictive assignment success
3. **Dynamic Pricing**: Surge pricing integration
4. **Driver Preferences**: Route and area preferences
5. **Team Assignments**: Multi-driver order support

### API Extensions

1. **Manual Assignment**: Support staff assignment override
2. **Batch Assignment**: Multiple order assignment
3. **Driver Scheduling**: Advance assignment scheduling
4. **Performance Analytics**: Advanced reporting dashboard

## Support

### Documentation

- API Documentation: `/docs/api/driver-assignment`
- WebSocket Guide: `/docs/websocket/driver-messages`
- Deployment Guide: `/docs/deployment/driver-assignment`

### Contact

- Technical Support: tech@wizzcentral.com
- System Issues: support@wizzcentral.com
- Feature Requests: product@wizzcentral.com
