#!/usr/bin/env node
const WebSocket = require('ws');

const WS_BASE = process.env.WS_BASE || 'wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com';
const STAGE = process.env.STAGE || 'ghayth';
const MERCHANT_ID = process.env.MERCHANT_ID || 'testBiz123';
const MERCHANT_NAME = process.env.MERCHANT_NAME || 'Test Merchant';
const MERCHANT_EMAIL = process.env.MERCHANT_EMAIL || 'test@merchant.com';
const AGENT_ID = process.env.AGENT_ID || `platform_agent_${Date.now()}`;
const AGENT_NAME = process.env.AGENT_NAME || 'WizzCentral Agent';

const merchantSessionId = `test_session_${MERCHANT_ID}_${Date.now()}`;
const wsMerchantUrl = `${WS_BASE}/${STAGE}?businessId=${MERCHANT_ID}&userType=merchant&app=whizzMerchants&sessionId=${merchantSessionId}`;
const wsAgentUrl = `${WS_BASE}/${STAGE}?userType=support&agentId=${encodeURIComponent(AGENT_ID)}&platform=web`;

console.log('E2E: Using endpoint:', `${WS_BASE}/${STAGE}`);

function delay(ms){ return new Promise(res => setTimeout(res, ms)); }

async function run() {
  let createdSessionId = null;
  let merchantReceivedFromAgent = false;
  let agentReceivedFromMerchant = false;

  const merchant = new WebSocket(wsMerchantUrl);
  const agent = new WebSocket(wsAgentUrl);

  merchant.on('open', () => {
    console.log('Merchant OPEN');
    const handshake = {
      action: 'chat_merchant_connect',
      type: 'chat_merchant_connect',
      merchantId: MERCHANT_ID,
      merchantName: MERCHANT_NAME,
      merchantEmail: MERCHANT_EMAIL,
      sessionId: merchantSessionId,
    };
    console.log('Merchant handshake ->', handshake);
    merchant.send(JSON.stringify(handshake));
  });

  merchant.on('message', (m) => {
    const msg = m.toString();
    console.log('Merchant MSG', msg);
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'chat_session_created' && parsed.sessionId) {
        createdSessionId = parsed.sessionId;
      }
      if ((parsed.type === 'chat_message' || parsed.type === 'support_message') && parsed.message) {
        merchantReceivedFromAgent = true;
      }
    } catch {}
  });

  agent.on('open', async () => {
    console.log('Agent OPEN');
    const agentHandshake = {
      action: 'chat_agent_connect',
      type: 'chat_agent_connect',
      agentId: AGENT_ID,
      agentName: AGENT_NAME,
    };
    console.log('Agent handshake ->', agentHandshake);
    agent.send(JSON.stringify(agentHandshake));

    // Wait for merchant session to be created
    let tries = 0;
    while (!createdSessionId && tries < 20) {
      await delay(250);
      tries++;
    }

    if (!createdSessionId) {
      console.error('E2E FAIL: Session was not created');
      merchant.close();
      agent.close();
      process.exit(1);
    }

    // Send agent -> merchant message
    const agentMsg = {
      action: 'chat_message',
      type: 'chat_message',
      sessionId: createdSessionId,
      message: 'Hello from support agent 👋',
      senderType: 'support',
      agentId: AGENT_ID,
      agentName: AGENT_NAME,
      timestamp: new Date().toISOString(),
    };
    console.log('Agent send ->', agentMsg);
    agent.send(JSON.stringify(agentMsg));

    // After a moment, send merchant -> agent
    setTimeout(() => {
      const merchantMsg = {
        action: 'chat_message',
        type: 'chat_message',
        sessionId: createdSessionId,
        message: 'Hello agent, merchant here ✅',
        senderType: 'merchant',
        merchantId: MERCHANT_ID,
        merchantName: MERCHANT_NAME,
        timestamp: new Date().toISOString(),
      };
      console.log('Merchant send ->', merchantMsg);
      merchant.send(JSON.stringify(merchantMsg));
    }, 800);
  });

  agent.on('message', (m) => {
    const msg = m.toString();
    console.log('Agent MSG', msg);
    try {
      const parsed = JSON.parse(msg);
      if ((parsed.type === 'chat_message' || parsed.type === 'driver_message' || parsed.type === 'merchant_message') && parsed.message) {
        agentReceivedFromMerchant = true;
      }
    } catch {}
  });

  // Wrap up after a few seconds
  setTimeout(() => {
    const ok = createdSessionId && merchantReceivedFromAgent && agentReceivedFromMerchant;
    console.log('\nE2E RESULT:', ok ? 'PASS ✅' : 'FAIL ❌');
    console.log({ createdSessionId, merchantReceivedFromAgent, agentReceivedFromMerchant });
    merchant.close();
    agent.close();
    process.exit(ok ? 0 : 1);
  }, 6000);
}

run().catch(e => { console.error('E2E ERROR', e); process.exit(1); });
