/**
 * WhizzMe Chat API - Production Ready
 * Provides AI-powered chat responses using AWS Bedrock (Amazon Nova Micro)
 */

const { getAISuggestion } = require('../src/services/bedrock-agent-service');

/**
 * Handle WhizzMe chat requests
 * POST /api/whizzme/chat
 */
async function handleWhizzMeChat(req, res) {
  try {
    console.log('🤖 WhizzMe Chat Request:', {
      userType: req.body.userType,
      sessionId: req.body.sessionId,
      messageLength: req.body.message?.length
    });

    // Validate request
    if (!req.body.message || !req.body.userType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, userType'
      });
    }

    // Prepare context for AI
    const context = {
      sessionId: req.body.sessionId || `session_${Date.now()}`,
      userType: req.body.userType, // 'merchant' or 'customer'
      message: req.body.message,
      conversationHistory: req.body.conversationHistory || [],
      metadata: req.body.metadata || {}
    };

    // Get AI suggestion from AWS Bedrock
    const aiResponse = await getAISuggestion(context);

    if (aiResponse.success) {
      return res.json({
        success: true,
        suggestion: aiResponse.suggestion,
        confidence: aiResponse.confidence || 0.8,
        category: req.body.metadata?.category || 'general',
        sessionId: context.sessionId
      });
    } else {
      // Fallback response if AI service fails
      const language = req.body.metadata?.language || 'ar'; // Default to Arabic
      return res.json({
        success: true,
        suggestion: getFallbackResponse(req.body.message, req.body.metadata?.category, language),
        confidence: 0.6,
        category: req.body.metadata?.category || 'general',
        sessionId: context.sessionId,
        note: 'Fallback response due to AI service unavailability'
      });
    }

  } catch (error) {
    console.error('❌ WhizzMe Chat Error:', error);
    
    // Return fallback response even on error
    const language = req.body.metadata?.language || 'ar'; // Default to Arabic
    return res.json({
      success: true,
      suggestion: getFallbackResponse(req.body.message, req.body.metadata?.category, language),
      confidence: 0.5,
      category: 'general',
      note: 'Fallback response due to error'
    });
  }
}

/**
 * Get fallback response when AI is unavailable
 * Supports both Arabic and English
 */
function getFallbackResponse(message, category, language = 'ar') {
  const lowerMessage = message.toLowerCase();
  const isArabic = language === 'ar';

  // Category-specific responses in Arabic
  if (isArabic) {
    if (category === 'technical_support' || lowerMessage.includes('crash') || lowerMessage.includes('bug') || 
        lowerMessage.includes('خلل') || lowerMessage.includes('مشكلة')) {
      return "للمشاكل التقنية، أنصح بالتالي:\n\n" +
             "١. إعادة تشغيل التطبيق\n" +
             "٢. التحقق من اتصال الإنترنت\n" +
             "٣. تحديث التطبيق لآخر نسخة\n" +
             "٤. مسح ذاكرة التخزين المؤقت إذا استمرت المشكلة\n\n" +
             "هل تريد أن أوصلك بفريق الدعم التقني؟";
    }

    if (category === 'order_management' || lowerMessage.includes('order') || lowerMessage.includes('طلب')) {
      return "للأسئلة المتعلقة بالطلبات:\n\n" +
             "• راجع قسم الطلبات لمعرفة حالة الطلب\n" +
             "• فعّل إشعارات الدفع للطلبات الجديدة\n" +
             "• تواصل مع الزبائن مباشرة عبر التطبيق\n\n" +
             "ما هي مشكلة الطلب المحددة التي يمكنني مساعدتك بها؟";
    }

    if (category === 'payment_issues' || lowerMessage.includes('payment') || lowerMessage.includes('payout') ||
        lowerMessage.includes('دفع') || lowerMessage.includes('تحويل')) {
      return "لاستفسارات الدفع:\n\n" +
             "💰 يتم معالجة التحويلات أسبوعياً\n" +
             "📊 راجع قسم الأرباح للتفاصيل\n" +
             "🏦 تأكد من تحديث بيانات البنك\n\n" +
             "ما هو سؤالك المحدد حول الدفع؟";
    }

    if (category === 'account_issues' || lowerMessage.includes('login') || lowerMessage.includes('password') ||
        lowerMessage.includes('دخول') || lowerMessage.includes('كلمة السر')) {
      return "لمشاكل الحساب:\n\n" +
             "🔐 استخدم 'نسيت كلمة السر' لإعادة التعيين\n" +
             "📧 راجع بريدك الإلكتروني لروابط التحقق\n" +
             "✅ تأكد من تفعيل حسابك\n\n" +
             "ما هي مشكلة الحساب التي تواجهها؟";
    }

    if (category === 'business_setup' || lowerMessage.includes('menu') || lowerMessage.includes('hours') ||
        lowerMessage.includes('قائمة') || lowerMessage.includes('ساعات')) {
      return "لإعداد المتجر:\n\n" +
             "📝 حدّث عناصر القائمة في إدارة القائمة\n" +
             "🕒 عيّن ساعات العمل في إعدادات المتجر\n" +
             "📍 تحقق من موقعك للتوصيل الدقيق\n\n" +
             "أي جزء من الإعداد تحتاج مساعدة فيه؟";
    }

    // Generic Arabic fallback
    return "أفهم أنك تحتاج مساعدة. دعني أساعدك!\n\n" +
           "هل يمكنك تقديم المزيد من التفاصيل حول مشكلتك؟ " +
           "أو هل تريد أن أوصلك بموظف دعم بشري؟";
  }

  // English fallback responses (original)
  if (category === 'technical_support' || lowerMessage.includes('crash') || lowerMessage.includes('bug')) {
    return "For technical issues, I recommend:\n\n" +
           "1. Restart the app\n" +
           "2. Check your internet connection\n" +
           "3. Update to the latest version\n" +
           "4. Clear app cache if the problem persists\n\n" +
           "Would you like me to connect you with our technical support team?";
  }

  if (category === 'order_management' || lowerMessage.includes('order')) {
    return "For order-related questions:\n\n" +
           "• Check the Orders tab for order status\n" +
           "• Enable push notifications for new orders\n" +
           "• Contact customers directly through the app\n\n" +
           "What specific order issue can I help you with?";
  }

  if (category === 'payment_issues' || lowerMessage.includes('payment') || lowerMessage.includes('payout')) {
    return "For payment inquiries:\n\n" +
           "💰 Payouts are processed weekly\n" +
           "📊 Check your Earnings section for details\n" +
           "🏦 Ensure your bank details are up to date\n\n" +
           "What specific payment question do you have?";
  }

  if (category === 'account_issues' || lowerMessage.includes('login') || lowerMessage.includes('password')) {
    return "For account issues:\n\n" +
           "🔐 Use 'Forgot Password' to reset\n" +
           "📧 Check your email for verification links\n" +
           "✅ Ensure your account is verified\n\n" +
           "What account issue are you experiencing?";
  }

  if (category === 'business_setup' || lowerMessage.includes('menu') || lowerMessage.includes('hours')) {
    return "For business setup:\n\n" +
           "📝 Update menu items in Menu Management\n" +
           "🕒 Set store hours in Business Settings\n" +
           "📍 Verify your location for accurate delivery\n\n" +
           "Which setup area needs help?";
  }

  // Generic English fallback
  return "I understand you need assistance. Let me help you with that!\n\n" +
         "Could you provide more details about your issue? " +
         "Or would you like me to connect you with a human support agent?";
}

/**
 * Health check endpoint
 * GET /api/whizzme/health
 */
function healthCheck(req, res) {
  res.json({
    status: 'healthy',
    service: 'WhizzMe Chat API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}

module.exports = {
  handleWhizzMeChat,
  healthCheck
};
