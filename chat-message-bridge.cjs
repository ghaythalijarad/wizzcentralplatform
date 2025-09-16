#!/usr/bin/env node

/**
 * Enhanced Chat Message Bridge
 * Receives HTTP messages from Flutter driver app and forwards them to WebSocket Live Chat
 */

const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Configuration
const HTTP_PORT = 8087;  // Port expected by Flutter app
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

// Store active chat sessions and WebSocket connections
const chatSessions = new Map();
const driverSessions = new Map();
const messageHistory = [];

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// WebSocket connection for forwarding to Live Chat
let liveChatWS = null;

function connectToLiveChat() {
    console.log('🔌 Connecting to Live Chat WebSocket...');
    
    try {
        liveChatWS = new WebSocket(WEBSOCKET_URL + '?userType=support&agentId=bridge_agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5');
        
        liveChatWS.on('open', () => {
            console.log('✅ Connected to Live Chat WebSocket');
            
            // Send authentication as support agent  
            liveChatWS.send(JSON.stringify({
                type: 'chat_agent_connect',
                agentId: 'bridge_agent',
                agentName: 'Message Bridge',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
            }));
        });
        
        liveChatWS.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log('📨 Received from Live Chat:', message.type);
                
                if (message.type === 'error') {
                    console.log('❌ Error from Live Chat:', JSON.stringify(message, null, 2));
                } else if (message.type === 'chat_session_created') {
                    console.log('✅ Session created:', message.sessionId);
                } else if (message.type === 'chat_message' && message.senderType === 'agent') {
                    console.log('💬 Agent response received - could forward to Flutter app if needed');
                    // Future: implement bidirectional communication
                }
            } catch (e) {
                console.log('📨 Raw message from Live Chat:', data.toString());
            }
        });
        
        liveChatWS.on('error', (error) => {
            console.error('❌ Live Chat WebSocket error:', error.message);
        });
        
        liveChatWS.on('close', () => {
            console.log('🔌 Live Chat WebSocket disconnected');
            liveChatWS = null;
            
            // Attempt to reconnect after 5 seconds
            setTimeout(connectToLiveChat, 5000);
        });
        
    } catch (error) {
        console.error('❌ Failed to connect to Live Chat:', error.message);
        setTimeout(connectToLiveChat, 5000);
    }
}

// HTTP Server to receive messages from Flutter app
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // Set CORS headers for all responses
    Object.keys(corsHeaders).forEach(header => {
        res.setHeader(header, corsHeaders[header]);
    });

    console.log(`📨 ${method} ${path} - ${new Date().toISOString()}`);

    if (path === '/chat/send' && method === 'POST') {
        // Receive Flutter driver messages and bridge to WebSocket
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const flutterMessage = JSON.parse(body);
                console.log('📱 Flutter message received:', {
                    senderType: flutterMessage.metadata?.senderType,
                    senderId: flutterMessage.metadata?.senderId,
                    messageLength: flutterMessage.message?.length
                });
                
                // Generate message ID and session ID
                const messageWithId = {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...flutterMessage,
                    timestamp: new Date().toISOString()
                };
                
                // Store in history
                messageHistory.push(messageWithId);
                
                // Determine session ID and driver info
                const driverId = flutterMessage.metadata?.senderId || flutterMessage.metadata?.driverId;
                const driverName = flutterMessage.metadata?.senderName || flutterMessage.metadata?.driverName || `Driver ${driverId}`;
                
                // Use provided session ID or create new one
                let sessionId = flutterMessage.sessionId;
                if (!sessionId) {
                    sessionId = `session_${driverId}_${Date.now()}`;
                    driverSessions.set(driverId, sessionId);
                    console.log(`📝 Created new session ${sessionId} for driver ${driverId}`);
                } else {
                    console.log(`📝 Using provided session ${sessionId} for driver ${driverId}`);
                }
                
                // Forward to Live Chat if connected
                if (liveChatWS && liveChatWS.readyState === WebSocket.OPEN) {
                    // Forward message to Live Chat using correct format for agent forwarding
                    const webSocketMessage = {
                        type: 'chat_message',
                        sessionId: sessionId,
                        message: flutterMessage.message,
                        content: flutterMessage.message,
                        senderType: 'driver',
                        senderId: driverId,
                        senderName: driverName,
                        driverId: driverId,
                        driverName: driverName,
                        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                        timestamp: new Date().toISOString(),
                        metadata: {
                            platform: 'flutter',
                            source: 'flutter_http_bridge',
                            forwardedBy: 'bridge_agent'
                        }
                    };
                    
                    console.log('🔍 Sending WebSocket message:', JSON.stringify(webSocketMessage, null, 2));
                    liveChatWS.send(JSON.stringify(webSocketMessage));
                    console.log('📡 Message bridged to Live Chat WebSocket');
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        messageId: messageWithId.id,
                        sessionId: sessionId,
                        bridged: true,
                        message: 'Message sent to Live Chat support'
                    }));
                } else {
                    console.log('⚠️ Live Chat WebSocket not connected - message stored only');
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        messageId: messageWithId.id,
                        sessionId: sessionId,
                        bridged: false,
                        message: 'Message received but Live Chat not available'
                    }));
                }
                
            } catch (error) {
                console.error('❌ Error processing Flutter message:', error);
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid message format'
                }));
            }
        });
        
    } else if (path === '/chat/history' && method === 'GET') {
        // Get message history
        const limit = parseInt(parsedUrl.query.limit) || 50;
        const recentMessages = messageHistory.slice(-limit);
        
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            messages: recentMessages,
            total: messageHistory.length
        }));
        
    } else if (path === '/chat/status' && method === 'GET') {
        // Get bridge status
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            status: 'running',
            liveChatConnected: liveChatWS && liveChatWS.readyState === WebSocket.OPEN,
            activeSessions: driverSessions.size,
            totalMessages: messageHistory.length,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
        
    } else if (path === '/health' && method === 'GET') {
        // Health check
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
            liveChatStatus: liveChatWS ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        }));
        
    } else {
        // 404 for unknown paths
        res.writeHead(404);
        res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found'
        }));
    }
});

// Start the bridge
server.listen(HTTP_PORT, () => {
    console.log('🌉 Chat Message Bridge Started');
    console.log(`📡 HTTP Server listening on http://localhost:${HTTP_PORT}`);
    console.log(`🔗 Bridging to WebSocket: ${WEBSOCKET_URL}`);
    console.log('');
    console.log('🔗 Available endpoints:');
    console.log('   POST /chat/send     - Receive Flutter messages (bridge to WebSocket)');
    console.log('   GET  /chat/history  - Get message history');
    console.log('   GET  /chat/status   - Get bridge status');
    console.log('   GET  /health        - Health check');
    console.log('');
    console.log('💬 Ready to bridge Flutter HTTP messages to Live Chat WebSocket!');
    
    // Connect to Live Chat WebSocket
    connectToLiveChat();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down chat message bridge...');
    
    if (liveChatWS) {
        liveChatWS.close();
    }
    
    server.close(() => {
        console.log('✅ Chat message bridge shut down gracefully');
        process.exit(0);
    });
});
