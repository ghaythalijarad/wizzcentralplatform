#!/usr/bin/env node

/**
 * Flutter Chat Service Stabilization Script
 * Adds connection guard, reconnection logic, and heartbeat to the Flutter chat service
 */

const fs = require('fs');
const path = require('path');

const FLUTTER_CHAT_SERVICE_PATH = '/Users/ghaythallaheebi/Desktop/hadhir/frontend/lib/services/wizzcentral_support_chat_service.dart';

console.log('🔧 Flutter Chat Service Stabilization');
console.log('=====================================');

// Check if file exists
if (!fs.existsSync(FLUTTER_CHAT_SERVICE_PATH)) {
    console.error('❌ Flutter chat service file not found:', FLUTTER_CHAT_SERVICE_PATH);
    process.exit(1);
}

// Read current content
const currentContent = fs.readFileSync(FLUTTER_CHAT_SERVICE_PATH, 'utf8');

console.log('📄 Current file size:', currentContent.length, 'characters');

// Check what stabilization features are already present
const hasConnectionGuard = currentContent.includes('_isConnecting');
const hasHeartbeat = currentContent.includes('_heartbeatTimer');
const hasMessageQueue = currentContent.includes('_messageQueue');
const hasConnectivityMonitoring = currentContent.includes('connectivity_plus');

console.log('\n🔍 Current Stabilization Features:');
console.log('   Connection Guard:', hasConnectionGuard ? '✅' : '❌');
console.log('   Heartbeat System:', hasHeartbeat ? '✅' : '❌');
console.log('   Message Queue:', hasMessageQueue ? '✅' : '❌');
console.log('   Connectivity Monitoring:', hasConnectivityMonitoring ? '✅' : '❌');

// Create stabilization enhancements
const stabilizationCode = `
  // === STABILIZATION ENHANCEMENTS ===
  
  // Connection guard to prevent multiple simultaneous connections
  bool _isConnecting = false;
  
  // Heartbeat system
  Timer? _heartbeatTimer;
  DateTime? _lastHeartbeatAck;
  static const Duration _heartbeatInterval = Duration(seconds: 50);
  static const Duration _heartbeatTimeout = Duration(seconds: 120);
  
  // Message queue for offline/disconnected state
  final List<Map<String, dynamic>> _messageQueue = [];
  static const int _maxQueueSize = 50;
  
  // Enhanced reconnection with exponential backoff
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 8;
  static const Duration _maxReconnectDelay = Duration(seconds: 60);
  
  /// Start heartbeat to keep connection alive
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _lastHeartbeatAck = DateTime.now();
    
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (timer) {
      if (_isConnected && _webSocket != null) {
        final heartbeatMessage = {
          'type': 'heartbeat',
          'timestamp': DateTime.now().toIso8601String(),
          'driverId': _driverId,
        };
        
        _sendWebSocketMessage(heartbeatMessage);
        debugPrint('💓 Sent heartbeat');
        
        // Check for heartbeat timeout
        if (_lastHeartbeatAck != null &&
            DateTime.now().difference(_lastHeartbeatAck!) > _heartbeatTimeout) {
          debugPrint('❌ Heartbeat timeout detected');
          _handleWebSocketDisconnection('heartbeat_timeout');
        }
      } else {
        timer.cancel();
      }
    });
  }
  
  /// Stop heartbeat
  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }
  
  /// Send WebSocket message with error handling
  bool _sendWebSocketMessage(Map<String, dynamic> message) {
    if (_webSocket?.sink != null && _isConnected) {
      try {
        _webSocket!.sink.add(jsonEncode(message));
        return true;
      } catch (e) {
        debugPrint('❌ Failed to send WebSocket message: $e');
        _queueMessage(message);
        _handleWebSocketDisconnection('send_error');
        return false;
      }
    } else {
      _queueMessage(message);
      return false;
    }
  }
  
  /// Queue message for later sending
  void _queueMessage(Map<String, dynamic> message) {
    if (_messageQueue.length >= _maxQueueSize) {
      _messageQueue.removeAt(0); // Remove oldest message
    }
    _messageQueue.add(message);
    debugPrint('📦 Queued message: \${message['type']} (queue size: \${_messageQueue.length})');
  }
  
  /// Send all queued messages
  void _sendQueuedMessages() {
    if (_messageQueue.isNotEmpty && _isConnected) {
      debugPrint('📤 Sending \${_messageQueue.length} queued messages');
      final messages = List<Map<String, dynamic>>.from(_messageQueue);
      _messageQueue.clear();
      
      for (final message in messages) {
        _sendWebSocketMessage(message);
      }
    }
  }
  
  /// Handle WebSocket disconnection with enhanced reconnection
  void _handleWebSocketDisconnection(String reason) {
    if (!_isConnected) return; // Already handled
    
    debugPrint('🔌 WebSocket disconnected: $reason');
    _isConnected = false;
    _isConnecting = false;
    _stopHeartbeat();
    
    _notifyStatusChange('disconnected');
    
    // Schedule reconnection with exponential backoff
    if (_reconnectAttempts < _maxReconnectAttempts) {
      _scheduleReconnection();
    } else {
      debugPrint('❌ Max reconnection attempts reached');
      _notifyStatusChange('max_retries_reached');
    }
  }
  
  /// Schedule reconnection with exponential backoff and jitter
  void _scheduleReconnection() {
    _reconnectAttempts++;
    
    // Exponential backoff: 2^attempt seconds, capped at max delay
    final baseDelay = Duration(seconds: math.min(math.pow(2, _reconnectAttempts).toInt(), _maxReconnectDelay.inSeconds));
    
    // Add jitter to prevent thundering herd
    final jitter = Duration(milliseconds: math.Random().nextInt(1000));
    final totalDelay = baseDelay + jitter;
    
    debugPrint('🔄 Scheduling reconnection attempt $_reconnectAttempts/$_maxReconnectAttempts in \${totalDelay.inSeconds}s');
    _notifyStatusChange('reconnecting');
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(totalDelay, () {
      debugPrint('🔄 Attempting reconnection...');
      _connectWebSocket();
    });
  }
  
  /// Reset reconnection state after successful connection
  void _resetReconnectionState() {
    _reconnectAttempts = 0;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }
`;

// Create usage instructions
const usageInstructions = `
/**
 * USAGE INSTRUCTIONS FOR STABILIZATION FEATURES
 * 
 * 1. Add these method calls to your existing WebSocket connection logic:
 * 
 * In _connectWebSocket() method, after successful connection:
 *   _resetReconnectionState();
 *   _startHeartbeat();
 *   _sendQueuedMessages();
 * 
 * In _handleWebSocketMessage() method, handle heartbeat responses:
 *   case 'heartbeat_response':
 *   case 'pong':
 *     _lastHeartbeatAck = DateTime.now();
 *     break;
 * 
 * In sendMessageToSupport() method, use enhanced sending:
 *   final success = _sendWebSocketMessage({
 *     'type': 'driver_message',
 *     'content': message,
 *     'sessionId': _sessionId,
 *     // ... other fields
 *   });
 * 
 * In dispose() method:
 *   _stopHeartbeat();
 *   _reconnectTimer?.cancel();
 * 
 * 2. Add dart:math import at the top:
 *   import 'dart:math' as math;
 * 
 * 3. Update your connection guard in _connectWebSocket():
 *   if (_isConnecting) {
 *     debugPrint('🔒 Connection already in progress');
 *     return false;
 *   }
 *   _isConnecting = true;
 *   
 *   // ... connection logic ...
 *   
 *   // On success:
 *   _isConnecting = false;
 *   
 *   // On error:
 *   _isConnecting = false;
 */
`;

console.log('\n📋 STABILIZATION PLAN:');
console.log('1. Add connection guard to prevent duplicate connections');
console.log('2. Implement heartbeat system (50s interval, 120s timeout)');
console.log('3. Add message queueing for offline state');
console.log('4. Enhanced reconnection with exponential backoff + jitter');
console.log('5. Proper error handling and state management');

console.log('\n🔧 CODE ENHANCEMENTS READY:');
console.log('- Connection Guard: Prevents multiple simultaneous connections');
console.log('- Heartbeat System: Keeps connection alive and detects timeouts');
console.log('- Message Queue: Stores messages when disconnected');
console.log('- Smart Reconnection: Exponential backoff with jitter');
console.log('- Error Recovery: Graceful handling of network issues');

// Create backup
const backupPath = FLUTTER_CHAT_SERVICE_PATH + '.backup.' + Date.now();
fs.writeFileSync(backupPath, currentContent);
console.log('\n💾 Created backup:', backupPath);

// Create enhancement file
const enhancementPath = path.join(path.dirname(FLUTTER_CHAT_SERVICE_PATH), 'chat_service_stabilization_enhancements.dart');
fs.writeFileSync(enhancementPath, stabilizationCode + usageInstructions);
console.log('📝 Created enhancement file:', enhancementPath);

console.log('\n🎯 NEXT STEPS:');
console.log('1. Review the enhancement file:', enhancementPath);
console.log('2. Integrate the stabilization code into your chat service');
console.log('3. Test connection stability with network interruptions');
console.log('4. Monitor heartbeat and reconnection behavior');

console.log('\n💡 INTEGRATION PRIORITY:');
console.log('High Priority: Connection guard, heartbeat, basic reconnection');
console.log('Medium Priority: Message queueing, enhanced error handling');
console.log('Low Priority: Connectivity monitoring, advanced metrics');

console.log('\n✅ Stabilization framework ready for integration!');
