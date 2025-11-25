#!/usr/bin/env node

/**
 * Simple WhizzMe Mock Server for Testing
 * No AWS dependencies - just returns smart responses based on category
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

// Category-based knowledge base for intelligent responses
const KNOWLEDGE_BASE = {
  order_management: {
    welcome: "Hi! I'm WhizzMe 🤖. I can help you with orders, fulfillment, cancellations, and refunds. What specific issue are you experiencing?",
    keywords: ['order', 'refund', 'cancel', 'delivery', 'fulfillment', 'customer'],
    responses: {
      refund: "To process a refund:\n1. Go to Orders tab\n2. Select the order\n3. Tap 'Refund' button\n4. Choose full/partial refund\n5. Confirm\n\nRefunds typically process within 3-5 business days. Need help with a specific order?",
      cancel: "To cancel an order:\n1. Orders must be in 'Pending' or 'Preparing' status\n2. Tap the order\n3. Select 'Cancel Order'\n4. Choose cancellation reason\n\nThe customer will be notified immediately. Would you like help with anything else?",
      stuck: "If an order is stuck:\n1. Check your internet connection\n2. Try refreshing the order status\n3. Ensure you've marked previous steps complete\n\nIf issue persists, I can connect you with a human agent. Should I do that?",
      notReceiving: "If you're not receiving orders:\n1. Check if your store is marked as 'Open'\n2. Verify your working hours are correct\n3. Ensure notifications are enabled\n4. Check if you're within delivery radius\n\nWould you like me to help check your store settings?"
    }
  },
  payment_issues: {
    welcome: "Hi! I'm WhizzMe 🤖. I'm here to help with payment methods, transaction issues, and payout delays. What's happening?",
    keywords: ['payment', 'payout', 'money', 'transaction', 'commission', 'bank'],
    responses: {
      payout: "Regarding payout delays:\n• Payouts process every Monday\n• It takes 2-3 business days to reach your bank\n• Minimum payout threshold: $50\n• Check your bank details are correct in Settings\n\nWhen was your last payout scheduled?",
      failed: "For failed payments:\n1. Ask customer to check their card details\n2. Suggest trying a different payment method\n3. Ensure sufficient funds available\n\nThe payment will be retried automatically. Need more help?",
      commission: "Commission structure:\n• Restaurant orders: 15% platform fee\n• Grocery orders: 12% platform fee\n• Service fee covers payment processing, support, and platform maintenance\n\nYou can view detailed breakdowns in the Earnings section. Would you like me to show you how?"
    }
  },
  account_issues: {
    welcome: "Hi! I'm WhizzMe 🤖. I can help with login issues, account verification, and profile updates. What do you need help with?",
    keywords: ['login', 'password', 'account', 'verify', 'profile', 'email'],
    responses: {
      login: "Having trouble logging in?\n1. Try 'Forgot Password' to reset\n2. Check if your email is verified\n3. Clear app cache and try again\n4. Ensure you're using the correct email\n\nWould you like me to send a password reset link?",
      verify: "For account verification:\n1. Check your email for verification link\n2. Upload required documents (Business license, ID)\n3. Verification typically takes 24-48 hours\n\nNeed help uploading documents?",
      password: "To reset your password:\n1. Tap 'Forgot Password' on login screen\n2. Enter your registered email\n3. Check email for reset link\n4. Create a new strong password\n\nIf you don't receive the email, check your spam folder."
    }
  },
  business_setup: {
    welcome: "Hi! I'm WhizzMe 🤖. I can help with menu management, store hours, and business settings. What would you like to configure?",
    keywords: ['menu', 'hours', 'store', 'business', 'items', 'price', 'category'],
    responses: {
      menu: "To update your menu:\n1. Go to Menu section\n2. Tap '+' to add items or edit existing\n3. Set name, description, price, and image\n4. Organize into categories\n5. Toggle availability on/off\n\nChanges are live immediately. Need help with specific items?",
      hours: "To update store hours:\n1. Go to Settings > Business Hours\n2. Set open/close times for each day\n3. Mark days as closed if needed\n4. Save changes\n\nCustomers see real-time availability. Would you like to set up special hours?",
      verify: "For business verification:\n• Upload business license/permit\n• Provide proof of address\n• Complete tax information\n• Verification takes 1-2 business days\n\nNeed help with required documents?"
    }
  },
  technical_support: {
    welcome: "Hi! I'm WhizzMe 🤖. I can help with app issues, notification problems, and sync errors. What's not working correctly?",
    keywords: ['app', 'crash', 'notification', 'sync', 'error', 'bug', 'not working'],
    responses: {
      crash: "If the app keeps crashing:\n1. Force close and restart the app\n2. Update to the latest version\n3. Clear app cache (Settings > Storage)\n4. Restart your device\n5. Reinstall if problem persists\n\nWhat device and OS version are you using?",
      notification: "For notification issues:\n1. Check Settings > Notifications > WhizzMerchants is enabled\n2. Ensure 'Do Not Disturb' is off\n3. Check in-app notification settings\n4. Reinstall app if needed\n\nAre you missing specific types of notifications?",
      sync: "For sync problems:\n1. Check your internet connection\n2. Pull down to refresh manually\n3. Log out and log back in\n4. Clear cache if needed\n\nWhat data isn't syncing correctly?"
    }
  }
};

// General fallback responses
const GENERAL_RESPONSES = {
  greeting: "Hi! I'm WhizzMe, your AI assistant. I'm here to help you with:\n• Orders & Fulfillment\n• Payments & Payouts\n• Account Issues\n• Menu Management\n• Technical Support\n\nWhat can I help you with today?",
  unclear: "I want to make sure I help you correctly. Could you provide more details about your issue? Or would you like me to connect you with a human agent?",
  humanRequest: "I understand you'd like to speak with a human agent. I'm connecting you now...",
  thankYou: "You're welcome! Is there anything else I can help you with today?",
  goodbye: "Happy to help! Feel free to reach out anytime. Have a great day! 😊"
};

/**
 * Analyze message and generate intelligent response
 */
function generateResponse(message, category, conversationHistory = []) {
  const lowerMessage = message.toLowerCase();
  
  // Check for human agent request
  if (lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('person') || lowerMessage.includes('representative')) {
    return { response: GENERAL_RESPONSES.humanRequest, confidence: 0.95, escalate: true };
  }

  // Check for greeting
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    const categoryInfo = KNOWLEDGE_BASE[category];
    if (categoryInfo && conversationHistory.length === 0) {
      return { response: categoryInfo.welcome, confidence: 0.9, escalate: false };
    }
    return { response: GENERAL_RESPONSES.greeting, confidence: 0.85, escalate: false };
  }

  // Check for thank you
  if (lowerMessage.match(/thank|thanks|appreciate/)) {
    return { response: GENERAL_RESPONSES.thankYou, confidence: 0.9, escalate: false };
  }

  // Check for goodbye
  if (lowerMessage.match(/bye|goodbye|see you|that's all/)) {
    return { response: GENERAL_RESPONSES.goodbye, confidence: 0.9, escalate: false };
  }

  // Category-specific responses
  const categoryInfo = KNOWLEDGE_BASE[category];
  if (categoryInfo) {
    // Check for specific keywords
    for (const [key, response] of Object.entries(categoryInfo.responses)) {
      if (lowerMessage.includes(key)) {
        return { response, confidence: 0.88, escalate: false };
      }
    }

    // Check for general category keywords
    const hasKeyword = categoryInfo.keywords.some(keyword => lowerMessage.includes(keyword));
    if (hasKeyword && conversationHistory.length === 0) {
      return { response: categoryInfo.welcome, confidence: 0.8, escalate: false };
    }
  }

  // Default response
  return { response: GENERAL_RESPONSES.unclear, confidence: 0.6, escalate: false };
}

/**
 * WhizzMe Chat Endpoint
 */
app.post('/api/whizzme/chat', async (req, res) => {
  try {
    const { message, userType, sessionId, metadata = {} } = req.body;
    const category = metadata.category || 'general';
    const conversationHistory = metadata.conversationHistory || [];

    console.log('🤖 WhizzMe Request:', {
      sessionId,
      category,
      messageLength: message?.length,
      historyCount: conversationHistory.length
    });

    // Validate request
    if (!message || !userType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, userType'
      });
    }

    // Generate intelligent response
    const { response, confidence, escalate } = generateResponse(message, category, conversationHistory);

    // Return response
    res.json({
      success: true,
      suggestion: response,
      confidence,
      category,
      sessionId: sessionId || `session_${Date.now()}`,
      source: 'mock-ai',
      shouldEscalate: escalate,
      metadata: {
        responseTime: new Date().toISOString(),
        messageCount: conversationHistory.length + 1
      }
    });

  } catch (error) {
    console.error('❌ WhizzMe Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health Check Endpoint
 */
app.get('/api/whizzme/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WhizzMe Mock API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      chat: '/api/whizzme/chat',
      health: '/api/whizzme/health'
    }
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'WhizzMe Mock Server',
    status: 'running',
    endpoints: [
      { method: 'POST', path: '/api/whizzme/chat', description: 'WhizzMe chat endpoint' },
      { method: 'GET', path: '/api/whizzme/health', description: 'Health check' }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🤖 ================================================');
  console.log('🤖 WhizzMe Mock Server Started!');
  console.log('🤖 ================================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/whizzme/chat`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/whizzme/health`);
  console.log('🤖 ================================================');
  console.log('');
  console.log('📋 Supported Categories:');
  Object.keys(KNOWLEDGE_BASE).forEach(cat => {
    console.log(`   • ${cat}`);
  });
  console.log('');
  console.log('✅ Ready to serve WhizzMe AI responses!');
  console.log('');
});
