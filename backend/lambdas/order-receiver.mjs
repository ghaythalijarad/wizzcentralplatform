import { ORDER_STATUSES, ARABIC_ORDER_STATUSES } from '../services/order-management/order-status-constants.mjs';

// ...existing code...
const orderData = {
    // ...
    status: ORDER_STATUSES.PENDING,
    statusHistory: [{
        status: ORDER_STATUSES.PENDING,
        timestamp: new Date().toISOString(),
        notes: "Order received by system.",
    }],
    // ...
};

// ...
const notificationPayload = {
    ...orderData,
    status: ORDER_STATUSES.PENDING,
    statusTranslation: ARABIC_ORDER_STATUSES[ORDER_STATUSES.PENDING],
    message: "You have a new order!",
    message_ar: "لديك طلب جديد!",
};

await webSocketService.notifyBusiness(businessId, notificationPayload);
// ...existing code...