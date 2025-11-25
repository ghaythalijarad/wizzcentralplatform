const WebSocket = require('ws');

const merchantId = process.env.MERCHANT_ID || 'testBiz123';
const merchantName = process.env.MERCHANT_NAME || 'Test Merchant';
const merchantEmail = process.env.MERCHANT_EMAIL || 'test@merchant.com';
const stage = process.env.STAGE || 'ghayth';
const apiBase = process.env.WS_BASE || 'wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com';
const sessionId = `test_session_${merchantId}_${Date.now()}`;
const base = `${apiBase}/${stage}`;
const url = `${base}?businessId=${merchantId}&userType=merchant&app=whizzMerchants&sessionId=${sessionId}`;

console.log('Connecting to', url);
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('OPEN');
  const payload = {
    action: 'chat_merchant_connect',
    type: 'chat_merchant_connect',
    merchantId,
    merchantName,
    merchantEmail,
    sessionId,
  };
  console.log('Sending handshake', payload);
  ws.send(JSON.stringify(payload));
});

ws.on('message', (m) => {
  console.log('MSG', m.toString());
});

ws.on('error', (e) => {
  console.error('ERR', e);
});

ws.on('close', () => {
  console.log('CLOSE');
});

setTimeout(() => {
  console.log('Done test, closing');
  ws.close();
}, 8000);
