// Phase C: ChatSessionService centralizes session state, unread counters, and WebSocket management
// Goal: Abstract chat state from legacy globals; provide clean API for session management
(function (global) {
  class ChatSessionService {
    constructor() {
      this.sessions = new Map(); // sessionId -> { id, driverName, status, messages, unreadCount, lastActivity, metadata }
      this.activeSessionId = null;
      this.wsInstance = null; // will hold LiveChatSocket instance
      this.lastSyncAt = null;
      this.initialized = false;
      this.subscribers = new Set();
    }

    // Determine if a session looks like a test/mock
    _isTestSession(sessionData = {}) {
      try {
        const meta = sessionData.metadata || {};
        const id = (sessionData.sessionId || sessionData.id || '').toString().toLowerCase();
        const name = (
          sessionData.driverName ||
          sessionData.driverInfo?.driverName ||
          meta.driverName ||
          ''
        ).toString().toLowerCase();
        const flags = [sessionData.isTest, meta.isTest, meta.source === 'test', meta.source === 'mock'];
        const looksTesty = id.startsWith('test_') || name.includes('test') || name.includes('demo');
        return Boolean(flags.some(Boolean) || looksTesty);
      } catch (e) {
        return false;
      }
    }

    // Only allow sessions from WizzDriver (Flutter). If metadata exists and points elsewhere, reject.
    _isAllowedDriverSession(sessionData = {}) {
      try {
        const meta = sessionData.metadata || {};
        const platform = sessionData.platform || meta.platform || sessionData.driverInfo?.platform;
        const sourceRaw = meta.source || sessionData.source || sessionData.driverInfo?.source;
        const source = typeof sourceRaw === 'string' ? sourceRaw.toLowerCase() : null;
        const userAgent = (meta.userAgent || '').toString();
        // Positive allowlist
        const allowByPlatform = typeof platform === 'string' && platform.toLowerCase() === 'flutter';
        const allowBySource = source === 'wizzdriver' || source === 'http_api' || source === 'flutter_http_bridge';
        const allowByUA = /dart|flutter/i.test(userAgent);
        if (allowByPlatform || allowBySource || allowByUA) return true;
        // If metadata explicitly indicates a non-flutter origin (like web/test/mock), disallow
        const explicitNonFlutter = typeof platform === 'string' && platform && platform.toLowerCase() !== 'flutter';
        const explicitMock = typeof source === 'string' && /test|mock|demo/i.test(source);
        if (explicitNonFlutter || explicitMock) return false;
        // If we have no decisive metadata, default to allow
        return true;
      } catch (e) {
        return true;
      }
    }

    init() {
      if (this.initialized) return;

      // Sync with legacy globals if they exist
      if (global.liveChatSessions) {
        Object.entries(global.liveChatSessions).forEach(([id, sess]) => {
          const candidate = {
            id,
            driverName: sess.driverName || sess.driverInfo?.driverName || 'Driver',
            status: sess.status || 'waiting_for_agent',
            messages: sess.messages || [],
            unreadCount: 0,
            lastActivity: sess.lastActivity || new Date().toISOString(),
            metadata: sess
          };
          if (this._isTestSession(candidate)) return; // skip test
          if (!this._isAllowedDriverSession(candidate)) return; // skip non-WizzDriver
          this.sessions.set(id, candidate);
        });
      }

      // Sync active session
      if (global.liveChatUIState?.activeSessionId) {
        this.activeSessionId = global.liveChatUIState.activeSessionId;
      }

      // Restore from localStorage if available
      this._restoreFromStorage();

      this.initialized = true;
      this._notifySubscribers('initialized', { sessionCount: this.sessions.size });
    }

    // Session Management
    addSession(sessionData) {
      // Filter out test/mock or non-WizzDriver sessions
      if (this._isTestSession(sessionData)) { return null; }
      if (!this._isAllowedDriverSession(sessionData)) { return null; }

      const session = {
        id: sessionData.sessionId || sessionData.id,
        driverName: sessionData.driverName || sessionData.driverInfo?.driverName || 'Driver',
        status: sessionData.status || 'waiting_for_agent',
        messages: [],
        unreadCount: 0,
        lastActivity: new Date().toISOString(),
        metadata: sessionData
      };

      this.sessions.set(session.id, session);
      this._syncWithLegacyGlobals();
      this._persistToStorage();
      this._notifySubscribers('sessionAdded', { session });

      return session;
    }

    removeSession(sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.sessions.delete(sessionId);
        if (this.activeSessionId === sessionId) {
          this.activeSessionId = null;
        }
        this._syncWithLegacyGlobals();
        this._persistToStorage();
        this._notifySubscribers('sessionRemoved', { sessionId, session });
      }
    }

    updateSession(sessionId, updates) {
      const session = this.sessions.get(sessionId);
      if (session) {
        Object.assign(session, updates);
        session.lastActivity = new Date().toISOString();
        this._syncWithLegacyGlobals();
        this._persistToStorage();
        this._notifySubscribers('sessionUpdated', { sessionId, session, updates });
      }
    }

    getSession(sessionId) {
      return this.sessions.get(sessionId);
    }

    getAllSessions() {
      return Array.from(this.sessions.values());
    }

    getSessionEntries() {
      return Array.from(this.sessions.entries());
    }

    // Active Session Management
    setActiveSession(sessionId) {
      const session = this.sessions.get(sessionId);
      if (!session) return false;

      this.activeSessionId = sessionId;
      // Reset unread count for active session
      session.unreadCount = 0;

      // Request recent messages for this session
      if (this.wsInstance && this.wsInstance.connected) {
        try {
          this.wsInstance.send({ type: 'get_session_messages', sessionId, limit: 40 });
        } catch (e) { console.warn('[ChatSessionService] Failed to request session messages', e); }
      }

      this._syncWithLegacyGlobals();
      this._persistToStorage();
      this._notifySubscribers('activeSessionChanged', { sessionId, session });

      return true;
    }

    getActiveSession() {
      return this.activeSessionId ? this.sessions.get(this.activeSessionId) : null;
    }

    // Message Management
    addMessage(sessionId, message) {
      const session = this.sessions.get(sessionId);
      if (!session) return false;

      // If session becomes flagged as test or non-allowed later, stop adding messages
      if (this._isTestSession(session) || !this._isAllowedDriverSession(session)) {
        return false;
      }

      // Validate message if ValidationManager is available
      if (global.ValidationManager) {
        const validation = global.ValidationManager.validateChatMessage({
          ...message,
          sessionId,
          senderName: message.senderName || message.sender || 'Unknown',
          senderType: message.senderType || 'user',
          messageText: message.messageText || message.text || message.message || ''
        });

        if (!validation.valid) {
          console.warn('[ChatSessionService] Message validation failed:', validation.errors);
          this._notifySubscribers('messageValidationFailed', { sessionId, errors: validation.errors });
          return false;
        }
      }

      let normalizedMessage = {
        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        senderName: message.senderName || message.sender || 'Unknown',
        senderType: message.senderType || 'user',
        messageText: message.messageText || message.text || message.message || '',
        timestamp: message.timestamp || new Date().toISOString(),
        ...message
      };

      // Sanitize message if ValidationManager is available
      if (global.ValidationManager) {
        normalizedMessage = global.ValidationManager.sanitizeChatMessage(normalizedMessage);
        if (!normalizedMessage) {
          console.warn('[ChatSessionService] Message sanitization failed');
          return false;
        }
      }

      session.messages.push(normalizedMessage);
      session.lastActivity = normalizedMessage.timestamp;

      // Increment unread if not active session
      if (sessionId !== this.activeSessionId) {
        session.unreadCount++;
      }

      this._syncWithLegacyGlobals();
      this._persistToStorage();
      this._notifySubscribers('messageAdded', { sessionId, message: normalizedMessage, session });

      return normalizedMessage;
    }

    getUnreadCount(sessionId) {
      const session = this.sessions.get(sessionId);
      return session ? session.unreadCount : 0;
    }

    getTotalUnreadCount() {
      return Array.from(this.sessions.values()).reduce((sum, session) => sum + session.unreadCount, 0);
    }

    // WebSocket Integration
    setWebSocketInstance(wsInstance) {
      this.wsInstance = wsInstance;
      this._notifySubscribers('webSocketConnected', { wsInstance });
    }

    sendMessage(sessionId, messageText) {
      if (!this.wsInstance || !this.wsInstance.connected) {
        console.warn('[ChatSessionService] WebSocket not connected');
        return false;
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        console.warn('[ChatSessionService] Session not found:', sessionId);
        return false;
      }

      const message = {
        type: 'chat_message',
        sessionId,
        senderType: 'agent',
        messageText,
        timestamp: new Date().toISOString()
      };

      this.wsInstance.send(message);
      return true;
    }

    // Persistence
    _persistToStorage() {
      try {
        const state = {
          activeSessionId: this.activeSessionId,
          lastSyncAt: this.lastSyncAt,
          unreadCounts: Object.fromEntries(
            Array.from(this.sessions.entries()).map(([id, session]) => [id, session.unreadCount])
          )
        };
        localStorage.setItem('chatSessionState', JSON.stringify(state));
      } catch (e) {
        console.warn('[ChatSessionService] Failed to persist to storage:', e);
      }
    }

    _restoreFromStorage() {
      try {
        const stored = localStorage.getItem('chatSessionState');
        if (stored) {
          const state = JSON.parse(stored);
          this.activeSessionId = state.activeSessionId;
          this.lastSyncAt = state.lastSyncAt;

          // Restore unread counts
          if (state.unreadCounts) {
            Object.entries(state.unreadCounts).forEach(([sessionId, count]) => {
              const session = this.sessions.get(sessionId);
              if (session) {
                session.unreadCount = count || 0;
              }
            });
          }
        }
      } catch (e) {
        console.warn('[ChatSessionService] Failed to restore from storage:', e);
      }
    }

    // Legacy Synchronization
    _syncWithLegacyGlobals() {
      // Keep legacy globals in sync for backward compatibility
      if (!global.liveChatSessions) global.liveChatSessions = {};
      if (!global.liveChatUIState) global.liveChatUIState = {};

      // Sync sessions
      global.liveChatSessions = {};
      this.sessions.forEach((session, id) => {
        global.liveChatSessions[id] = session.metadata;
        global.liveChatSessions[id].messages = session.messages;
      });

      // Sync active session
      global.liveChatUIState.activeSessionId = this.activeSessionId;
    }

    // Event System
    subscribe(callback) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }

    _notifySubscribers(event, data) {
      this.subscribers.forEach(callback => {
        try {
          callback(event, data);
        } catch (e) {
          console.warn('[ChatSessionService] Subscriber error:', e);
        }
      });

      // Also emit via EventBus if available
      if (global.EventBus) {
        global.EventBus.emit(`chatSession.${event}`, data);
      }
    }

    // Utility Methods
    getSessionCount() {
      return this.sessions.size;
    }

    getSessionsByStatus(status) {
      return Array.from(this.sessions.values()).filter(session => session.status === status);
    }

    updateLastSyncTimestamp() {
      this.lastSyncAt = new Date().toISOString();
      this._persistToStorage();
    }

    // Debug/Development
    dumpState() {
      return {
        sessionCount: this.sessions.size,
        activeSessionId: this.activeSessionId,
        sessions: Object.fromEntries(this.sessions),
        totalUnread: this.getTotalUnreadCount(),
        lastSyncAt: this.lastSyncAt
      };
    }
  }

  global.ChatSessionService = new ChatSessionService();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => global.ChatSessionService.init());
  } else {
    global.ChatSessionService.init();
  }
})(window);
