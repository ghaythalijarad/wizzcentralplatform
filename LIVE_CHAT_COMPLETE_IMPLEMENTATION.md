# 🎯 Live Chat Complete Implementation Guide

## 📊 Current Status Summary

**✅ Working Components:**
- Flutter chat UI with WizzCentral Support Chat Widget
- Central Platform dashboard hosted on AWS Amplify
- Chat bridge server (`chat-message-bridge.cjs`) running on port 8087
- Message bridging from HTTP to WebSocket (partial)

**❌ Critical Issues to Fix:**
1. **WebSocket Authentication (401 errors)** - Primary blocker
2. **Message persistence** - Messages lost on Lambda restart
3. **Connection recovery** - No reconnection logic
4. **Production readiness** - Missing AWS infrastructure

---

## 🚀 Phase 1: Fix WebSocket Authentication (Day 1)

### Step 1.1: Update Flutter WebSocket Configuration

**File:** `/Users/ghaythallaheebi/Desktop/hadhir/frontend/lib/config/environment.dart`

```dart
class Environment {
  // ... existing code ...

  // Live Chat WebSocket URL with proper authentication
  static String get liveChatWebSocketUrl {
    // Use production WebSocket endpoint with authentication parameters
    const baseUrl = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
    const businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5';
    return '$baseUrl?userType=driver&businessId=$businessId&platform=flutter';
  }

  // HTTP Bridge API for message forwarding
  static const String chatBridgeApiUrl = 
    'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api';
}
```

### Step 1.2: Fix WebSocket Lambda Authorizer

**Issue:** Current authorizer rejects driver connections with 401 errors.

**Solution:** Update Lambda authorizer to accept driver connections with proper business ID.

**File:** `websocket-authorizer.js` (AWS Lambda)

```javascript
exports.handler = async (event) => {
    console.log('WebSocket Authorization Event:', JSON.stringify(event, null, 2));
    
    try {
        const { queryStringParameters, headers } = event;
        const userType = queryStringParameters?.userType;
        const businessId = queryStringParameters?.businessId;
        const platform = queryStringParameters?.platform;
        
        // Allow driver connections with valid business ID
        if (userType === 'driver' && businessId === '7ccf646c-9594-48d4-8f63-c366d89257e5') {
            return {
                principalId: `driver-${Date.now()}`,
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: event.methodArn
                    }]
                },
                context: {
                    userType: userType,
                    businessId: businessId,
                    platform: platform || 'unknown'
                }
            };
        }
        
        // Allow agent connections
        if (userType === 'agent' || userType === 'agent_dashboard') {
            return {
                principalId: `agent-${Date.now()}`,
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: event.methodArn
                    }]
                },
                context: {
                    userType: userType,
                    businessId: businessId || '7ccf646c-9594-48d4-8f63-c366d89257e5'
                }
            };
        }
        
        // Deny all other connections
        throw new Error(`Unauthorized user type: ${userType}`);
        
    } catch (error) {
        console.error('Authorization failed:', error);
        throw new Error('Unauthorized');
    }
};
```

### Step 1.3: Update Flutter Chat Service

**File:** `/Users/ghaythallaheebi/Desktop/hadhir/frontend/lib/services/wizzcentral_support_chat_service.dart`

```dart
class WizzCentralSupportChatService {
  // ... existing code ...

  Future<void> _connectWebSocket() async {
    try {
      if (_webSocket != null) {
        await _webSocket!.close();
      }

      // Use environment configuration for WebSocket URL
      final wsUrl = Environment.liveChatWebSocketUrl;
      debugPrint('🔌 Connecting to WebSocket: $wsUrl');

      _webSocket = IOWebSocketChannel.connect(
        wsUrl,
        connectTimeout: const Duration(seconds: 15),
      );

      _webSocket!.stream.listen(
        _handleWebSocketMessage,
        onError: (error) {
          debugPrint('❌ WebSocket error: $error');
          _reconnectWebSocket();
        },
        onDone: () {
          debugPrint('🔌 WebSocket disconnected');
          _reconnectWebSocket();
        },
      );

      // Send driver authentication after connection
      _sendDriverAuthentication();
      
      debugPrint('✅ WebSocket connected successfully');
    } catch (e) {
      debugPrint('❌ WebSocket connection failed: $e');
      _reconnectWebSocket();
    }
  }

  void _sendDriverAuthentication() {
    final authMessage = {
      'type': 'driver_connect',
      'sessionId': _sessionId,
      'businessId': '7ccf646c-9594-48d4-8f63-c366d89257e5',
      'driverId': _driverId,
      'timestamp': DateTime.now().toIso8601String(),
      'platform': 'flutter',
      'metadata': {
        'app_version': '1.0.0',
        'platform': 'flutter',
        'userType': 'driver'
      }
    };

    _webSocket?.sink.add(jsonEncode(authMessage));
    debugPrint('📤 Sent driver authentication');
  }
}
```

---

## 🏗️ Phase 2: Implement Message Persistence (Day 2)

### Step 2.1: Create DynamoDB Table for Messages

**AWS CLI Command:**
```bash
aws dynamodb create-table \
  --table-name LiveChatMessages \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 2.2: Update Lambda Handler with DynamoDB Integration

**File:** `websocket-handler.js` (AWS Lambda)

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const { requestContext, body } = event;
    const { connectionId, routeKey } = requestContext;
    
    console.log('WebSocket Event:', { routeKey, connectionId, body });

    try {
        if (routeKey === '$connect') {
            return await handleConnect(event);
        } else if (routeKey === '$disconnect') {
            return await handleDisconnect(event);
        } else if (routeKey === '$default') {
            return await handleMessage(event);
        }
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('Handler error:', error);
        return { statusCode: 500 };
    }
};

async function handleConnect(event) {
    const { connectionId, authorizer } = event.requestContext;
    
    // Store connection info in DynamoDB
    await dynamodb.put({
        TableName: 'LiveChatConnections',
        Item: {
            connectionId: connectionId,
            userType: authorizer?.userType || 'unknown',
            businessId: authorizer?.businessId || 'unknown',
            connectedAt: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + 3600 // 1 hour TTL
        }
    }).promise();
    
    console.log(`✅ Connection stored: ${connectionId}`);
    return { statusCode: 200 };
}

async function handleMessage(event) {
    const { connectionId } = event.requestContext;
    const message = JSON.parse(event.body || '{}');
    
    // Store message in DynamoDB
    const messageRecord = {
        sessionId: message.sessionId || `session-${connectionId}`,
        timestamp: new Date().toISOString(),
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: message.senderId || connectionId,
        senderType: message.senderType || 'driver',
        content: message.content || message.message,
        businessId: message.businessId || '7ccf646c-9594-48d4-8f63-c366d89257e5',
        messageType: message.type || 'driver_message',
        metadata: message.metadata || {},
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 3600) // 30 days TTL
    };
    
    await dynamodb.put({
        TableName: 'LiveChatMessages',
        Item: messageRecord
    }).promise();
    
    // Broadcast to agents
    await broadcastToAgents(message, connectionId);
    
    return { statusCode: 200 };
}

async function broadcastToAgents(message, senderConnectionId) {
    const apiGateway = new AWS.ApiGatewayManagementApi({
        endpoint: process.env.WEBSOCKET_ENDPOINT
    });
    
    // Get all agent connections
    const agentConnections = await dynamodb.query({
        TableName: 'LiveChatConnections',
        IndexName: 'userType-index',
        KeyConditionExpression: 'userType = :userType',
        ExpressionAttributeValues: {
            ':userType': 'agent'
        }
    }).promise();
    
    // Send message to all agents
    const sendPromises = agentConnections.Items.map(async (connection) => {
        try {
            await apiGateway.postToConnection({
                ConnectionId: connection.connectionId,
                Data: JSON.stringify({
                    type: 'driver_message',
                    sessionId: message.sessionId,
                    content: message.content,
                    senderId: message.senderId,
                    timestamp: new Date().toISOString(),
                    businessId: message.businessId
                })
            }).promise();
        } catch (error) {
            console.error(`Failed to send to ${connection.connectionId}:`, error);
        }
    });
    
    await Promise.all(sendPromises);
}
```

---

## 🔄 Phase 3: Add Connection Recovery (Day 3)

### Step 3.1: Flutter Reconnection Logic

**File:** `/Users/ghaythallaheebi/Desktop/hadhir/frontend/lib/services/wizzcentral_support_chat_service.dart`

```dart
class WizzCentralSupportChatService {
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const Duration _baseReconnectDelay = Duration(seconds: 2);

  void _reconnectWebSocket() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('❌ Max reconnection attempts reached');
      return;
    }

    _reconnectAttempts++;
    final delay = Duration(
      seconds: _baseReconnectDelay.inSeconds * _reconnectAttempts,
    );

    debugPrint('🔄 Reconnecting in ${delay.inSeconds}s (attempt $_reconnectAttempts)');

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      _connectWebSocket();
    });
  }

  void _resetReconnectAttempts() {
    _reconnectAttempts = 0;
    _reconnectTimer?.cancel();
  }
}
```

### Step 3.2: Add Health Check and Heartbeat

```dart
class WizzCentralSupportChatService {
  Timer? _heartbeatTimer;
  DateTime? _lastHeartbeatResponse;

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _sendHeartbeat();
    });
  }

  void _sendHeartbeat() {
    final heartbeat = {
      'type': 'heartbeat',
      'sessionId': _sessionId,
      'timestamp': DateTime.now().toIso8601String(),
    };

    _webSocket?.sink.add(jsonEncode(heartbeat));
  }

  void _handleHeartbeatResponse() {
    _lastHeartbeatResponse = DateTime.now();
    _resetReconnectAttempts();
  }

  void _checkConnectionHealth() {
    final now = DateTime.now();
    if (_lastHeartbeatResponse != null) {
      final timeSinceLastResponse = now.difference(_lastHeartbeatResponse!);
      if (timeSinceLastResponse.inMinutes > 2) {
        debugPrint('⚠️ Connection appears unhealthy, reconnecting...');
        _reconnectWebSocket();
      }
    }
  }
}
```

---

## 📊 Phase 4: Add Monitoring and Debugging (Day 4)

### Step 4.1: CloudWatch Logging Setup

**Lambda Function Environment Variables:**
```json
{
  "LOG_LEVEL": "INFO",
  "WEBSOCKET_ENDPOINT": "https://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev"
}
```

**Enhanced Logging in Lambda:**
```javascript
const log = {
    debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error)
};

// Usage in handlers
log.info('Message received', { sessionId: message.sessionId, type: message.type });
```

### Step 4.2: Flutter Logging and Analytics

```dart
class ChatLogger {
  static void logMessage(String level, String message, [Map<String, dynamic>? data]) {
    final timestamp = DateTime.now().toIso8601String();
    final logEntry = {
      'timestamp': timestamp,
      'level': level,
      'message': message,
      'data': data,
    };
    
    debugPrint('[$level] $message ${data != null ? jsonEncode(data) : ''}');
    
    // Optional: Send to analytics service
    _sendToAnalytics(logEntry);
  }

  static void _sendToAnalytics(Map<String, dynamic> logEntry) {
    // Implementation for sending logs to analytics service
  }
}
```

---

## 🚀 Phase 5: AWS Infrastructure Setup (Day 5-6)

### Step 5.1: Create Required AWS Resources

**DynamoDB Tables:**
```bash
# Messages table
aws dynamodb create-table \
  --table-name LiveChatMessages \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Connections table
aws dynamodb create-table \
  --table-name LiveChatConnections \
  --attribute-definitions \
    AttributeName=connectionId,AttributeType=S \
    AttributeName=userType,AttributeType=S \
  --key-schema \
    AttributeName=connectionId,KeyType=HASH \
  --global-secondary-indexes \
    'IndexName=userType-index,KeySchema=[{AttributeName=userType,KeyType=HASH}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST
```

### Step 5.2: Redis Setup for Session Management

**ElastiCache Redis Cluster:**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id live-chat-sessions \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### Step 5.3: SQS for Message Queuing

```bash
aws sqs create-queue \
  --queue-name live-chat-message-queue \
  --attributes DelaySeconds=0,MessageRetentionPeriod=1209600
```

---

## 🧪 Phase 6: Testing and Validation (Day 7)

### Step 6.1: End-to-End Testing Script

**File:** `test-live-chat-complete.js`

```javascript
const WebSocket = require('ws');

async function testLiveChatFlow() {
    console.log('🧪 Testing Complete Live Chat Flow...');
    
    // Test 1: Driver Connection
    const driverWs = await connectAsDriver();
    await sleep(1000);
    
    // Test 2: Agent Connection
    const agentWs = await connectAsAgent();
    await sleep(1000);
    
    // Test 3: Send Message from Driver
    await sendDriverMessage(driverWs, 'Hello, I need help!');
    await sleep(2000);
    
    // Test 4: Agent Response
    await sendAgentMessage(agentWs, 'Hi! How can I help you?');
    await sleep(2000);
    
    // Test 5: Connection Recovery
    await testConnectionRecovery(driverWs);
    
    console.log('✅ Live Chat Flow Test Complete');
}

async function connectAsDriver() {
    const wsUrl = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev?userType=driver&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5';
    const ws = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
        ws.on('open', () => {
            console.log('✅ Driver connected');
            resolve(ws);
        });
        ws.on('error', reject);
    });
}

testLiveChatFlow().catch(console.error);
```

### Step 6.2: Performance Testing

```bash
# Load test with Artillery
npm install -g artillery
artillery quick --count 10 --num 5 wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev
```

---

## 📋 Implementation Checklist

### Day 1: WebSocket Authentication Fix
- [ ] Update Flutter Environment configuration
- [ ] Fix Lambda authorizer for driver connections
- [ ] Update Flutter chat service with proper authentication
- [ ] Test basic message delivery

### Day 2: Message Persistence
- [ ] Create DynamoDB tables
- [ ] Update Lambda handler with DynamoDB integration
- [ ] Test message storage and retrieval
- [ ] Verify message history in Central Platform

### Day 3: Connection Recovery
- [ ] Implement Flutter reconnection logic
- [ ] Add heartbeat mechanism
- [ ] Test connection resilience
- [ ] Validate automatic reconnection

### Day 4: Monitoring & Debugging
- [ ] Set up CloudWatch logging
- [ ] Add comprehensive error handling
- [ ] Implement Flutter analytics
- [ ] Create debugging dashboard

### Day 5-6: AWS Infrastructure
- [ ] Deploy DynamoDB tables
- [ ] Set up Redis cluster
- [ ] Configure SQS queues
- [ ] Update Lambda permissions

### Day 7: Testing & Validation
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Load testing
- [ ] Production readiness checklist

---

## 🎯 Success Criteria

1. **Messages delivered successfully** from Flutter app to Central Platform
2. **No 401 authentication errors** on WebSocket connections
3. **Message persistence** survives Lambda restarts
4. **Automatic reconnection** works reliably
5. **Real-time delivery** < 2 seconds latency
6. **Production ready** with monitoring and error handling

---

## 🚨 Immediate Next Steps

1. **Start with Phase 1** - Fix WebSocket authentication
2. **Test after each step** - Don't move forward until current step works
3. **Document all changes** - Keep track of what works
4. **Monitor AWS costs** - Use free tier where possible
5. **Have rollback plan** - Keep previous working versions

This implementation plan provides a clear path to a working, stable live chat system with proper AWS infrastructure for production use.
