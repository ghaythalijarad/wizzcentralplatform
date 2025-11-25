# 🔧 WebSocket 403 Forbidden Error - Fix Guide

**Issue:** Support page shows "جاري الاتصال..." (Connecting...) instead of "متصل" (Connected)  
**Root Cause:** AWS WebSocket API Gateway returns **HTTP 403 Forbidden**  
**Endpoint:** `wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth`

---

## 🔍 Problem Diagnosis

### Test Results
```bash
curl -I "https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"
# Returns: HTTP/2 403
```

This confirms the WebSocket API Gateway is deployed but **rejecting connections**.

### Browser Console Errors
When you open the support page, you'll see:
```
🔗 Attempting to connect to: wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
❌ Merchant chat WebSocket error
🔌 Merchant chat WebSocket disconnected – code: 1006
❌ Close code 1006: Abnormal closure - likely authentication/authorization failure
💡 This usually means AWS API Gateway returned 403 Forbidden
```

---

## ✅ Solutions

### Option 1: Fix AWS WebSocket API Gateway (Recommended)

The WebSocket API Gateway needs proper configuration to accept connections.

#### Step 1: Check API Gateway Configuration

```bash
# List all WebSocket APIs
aws apigatewayv2 get-apis --region us-east-1 --profile wizz-drivers-ghayth-dev

# Get specific API details
aws apigatewayv2 get-api --api-id bx4snzqxpd --region us-east-1 --profile wizz-drivers-ghayth-dev
```

#### Step 2: Check Routes Configuration

```bash
# List routes for the WebSocket API
aws apigatewayv2 get-routes --api-id bx4snzqxpd --region us-east-1 --profile wizz-drivers-ghayth-dev
```

You should have these routes:
- `$connect` - Called when client connects
- `$disconnect` - Called when client disconnects
- `$default` - Handles all other messages
- Custom routes like `chat_agent_connect`, `send_message`, etc.

#### Step 3: Check Lambda Authorizer (if using)

```bash
# List authorizers
aws apigatewayv2 get-authorizers --api-id bx4snzqxpd --region us-east-1 --profile wizz-drivers-ghayth-dev
```

Common issues:
- Authorizer Lambda function doesn't exist
- Authorizer returns incorrect policy format
- Missing IAM permissions

#### Step 4: Fix the `$connect` Route

The `$connect` route must either:
1. **Have no authorizer** (allow anonymous connections), OR
2. **Have a working Lambda authorizer** that returns a proper IAM policy

To remove the authorizer and allow all connections:

```bash
# Get the route ID for $connect
ROUTE_ID=$(aws apigatewayv2 get-routes \
  --api-id bx4snzqxpd \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --query 'Items[?RouteKey==`$connect`].RouteId' \
  --output text)

# Remove the authorizer from $connect
aws apigatewayv2 update-route \
  --api-id bx4snzqxpd \
  --route-id $ROUTE_ID \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --no-authorizer-id
```

#### Step 5: Redeploy the API

```bash
# Create a new deployment
aws apigatewayv2 create-deployment \
  --api-id bx4snzqxpd \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --stage-name ghayth
```

#### Step 6: Test the Connection

```bash
# Should now return 200 or upgrade to WebSocket
curl -I "https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"

# Test with wscat (install with: npm install -g wscat)
wscat -c wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
```

---

### Option 2: Create Lambda Authorizer (If You Need Authentication)

If you want to authenticate WebSocket connections:

#### Create Authorizer Lambda

```python
# lambda_websocket_authorizer.py
import json

def lambda_handler(event, context):
    """
    WebSocket Lambda Authorizer
    Returns IAM policy to allow/deny connection
    """
    print(f"Authorizer event: {json.dumps(event)}")
    
    # Extract connection info
    method_arn = event['methodArn']
    
    # TODO: Add your authentication logic here
    # For now, allow all connections
    allow = True
    
    if allow:
        # Generate allow policy
        policy = {
            "principalId": "user",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Allow",
                        "Resource": method_arn
                    }
                ]
            }
        }
    else:
        # Generate deny policy
        policy = {
            "principalId": "user",
            "policyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "execute-api:Invoke",
                        "Effect": "Deny",
                        "Resource": method_arn
                    }
                ]
            }
        }
    
    return policy
```

#### Deploy Authorizer

```bash
# Create Lambda function
zip authorizer.zip lambda_websocket_authorizer.py

aws lambda create-function \
  --function-name websocket-authorizer \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_websocket_authorizer.lambda_handler \
  --zip-file fileb://authorizer.zip \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev

# Create authorizer in API Gateway
aws apigatewayv2 create-authorizer \
  --api-id bx4snzqxpd \
  --authorizer-type REQUEST \
  --authorizer-uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:websocket-authorizer/invocations \
  --identity-source route.request.header.Authorization \
  --name WebSocketAuthorizer \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev
```

---

### Option 3: Use Local WebSocket Server for Development

If you want to test locally without AWS:

#### Add to `local-dev-server.js`

```javascript
const WebSocket = require('ws');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('✅ Client connected to local WebSocket');
    
    ws.on('message', (message) => {
        console.log('📥 Received:', message);
        // Echo back or handle message
        ws.send(JSON.stringify({ type: 'ack', data: 'Message received' }));
    });
    
    ws.on('close', () => {
        console.log('🔌 Client disconnected');
    });
});

console.log('🔌 WebSocket server running on ws://localhost:8080');
```

#### Update Support Page for Local Development

```javascript
// In support.html, add environment detection
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const MERCHANT_WS_URL = IS_LOCAL 
    ? 'ws://localhost:8080'
    : 'wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth';
```

---

## 📊 Verification Steps

After applying any fix:

### 1. Test HTTP Endpoint
```bash
curl -I "https://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"
# Should return: HTTP/2 200 or HTTP/2 426 (Upgrade Required)
# Should NOT return: HTTP/2 403
```

### 2. Test WebSocket Connection
```bash
# Install wscat
npm install -g wscat

# Test connection
wscat -c wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth

# You should see: connected (press CTRL+C to quit)
# If it works, type a message and press Enter
```

### 3. Check Support Page

1. Open: https://main.d2f5oacwil9cbi.amplifyapp.com/frontend/pages/support.html
2. Open Browser Console (F12)
3. Look for:
   ```
   ✅ Merchant chat WebSocket connected
   📍 Active endpoint: wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth
   ✅ CONNECTION STATE: merchantChatWS is OPEN (readyState: 1)
   ```
4. UI should show: "متصل" (Connected) instead of "جاري الاتصال..." (Connecting...)

---

## 🔧 Quick Fix Commands

### Remove Authorizer and Redeploy (Fastest Fix)

```bash
# Complete fix in one script
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Get $connect route ID
ROUTE_ID=$(aws apigatewayv2 get-routes \
  --api-id bx4snzqxpd \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --query 'Items[?RouteKey==`$connect`].RouteId' \
  --output text)

echo "Route ID: $ROUTE_ID"

# Remove authorizer
aws apigatewayv2 update-route \
  --api-id bx4snzqxpd \
  --route-id $ROUTE_ID \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --no-authorization-type

# Redeploy
aws apigatewayv2 create-deployment \
  --api-id bx4snzqxpd \
  --region us-east-1 \
  --profile wizz-drivers-ghayth-dev \
  --stage-name ghayth

echo "✅ Fixed! Test with:"
echo "wscat -c wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth"
```

---

## 📝 Additional Resources

- [AWS WebSocket API Gateway Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Lambda Authorizers for WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-lambda-auth.html)
- [WebSocket Close Codes](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code)

---

## ✅ Changes Made to Support Page

The support page now includes:

1. **Connection Timeout Detection** - Detects if WebSocket is stuck connecting for more than 10 seconds
2. **Better Error Logging** - Logs detailed error information including close codes
3. **Diagnostic Tips** - Provides curl command to test endpoint
4. **Clear Status Messages** - Shows "Connection timeout - AWS configuration issue" when appropriate
5. **Close Code Interpretation** - Explains what each WebSocket close code means

---

*Last Updated: November 15, 2025*
*Author: GitHub Copilot*
