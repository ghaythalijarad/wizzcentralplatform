#!/usr/bin/env node

/**
 * Quick WebSocket Connectivity Test
 * Tests both WebSocket endpoints to determine which is working
 */

const WebSocket = require('ws');

const endpoints = [
    'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev',
    'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev'
];

console.log('🧪 Quick WebSocket Connectivity Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function testEndpoint(url, index) {
    return new Promise((resolve) => {
        console.log(`\n${index + 1}. Testing: ${url}`);
        
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => {
            console.log(`   ❌ Timeout (10s) - No response`);
            ws.terminate();
            resolve({ url, status: 'timeout' });
        }, 10000);

        ws.on('open', () => {
            console.log(`   ✅ Connected successfully`);
            clearTimeout(timeout);
            ws.close();
            resolve({ url, status: 'connected' });
        });

        ws.on('error', (error) => {
            console.log(`   ⚠️  Error: ${error.message}`);
            clearTimeout(timeout);
            resolve({ url, status: 'error', error: error.message });
        });

        ws.on('close', (code, reason) => {
            console.log(`   🔌 Closed: ${code} ${reason || ''}`);
            clearTimeout(timeout);
            resolve({ url, status: 'closed', code });
        });
    });
}

async function runTests() {
    const results = [];
    
    for (let i = 0; i < endpoints.length; i++) {
        const result = await testEndpoint(endpoints[i], i);
        results.push(result);
    }

    console.log('\n📊 Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.forEach((result, index) => {
        const status = result.status === 'connected' ? '✅ WORKING' : 
                      result.status === 'timeout' ? '❌ TIMEOUT' :
                      result.status === 'error' ? `⚠️  ERROR: ${result.error}` :
                      `🔌 CLOSED (${result.code})`;
        console.log(`${index + 1}. ${result.url}`);
        console.log(`   Status: ${status}\n`);
    });

    const workingEndpoints = results.filter(r => r.status === 'connected');
    if (workingEndpoints.length > 0) {
        console.log('🎉 Working endpoints found! Live chat should be functional.');
    } else {
        console.log('❌ No working endpoints found. WebSocket deployment may need attention.');
    }
    
    process.exit(0);
}

runTests().catch(console.error);
