const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, ScanCommand, DeleteCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Table names
const WEBSOCKET_CONNECTIONS_TABLE = process.env.WEBSOCKET_CONNECTIONS_TABLE || 'websocket-connections-dev';
const CHAT_SESSIONS_TABLE = process.env.CHAT_SESSIONS_TABLE || 'chat-sessions-dev';
const CHAT_MESSAGES_TABLE = process.env.CHAT_MESSAGES_TABLE || 'chat-messages-dev';

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'YOUR_USER_POOL_ID';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || 'YOUR_APP_CLIENT_ID';
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';

// Only create Cognito verifier if valid credentials are provided
let cognitoVerifier = null;
if (COGNITO_USER_POOL_ID !== 'YOUR_USER_POOL_ID' && COGNITO_CLIENT_ID !== 'YOUR_APP_CLIENT_ID') {
    cognitoVerifier = CognitoJwtVerifier.create({
        userPoolId: COGNITO_USER_POOL_ID,
        tokenUse: 'id',
        clientId: COGNITO_CLIENT_ID
    });
}

async function verifyJwt(idToken) {
    if (!idToken) throw new Error('Missing token');
    if (!cognitoVerifier) throw new Error('Cognito verifier not configured');
    try {
        const payload = await cognitoVerifier.verify(idToken);
        return payload; // contains sub, email, cognito:groups, etc.
    } catch (e) {
        console.warn('JWT verify failed', e.message || e);
        throw new Error('Invalid token');
    }
}

const handler = async (event) => {
    try {
        console.log('Full event received:', JSON.stringify(event));

        const connectionId = event.requestContext?.connectionId;
        const routeKey = event.requestContext?.routeKey;
        const body = event.body;
        const apiId = event.requestContext?.apiId;
        const stage = event.requestContext?.stage || 'dev';

        if (!connectionId) {
            console.error('Missing connectionId in event.requestContext');
            return {
                statusCode: 400,
                body: 'Missing connectionId'
            };
        }

        console.log(`WebSocket message: ${connectionId}, route: ${routeKey}, body: ${body}`);

        // Initialize API Gateway Management API client
        const apiGatewayClient = new ApiGatewayManagementApiClient({
            endpoint: `https://${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
        });

        // Handle connection and disconnection
        if (routeKey === '$connect') {
            return await handleConnect(connectionId, event);
        } else if (routeKey === '$disconnect') {
            return await handleDisconnect(connectionId);
        }

        // Parse the message if it exists
        let message;
        if (body) {
            try {
                message = JSON.parse(body);
                console.log('Parsed message:', JSON.stringify(message));
            } catch (e) {
                console.log('Failed to parse message body:', body);
                message = { type: 'unknown', body };
            }
        }

        // Handle different message types
        const messageType = message?.type || message?.action;
        if (messageType) {
            // Authorization guard: ensure connection is authenticated unless heartbeat/authenticate
            const connAuth = await dynamoDB.send(new GetCommand({ TableName: WEBSOCKET_CONNECTIONS_TABLE, Key: { connectionId } }));
            const isAuthed = !!connAuth.Item?.authenticated;
            if (!isAuthed && !['authenticate', 'heartbeat', 'ping'].includes(messageType)) {
                console.warn('Blocking message from unauthenticated connection', connectionId, messageType);
                return await sendToConnection(connectionId, { type: 'error', message: 'Not authenticated' }, apiGatewayClient);
            }
            switch (messageType) {
                case 'authenticate':
                    return await handleAuthentication(connectionId, message, apiGatewayClient);
                case 'heartbeat':
                case 'ping':
                    return await handleHeartbeat(connectionId, apiGatewayClient);
                case 'chat_driver_connect':
                    console.log(`🚗 Driver connecting to live chat: ${connectionId}`);
                    return await handleDriverChatConnect(connectionId, message, apiGatewayClient);
                case 'chat_agent_connect':
                    console.log(`👩‍💼 Support agent connecting to live chat: ${connectionId}`);
                    return await handleAgentChatConnect(connectionId, message, apiGatewayClient);
                case 'driver_message':
                    console.log('⚠️ Received legacy driver_message. Normalizing to chat_message for session', message.sessionId);
                case 'agent_message':
                    console.log('⚠️ Received agent_message. Normalizing to chat_message for session', message.sessionId);
                case 'chat_message':
                    console.log(`💬 Chat message from ${connectionId}`);
                    return await handleChatMessage(connectionId, { ...message, type: 'chat_message' }, apiGatewayClient);
                case 'chat_typing':
                    console.log(`⌨️ Typing indicator from ${connectionId}`);
                    return await handleTypingIndicator(connectionId, message, apiGatewayClient);
                case 'chat_session_close':
                    console.log(`🔚 Chat session close from ${connectionId}`);
                    return await handleChatSessionClose(connectionId, message, apiGatewayClient);
                case 'sync_sessions':
                    console.log(`🔄 Session sync request from ${connectionId}`);
                    return await handleSyncSessions(connectionId, message, apiGatewayClient);
                case 'get_session_messages':
                    return await handleGetSessionMessages(connectionId, message, apiGatewayClient);
                case 'ack':
                    return await handleAck(connectionId, message, apiGatewayClient);
                default:
                    console.log(`Unknown message type: ${messageType}`);
                    return await sendToConnection(connectionId, { type: 'error', message: `Unknown message type: ${messageType}` }, apiGatewayClient);
            }
        }

        return {
            statusCode: 200,
            body: 'Message received'
        };

    } catch (error) {
        console.error('Error handling WebSocket message:', error);
        return {
            statusCode: 500,
            body: 'Failed to process message'
        };
    }
};

// Handle WebSocket connection
async function handleConnect(connectionId, event) {
    try {
        const queryParams = event.queryStringParameters || {};
        const { token, businessId, userType: requestUserType } = queryParams;
        console.log(`New WebSocket connection: ${connectionId}, businessId: ${businessId}, userType: ${requestUserType}`);

        // Special handling for support agents - allow without JWT
        if (requestUserType === 'support') {
            console.log('Support agent connection - bypassing JWT verification');

            await dynamoDB.send(new PutCommand({
                TableName: WEBSOCKET_CONNECTIONS_TABLE,
                Item: {
                    connectionId,
                    userId: queryParams.agentId || 'support-agent-001',
                    userType: 'agent',
                    businessId: businessId || 'default',
                    platform: queryParams.platform || 'web',
                    appVersion: queryParams.appVersion || '1.0.0',
                    connectedAt: new Date().toISOString(),
                    ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
                    authenticated: true,
                    groups: ['support'],
                    email: 'support@wizzcentral.com'
                }
            }));

            console.log(`Support agent connection stored ${connectionId} agentId=${queryParams.agentId}`);
            return { statusCode: 200, body: 'Connected' };
        }

        // Verify JWT (id token) if provided; reject if invalid or missing
        let verified = null;
        try {
            verified = await verifyJwt(token);
        } catch (e) {
            console.error('Connection auth failed', e.message || e);
            return { statusCode: 401, body: 'Unauthorized' };
        }
        // Determine role / userType from groups
        const groups = verified['cognito:groups'] || [];
        let role = 'driver';
        if (Array.isArray(groups)) {
            if (groups.includes('support') || groups.includes('admin')) role = 'agent';
        }
        const userId = verified.sub || verified.email || verified.username || 'unknown_user';
        const userType = role === 'agent' ? 'agent' : 'driver';
        // Store connection only after auth
        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userId,
                userType,
                businessId: businessId || 'default',
                platform: queryParams.platform || 'web',
                appVersion: queryParams.appVersion || '1.0.0',
                connectedAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
                authenticated: true,
                groups,
                email: verified.email || null
            }
        }));
        console.log(`Authenticated connection stored ${connectionId} userId=${userId} type=${userType}`);
        return { statusCode: 200, body: 'Connected' };
    } catch (error) {
        console.error('Error handling connection:', error);
        return { statusCode: 500, body: 'Failed to connect' };
    }
}

// Handle WebSocket disconnection
async function handleDisconnect(connectionId) {
    try {
        console.log(`WebSocket disconnection: ${connectionId}`);

        // Remove connection from database
        await dynamoDB.send(new DeleteCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Key: { connectionId }
        }));

        console.log(`Connection ${connectionId} removed successfully`);

        return {
            statusCode: 200,
            body: 'Disconnected'
        };
    } catch (error) {
        console.error('Error handling disconnection:', error);
        return {
            statusCode: 500,
            body: 'Failed to disconnect'
        };
    }
}

// Handle authentication
async function handleAuthentication(connectionId, message, apiGatewayClient) {
    try {
        const { userId, userType, token } = message;

        // Update connection with authentication info
        await dynamoDB.send(new UpdateCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Key: { connectionId },
            UpdateExpression: 'SET userId = :userId, userType = :userType, #token = :token, authenticatedAt = :authenticatedAt',
            ExpressionAttributeNames: {
                '#token': 'token'
            },
            ExpressionAttributeValues: {
                ':userId': userId,
                ':userType': userType,
                ':token': token,
                ':authenticatedAt': new Date().toISOString()
            }
        }));

        // Send authentication confirmation
        return await sendToConnection(connectionId, {
            type: 'auth_success',
            userId,
            userType,
            timestamp: new Date().toISOString()
        }, apiGatewayClient);

    } catch (error) {
        console.error('Error handling authentication:', error);
        return await sendToConnection(connectionId, {
            type: 'auth_error',
            message: 'Authentication failed'
        }, apiGatewayClient);
    }
}

// Handle heartbeat
async function handleHeartbeat(connectionId, apiGatewayClient) {
    try {
        const now = new Date();
        // update connection lastHeartbeatAt (best-effort)
        try {
            await dynamoDB.send(new UpdateCommand({
                TableName: WEBSOCKET_CONNECTIONS_TABLE,
                Key: { connectionId },
                UpdateExpression: 'SET lastHeartbeatAt = :ts',
                ExpressionAttributeValues: { ':ts': now.toISOString() }
            }));
        } catch (e) { console.warn('heartbeat update failed', e.message || e); }
        const heartbeatResponse = { type: 'heartbeat_response', timestamp: now.toISOString(), connectionId, serverTime: now.toISOString() };
        return await sendToConnection(connectionId, heartbeatResponse, apiGatewayClient);
    } catch (error) {
        console.error(`Failed to send heartbeat response to ${connectionId}:`, error);
        return { statusCode: 500, body: 'Failed to send heartbeat' };
    }
}

// Live Chat Support Functions
async function handleDriverChatConnect(connectionId, message, apiGatewayClient) {
    try {
        const { driverId, driverName, driverPhone } = message;

        // Create or find existing chat session
        const sessionId = `session_${driverId}_${Date.now()}`;

        // Store driver connection
        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userId: driverId,
                userType: 'driver',
                sessionId,
                connectedAt: new Date().toISOString(),
                driverInfo: {
                    name: driverName,
                    phone: driverPhone
                },
                ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            }
        }));

        // Create chat session record
        await dynamoDB.send(new PutCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Item: {
                sessionId,
                driverId,
                driverName,
                driverPhone,
                status: 'waiting_for_agent',
                createdAt: new Date().toISOString(),
                messages: []
            }
        }));

        // Notify all agents about new chat session
        await notifyAgentsOfNewSession(sessionId, { driverId, driverName, driverPhone }, apiGatewayClient);

        // Send confirmation to driver
        const response = {
            type: 'chat_session_created',
            sessionId,
            status: 'waiting_for_agent',
            message: 'Connected to support. An agent will be with you shortly.'
        };

        return await sendToConnection(connectionId, response, apiGatewayClient);

    } catch (error) {
        console.error('Error handling driver chat connect:', error);
        return await sendToConnection(connectionId, {
            type: 'error',
            message: 'Failed to connect to chat'
        }, apiGatewayClient);
    }
}

async function handleAgentChatConnect(connectionId, message, apiGatewayClient) {
    try {
        const { agentId, agentName, sessionId } = message;

        // Store agent connection
        await dynamoDB.send(new PutCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userId: agentId,
                userType: 'agent',
                sessionId: sessionId || null,
                connectedAt: new Date().toISOString(),
                agentInfo: {
                    name: agentName
                },
                ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            }
        }));

        // If joining a specific session, update the session
        if (sessionId) {
            await dynamoDB.send(new UpdateCommand({
                TableName: CHAT_SESSIONS_TABLE,
                Key: { sessionId },
                UpdateExpression: 'SET agentId = :agentId, agentName = :agentName, #status = :status, agentJoinedAt = :agentJoinedAt',
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':agentId': agentId,
                    ':agentName': agentName,
                    ':status': 'active',
                    ':agentJoinedAt': new Date().toISOString()
                }
            }));

            // Notify driver that agent has joined
            await notifyDriverOfAgentJoin(sessionId, { agentId, agentName }, apiGatewayClient);
        }

        // Send confirmation to agent
        const response = {
            type: 'agent_connected',
            sessionId,
            message: sessionId ? 'Joined chat session' : 'Connected to support system'
        };

        await sendToConnection(connectionId, response, apiGatewayClient);

        // PHASE 1 STEP 1: Push list of currently active / waiting sessions to the agent upon connect
        try {
            const activeSessionsPayload = await getActiveChatSessions();
            await sendToConnection(connectionId, {
                type: 'active_sessions',
                sessions: activeSessionsPayload,
                timestamp: new Date().toISOString()
            }, apiGatewayClient);
        } catch (activeErr) {
            console.error('Failed to send active_sessions to agent', activeErr);
        }

        return {
            statusCode: 200,
            body: 'Agent connected'
        };

    } catch (error) {
        console.error('Error handling agent chat connect:', error);
        return await sendToConnection(connectionId, {
            type: 'error',
            message: 'Failed to connect agent to chat'
        }, apiGatewayClient);
    }
}

async function handleChatMessage(connectionId, message, apiGatewayClient) {
    try {
        const { sessionId, messageText, senderType = 'driver', requestId } = message;
        const sanitized = sanitizeChatContent(messageText);
        if (!sessionId || !sanitized) {
            return await sendToConnection(connectionId, { type: 'error', message: 'Missing sessionId or messageText' }, apiGatewayClient);
        }
        // Fetch session
        const getRes = await dynamoDB.send(new GetCommand({ TableName: CHAT_SESSIONS_TABLE, Key: { sessionId } }));
        const sessionRecord = getRes.Item;
        if (!sessionRecord) {
            return await sendToConnection(connectionId, { type: 'error', message: 'Session not found' }, apiGatewayClient);
        }
        if (sessionRecord.status === 'closed') {
            return await sendToConnection(connectionId, { type: 'error', message: 'Session closed' }, apiGatewayClient);
        }
        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        const messageId = `msg_${now}_${Math.random().toString(36).slice(2,9)}`;
        const messageKey = `t#${now}#${messageId}`; // for ordered queries
        const chatMessageItem = {
            sessionId,
            messageKey,
            messageId,
            senderType,
            text: sanitized,
            createdAt: nowIso,
            ttl: Math.floor(now / 1000) + 60 * 60 * 24 * 30 // 30 days
        };
        // Persist message in messages table
        await dynamoDB.send(new PutCommand({ TableName: CHAT_MESSAGES_TABLE, Item: chatMessageItem }));
        // Update session metadata (first message timestamps + lastMessageAt + unread counters)
        const updates = [];
        const exprNames = { '#status': 'status' };
        const exprValues = { ':lastMessageAt': nowIso };
        updates.push('lastMessageAt = :lastMessageAt');
        if (senderType === 'driver' && !sessionRecord.driverFirstMessageAt) {
            updates.push('driverFirstMessageAt = :firstDriver');
            exprValues[':firstDriver'] = nowIso;
        }
        if (senderType === 'agent' && !sessionRecord.agentFirstResponseAt) {
            updates.push('agentFirstResponseAt = :firstAgent');
            exprValues[':firstAgent'] = nowIso;
        }
        // Apply SET updates
        if (updates.length) {
            await dynamoDB.send(new UpdateCommand({
                TableName: CHAT_SESSIONS_TABLE,
                Key: { sessionId },
                UpdateExpression: `SET ${updates.join(', ')}`,
                ExpressionAttributeValues: exprValues,
                ExpressionAttributeNames: Object.keys(exprNames).length ? exprNames : undefined
            }));
        }
        // Increment unread counter for the opposite party
        try {
            if (senderType === 'driver') {
                await dynamoDB.send(new UpdateCommand({
                    TableName: CHAT_SESSIONS_TABLE,
                    Key: { sessionId },
                    UpdateExpression: 'ADD unreadAgent :one',
                    ExpressionAttributeValues: { ':one': 1 }
                }));
            } else if (senderType === 'agent') {
                await dynamoDB.send(new UpdateCommand({
                    TableName: CHAT_SESSIONS_TABLE,
                    Key: { sessionId },
                    UpdateExpression: 'ADD unreadDriver :one',
                    ExpressionAttributeValues: { ':one': 1 }
                }));
            }
        } catch (e) { console.warn('Unread counter update failed', e.message || e); }
        // Broadcast
        const outbound = {
            type: 'chat_message',
            sessionId,
            message: {
                messageId,
                sessionId,
                messageKey,
                senderType,
                text: sanitized,
                createdAt: nowIso
            }
        };
        await broadcastToSession(sessionId, outbound, apiGatewayClient);
        // Ack to sender if requestId supplied
        if (requestId) {
            await sendToConnection(connectionId, { type: 'ack', requestId, messageId, sessionId }, apiGatewayClient);
        }
        return { statusCode: 200, body: 'Message stored' };
    } catch (error) {
        console.error('Error handling chat message (refactored):', error);
        return await sendToConnection(connectionId, { type: 'error', message: 'Failed to send message' }, apiGatewayClient);
    }
}

async function handleTypingIndicator(connectionId, message, apiGatewayClient) {
    try {
        const { sessionId, isTyping, senderType } = message;
        // Fetch session status to guard against closed sessions
        let sessionRecord = null;
        try {
            const getRes = await dynamoDB.send(new GetCommand({ TableName: CHAT_SESSIONS_TABLE, Key: { sessionId } }));
            sessionRecord = getRes.Item || null;
        } catch (e) {
            console.warn('handleTypingIndicator: failed to fetch session', e.message || e);
        }
        if (!sessionRecord || sessionRecord.status === 'closed') {
            return { statusCode: 200, body: 'Typing ignored (session closed or missing)' };
        }

        // Broadcast typing indicator to other participants
        await broadcastToSession(sessionId, {
            type: 'typing_indicator',
            sessionId,
            isTyping,
            senderType,
            timestamp: new Date().toISOString()
        }, apiGatewayClient, [connectionId]); // Exclude sender

        return {
            statusCode: 200,
            body: 'Typing indicator sent'
        };

    } catch (error) {
        console.error('Error handling typing indicator:', error);
        return {
            statusCode: 500,
            body: 'Failed to send typing indicator'
        };
    }
}

async function handleChatSessionClose(connectionId, message, apiGatewayClient) {
    try {
        const { sessionId, closedByUserType = 'agent', closedByUserId } = message;
        // Fetch session first
        let sessionRecord = null;
        try {
            const getRes = await dynamoDB.send(new GetCommand({ TableName: CHAT_SESSIONS_TABLE, Key: { sessionId } }));
            sessionRecord = getRes.Item || null;
        } catch (e) {
            console.warn('handleChatSessionClose: failed to fetch session', e.message || e);
        }
        if (!sessionRecord) {
            return await sendToConnection(connectionId, { type: 'error', message: 'Session not found' }, apiGatewayClient);
        }
        if (sessionRecord.status === 'closed') {
            // Idempotent: already closed, send ack again (no broadcast needed) and return
            await sendToConnection(connectionId, { type: 'chat_session_close_ack', sessionId, alreadyClosed: true, timestamp: new Date().toISOString() }, apiGatewayClient);
            return { statusCode: 200, body: 'Session already closed' };
        }

        // Immediate ACK to requester so UI can move to closing state
        await sendToConnection(connectionId, { type: 'chat_session_close_ack', sessionId, timestamp: new Date().toISOString() }, apiGatewayClient);

        const nowIso = new Date().toISOString();
        // Update session status (only if not already closed)
        try {
            await dynamoDB.send(new UpdateCommand({
                TableName: CHAT_SESSIONS_TABLE,
                Key: { sessionId },
                UpdateExpression: 'SET #status = :status, closedAt = :closedAt, closedByUserType = :closedByUserType, closedByUserId = :closedByUserId',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':status': 'closed',
                    ':closedAt': nowIso,
                    ':closedByUserType': closedByUserType,
                    ':closedByUserId': closedByUserId || null
                }
            }));
        } catch (e) {
            console.error('handleChatSessionClose update failed', e);
        }

        // Final broadcast
        await broadcastToSession(sessionId, {
            type: 'session_closed',
            sessionId,
            closedAt: nowIso,
            closedByUserType,
            closedByUserId: closedByUserId || null,
            timestamp: nowIso
        }, apiGatewayClient);

        return {
            statusCode: 200,
            body: 'Session closed'
        };

    } catch (error) {
        console.error('Error handling session close:', error);
        return {
            statusCode: 500,
            body: 'Failed to close session'
        };
    }
}

async function handleSyncSessions(connectionId, message, apiGatewayClient) {
    try {
        const { since } = message;
        const sinceTs = since ? new Date(since).getTime() : 0;
        const scanResult = await dynamoDB.send(new ScanCommand({ TableName: CHAT_SESSIONS_TABLE }));
        let sessions = (scanResult.Items || []);
        // Filter to sessions of interest: active, waiting, or recently closed (< 2h) and changed after since
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        sessions = sessions.filter(s => {
            const status = s.status;
            const lastChange = new Date(s.lastMessageAt || s.closedAt || s.updatedAt || s.createdAt || 0).getTime();
            if (sinceTs && lastChange <= sinceTs) return false; // not changed since
            if (status === 'waiting_for_agent' || status === 'active') return true;
            if (status === 'closed') return (lastChange >= twoHoursAgo); // recently closed
            return false;
        }).map(item => ({
            sessionId: item.sessionId,
            driverId: item.driverId,
            driverName: item.driverName,
            driverPhone: item.driverPhone,
            status: item.status,
            createdAt: item.createdAt,
            lastMessageAt: item.lastMessageAt || item.createdAt,
            closedAt: item.closedAt || null,
            agentId: item.agentId || null,
            agentName: item.agentName || null,
            messages: Array.isArray(item.messages) ? item.messages.slice(-40) : []
        }));
        // Sort latest first
        sessions.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        await sendToConnection(connectionId, { type: 'active_sessions', delta: true, since, count: sessions.length, sessions, timestamp: new Date().toISOString() }, apiGatewayClient);
        return { statusCode: 200, body: 'Sync sent' };
    } catch (e) {
        console.error('handleSyncSessions failed', e);
        return await sendToConnection(connectionId, { type: 'error', message: 'Failed to sync sessions' }, apiGatewayClient);
    }
}

async function handleGetSessionMessages(connectionId, message, apiGatewayClient) {
    try {
        const { sessionId, limit = 30, cursor } = message;
        if (!sessionId) return await sendToConnection(connectionId, { type: 'error', message: 'sessionId required' }, apiGatewayClient);
        const queryParams = {
            TableName: CHAT_MESSAGES_TABLE,
            KeyConditionExpression: 'sessionId = :sid',
            ExpressionAttributeValues: { ':sid': sessionId },
            Limit: Math.min(limit, 100),
            ScanIndexForward: false // newest first
        };
        if (cursor) {
            queryParams.ExclusiveStartKey = { sessionId, messageKey: cursor };
        }
        const res = await dynamoDB.send(new QueryCommand(queryParams));
        const items = res.Items || [];
        const nextCursor = res.LastEvaluatedKey ? res.LastEvaluatedKey.messageKey : null;
        return await sendToConnection(connectionId, {
            type: 'session_messages',
            sessionId,
            messages: items.map(i => ({
                messageId: i.messageId,
                messageKey: i.messageKey,
                senderType: i.senderType,
                text: i.text,
                createdAt: i.createdAt
            })),
            nextCursor
        }, apiGatewayClient);
    } catch (e) {
        console.error('handleGetSessionMessages failed', e);
        return await sendToConnection(connectionId, { type: 'error', message: 'Failed to load messages' }, apiGatewayClient);
    }
}

async function handleAck(connectionId, message, apiGatewayClient) {
    // Currently stateless; placeholder for future delivery tracking
    try {
        const { requestId, messageId } = message;
        if (!requestId && !messageId) return { statusCode: 200, body: 'Nothing to ack' };
        return await sendToConnection(connectionId, { type: 'ack_received', requestId, messageId, ts: new Date().toISOString() }, apiGatewayClient);
    } catch (e) {
        console.error('handleAck failed', e);
        return { statusCode: 500, body: 'Ack failed' };
    }
}

// Helper functions
async function sendToConnection(connectionId, data, apiGatewayClient) {
    try {
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(data)
        });

        await apiGatewayClient.send(command);
        console.log(`Message sent to connection ${connectionId}`);

        return {
            statusCode: 200,
            body: 'Message sent'
        };
    } catch (error) {
        if (error.statusCode === 410) {
            console.log(`Connection ${connectionId} is stale, removing from database`);
            await dynamoDB.send(new DeleteCommand({
                TableName: WEBSOCKET_CONNECTIONS_TABLE,
                Key: { connectionId }
            }));
        } else {
            console.error(`Failed to send message to ${connectionId}:`, error);
        }
        throw error;
    }
}

async function broadcastToSession(sessionId, data, apiGatewayClient, excludeConnections = []) {
    try {
        // Get all connections for this session OR all agents
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'sessionId = :sessionId OR userType = :agent',
            ExpressionAttributeValues: {
                ':sessionId': sessionId,
                ':agent': 'agent'
            }
        }));

        const connections = result.Items || [];
        const sendPromises = connections
            .filter(conn => !excludeConnections.includes(conn.connectionId))
            .map(conn => sendToConnection(conn.connectionId, data, apiGatewayClient).catch(error => {
                console.error(`Failed to send to ${conn.connectionId}:`, error);
            }));

        await Promise.all(sendPromises);
        console.log(`Broadcasted message to ${sendPromises.length} connections in session ${sessionId} (including agents)`);

    } catch (error) {
        console.error('Error broadcasting to session:', error);
    }
}

async function notifyAgentsOfNewSession(sessionId, driverInfo, apiGatewayClient) {
    try {
        // Get all agent connections
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'userType = :userType',
            ExpressionAttributeValues: {
                ':userType': 'agent'
            }
        }));

        const agentConnections = result.Items || [];
        const notificationData = {
            type: 'new_chat_session',
            sessionId,
            driverInfo,
            timestamp: new Date().toISOString()
        };

        const sendPromises = agentConnections.map(conn =>
            sendToConnection(conn.connectionId, notificationData, apiGatewayClient).catch(error => {
                console.error(`Failed to notify agent ${conn.connectionId}:`, error);
            })
        );

        await Promise.all(sendPromises);
        console.log(`Notified ${agentConnections.length} agents of new session ${sessionId}`);

    } catch (error) {
        console.error('Error notifying agents:', error);
    }
}

async function notifyDriverOfAgentJoin(sessionId, agentInfo, apiGatewayClient) {
    try {
        // Get driver connection for this session
        const result = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            FilterExpression: 'sessionId = :sessionId AND userType = :userType',
            ExpressionAttributeValues: {
                ':sessionId': sessionId,
                ':userType': 'driver'
            }
        }));

        const driverConnections = result.Items || [];
        const notificationData = {
            type: 'agent_joined',
            sessionId,
            agentInfo,
            timestamp: new Date().toISOString()
        };

        const sendPromises = driverConnections.map(conn =>
            sendToConnection(conn.connectionId, notificationData, apiGatewayClient).catch(error => {
                console.error(`Failed to notify driver ${conn.connectionId}:`, error);
            })
        );

        await Promise.all(sendPromises);
        console.log(`Notified ${driverConnections.length} drivers of agent join in session ${sessionId}`);

    } catch (error) {
        console.error('Error notifying driver:', error);
    }
}

async function getActiveChatSessions(limit = 25, msgLimit = 40) {
    try {
        // Scan for sessions with status waiting_for_agent or active
        const scanResult = await dynamoDB.send(new ScanCommand({
            TableName: CHAT_SESSIONS_TABLE,
            // Use OR expression because IN not directly supported in expressions
            FilterExpression: '#status = :waiting OR #status = :active',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':waiting': 'waiting_for_agent', ':active': 'active' }
        }));

        let sessions = (scanResult.Items || []).map(item => ({
            sessionId: item.sessionId,
            driverId: item.driverId,
            driverName: item.driverName,
            driverPhone: item.driverPhone,
            status: item.status,
            createdAt: item.createdAt,
            lastMessageAt: item.lastMessageAt || item.createdAt,
            agentId: item.agentId || null,
            agentName: item.agentName || null,
            unreadDriver: item.unreadDriver || 0,
            unreadAgent: item.unreadAgent || 0,
            messages: [] // messages no longer embedded
        }));

        // Sort by lastMessageAt desc (fallback createdAt)
        sessions.sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0) - new Date(a.lastMessageAt || a.createdAt || 0));
        if (sessions.length > limit) sessions = sessions.slice(0, limit);
        return sessions;
    } catch (e) {
        console.error('getActiveChatSessions failed', e);
        return [];
    }
}

function sanitizeChatContent(text) {
    if (typeof text !== 'string') return '';
    let t = text.trim();
    // Basic length limit
    if (t.length > 4000) t = t.slice(0, 4000);
    // Strip simple script tags
    t = t.replace(/<script.*?>.*?<\/script>/gi, '[removed]');
    // Remove dangerous on* attributes (very naive)
    t = t.replace(/on[a-z]+="[^"]*"/gi, '');
    return t;
}

// Helper function to get connections for a business
async function getBusinessConnections(businessId) {
    try {
        const result = await dynamoDB.send(new QueryCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE,
            IndexName: 'BusinessIdIndex',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        }));
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting business connections:', error);
        return [];
    }
}

module.exports = { handler, getBusinessConnections };