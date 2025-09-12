#!/usr/bin/env node

/**
 * Simple Chat Message Broker for Testing Live Chat Integration
 * This creates a local HTTP server that can receive and relay chat messages
 * between the central platform and the Flutter app.
 */

const http = require('http');
const url = require('url');

// Store active chat sessions
const chatSessions = new Map();
const messageHistory = [];

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

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

    if (path === '/chat/message' && method === 'POST') {
        // Receive new message
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const message = JSON.parse(body);
                console.log('💬 New message received:', message);

                // Store message
                const messageWithId = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    ...message
                };
                messageHistory.push(messageWithId);

                // Keep only last 100 messages
                if (messageHistory.length > 100) {
                    messageHistory.shift();
                }

                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    messageId: messageWithId.id,
                    message: 'Message received and stored'
                }));

            } catch (error) {
                console.error('❌ Error parsing message:', error);
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid JSON'
                }));
            }
        });

    } else if (path === '/chat/messages' && method === 'GET') {
        // Get message history
        const limit = parseInt(parsedUrl.query.limit) || 50;
        const recentMessages = messageHistory.slice(-limit);

        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            messages: recentMessages,
            total: messageHistory.length
        }));

    } else if (path === '/chat/send' && method === 'POST') {
        // Send message to specific session
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { sessionId, message, sender } = JSON.parse(body);
                console.log(`📤 Sending message to session ${sessionId}:`, message);

                // Store outgoing message
                const messageWithId = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    sessionId,
                    message,
                    sender: sender || 'central-platform',
                    direction: 'outbound'
                };
                messageHistory.push(messageWithId);

                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    messageId: messageWithId.id,
                    message: 'Message sent successfully'
                }));

            } catch (error) {
                console.error('❌ Error sending message:', error);
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid request'
                }));
            }
        });

    } else if (path === '/chat/status' && method === 'GET') {
        // Get chat broker status
        res.writeHead(200);
        res.end(JSON.stringify({
            success: true,
            status: 'running',
            activeSessions: chatSessions.size,
            totalMessages: messageHistory.length,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));

    } else if (path === '/health' && method === 'GET') {
        // Health check
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
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

const PORT = 8085;
server.listen(PORT, () => {
    console.log('🚀 Chat Message Broker Server Started');
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log('🔗 Available endpoints:');
    console.log('   POST /chat/message  - Receive new messages');
    console.log('   GET  /chat/messages - Get message history');
    console.log('   POST /chat/send     - Send message to session');
    console.log('   GET  /chat/status   - Get broker status');
    console.log('   GET  /health        - Health check');
    console.log('💬 Ready to relay chat messages!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down chat broker server...');
    server.close(() => {
        console.log('✅ Chat broker server shut down gracefully');
        process.exit(0);
    });
});
