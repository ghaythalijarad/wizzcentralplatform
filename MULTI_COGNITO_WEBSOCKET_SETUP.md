# Multi-Cognito User Pool WebSocket Authentication

## Summary

Updated the WhizzCentralPlatform WebSocket backend to support multiple Cognito User Pools, allowing each app (WhizzMerchants, WhizzDrivers, WhizzCentralPlatform) to authenticate with their own user pool.

## Problem

- **Support Portal**: Using WhizzCentralPlatform Cognito User Pool (`us-east-1_Cp9YnOQWi`)
- **Merchants App**: Using WhizzMerchants Cognito User Pool (to be configured)
- **Drivers App**: Using WhizzDrivers Cognito User Pool (to be configured)
- Backend was configured for only ONE user pool, causing authentication failures

## Solution

### 1. Multiple Cognito Verifiers

Updated `backend/src/handlers/websocket-connections.js` to support three user pools:

```javascript
// WhizzCentralPlatform Cognito (for support agents)
const CENTRAL_PLATFORM_USER_POOL_ID = 'us-east-1_Cp9YnOQWi';
const CENTRAL_PLATFORM_CLIENT_ID = '22rf529lhbqtlvpdk2578h73l1';

// WhizzMerchants Cognito (for merchants)
const MERCHANTS_USER_POOL_ID = 'us-east-1_PHPkG78b5';
const MERCHANTS_CLIENT_ID = '1tl9g7nk2k2chtj5fg960fgdth';

// WhizzDrivers Cognito (for drivers)
const DRIVERS_USER_POOL_ID = 'us-east-1_Mnrmklxro';
const DRIVERS_CLIENT_ID = '4dkt45gole08kurh0o43rvk8q7';
```

### 2. Smart JWT Verification

The `verifyJwt()` function now:
1. Accepts **browser tokens** in development mode (tokens starting with `browser_`)
2. Routes verification to the correct user pool based on `userType` parameter:
   - `support` → Central Platform pool
   - `merchant` → Merchants pool
   - `driver` → Drivers pool
3. Falls back to trying all pools if userType doesn't match

### 3. Development Mode Support

For local testing without JWT:
- Browser tokens (`browser_agent_*`, `browser_driver_*`) are accepted
- Connections without tokens are allowed if `NODE_ENV=development` or `WS_AUTH_DISABLED=true`
- Support agents can connect without JWT verification

## Next Steps

### 1. Configure Merchants User Pool

Update environment variables:
```bash
export MERCHANTS_USER_POOL_ID="<your-merchants-pool-id>"
export MERCHANTS_CLIENT_ID="<your-merchants-client-id>"
```

Or add to serverless.websocket.yml:
```yaml
environment:
  MERCHANTS_USER_POOL_ID: ${env:MERCHANTS_USER_POOL_ID}
  MERCHANTS_CLIENT_ID: ${env:MERCHANTS_CLIENT_ID}
```

### 2. Configure Drivers User Pool

Same process:
```bash
export DRIVERS_USER_POOL_ID="<your-drivers-pool-id>"
export DRIVERS_CLIENT_ID="<your-drivers-client-id>"
```

### 3. Deploy Updated Handler

```bash
cd backend
node build-websocket-handler.js
./deploy-websocket-connections.sh
```

### 4. Find User Pool IDs

**For WhizzMerchants:**
```bash
cd whizzMerchants/frontend
cat amplifyconfiguration.json | grep user_pool_id
```

**For WhizzDrivers:**
```bash
cd whizzDrivers/frontend
cat amplifyconfiguration.json | grep user_pool_id
```

## Testing

### Support Portal (Local Development)

1. Open http://localhost:3000/pages/support.html
2. Connection should now succeed with status "Connected"
3. Browser console should show: `✅ Using sessionStorage idToken for WebSocket authentication`

### Merchants App

1. Launch app and login
2. Navigate to Settings > About the app > Chat with Support
3. Should connect and show "Connected" status
4. Send a test message

### Expected Behavior

- **Support Portal**: Connects with browser token (dev mode) or Central Platform JWT
- **Merchants App**: Connects with Merchants JWT (once configured)
- **Drivers App**: Connects with Drivers JWT (once configured)
- **Backend**: Automatically routes to correct verifier based on userType

## Files Modified

1. `backend/src/handlers/websocket-connections.js`
   - Added multi-pool verifier configuration
   - Updated `verifyJwt()` function
   - Added dev mode support for browser tokens

2. `frontend/js/support/LiveChatSocket.js`
   - Changed handshake action from `chat_init` to `chat_agent_connect`

3. `whizzMerchants/frontend/lib/screens/support_chat_screen.dart`
   - Changed handshake action from `merchant_join` to `chat_driver_connect`
   - Added JWT token to WebSocket connection
   - Normalized message payloads

4. `local-dev-server.js`
   - Added `'unsafe-inline'` to CSP for development

## Environment Variables

Add to `.env` or serverless config:

```env
# Central Platform (Support Portal)
CENTRAL_PLATFORM_USER_POOL_ID=us-east-1_Cp9YnOQWi
CENTRAL_PLATFORM_CLIENT_ID=22rf529lhbqtlvpdk2578h73l1

# Merchants (WhizzMerchants App)
MERCHANTS_USER_POOL_ID=<to-be-configured>
MERCHANTS_CLIENT_ID=<to-be-configured>

# Drivers (WhizzDrivers App)  
DRIVERS_USER_POOL_ID=<to-be-configured>
DRIVERS_CLIENT_ID=<to-be-configured>

# Development/Testing
NODE_ENV=development
WS_AUTH_DISABLED=false  # Set to true to disable JWT verification completely
```

## Troubleshooting

### Support Portal Still Shows "Connecting"

1. Check browser console for WebSocket errors
2. Verify idToken exists: `sessionStorage.getItem('idToken')`
3. Check CloudWatch logs for Lambda errors
4. Ensure CSP allows WebSocket connections

### Merchants App Shows "Disconnected"

1. Verify token is being sent: Check `TokenManager.getAuthorizationToken()`
2. Configure `MERCHANTS_USER_POOL_ID` and `MERCHANTS_CLIENT_ID`
3. Redeploy Lambda handler
4. Check CloudWatch logs: `$connect` route should show JWT verification success

### "Invalid token" Errors

1. Ensure correct user pool ID and client ID are configured
2. Check token expiration (Cognito tokens expire after 1 hour)
3. Verify token is an **ID token**, not an access token
4. Try refreshing the token (logout and login again)

## Security Notes

- **Production**: Remove dev mode bypasses and require valid JWT for all connections
- **Browser tokens**: Only accepted in development, never in production
- **JWT verification**: Each app's tokens are verified against their own user pool
- **Fallback verification**: If userType is unknown, tries all configured pools (performance impact)

## Future Improvements

1. Add caching for JWT verification results
2. Implement token refresh mechanism
3. Add rate limiting per user pool
4. Add metrics/monitoring for auth failures per pool
5. Consider using AWS Cognito Authorizer instead of custom JWT verification
