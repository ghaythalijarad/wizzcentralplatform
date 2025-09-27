/**
 * Enhanced WebSocket Default Handler - FIXED VERSION
 * Properly handles agent registration and chat functionality
 * Compatible with existing WizzUser WebSocket API
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
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
    console.log('📨 Enhanced WebSocket handler (FIXED):', JSON.stringify(event, null, 2));
    
    const { requestContext, body } = event;
    const { connectionId, stage, domainName, routeKey } = requestContext;
    
    // Create API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
    });

    // Handle connection events (no body)
    if (routeKey === '$connect') {
        console.log(`🔌 New connection: ${connectionId}`);
        return { statusCode: 200 };
    }
    
    if (routeKey === '$disconnect') {
        console.log(`🔌 Disconnection: ${connectionId}`);
        // Clean up connection record
        try {
            await dynamoDB.send(new DeleteCommand({
                TableName: WEBSOCKET_CONNECTIONS_TABLE,
                Key: { connectionId }
            }));
        } catch (error) {
            console.warn('⚠️ Failed to clean up connection:', error);
        }
        return { statusCode: 200 };
    }

    let message = {};
    try {
        if (body) {
            message = JSON.parse(body);
        }
    } catch (error) {
        console.warn('⚠️ Failed to parse message body:', error);
        return { statusCode: 400 };
    }

    const action = message.action || message.type || routeKey || 'unknown';
    console.log(`🎯 Processing action: ${action}`, { userType: message.userType, senderId: message.senderId });

    try {
        switch (action) {
            // Agent registration actions
            case 'chat_agent_connect':
            case 'agent_connect':
                return await handleAgentConnect(connectionId, message, apiGatewayClient);
            
            // Chat initialization - distinguish between driver and agent
            case 'chat_init':
                if (message.userType === 'agent') {
                    return await handleAgentConnect(connectionId, message, apiGatewayClient);
                } else {
                    return await handleChatInit(connectionId, message, apiGatewayClient);
                }
            
            // Other chat actions
            case 'join_channel':
                return await handleJoinChannel(connectionId, message, apiGatewayClient);
            case 'chat_message':
                return await handleChatMessage(connectionId, message, apiGatewayClient);
            case 'close_session':
                return await handleCloseSession(connectionId, message, apiGatewayClient);
            case 'sync_sessions':
                return await handleSyncSessions(connectionId, message, apiGatewayClient);
            case 'ping':
                return await handlePing(connectionId, apiGatewayClient);
            case 'driver_status_update':
                return await handleDriverStatusUpdate(connectionId, message, apiGatewayClient);
            
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
        
        // Try to send error message, but don't fail if connection is stale
        try {
            await sendToConnection(connectionId, {
                action: 'error',
                message: 'Internal server error',
                timestamp: new Date().toISOString()
            }, apiGatewayClient);
        } catch (sendError) {
            console.warn('⚠️ Failed to send error message (connection may be stale):', sendError.message);
        }
        
        return { statusCode: 500 };
    }
};

/**
 * Handle agent connection/registration
 */
async function handleAgentConnect(connectionId, message, apiGatewayClient) {
    console.log('👤 Agent connecting/registering');
    
    const { agentId, agentName, businessId, userType } = message;
    const now = new Date().toISOString();
    
    try {
        // Store agent connection info
        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userType: 'agent',
                userId: agentId || connectionId,
                userName: agentName || 'Support Agent',
                agentId: agentId || connectionId,
                agentName: agentName || 'Support Agent',
                businessId: businessId || 'default',
                connectedAt: now,
                lastSeen: now,
                status: 'online'
            }
        }));
        
        console.log(`✅ Agent ${agentName} (${agentId}) registered successfully`);
        
        // Send confirmation to agent
        await sendToConnection(connectionId, {
            action: 'agent_connected',
            agentId,
            agentName,
            status: 'online',
            timestamp: now
        }, apiGatewayClient);
        
        // Get active chat sessions for this agent to sync
        const activeSessions = await getActiveChatSessions();
        
        // Send initial session sync
        await sendToConnection(connectionId, {
            action: 'sessions_sync',
            sessions: activeSessions,
            timestamp: now
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Agent connect error:', error);
        await sendToConnection(connectionId, {
            action: 'connection_error',
            message: 'Failed to register agent',
            timestamp: now
        }, apiGatewayClient);
        return { statusCode: 500 };
    }
}

/**
 * Handle sync sessions request from agent
 */
async function handleSyncSessions(connectionId, message, apiGatewayClient) {
    console.log('🔄 Syncing sessions for agent');
    
    try {
        const sessions = await getActiveChatSessions(message.since);
        
        await sendToConnection(connectionId, {
            action: 'sessions_sync',
            sessions,
            since: message.since,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);
        
        return { statusCode: 200 };
    } catch (error) {
        console.error('❌ Sync sessions error:', error);
        return { statusCode: 500 };
    }
}

/**
 * Get active chat sessions
 */
async function getActiveChatSessions(since = null) {
    try {
        const params = {
            TableName: CHAT_SESSIONS_TABLE,
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'active'
            }
        };
        
        // Add time filter if since parameter provided
        if (since) {
            params.FilterExpression += ' AND (createdAt >= :since OR lastMessageAt >= :since)';
            params.ExpressionAttributeValues[':since'] = since;
        }
        
        const result = await dynamoDB.send(new ScanCommand(params));
        return result.Items || [];
    } catch (error) {
        console.error('❌ Get active sessions error:', error);
        return [];
    }
}

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
 * Handle chat session initialization (for drivers)
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
        const unreadField = senderType === 'agent' ? 'unreadDriver' : 'unreadAgent';
        await dynamoDB.send(new UpdateCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: `SET lastMessageAt = :now, ${unreadField} = if_not_exists(${unreadField}, :zero) + :one`,
            ExpressionAttributeValues: {
                ':now': now,
                ':one': 1,
                ':zero': 0
            }
        }));
        
        console.log(`✅ Message stored: ${messageId}`);
        
        // Broadcast message to appropriate recipients
        const broadcastMessage = {
            action: 'message_received',
            sessionId,
            messageId,
            senderType: senderType || 'driver',
            senderName: senderName || 'Driver',
            message: messageText,
            timestamp: now
        };
        
        if (senderType === 'agent') {
            // Agent sent message - notify driver
            await notifyDrivers(broadcastMessage, session.userId, apiGatewayClient);
        } else {
            // Driver sent message - notify agents
            await notifyAgents(broadcastMessage, apiGatewayClient);
        }
        
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
        
        // Notify agents and drivers
        const notifyMessage = {
            action: 'session_closed',
            sessionId,
            closedBy: userType,
            timestamp: new Date().toISOString()
        };
        
        await notifyAgents(notifyMessage, apiGatewayClient);
        
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
 * Notify all connected agents
 */
async function notifyAgents(message, apiGatewayClient) {
    try {
        // Get all agent connections using Scan since we might not have GSI
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'userType = :userType',
            ExpressionAttributeValues: {
                ':userType': 'agent'
            }
        }));
        
        const agents = result.Items || [];
        console.log(`📡 Notifying ${agents.length} agents`);
        
        if (agents.length === 0) {
            console.warn('⚠️ No agents connected to receive notification');
        }
        
        const promises = agents.map(agent => 
            sendToConnection(agent.connectionId, message, apiGatewayClient)
        );
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📊 Agent notification results: ${successful} successful, ${failed} failed`);
        
        return { successful, failed, total: agents.length };
    } catch (error) {
        console.error('❌ Notify agents error:', error);
        return { successful: 0, failed: 0, total: 0 };
    }
}

/**
 * Notify drivers about messages from agents
 */
async function notifyDrivers(message, driverId, apiGatewayClient) {
    try {
        // Get driver connections using Scan and filter
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'userId = :userId AND userType = :userType',
            ExpressionAttributeValues: {
                ':userId': driverId,
                ':userType': 'driver'
            }
        }));
        
        const drivers = result.Items || [];
        console.log(`📡 Notifying ${drivers.length} driver connections for ${driverId}`);
        
        const promises = drivers.map(driver => 
            sendToConnection(driver.connectionId, message, apiGatewayClient)
        );
        
        await Promise.allSettled(promises);
    } catch (error) {
        console.error('❌ Notify drivers error:', error);
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
        console.log(`📤 Sent message to ${connectionId}:`, message.action || 'unknown');
        return true;
    } catch (error) {
        if (error.statusCode === 410 || error.name === 'GoneException') {
            // Connection is stale, remove it but don't fail the request
            console.log(`🧹 Removing stale connection: ${connectionId}`);
            try {
                await dynamoDB.send(new DeleteCommand({
                    TableName: WEBSOCKET_CONNECTIONS_TABLE,
                    Key: { connectionId }
                }));
            } catch (deleteError) {
                console.warn('⚠️ Failed to remove stale connection:', deleteError);
            }
            return false; // Return false but don't throw
        } else {
            console.error(`❌ Send to connection error (${connectionId}):`, error);
            throw error; // Only throw for non-410 errors
        }
    }
}
