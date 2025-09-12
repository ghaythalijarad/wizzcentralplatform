#!/usr/bin/env node

const http = require('http');
const url = require('url');

// Simple test HTTP server on port 8087 to simulate chat bridge
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${method} ${path} - ${new Date().toISOString()}`);

    if (path === '/chat/send' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const message = JSON.parse(body);
                console.log('📱 Received Flutter message:', {
                    senderType: message.metadata?.senderType,
                    senderId: message.metadata?.senderId,
                    messageLength: message.message?.length
                });
                
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    messageId: Date.now().toString(),
                    sessionId: `session_${message.metadata?.senderId}_${Date.now()}`,
                    message: 'Message received by test server'
                }));
            } catch (error) {
                console.error('Error parsing message:', error);
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid message format'
                }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({
            success: false,
            error: 'Endpoint not found'
        }));
    }
});

const PORT = 8087;
server.listen(PORT, () => {
    console.log(`🧪 Test Chat Bridge Server listening on http://localhost:${PORT}`);
    console.log('📱 Ready to receive Flutter messages at POST /chat/send');
});
