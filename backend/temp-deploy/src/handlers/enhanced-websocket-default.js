/**
 * Enhanced WebSocket Default Handler
 * Extends existing functionality with chat support
 * Compatible with existing WizzUser WebSocket API
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

// Initialize DynamoDB client
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Table names - fallback to default if not set
const CHAT_SESSIONS_TABLE = process.env.CHAT_SESSIONS_TABLE || 'ChatSessions';
const CHAT_MESSAGES_TABLE = process.env.CHAT_MESSAGES_TABLE || 'ChatMessages';
const WEBSOCKET_CONNECTIONS_TABLE = process.env.WEBSOCKET_CONNECTIONS_TABLE || 'WebSocketConnections';

/**
 * Main handler for WebSocket messages
 */
exports.handler = async (event) => {
    console.log('📨 Enhanced WebSocket handler:', JSON.stringify(event, null, 2));
    
    const { requestContext, body } = event;
    const { connectionId, stage, domainName } = requestContext;
    
    // Create API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
    });

    let message = {};
    try {
        if (body) {
            message = JSON.parse(body);
        }
    } catch (error) {
        console.warn('⚠️ Failed to parse message body:', error);
        return { statusCode: 400 };
    }

    const action = message.action || message.type || 'unknown';
    console.log(`🎯 Processing action: ${action}`);

    try {
        switch (action) {
            // Chat-specific actions
            case 'join_channel':
                return await handleJoinChannel(connectionId, message, apiGatewayClient);
            case 'chat_init':
                return await handleChatInit(connectionId, message, apiGatewayClient);
            case 'chat_message':
                return await handleChatMessage(connectionId, message, apiGatewayClient);
            case 'close_session':
                return await handleCloseSession(connectionId, message, apiGatewayClient);
            case 'ping':
                return await handlePing(connectionId, apiGatewayClient);
            case 'driver_status_update':
                return await handleDriverStatusUpdate(connectionId, message, apiGatewayClient);
            case 'driver_assigned':
                return await handleDriverAssigned(connectionId, message, apiGatewayClient);
            
            // Agent connection actions
            case 'chat_agent_connect':
            case 'agent_connect':
                return await handleAgentConnect(connectionId, message, apiGatewayClient);
            
            // Existing actions - pass through or handle minimally
            case 'heartbeat':
                return await handleHeartbeat(connectionId, apiGatewayClient);
            case 'subscribe_order':
            case 'unsubscribe_order':
            case 'subscribe_business_status':
            case 'unsubscribe_business_status':
                console.log(`📦 Legacy action: ${action} - acknowledging`);
                return await sendToConnection(connectionId, {
                    action: 'ack',
                    originalAction: action,
                    timestamp: new Date().toISOString()
                }, apiGatewayClient);
            
            default:
                console.log(`❓ Unknown action: ${action}`);
                return await sendToConnection(connectionId, {
                    action: 'error',
                    message: `Unknown action: ${action}`,
                    timestamp: new Date().toISOString()
                }, apiGatewayClient);
        }
    } catch (error) {
        console.error('❌ Handler error:', error);
        await sendToConnection(connectionId, {
            action: 'error',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        return { statusCode: 500 };
    }
};

/**
 * Handle driver joining a channel (initial connection setup)
 */
async function handleJoinChannel(connectionId, message, apiGatewayClient) {
    console.log('🔗 Driver joining channel');
    
    const { userType, userId, userName, userPhone, channel } = message;
    
    try {
        // Store/update connection info
        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userType: userType || 'driver',
                userId: userId || connectionId,
                userName: userName || `User ${userId}`,
                userPhone: userPhone || '',
                channel: channel || `driver_${userId}`,
                connectedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'connected'
            }
        }));
        
        console.log(`✅ Driver ${userName} connected to channel ${channel}`);
        
        // Send confirmation
        await sendToConnection(connectionId, {
            action: 'channel_joined',
            channel,
            userId,
            userName,
            status: 'connected',
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Join channel error:', error);
        return { statusCode: 500 };
    }
}

/**
 * Handle chat session initialization
 */
async function handleChatInit(connectionId, message, apiGatewayClient) {
    console.log('🆕 Initializing chat session');
    
    const { userType, userId, userName, topic, description, metadata } = message;
    
    const sessionId = `chat_${userType}_${userId}_${Date.now()}`;
    const now = new Date().toISOString();
    
    try {
        // Create chat session
        await dynamoDB.send(new PutCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Item: {
                sessionId,
                userId: userId || connectionId,
                userType: userType || 'driver',
                userDisplayName: userName || `User ${userId}`,
                driverName: userName,
                driverId: userId,
                driverPhone: message.userPhone || '',
                status: 'active',
                topic: topic || 'Driver Support',
                description: description || 'Driver requesting support',
                createdAt: now,
                lastMessageAt: now,
                agentId: null,
                agentName: null,
                unreadAgent: 0,
                unreadDriver: 0,
                metadata: metadata || {}
            }
        }));
        
        console.log(`✅ Chat session created: ${sessionId}`);
        
        // Send confirmation to driver
        await sendToConnection(connectionId, {
            action: 'session_created',
            sessionId,
            status: 'active',
            topic,
            timestamp: now
        }, apiGatewayClient);
        
        // Notify agents about new session
        await notifyAgents({
            action: 'new_chat_session',
            sessionId,
            userType,
            userName: userName || `User ${userId}`,
            driverName: userName,
            topic,
            createdAt: now
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Chat init error:', error);
        return { statusCode: 500 };
    }
}

/**
 * Handle chat message
 */
async function handleChatMessage(connectionId, message, apiGatewayClient) {
    console.log('💬 Processing chat message');
    
    const { sessionId, senderId, senderName, senderType, message: messageText } = message;
    
    if (!sessionId || !messageText) {
        console.warn('❌ Invalid message: missing sessionId or message text');
        return { statusCode: 400 };
    }
    
    try {
        // Check if session exists
        const sessionResult = await dynamoDB.send(new GetCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId }
        }));
        
        if (!sessionResult.Item) {
            console.warn('❌ Session not found:', sessionId);
            return await sendToConnection(connectionId, {
                action: 'error',
                message: 'Session not found',
                sessionId
            }, apiGatewayClient);
        }
        
        const session = sessionResult.Item;
        if (session.status === 'closed') {
            console.warn('❌ Session is closed:', sessionId);
            return await sendToConnection(connectionId, {
                action: 'error',
                message: 'Session is closed',
                sessionId
            }, apiGatewayClient);
        }
        
        const now = new Date().toISOString();
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageKey = `t#${Date.now()}#${messageId}`;
        
        // Store message
        await dynamoDB.send(new PutCommand({
            TableName: CHAT_MESSAGES_TABLE,
            Item: {
                sessionId,
                messageKey,
                messageId,
                senderType: senderType || 'driver',
                senderName: senderName || 'Driver',
                text: messageText,
                createdAt: now,
                metadata: message.metadata || {}
            }
        }));
        
        // Update session
        await dynamoDB.send(new UpdateCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: 'SET lastMessageAt = :now, unreadAgent = if_not_exists(unreadAgent, :zero) + :one',
            ExpressionAttributeValues: {
                ':now': now,
                ':one': 1,
                ':zero': 0
            }
        }));
        
        console.log(`✅ Message stored: ${messageId}`);
        
        // Broadcast message to agents
        const broadcastMessage = {
            action: 'message_received',
            sessionId,
            messageId,
            senderType: senderType || 'driver',
            senderName: senderName || 'Driver',
            message: messageText,
            timestamp: now
        };
        
        await notifyAgents(broadcastMessage, apiGatewayClient);
        
        // Send acknowledgment to sender
        await sendToConnection(connectionId, {
            action: 'message_sent',
            messageId,
            sessionId,
            timestamp: now
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Chat message error:', error);
        return { statusCode: 500 };
    }
}

/**
 * Handle closing a chat session
 */
async function handleCloseSession(connectionId, message, apiGatewayClient) {
    console.log('🔚 Closing chat session');
    
    const { sessionId, userId, userType } = message;
    
    if (!sessionId) {
        return { statusCode: 400 };
    }
    
    try {
        await dynamoDB.send(new UpdateCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: 'SET #status = :status, closedAt = :now, closedBy = :closedBy',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'closed',
                ':now': new Date().toISOString(),
                ':closedBy': `${userType}:${userId}`
            }
        }));
        
        console.log(`✅ Session closed: ${sessionId}`);
        
        // Notify agents
        await notifyAgents({
            action: 'session_closed',
            sessionId,
            closedBy: userType,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        // Confirm to sender
        await sendToConnection(connectionId, {
            action: 'session_closed',
            sessionId,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Close session error:', error);
        return { statusCode: 500 };
    }
}

/**
 * Handle ping (heartbeat)
 */
async function handlePing(connectionId, apiGatewayClient) {
    await sendToConnection(connectionId, {
        action: 'pong',
        timestamp: new Date().toISOString()
    }, apiGatewayClient);
    return { statusCode: 200 };
}

/**
 * Handle heartbeat
 */
async function handleHeartbeat(connectionId, apiGatewayClient) {
    await sendToConnection(connectionId, {
        action: 'heartbeat_response',
        timestamp: new Date().toISOString()
    }, apiGatewayClient);
    return { statusCode: 200 };
}

/**
 * Handle driver status update
 */
async function handleDriverStatusUpdate(connectionId, message, apiGatewayClient) {
    console.log('📍 Driver status update');
    
    try {
        // Update connection status
        await dynamoDB.send(new UpdateCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Key: { connectionId },
            UpdateExpression: 'SET #status = :status, lastSeen = :now, location = :location',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': message.status || 'active',
                ':now': new Date().toISOString(),
                ':location': message.location || null
            }
        }));
        
        // Send confirmation
        await sendToConnection(connectionId, {
            action: 'status_updated',
            status: message.status,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Status update error:', error);
        return { statusCode: 500 };
    }
}

/**
 * Handle driver assignment notification
 */
async function handleDriverAssigned(connectionId, message, apiGatewayClient) {
    console.log('🚗 Driver assignment notification:', JSON.stringify(message, null, 2));
    
    try {
        const { orderId, driverId, driverName, orderDetails, businessId } = message;
        
        // Find the specific driver connection by driverId
        let targetConnectionId = null;
        
        if (driverId) {
            try {
                const result = await dynamoDB.send(new QueryCommand({
                    TableName: WEBSOCKET_CONNECTIONS_TABLE,
                    IndexName: 'UserIdIndex',
                    KeyConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues: {
                        ':userId': driverId
                    }
                }));
                
                const driverConnection = result.Items?.find(item => 
                    item.userType === 'driver' && item.status === 'connected'
                );
                
                if (driverConnection) {
                    targetConnectionId = driverConnection.connectionId;
                }
            } catch (error) {
                console.warn('⚠️ Could not find driver connection, using sender connection');
            }
        }
        
        // Use the sender's connection if no specific driver found
        if (!targetConnectionId) {
            targetConnectionId = connectionId;
        }
        
        // Create notification message for the driver
        const notification = {
            action: 'order_assigned',
            type: 'order_assignment',
            orderId,
            driverId,
            driverName,
            orderDetails,
            businessId,
            message: `New order ${orderId} assigned to you`,
            timestamp: new Date().toISOString()
        };
        
        console.log(`📨 Sending order assignment to connection: ${targetConnectionId}`);
        
        // Send the notification to the driver
        await sendToConnection(targetConnectionId, notification, apiGatewayClient);
        
        // Send confirmation back to the sender
        await sendToConnection(connectionId, {
            action: 'assignment_sent',
            orderId,
            driverId,
            targetConnection: targetConnectionId,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Driver assignment error:', error);
        
        // Send error response to sender
        await sendToConnection(connectionId, {
            action: 'assignment_error',
            message: 'Failed to assign order to driver',
            error: error.message,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        return { statusCode: 500 };
    }
}

/**
 * Notify all connected agents
 */
async function notifyAgents(message, apiGatewayClient) {
    try {
        // Get all agent connections
        const result = await dynamoDB.send(new QueryCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            IndexName: 'UserTypeIndex',
            KeyConditionExpression: 'userType = :userType',
            ExpressionAttributeValues: {
                ':userType': 'agent'
            }
        }));
        
        const agents = result.Items || [];
        console.log(`📡 Notifying ${agents.length} agents`);
        
        const promises = agents.map(agent => 
            sendToConnection(agent.connectionId, message, apiGatewayClient)
        );
        
        await Promise.allSettled(promises);
    } catch (error) {
        console.error('❌ Notify agents error:', error);
    }
}

/**
 * Handle agent connection
 */
async function handleAgentConnect(connectionId, message, apiGatewayClient) {
    console.log('👨‍💼 Agent connecting to live chat');
    
    const { agentId, agentName, businessId } = message;
    
    try {
        // Store agent connection in WebSocket connections table
        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userId: agentId,
                userType: 'agent',
                agentId: agentId,
                agentName: agentName,
                businessId: businessId || '7ccf646c-9594-48d4-8f63-c366d89257e5',
                connectedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'active',
                ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
            }
        }));
        
        console.log(`✅ Agent connected: ${agentName} (${agentId})`);
        
        // Send agent authentication confirmation
        await sendToConnection(connectionId, {
            type: 'connection_confirmed',
            action: 'connection_confirmed',
            agentId: agentId,
            agentName: agentName,
            message: 'Agent successfully connected to live chat',
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        // Send active sessions to the agent
        await sendActiveSessions(connectionId, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Agent connect error:', error);
        await sendToConnection(connectionId, {
            type: 'error',
            action: 'error',
            message: 'Failed to connect agent to live chat',
            error: error.message,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        return { statusCode: 500 };
    }
}

/**
 * Send active chat sessions to agent
 */
async function sendActiveSessions(connectionId, apiGatewayClient) {
    try {
        // Query for active chat sessions
        const result = await dynamoDB.send(new ScanCommand({
            TableName: CHAT_SESSIONS_TABLE,
            FilterExpression: '#status = :active OR #status = :waiting',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':active': 'active',
                ':waiting': 'waiting'
            }
        }));
        
        const sessions = result.Items || [];
        console.log(`📋 Sending ${sessions.length} active sessions to agent`);
        
        await sendToConnection(connectionId, {
            type: 'active_sessions',
            action: 'active_sessions',
            sessions: sessions,
            count: sessions.length,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
    } catch (error) {
        console.error('❌ Failed to send active sessions:', error);
        await sendToConnection(connectionId, {
            type: 'active_sessions',
            action: 'active_sessions',
            sessions: [],
            count: 0,
            error: 'Failed to load active sessions',
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
    }
}

/**
 * Send message to a WebSocket connection
 */
async function sendToConnection(connectionId, message, apiGatewayClient) {
    try {
        await apiGatewayClient.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(message)
        }));
    } catch (error) {
        if (error.statusCode === 410) {
            // Connection is stale, remove it
            console.log(`🧹 Removing stale connection: ${connectionId}`);
            try {
                await dynamoDB.send(new DeleteCommand({
                    TableName: WEBSOCKET_CONNECTIONS_TABLE,
                    Key: { connectionId }
                }));
            } catch (deleteError) {
                console.warn('⚠️ Failed to remove stale connection:', deleteError);
            }
        } else {
            console.error(`❌ Send to connection error (${connectionId}):`, error);
        }
        throw error;
    }
}
