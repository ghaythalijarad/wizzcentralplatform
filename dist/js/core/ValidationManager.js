// Security & Validation Manager (Security Phase)
// Goal: Add message validation, sanitization, and security hardening
(function (global) {
  class ValidationManager {
    constructor() {
      this.maxMessageLength = 2000;
      this.maxSubjectLength = 200;
      this.maxDescriptionLength = 5000;
      this.allowedTags = ['b', 'i', 'u', 'br', 'p', 'a'];
      this.blockedPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:(?!image\/(png|jpg|jpeg|gif|svg))/gi
      ];
    }

    // Message Validation
    validateChatMessage(message) {
      const errors = [];

      if (!message || typeof message !== 'object') {
        errors.push('Invalid message format');
        return { valid: false, errors };
      }

      // Required fields
      if (!message.messageText || typeof message.messageText !== 'string') {
        errors.push('Message text is required');
      } else {
        // Length validation
        if (message.messageText.length > this.maxMessageLength) {
          errors.push(`Message too long (max ${this.maxMessageLength} characters)`);
        }

        // Content validation
        if (this._containsBlockedContent(message.messageText)) {
          errors.push('Message contains prohibited content');
        }
      }

      // Sender validation
      if (!message.senderType || !['user', 'agent', 'system'].includes(message.senderType)) {
        errors.push('Invalid sender type');
      }

      if (!message.senderName || typeof message.senderName !== 'string' || message.senderName.trim().length === 0) {
        errors.push('Sender name is required');
      }

      // Session validation
      if (!message.sessionId || typeof message.sessionId !== 'string') {
        errors.push('Session ID is required');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    // Ticket Validation
    validateTicket(ticket) {
      const errors = [];

      if (!ticket || typeof ticket !== 'object') {
        errors.push('Invalid ticket format');
        return { valid: false, errors };
      }

      // Subject validation
      if (!ticket.subject || typeof ticket.subject !== 'string') {
        errors.push('Subject is required');
      } else if (ticket.subject.length > this.maxSubjectLength) {
        errors.push(`Subject too long (max ${this.maxSubjectLength} characters)`);
      }

      // Customer validation
      if (!ticket.customer || typeof ticket.customer !== 'object') {
        errors.push('Customer information is required');
      } else {
        if (!ticket.customer.email || !this._isValidEmail(ticket.customer.email)) {
          errors.push('Valid customer email is required');
        }
        if (!ticket.customer.name || typeof ticket.customer.name !== 'string') {
          errors.push('Customer name is required');
        }
      }

      // Description validation
      if (ticket.description && ticket.description.length > this.maxDescriptionLength) {
        errors.push(`Description too long (max ${this.maxDescriptionLength} characters)`);
      }

      // Priority validation
      if (ticket.priority && !['low', 'medium', 'high', 'urgent'].includes(ticket.priority)) {
        errors.push('Invalid priority level');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    // Sanitization
    sanitizeHTML(input) {
      if (!input || typeof input !== 'string') return '';

      // Remove blocked patterns
      let cleaned = input;
      this.blockedPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });

      // Create temporary element for parsing
      const temp = document.createElement('div');
      temp.innerHTML = cleaned;

      // Remove disallowed tags
      const walker = document.createTreeWalker(
        temp,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            return this.allowedTags.includes(node.tagName.toLowerCase())
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const nodesToRemove = [];
      let node;
      while (node = walker.nextNode()) {
        // Remove event handlers and dangerous attributes
        Array.from(node.attributes).forEach(attr => {
          if (attr.name.startsWith('on') ||
            attr.name === 'style' ||
            attr.name === 'class' ||
            (attr.name === 'href' && !this._isValidURL(attr.value))) {
            node.removeAttribute(attr.name);
          }
        });
      }

      // Remove rejected nodes
      temp.querySelectorAll('*').forEach(el => {
        if (!this.allowedTags.includes(el.tagName.toLowerCase())) {
          el.remove();
        }
      });

      return temp.innerHTML;
    }

    sanitizeChatMessage(message) {
      if (!message || typeof message !== 'object') return null;

      return {
        ...message,
        messageText: this.sanitizeHTML(message.messageText),
        senderName: this._sanitizeText(message.senderName),
        sessionId: this._sanitizeID(message.sessionId),
        timestamp: message.timestamp || new Date().toISOString()
      };
    }

    sanitizeTicket(ticket) {
      if (!ticket || typeof ticket !== 'object') return null;

      return {
        ...ticket,
        subject: this._sanitizeText(ticket.subject),
        description: this.sanitizeHTML(ticket.description),
        customer: {
          ...ticket.customer,
          name: this._sanitizeText(ticket.customer?.name),
          email: this._sanitizeEmail(ticket.customer?.email)
        }
      };
    }

    // Rate Limiting
    createRateLimiter(maxRequests = 10, windowMs = 60000) {
      const requests = new Map();

      return {
        check: (identifier) => {
          const now = Date.now();
          const windowStart = now - windowMs;

          // Clean old entries
          for (const [id, timestamps] of requests.entries()) {
            requests.set(id, timestamps.filter(ts => ts > windowStart));
            if (requests.get(id).length === 0) {
              requests.delete(id);
            }
          }

          // Check current identifier
          const userRequests = requests.get(identifier) || [];
          if (userRequests.length >= maxRequests) {
            return { allowed: false, resetTime: Math.min(...userRequests) + windowMs };
          }

          // Add new request
          userRequests.push(now);
          requests.set(identifier, userRequests);

          return { allowed: true, remaining: maxRequests - userRequests.length };
        }
      };
    }

    // Private Helper Methods
    _containsBlockedContent(text) {
      return this.blockedPatterns.some(pattern => pattern.test(text));
    }

    _isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    _isValidURL(url) {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }

    _sanitizeText(text) {
      if (!text || typeof text !== 'string') return '';
      return text.replace(/[<>'"&]/g, (char) => {
        const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
        return map[char];
      }).trim();
    }

    _sanitizeID(id) {
      if (!id || typeof id !== 'string') return '';
      return id.replace(/[^a-zA-Z0-9_-]/g, '').trim();
    }

    _sanitizeEmail(email) {
      if (!email || typeof email !== 'string') return '';
      const cleaned = email.toLowerCase().trim();
      return this._isValidEmail(cleaned) ? cleaned : '';
    }

    // Security Headers Check
    checkSecurityHeaders() {
      const headers = {
        'Content-Security-Policy': 'CSP header missing',
        'X-Frame-Options': 'X-Frame-Options header missing',
        'X-Content-Type-Options': 'X-Content-Type-Options header missing',
        'Referrer-Policy': 'Referrer-Policy header missing'
      };

      // Note: In a real application, you'd check response headers
      // This is a placeholder for security audit functionality
      console.warn('Security headers should be checked server-side');
      return headers;
    }
  }

  global.ValidationManager = new ValidationManager();
  console.log('[ValidationManager] Security validation system initialized');
})(window);
