#!/usr/bin/env node

/**
 * Central Platform WebSocket Test
 * Tests the improved LiveChatSocket implementation
 */

console.log('🧪 Central Platform WebSocket Test');
console.log('==================================');

// Open browser to test page
const { exec } = require('child_process');
const path = require('path');

// Create a simple test HTML page
const testPageContent = `<!DOCTYPE html>
<html>
<head>
    <title>Central Platform WebSocket Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .connected { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .connecting { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .disconnected { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .log { background: #f8f9fa; border: 1px solid #e9ecef; padding: 10px; margin: 10px 0; border-radius: 4px; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; }
        button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        button.danger { background: #dc3545; }
        button.success { background: #28a745; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0; }
        .stat { background: #e9ecef; padding: 10px; border-radius: 4px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 Central Platform WebSocket Test</h1>
        <p>Testing the improved LiveChatSocket implementation with authentication, reconnection, and message queueing.</p>
        
        <div id="status" class="status disconnected">
            🔴 Disconnected
        </div>

        <div class="stats">
            <div class="stat">
                <div id="stat-sent" class="stat-value">0</div>
                <div class="stat-label">Messages Sent</div>
            </div>
            <div class="stat">
                <div id="stat-received" class="stat-value">0</div>
                <div class="stat-label">Messages Received</div>
            </div>
            <div class="stat">
                <div id="stat-reconnects" class="stat-value">0</div>
                <div class="stat-label">Reconnections</div>
            </div>
            <div class="stat">
                <div id="stat-errors" class="stat-value">0</div>
                <div class="stat-label">Errors</div>
            </div>
        </div>

        <div>
            <button onclick="connect()">🔌 Connect</button>
            <button onclick="disconnect()" class="danger">🔌 Disconnect</button>
            <button onclick="sendTestMessage()" class="success">📤 Send Test Message</button>
            <button onclick="sendHeartbeat()">💓 Send Heartbeat</button>
            <button onclick="clearLog()">🧹 Clear Log</button>
        </div>

        <div id="log" class="log"></div>
    </div>

    <script>
        // Mock config for testing
        window.WIZZCENTRAL_CONFIG = {
            WEBSOCKET: {
                LIVE_CHAT_URL: 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev'
            }
        };

        // Mock EventBus
        window.EventBus = {
            events: {},
            on(event, callback) {
                if (!this.events[event]) this.events[event] = [];
                this.events[event].push(callback);
            },
            emit(event, data) {
                if (this.events[event]) {
                    this.events[event].forEach(callback => callback(data));
                }
            }
        };

        // Load LiveChatSocket
        const script = document.createElement('script');
        script.src = '../js/support/LiveChatSocket.js';
        document.head.appendChild(script);

        let liveChatSocket = null;
        let stats = { sent: 0, received: 0, reconnects: 0, errors: 0 };

        function log(message) {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            logDiv.innerHTML += \`[\${timestamp}] \${message}\\n\`;
            logDiv.scrollTop = logDiv.scrollHeight;
            console.log(message);
        }

        function updateStatus(text, className) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = text;
            statusDiv.className = \`status \${className}\`;
        }

        function updateStats() {
            document.getElementById('stat-sent').textContent = stats.sent;
            document.getElementById('stat-received').textContent = stats.received;
            document.getElementById('stat-reconnects').textContent = stats.reconnects;
            document.getElementById('stat-errors').textContent = stats.errors;
        }

        function connect() {
            if (liveChatSocket) {
                log('❌ Already have a socket instance, disconnecting first...');
                liveChatSocket.disconnect();
            }

            log('🚀 Creating LiveChatSocket instance...');
            updateStatus('🟡 Connecting...', 'connecting');
            
            liveChatSocket = new window.LiveChatSocket({
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                endpoint: 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev',
                userId: 'test-agent',
                agentId: 'test-agent-' + Date.now(),
                agentName: 'Test Support Agent'
            });

            // Set up event listeners
            window.EventBus.on('liveChat.connected', (data) => {
                log('✅ Connected to LiveChat');
                updateStatus('🟢 Connected', 'connected');
            });

            window.EventBus.on('liveChat.disconnected', (data) => {
                log(\`🔌 Disconnected: \${data.code} \${data.reason || ''}\`);
                updateStatus('🔴 Disconnected', 'disconnected');
                if (data.willReconnect) {
                    stats.reconnects++;
                    updateStats();
                }
            });

            window.EventBus.on('liveChat.error', (data) => {
                log(\`❌ Error: \${data.error || 'Unknown error'}\`);
                stats.errors++;
                updateStats();
            });

            window.EventBus.on('liveChat.connectionStateChanged', (data) => {
                log(\`🔄 State: \${data.previousState} → \${data.state}\`);
                if (data.reason) log(\`   Reason: \${data.reason}\`);
            });

            // Any message received
            const originalHandleMessage = liveChatSocket._handleMessage;
            liveChatSocket._handleMessage = function(data) {
                stats.received++;
                updateStats();
                log(\`📥 Received: \${data.type || data.action || 'unknown'}\`);
                return originalHandleMessage.call(this, data);
            };

            liveChatSocket.init();
            liveChatSocket.connect().catch(error => {
                log(\`❌ Connection failed: \${error.message}\`);
                updateStatus('❌ Connection Failed', 'disconnected');
            });
        }

        function disconnect() {
            if (liveChatSocket) {
                log('🔌 Disconnecting...');
                liveChatSocket.disconnect();
                liveChatSocket = null;
            } else {
                log('⚠️ No socket to disconnect');
            }
        }

        function sendTestMessage() {
            if (!liveChatSocket) {
                log('❌ Not connected');
                return;
            }

            const message = \`Test message \${Date.now()}\`;
            log(\`📤 Sending test message...\`);
            
            const success = liveChatSocket.send({
                type: 'test_message',
                content: message,
                sender: 'test-agent'
            });

            if (success) {
                stats.sent++;
                updateStats();
            }
        }

        function sendHeartbeat() {
            if (!liveChatSocket) {
                log('❌ Not connected');
                return;
            }

            log('💓 Sending heartbeat...');
            const success = liveChatSocket.send({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
            });

            if (success) {
                stats.sent++;
                updateStats();
            }
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }

        // Auto-connect when page loads
        script.onload = () => {
            log('📄 Page loaded, LiveChatSocket ready');
            log('💡 Click "Connect" to start the test');
        };
    </script>
</body>
</html>`;

const fs = require('fs');
const testPagePath = path.join(__dirname, 'test-livechat-socket.html');

fs.writeFileSync(testPagePath, testPageContent);
console.log('✅ Created test page:', testPagePath);

// Try to open in browser
const openCommand = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';

exec(`${openCommand} ${testPagePath}`, (error) => {
    if (error) {
        console.log('❌ Could not auto-open browser. Please open manually:', testPagePath);
    } else {
        console.log('🌐 Opening test page in browser...');
    }
});

console.log('\n📋 Test Instructions:');
console.log('1. Open the test page in your browser');
console.log('2. Click "Connect" to establish WebSocket connection');
console.log('3. Try sending test messages and heartbeats');
console.log('4. Monitor the connection status and statistics');
console.log('5. Test reconnection by temporarily disconnecting your network');
console.log('\n💡 This test validates:');
console.log('  - WebSocket authentication');
console.log('  - Message sending/receiving');
console.log('  - Automatic reconnection');
console.log('  - Message queueing');
console.log('  - Error handling');
