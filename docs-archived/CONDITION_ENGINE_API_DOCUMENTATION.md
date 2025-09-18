# WizzCentral Campaign Condition Engine API Documentation

## Overview

The WizzCentral Campaign Condition Engine API provides sophisticated targeting capabilities for marketing campaigns. It enables creating, managing, and evaluating complex conditions based on customer behavior, location, time, and business logic.

**Version:** 1.0  
**Base URL:** `https://api.wizzcentral.com/v1`  
**Authentication:** Bearer Token (JWT)

## Table of Contents

1. [Authentication](#authentication)
2. [Condition Definitions](#condition-definitions)
3. [Campaign Management](#campaign-management)
4. [Condition Evaluation](#condition-evaluation)
5. [Analytics](#analytics)
6. [Error Handling](#error-handling)
7. [SDKs and Examples](#sdks-and-examples)

## Authentication

All API requests require authentication using a Bearer token.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Authentication Token

```http
POST /auth/token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## Condition Definitions

### List Available Conditions

Get all available condition types and their parameters.

```http
GET /conditions/definitions
```

**Response:**
```json
{
  "conditions": {
    "customer": [
      {
        "id": "new_customer",
        "name": "New Customer",
        "description": "Customer with zero completed orders",
        "parameters": {},
        "category": "customer"
      },
      {
        "id": "recently_registered",
        "name": "Recently Registered",
        "description": "Customer registered within specified days",
        "parameters": {
          "days": {
            "type": "integer",
            "default": 7,
            "min": 1,
            "max": 365,
            "description": "Number of days since registration"
          }
        },
        "category": "customer"
      }
    ],
    "order": [
      {
        "id": "minimum_order_value",
        "name": "Minimum Order Value",
        "description": "Order value meets minimum threshold",
        "parameters": {
          "amount": {
            "type": "number",
            "required": true,
            "min": 0,
            "description": "Minimum order amount in USD"
          }
        },
        "category": "order"
      }
    ],
    "location": [
      {
        "id": "specific_restaurant",
        "name": "Specific Restaurant",
        "description": "Order from specified restaurant",
        "parameters": {
          "restaurant_id": {
            "type": "string",
            "required": true,
            "description": "Restaurant identifier"
          }
        },
        "category": "location"
      }
    ],
    "time": [
      {
        "id": "time_window",
        "name": "Time Window",
        "description": "Order placed within specific time window",
        "parameters": {
          "start_hour": {
            "type": "integer",
            "min": 0,
            "max": 23,
            "description": "Start hour (24-hour format)"
          },
          "end_hour": {
            "type": "integer",
            "min": 0,
            "max": 23,
            "description": "End hour (24-hour format)"
          }
        },
        "category": "time"
      }
    ]
  }
}
```

### Get Condition Definition

Get details for a specific condition type.

```http
GET /conditions/definitions/{conditionId}
```

**Response:**
```json
{
  "id": "new_customer",
  "name": "New Customer",
  "description": "Customer with zero completed orders",
  "category": "customer",
  "parameters": {},
  "examples": [
    {
      "description": "Target only brand new customers",
      "config": {}
    }
  ],
  "evaluation_logic": "customer.completed_orders === 0",
  "supported_operators": ["equals", "not_equals"],
  "performance_notes": "Low computational cost, high selectivity"
}
```

## Campaign Management

### Create Campaign

Create a new campaign with conditions.

```http
POST /campaigns
Content-Type: application/json

{
  "name": "Welcome New Customers",
  "description": "Special offer for first-time customers",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "discount": {
    "type": "percentage",
    "value": 20,
    "max_amount": 50
  },
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "condition_id": "new_customer",
        "parameters": {}
      },
      {
        "condition_id": "minimum_order_value",
        "parameters": {
          "amount": 25
        }
      }
    ]
  },
  "target_audience": {
    "estimated_size": 10000,
    "segment": "new_customers"
  }
}
```

**Response:**
```json
{
  "id": "campaign_123",
  "name": "Welcome New Customers",
  "status": "active",
  "created_at": "2024-01-01T12:00:00Z",
  "conditions": {
    "compiled": true,
    "hash": "abc123def456",
    "estimated_matches": 8500
  },
  "metrics": {
    "estimated_reach": 8500,
    "estimated_conversion_rate": 0.12,
    "estimated_revenue": 25500
  }
}
```

### List Campaigns

Get all campaigns with optional filtering.

```http
GET /campaigns?status=active&limit=20&offset=0
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `paused`, `ended`)
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search in campaign names and descriptions

**Response:**
```json
{
  "campaigns": [
    {
      "id": "campaign_123",
      "name": "Welcome New Customers",
      "status": "active",
      "created_at": "2024-01-01T12:00:00Z",
      "metrics": {
        "total_redemptions": 450,
        "total_revenue": 12750,
        "conversion_rate": 0.08
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Get Campaign Details

```http
GET /campaigns/{campaignId}
```

**Response:**
```json
{
  "id": "campaign_123",
  "name": "Welcome New Customers",
  "description": "Special offer for first-time customers",
  "status": "active",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "discount": {
    "type": "percentage",
    "value": 20,
    "max_amount": 50
  },
  "conditions": {
    "operator": "AND",
    "rules": [
      {
        "condition_id": "new_customer",
        "parameters": {},
        "performance": {
          "trigger_rate": 0.15,
          "conversion_rate": 0.08,
          "effectiveness_score": 0.75
        }
      }
    ]
  },
  "metrics": {
    "total_redemptions": 450,
    "unique_customers": 400,
    "total_revenue": 12750,
    "avg_order_value": 28.33,
    "conversion_rate": 0.08,
    "roi": 2.45
  },
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Update Campaign

```http
PUT /campaigns/{campaignId}
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "status": "paused",
  "conditions": {
    "operator": "OR",
    "rules": [
      {
        "condition_id": "new_customer",
        "parameters": {}
      }
    ]
  }
}
```

### Delete Campaign

```http
DELETE /campaigns/{campaignId}
```

## Condition Evaluation

### Evaluate Conditions for Customer

Check if a customer meets campaign conditions.

```http
POST /conditions/evaluate
Content-Type: application/json

{
  "campaign_id": "campaign_123",
  "customer_id": "customer_456",
  "order_context": {
    "restaurant_id": "restaurant_789",
    "total_amount": 35.50,
    "items": [
      {
        "id": "item_1",
        "name": "Pizza Margherita",
        "price": 18.50
      }
    ]
  },
  "timestamp": "2024-01-15T14:30:00Z"
}
```

**Response:**
```json
{
  "eligible": true,
  "campaign_id": "campaign_123",
  "customer_id": "customer_456",
  "evaluation_result": {
    "overall_match": true,
    "condition_results": [
      {
        "condition_id": "new_customer",
        "matched": true,
        "execution_time_ms": 2.5,
        "details": {
          "customer_order_count": 0,
          "customer_registration_date": "2024-01-10T09:00:00Z"
        }
      },
      {
        "condition_id": "minimum_order_value",
        "matched": true,
        "execution_time_ms": 0.8,
        "details": {
          "order_amount": 35.50,
          "required_minimum": 25.00
        }
      }
    ]
  },
  "discount": {
    "type": "percentage",
    "value": 20,
    "amount": 7.10,
    "final_total": 28.40
  },
  "evaluation_metadata": {
    "total_execution_time_ms": 5.3,
    "cache_hit": false,
    "evaluation_id": "eval_789abc"
  }
}
```

### Batch Condition Evaluation

Evaluate conditions for multiple customers/orders.

```http
POST /conditions/evaluate/batch
Content-Type: application/json

{
  "campaign_id": "campaign_123",
  "evaluations": [
    {
      "customer_id": "customer_456",
      "order_context": {
        "total_amount": 35.50
      }
    },
    {
      "customer_id": "customer_789",
      "order_context": {
        "total_amount": 22.00
      }
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "customer_id": "customer_456",
      "eligible": true,
      "discount_amount": 7.10
    },
    {
      "customer_id": "customer_789",
      "eligible": false,
      "reason": "Order value below minimum threshold"
    }
  ],
  "summary": {
    "total_evaluated": 2,
    "eligible_count": 1,
    "eligibility_rate": 0.5,
    "total_execution_time_ms": 8.7
  }
}
```

## Analytics

### Campaign Performance Analytics

```http
GET /analytics/campaigns/{campaignId}?timeRange=7d&granularity=day
```

**Query Parameters:**
- `timeRange`: `1h`, `24h`, `7d`, `30d`, `custom`
- `granularity`: `hour`, `day`, `week`, `month`
- `startDate` (for custom range): ISO 8601 date
- `endDate` (for custom range): ISO 8601 date

**Response:**
```json
{
  "campaign_id": "campaign_123",
  "time_range": "7d",
  "summary": {
    "total_redemptions": 450,
    "unique_customers": 400,
    "total_revenue": 12750.50,
    "avg_order_value": 28.33,
    "conversion_rate": 0.08,
    "roi": 2.45
  },
  "time_series": [
    {
      "date": "2024-01-15",
      "redemptions": 65,
      "revenue": 1840.25,
      "unique_customers": 60
    }
  ],
  "condition_performance": [
    {
      "condition_id": "new_customer",
      "trigger_rate": 0.15,
      "conversion_rate": 0.08,
      "effectiveness_score": 0.75,
      "revenue_impact": 8500.00
    }
  ],
  "customer_segments": {
    "new_customers": {
      "count": 380,
      "revenue": 10750.00,
      "avg_order_value": 28.29
    },
    "returning_customers": {
      "count": 20,
      "revenue": 2000.50,
      "avg_order_value": 100.03
    }
  },
  "geographic_breakdown": [
    {
      "restaurant_id": "restaurant_789",
      "restaurant_name": "Mario's Pizza",
      "redemptions": 120,
      "revenue": 3400.00
    }
  ]
}
```

### Condition Analytics

```http
GET /analytics/conditions/{conditionId}?timeRange=30d
```

**Response:**
```json
{
  "condition_id": "new_customer",
  "name": "New Customer",
  "summary": {
    "total_triggers": 2500,
    "total_conversions": 450,
    "avg_trigger_rate": 0.15,
    "avg_conversion_rate": 0.18,
    "total_revenue_impact": 35000.00
  },
  "campaigns_using": [
    {
      "campaign_id": "campaign_123",
      "campaign_name": "Welcome New Customers",
      "performance": {
        "triggers": 1200,
        "conversions": 200,
        "revenue": 15000.00
      }
    }
  ],
  "performance_trends": [
    {
      "date": "2024-01-15",
      "triggers": 85,
      "conversions": 15,
      "conversion_rate": 0.176
    }
  ],
  "recommendations": [
    {
      "type": "optimization",
      "priority": "medium",
      "message": "Consider combining with time-based conditions to improve conversion rate",
      "potential_impact": "+12% conversion rate"
    }
  ]
}
```

### System Performance Metrics

```http
GET /analytics/system/performance?timeRange=24h
```

**Response:**
```json
{
  "evaluation_performance": {
    "total_evaluations": 125000,
    "avg_evaluation_time_ms": 4.2,
    "p95_evaluation_time_ms": 12.5,
    "p99_evaluation_time_ms": 25.8,
    "cache_hit_rate": 0.78
  },
  "condition_usage": [
    {
      "condition_id": "new_customer",
      "usage_count": 45000,
      "avg_execution_time_ms": 2.1
    }
  ],
  "error_rates": {
    "evaluation_errors": 0.001,
    "timeout_errors": 0.0005,
    "validation_errors": 0.002
  },
  "resource_utilization": {
    "cpu_usage": 0.45,
    "memory_usage": 0.62,
    "database_connections": 25
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid condition parameters",
    "details": {
      "field": "amount",
      "value": -10,
      "constraint": "must be greater than 0"
    },
    "request_id": "req_123abc",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing authentication token |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions for resource |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `CONDITION_EVALUATION_ERROR` | 422 | Error evaluating conditions |
| `RATE_LIMIT_EXCEEDED` | 429 | API rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Rate Limiting

API requests are rate-limited per API key:

- **Standard Plan**: 1000 requests/hour
- **Professional Plan**: 5000 requests/hour  
- **Enterprise Plan**: 25000 requests/hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## SDKs and Examples

### JavaScript SDK

```bash
npm install @wizzcentral/condition-engine
```

```javascript
import { ConditionEngine } from '@wizzcentral/condition-engine';

const engine = new ConditionEngine({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.wizzcentral.com/v1'
});

// Evaluate conditions
const result = await engine.evaluate({
  campaignId: 'campaign_123',
  customerId: 'customer_456',
  orderContext: {
    totalAmount: 35.50,
    restaurantId: 'restaurant_789'
  }
});

if (result.eligible) {
  console.log(`Discount: $${result.discount.amount}`);
}
```

### Python SDK

```bash
pip install wizzcentral-condition-engine
```

```python
from wizzcentral import ConditionEngine

engine = ConditionEngine(
    api_key='your-api-key',
    base_url='https://api.wizzcentral.com/v1'
)

# Evaluate conditions
result = engine.evaluate(
    campaign_id='campaign_123',
    customer_id='customer_456',
    order_context={
        'total_amount': 35.50,
        'restaurant_id': 'restaurant_789'
    }
)

if result['eligible']:
    print(f"Discount: ${result['discount']['amount']}")
```

### cURL Examples

#### Create Campaign
```bash
curl -X POST https://api.wizzcentral.com/v1/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Customer Welcome",
    "conditions": {
      "operator": "AND",
      "rules": [
        {
          "condition_id": "new_customer",
          "parameters": {}
        }
      ]
    }
  }'
```

#### Evaluate Conditions
```bash
curl -X POST https://api.wizzcentral.com/v1/conditions/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "campaign_123",
    "customer_id": "customer_456",
    "order_context": {
      "total_amount": 35.50
    }
  }'
```

## Webhooks

### Campaign Events

Subscribe to campaign events via webhooks:

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/campaigns",
  "events": [
    "campaign.condition_triggered",
    "campaign.redeemed",
    "campaign.performance_alert"
  ],
  "secret": "webhook_secret_key"
}
```

### Event Payload Example

```json
{
  "event": "campaign.redeemed",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "campaign_id": "campaign_123",
    "customer_id": "customer_456",
    "order_id": "order_789",
    "discount_amount": 7.10,
    "revenue_impact": 28.40
  },
  "webhook_id": "webhook_123"
}
```

## Testing

### Sandbox Environment

Use the sandbox environment for testing:

**Base URL:** `https://api-sandbox.wizzcentral.com/v1`

Sandbox features:
- No real charges or impacts
- Simulated customer data
- Fast condition evaluation
- Comprehensive test scenarios

### Test Customer Data

The sandbox provides pre-configured test customers:

- `test_new_customer_001`: New customer (0 orders)
- `test_vip_customer_001`: VIP customer (50+ orders)
- `test_frequent_customer_001`: Frequent customer (10+ orders)

## Support

- **Documentation**: https://docs.wizzcentral.com
- **Support Email**: api-support@wizzcentral.com
- **Status Page**: https://status.wizzcentral.com
- **Developer Portal**: https://developers.wizzcentral.com

## Changelog

### Version 1.0 (Current)
- Initial release
- Core condition engine functionality
- Campaign management
- Analytics and reporting
- Webhook support

---

*Last updated: January 15, 2024*
