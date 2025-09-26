#!/usr/bin/env node

/**
 * Local Development Chat Bridge
 * Bridges HTTP messages from Flutter app to local WebSocket support page
 */

const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Configuration
const HTTP_PORT = 8087;  // Port expected by Flutter app
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

// Store active chat sessions and message history
const activeSessions = new Map();
const messageHistory = [];

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// WebSocket connection for live chat
let liveWebSocket = null;

console.log('🚀 Starting Local Development Chat Bridge');
console.log('=========================================');

function connectToLiveChat() {
    console.log('🔌 Connecting to Live Chat WebSocket...');
    
    try {
        liveWebSocket = new WebSocket(WEBSOCKET_URL + '?userType=agent&agentId=dev_bridge_agent&businessId=7ccf646c-9594-48d4-8f63-c366d89257e5');
        
        liveWebSocket.on('open', () => {
            console.log('✅ Connected to Live Chat WebSocket');
            
            // Send agent registration
            const agentConnect = {
                action: 'agent_connect',
                type: 'chat_agent_connect',
                agentId: 'dev_bridge_agent',
                agentName: 'Local Dev Bridge',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                userType: 'agent'
            };
            
            liveWebSocket.send(JSON.stringify(agentConnect));
            console.log('📤 Sent agent registration');
        });
        
        liveWebSocket.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(`📨 Received from WebSocket: ${message.type || 'unknown'}`);
                
                // Store agent replies for debugging
                if (message.type === 'chat_message' && message.senderType === 'agent') {
                    messageHistory.push({
                        id: `reply_${Date.now()}`,
                        type: 'agent_reply',
                        message: message.text || message.message,
                        timestamp: new Date().toISOString(),
                        sessionId: message.sessionId
                    });
                }
            } catch (e) {
                console.log(`📨 Raw WebSocket message: ${data.toString()}`);
            }
        });
        
        liveWebSocket.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
        });
        
        liveWebSocket.on('close', () => {
            console.log('🔌 WebSocket disconnected, attempting to reconnect...');
            liveWebSocket = null;
            setTimeout(connectToLiveChat, 5000);
        });
        
    } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error.message);
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

    // Set CORS headers
    Object.keys(corsHeaders).forEach(header => {
        res.setHeader(header, corsHeaders[header]);
    });

    console.log(`📨 ${method} ${path} - ${new Date().toISOString()}`);

    if (path === '/chat/send' && method === 'POST') {
        // Handle Flutter chat messages
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const flutterMessage = JSON.parse(body);
                console.log('📱 Flutter message received:', {
                    message: flutterMessage.message?.substring(0, 50) + '...',
                    senderType: flutterMessage.metadata?.senderType,
                    senderName: flutterMessage.metadata?.senderName,
                    platform: flutterMessage.metadata?.platform
                });

                // Extract driver info
                const driverId = flutterMessage.metadata?.senderId || 'unknown_driver';
                const driverName = flutterMessage.metadata?.senderName || 'Unknown Driver';
                const sessionId = flutterMessage.participantToken || `session_${driverId}`;

                // Store message in history
                const messageWithId = {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    sessionId: sessionId,
                    message: flutterMessage.message,
                    senderType: 'driver',
                    senderName: driverName,
                    timestamp: new Date().toISOString(),
                    platform: 'flutter_http_bridge',
                    bridged: false
                };
                
                messageHistory.push(messageWithId);
                activeSessions.set(sessionId, {
                    driverId,
                    driverName,
                    lastActivity: new Date().toISOString()
                });

                console.log(`💾 Message stored (ID: ${messageWithId.id})`);
                
                // Forward to WebSocket if connected
                if (liveWebSocket && liveWebSocket.readyState === WebSocket.OPEN) {
                    const webSocketMessage = {
                        action: 'chat_message',
                        type: 'chat_message',
                        sessionId: sessionId,
                        messageText: flutterMessage.message,
                        text: flutterMessage.message,
                        senderType: 'driver',
                        senderId: driverId,
                        senderName: driverName,
                        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                        timestamp: new Date().toISOString(),
                        metadata: {
                            platform: 'flutter',
                            source: 'http_bridge',
                            messageId: messageWithId.id
                        }
                    };
                    
                    console.log('📡 Forwarding to WebSocket...');
                    liveWebSocket.send(JSON.stringify(webSocketMessage));
                    messageWithId.bridged = true;
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        messageId: messageWithId.id,
                        sessionId: sessionId,
                        bridged: true,
                        message: 'Message bridged to live chat successfully'
                    }));
                } else {
                    console.log('⚠️ WebSocket not connected - message stored only');
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        messageId: messageWithId.id,
                        sessionId: sessionId,
                        bridged: false,
                        message: 'Message received but WebSocket not available'
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
            total: messageHistory.length,
            activeSessions: activeSessions.size
        }));
        
    } else if (path === '/chat/status' && method === 'GET') {
        // Get bridge status
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            status: 'running',
            webSocketConnected: liveWebSocket && liveWebSocket.readyState === WebSocket.OPEN,
            activeSessions: activeSessions.size,
            totalMessages: messageHistory.length,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
        
    } else if (path === '/health' && method === 'GET') {
        // Health check
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
            webSocketStatus: liveWebSocket ? 'connected' : 'disconnected',
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

// Start server
server.listen(HTTP_PORT, () => {
    console.log('🌉 Local Development Chat Bridge Started');
    console.log(`📡 HTTP Server: http://localhost:${HTTP_PORT}`);
    console.log(`🔗 WebSocket URL: ${WEBSOCKET_URL}`);
    console.log('');
    console.log('🔗 Available endpoints:');
    console.log('   POST /chat/send     - Receive Flutter messages');
    console.log('   GET  /chat/history  - Get message history');
    console.log('   GET  /chat/status   - Get bridge status');
    console.log('   GET  /health        - Health check');
    console.log('');
    console.log('💬 Ready to bridge Flutter HTTP ↔ WebSocket Live Chat!');
    
    // Connect to WebSocket
    connectToLiveChat();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Local Development Chat Bridge...');
    if (liveWebSocket) {
        liveWebSocket.close();
    }
    server.close(() => {
        console.log('✅ Chat Bridge stopped');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
