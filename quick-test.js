const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const ws = new WebSocket('wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');

ws.on('open', () => {
    console.log('✅ Connected!');
    ws.close();
});

ws.on('error', (error) => {
    console.log('❌ Error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Closed');
    process.exit(0);
});

setTimeout(() => {
    console.log('⏰ Timeout');
    process.exit(1);
}, 5000);
