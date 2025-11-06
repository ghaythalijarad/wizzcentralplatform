#!/usr/bin/env node
/**
 * Local Development Server for Region API
 * Serves mock region data without AWS deployment
 */

const http = require('http');
const url = require('url');

// Import mock data
const mockRegions = require('./mock-regions-data');

const PORT = 3000;
const HOST = 'localhost';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept-Language',
    'Content-Type': 'application/json'
};

// Request handler
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // GET /regions/active
    if (method === 'GET' && pathname === '/regions/active') {
        const language = req.headers['accept-language'] || 'en';
        
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({
            success: true,
            message: `Active regions fetched successfully (${language})`,
            data: {
                regions: mockRegions,
                total: mockRegions.length,
                cached: false
            }
        }));
        return;
    }

    // GET /regions/:id
    if (method === 'GET' && pathname.startsWith('/regions/')) {
        const regionId = pathname.split('/')[2];
        const region = mockRegions.find(r => r.regionId === regionId);

        if (region) {
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({
                success: true,
                message: 'Region found',
                data: { region }
            }));
        } else {
            res.writeHead(404, corsHeaders);
            res.end(JSON.stringify({
                success: false,
                message: 'Region not found',
                error: `No region found with ID: ${regionId}`
            }));
        }
        return;
    }

    // Health check
    if (method === 'GET' && pathname === '/health') {
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({
            status: 'healthy',
            service: 'wizzcentral-regions-api',
            mode: 'development',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // 404 Not Found
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({
        success: false,
        message: 'Endpoint not found',
        error: `${method} ${pathname} is not a valid endpoint`
    }));
});

server.listen(PORT, HOST, () => {
    console.log('');
    console.log('🌍 WizzCentral Region API - Development Server');
    console.log('==============================================');
    console.log('');
    console.log(`✅ Server running at: http://${HOST}:${PORT}`);
    console.log('');
    console.log('📡 Available Endpoints:');
    console.log(`   GET  http://${HOST}:${PORT}/regions/active`);
    console.log(`   GET  http://${HOST}:${PORT}/regions/{id}`);
    console.log(`   GET  http://${HOST}:${PORT}/health`);
    console.log('');
    console.log('🗺️  Mock Data: 4 Governorates, 9 Neighborhoods with GPS');
    console.log('');
    console.log('📱 Update Flutter app to use this endpoint:');
    console.log(`   static const String _centralApiUrl = 'http://${HOST}:${PORT}';`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
