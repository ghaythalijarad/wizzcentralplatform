import {
    ORDER_STATUSES,
    ALLOWED_STATUS_TRANSITIONS,
    ARABIC_ORDER_STATUSES,
    ENGLISH_ORDER_STATUSES
} from './order-status-constants.mjs';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDb = new DynamoDBClient();
const sns = new SNSClient();

export const handler = async (event) => {
    const { orderId, newStatus, merchantId } = JSON.parse(event.body);

    if (!orderId || !newStatus || !merchantId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields: orderId, newStatus, merchantId" }),
        };
    }

    if (!Object.values(ORDER_STATUSES).includes(newStatus)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `Invalid status: ${newStatus}` }),
        };
    }

    const getOrderParams = {
        TableName: process.env.ORDER_TABLE,
        Key: {
            pk: `ORDER#${orderId}`,
            sk: `ORDER#${orderId}`,
        },
    };

    const order = await dynamoDb.send(new GetCommand(getOrderParams));
    if (!order.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: `Order not found: ${orderId}` }),
        };
    }

    const currentStatus = order.Item.status;

    if (!ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: `Invalid status transition from ${currentStatus} to ${newStatus}.`,
                currentStatus,
                newStatus,
                allowedNextStatuses: ALLOWED_STATUS_TRANSITIONS[currentStatus]
            }),
        };
    }

    const updateParams = {
        TableName: process.env.ORDER_TABLE,
        Key: {
            pk: `ORDER#${orderId}`,
            sk: `ORDER#${orderId}`,
        },
        UpdateExpression: "SET #s = :s, updatedAt = :ua, merchantId = :mid",
        ExpressionAttributeNames: {
            "#s": "status",
        },
        ExpressionAttributeValues: {
            ":s": newStatus,
            ":ua": new Date().toISOString(),
            ":mid": merchantId,
        },
    };

    await dynamoDb.send(new UpdateCommand(updateParams));

    const notificationPayload = {
        orderId,
        businessId: order.Item.businessId,
        newStatus,
        statusTranslations: {
            ar: ARABIC_ORDER_STATUSES[newStatus],
            en: ENGLISH_ORDER_STATUSES[newStatus],
        },
        updatedAt: new Date().toISOString(),
    };

    await sns.send(new PublishCommand({
        TopicArn: process.env.ORDER_STATUS_UPDATE_TOPIC_ARN,
        Message: JSON.stringify(notificationPayload),
    }));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Order status updated successfully." }),
    };
};