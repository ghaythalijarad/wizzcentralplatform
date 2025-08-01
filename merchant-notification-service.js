// Simple notification service for instant merchant app updates
// Add this to your existing generate test order functionality

// Enhanced generateTestOrder with notification
async function generateTestOrderWithNotification() {
    showLoader(true, 'Generating test order...');
    
    try {
        // Generate order (existing logic)
        const orderId = `ORD_${Date.now()}`;
        const orderData = {
            // ... your existing order data structure
        };
        
        // Send to merchant backend
        const response = await fetch(`${MERCHANT_API}/webhooks/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            // NEW: Trigger immediate notification to merchant app
            await triggerMerchantAppNotification(orderData);
            
            // Update local UI (existing logic)
            updateLocalOrdersDisplay(orderData);
            
            showMessage(`✅ Test order sent with instant notification!`, 'success');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(`❌ Failed: ${error.message}`, 'error');
    } finally {
        showLoader(false);
    }
}

// Function to trigger instant notification to merchant app
async function triggerMerchantAppNotification(orderData) {
    try {
        // Method 1: Send push notification via FCM (if implemented)
        await sendFCMPushNotification(orderData);
        
        // Method 2: Create a notification record in database for polling
        await createNotificationRecord(orderData);
        
        // Method 3: Use WebSocket if connected
        await sendWebSocketNotification(orderData);
        
    } catch (error) {
        console.error('Notification failed:', error);
        // Don't fail the main order process if notifications fail
    }
}

// Send FCM push notification
async function sendFCMPushNotification(orderData) {
    try {
        const fcmPayload = {
            businessId: orderData.businessId,
            notification: {
                title: '🆕 New Order!',
                body: `Order from ${orderData.customerName} - $${orderData.totalAmount}`,
                sound: 'order_notification.mp3',
                badge: 1
            },
            data: {
                type: 'new_order',
                orderId: orderData.orderId,
                orderData: JSON.stringify(orderData)
            }
        };
        
        const response = await fetch(`${CENTRAL_API}/api/send-fcm-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify(fcmPayload)
        });
        
        if (response.ok) {
            console.log('✅ FCM notification sent');
        }
    } catch (error) {
        console.error('FCM notification error:', error);
    }
}

// Create notification record for polling
async function createNotificationRecord(orderData) {
    try {
        const notification = {
            notificationId: `merchant_${orderData.businessId}_${Date.now()}`,
            businessId: orderData.businessId,
            type: 'new_order',
            title: 'New Order',
            message: `Order from ${orderData.customerName}`,
            orderData: orderData,
            read: false,
            priority: 'high',
            sound: true,
            createdAt: new Date().toISOString()
        };
        
        const response = await fetch(`${CENTRAL_API}/api/merchant-notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify(notification)
        });
        
        if (response.ok) {
            console.log('✅ Notification record created');
        }
    } catch (error) {
        console.error('Notification record error:', error);
    }
}

// Send WebSocket notification if connection exists
async function sendWebSocketNotification(orderData) {
    // This would require WebSocket implementation
    console.log('WebSocket notification would be sent here');
}
