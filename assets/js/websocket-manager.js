/**
 * WebSocket Real-Time Integration for Central Platform
 * Connects to AWS API Gateway WebSocket API for real-time notifications
 */

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.businessId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.pingInterval = null;
        this.isConnected = false;
        this.listeners = {};
    }

    /**
     * Initialize WebSocket connection
     */
    async connect(businessId) {
        if (!businessId) {
            console.error('❌ Business ID is required for WebSocket connection');
            return false;
        }

        this.businessId = businessId;
        
        try {
            // Get WebSocket URL from configuration
            const wsUrl = this.getWebSocketUrl();
            console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
            
            this.ws = new WebSocket(wsUrl);
            this.setupEventHandlers();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('WebSocket connection timeout'));
                }, 10000);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    this.onConnected();
                    resolve(true);
                };

                this.ws.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('WebSocket connection error:', error);
                    reject(error);
                };
            });

        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            return false;
        }
    }

    /**
     * Get WebSocket URL from environment
     */
    getWebSocketUrl() {
        // In production, this would come from your environment configuration
        const wsEndpoint = window.CONFIG?.WEBSOCKET_URL || 'wss://your-websocket-api.execute-api.us-east-1.amazonaws.com/dev';
        return `${wsEndpoint}?businessId=${this.businessId}&userType=central-platform`;
    }

    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        this.ws.onopen = () => this.onConnected();
        this.ws.onclose = (event) => this.onDisconnected(event);
        this.ws.onerror = (error) => this.onError(error);
        this.ws.onmessage = (event) => this.onMessage(event);
    }

    /**
     * Handle WebSocket connection opened
     */
    onConnected() {
        console.log('✅ WebSocket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Start ping/pong to keep connection alive
        this.startPing();
        
        // Emit connection event
        this.emit('connected', { businessId: this.businessId });
        
        // Update UI connection status
        this.updateConnectionStatus('Connected', 'success');
    }

    /**
     * Handle WebSocket connection closed
     */
    onDisconnected(event) {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.stopPing();
        
        // Update UI connection status
        this.updateConnectionStatus('Disconnected', 'error');
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
        
        this.emit('disconnected', { code: event.code, reason: event.reason });
    }

    /**
     * Handle WebSocket errors
     */
    onError(error) {
        console.error('❌ WebSocket error:', error);
        this.updateConnectionStatus('Error', 'error');
        this.emit('error', error);
    }

    /**
     * Handle incoming WebSocket messages
     */
    onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            
            // Handle different message types
            switch (message.type) {
                case 'connection_established':
                    console.log('🎉 Connection established:', message.message);
                    break;
                    
                case 'new_order':
                    this.handleNewOrder(message);
                    break;
                    
                case 'order_status_update':
                    this.handleOrderStatusUpdate(message);
                    break;
                    
                case 'test_notification':
                    this.handleTestNotification(message);
                    break;
                    
                case 'ping_response':
                    console.log('🏓 Ping response received');
                    break;
                    
                default:
                    console.log('📨 Unknown message type:', message.type);
            }
            
            // Emit message event for custom handlers
            this.emit('message', message);
            
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Handle new order notifications
     */
    handleNewOrder(message) {
        console.log('🆕 New order notification:', message.order);
        
        // Show browser notification if permission granted
        this.showBrowserNotification(
            'New Order Received!',
            `Order ${message.orderId} from ${message.order.customerName}`,
            'new-order'
        );
        
        // Update orders table in real-time
        if (typeof window.handleNewOrderNotification === 'function') {
            window.handleNewOrderNotification(message.order);
        }
        
        // Play notification sound
        this.playNotificationSound();
        
        this.emit('new_order', message);
    }

    /**
     * Handle order status update notifications
     */
    handleOrderStatusUpdate(message) {
        console.log('📊 Order status update:', message);
        
        // Update UI
        if (typeof window.handleOrderStatusUpdate === 'function') {
            window.handleOrderStatusUpdate(message);
        }
        
        this.emit('order_status_update', message);
    }

    /**
     * Handle test notifications
     */
    handleTestNotification(message) {
        console.log('🧪 Test notification:', message.message);
        
        this.showBrowserNotification(
            'Test Notification',
            message.message,
            'test'
        );
        
        this.emit('test_notification', message);
    }

    /**
     * Send message to WebSocket server
     */
    send(message) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        } else {
            console.error('WebSocket not connected, cannot send message');
            return false;
        }
    }

    /**
     * Start ping/pong to keep connection alive
     */
    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping', timestamp: new Date().toISOString() });
            }
        }, 30000); // Ping every 30 seconds
    }

    /**
     * Stop ping interval
     */
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect(this.businessId);
            }
        }, delay);
    }

    /**
     * Update connection status in UI
     */
    updateConnectionStatus(status, type) {
        const statusElement = document.getElementById('realtime-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status-${type}`;
        }
        
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }
    }

    /**
     * Show browser notification
     */
    async showBrowserNotification(title, body, tag) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: body,
                    tag: tag,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico'
                });
            } else if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body: body, tag: tag });
                }
            }
        }
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            // Create a simple notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Emit event to listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.stopPing();
        this.isConnected = false;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            businessId: this.businessId,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Global WebSocket manager instance
window.WebSocketManager = WebSocketManager;

// Auto-initialize for orders page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('orders.html')) {
        // Initialize WebSocket for merchant real-time notifications
        const businessId = '7ccf646c-9594-48d4-8f63-c366d89257e5'; // Your business ID
        
        window.wsManager = new WebSocketManager();
        
        // Connect to WebSocket
        window.wsManager.connect(businessId).then((connected) => {
            if (connected) {
                console.log('🎉 Real-time notifications enabled!');
            } else {
                console.warn('⚠️ Real-time notifications not available');
            }
        }).catch((error) => {
            console.error('❌ Failed to enable real-time notifications:', error);
        });
        
        // Handle new orders in the orders table
        window.handleNewOrderNotification = (order) => {
            console.log('🆕 Adding new order to table:', order);
            
            // Add to orders data if orders.js is loaded
            if (typeof window.ordersData !== 'undefined' && typeof window.renderOrdersTable === 'function') {
                const newOrderDisplay = {
                    orderId: order.orderId,
                    customerId: order.customerId,
                    merchantId: order.businessId,
                    driverId: 'N/A',
                    status: order.status || 'pending',
                    total: `$${parseFloat(order.total || 0).toFixed(2)}`,
                    date: new Date().toLocaleDateString(),
                    fullData: order
                };
                
                window.ordersData.unshift(newOrderDisplay);
                window.filteredOrders = [...window.ordersData];
                window.renderOrdersTable();
                
                // Show success message
                if (typeof window.showMessage === 'function') {
                    window.showMessage(`🆕 New order ${order.orderId} received in real-time!`, 'success');
                }
            }
        };
        
        // Handle order status updates
        window.handleOrderStatusUpdate = (update) => {
            console.log('📊 Updating order status:', update);
            
            if (typeof window.ordersData !== 'undefined' && typeof window.renderOrdersTable === 'function') {
                const orderIndex = window.ordersData.findIndex(o => o.orderId === update.orderId);
                if (orderIndex !== -1) {
                    window.ordersData[orderIndex].status = update.newStatus;
                    window.filteredOrders = [...window.ordersData];
                    window.renderOrdersTable();
                    
                    if (typeof window.showMessage === 'function') {
                        window.showMessage(`📊 Order ${update.orderId} status updated to ${update.newStatus}`, 'info');
                    }
                }
            }
        };
    }
});
