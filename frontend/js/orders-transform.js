// Orders Data Transformation and Status Logic for WizzOrders Table

/**
 * Determine order status based on timeline fields
 * @param {Object} order - Order object from WizzOrders table
 * @returns {string} - Status string (delivered, cancelled, out_for_delivery, etc.)
 */
function determineOrderStatus(order) {
    // Check in priority order
    if (order.deliveredAt) return 'delivered';
    if (order.canceledAt) return 'cancelled';
    if (order.assignedAt && order.collectorId) return 'out_for_delivery';
    if (order.assignedAt) return 'ready_for_pickup';
    if (order.confirmedAt) return 'preparing';
    if (order.createdAt) return 'pending';
    return 'unknown';
}

/**
 * Get payment status from order
 * @param {Object} order - Order object from WizzOrders table
 * @returns {Object} - Payment status info
 */
function getPaymentStatus(order) {
    if (order.codCollectedAt) {
        return {
            type: 'COD',
            status: 'collected',
            badge: 'payment-cod',
            text: 'COD ✓'
        };
    }
    if (order.capturedAt) {
        return {
            type: order.currency || 'IQD',
            status: 'captured',
            badge: 'payment-captured',
            text: `${order.currency} ✓`
        };
    }
    if (order.authorizedAt) {
        return {
            type: order.currency || 'IQD',
            status: 'authorized',
            badge: 'payment-authorized',
            text: `${order.currency} ⏳`
        };
    }
    return {
        type: order.currency || 'IQD',
        status: 'pending',
        badge: 'payment-pending',
        text: order.currency || 'IQD'
    };
}

/**
 * Format channel with icon
 * @param {string} channel - Channel name (android, ios, web)
 * @returns {string} - HTML for channel badge
 */
function formatChannelBadge(channel) {
    const icons = {
        'android': '🤖',
        'ios': '🍎',
        'web': '🌐'
    };
    const icon = icons[channel?.toLowerCase()] || '📱';
    const channelClass = `channel-${channel?.toLowerCase() || 'unknown'}`;
    return `<span class="channel-badge ${channelClass}">${icon} ${channel || 'Unknown'}</span>`;
}

/**
 * Format driver info
 * @param {string} collectorId - Driver/collector ID
 * @param {string} assignedAt - Assignment timestamp
 * @returns {string} - HTML for driver badge
 */
function formatDriverBadge(collectorId, assignedAt) {
    if (collectorId) {
        const shortId = collectorId.substring(0, 8);
        return `<span class="driver-badge" title="Assigned: ${formatDateTime(assignedAt)}">${shortId}</span>`;
    }
    return `<span class="driver-unassigned">Unassigned</span>`;
}

/**
 * Format date and time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted date/time string
 */
function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return timestamp;
    }
}

/**
 * Extract order ID from PK (ORDER#uuid format)
 * @param {string} pk - Primary key from DynamoDB
 * @returns {string} - Clean order ID
 */
function extractOrderId(pk) {
    if (!pk) return 'N/A';
    // Extract UUID from ORDER#uuid format
    const match = pk.match(/ORDER#(.+)/);
    return match ? match[1].substring(0, 8) : pk.substring(0, 8);
}

/**
 * Transform WizzOrders item to display format
 * @param {Object} item - Raw item from WizzOrders DynamoDB table
 * @returns {Object} - Transformed order object
 */
function transformWizzOrder(item) {
    const orderId = extractOrderId(item.PK);
    const status = determineOrderStatus(item);
    const payment = getPaymentStatus(item);
    
    return {
        orderId: orderId,
        fullOrderId: item.PK,
        customerName: item.customerName || 'N/A',
        customerPhone: item.customerPhone || 'N/A',
        channel: item.channel || 'unknown',
        status: status,
        collectorId: item.collectorId,
        createdAt: item.createdAt,
        confirmedAt: item.confirmedAt,
        assignedAt: item.assignedAt,
        deliveredAt: item.deliveredAt,
        canceledAt: item.canceledAt,
        canceledBy: item.canceledBy,
        cancelReason: item.cancelReason,
        currency: item.currency || 'IQD',
        payment: payment,
        createdBy: item.createdBy || 'N/A',
        fullData: item // Keep full data for detail view
    };
}

// Export functions for use in orders.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        determineOrderStatus,
        getPaymentStatus,
        formatChannelBadge,
        formatDriverBadge,
        formatDateTime,
        extractOrderId,
        transformWizzOrder
    };
}
