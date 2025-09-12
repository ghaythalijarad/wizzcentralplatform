// Sample data setup for support system
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
    region: 'us-east-1',
    endpoint: 'http://localhost:8000', // Local DynamoDB
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});
const dynamoDB = DynamoDBDocumentClient.from(client);

// Sample tickets
const sampleTickets = [
    {
        ticketId: 'TKT001',
        subject: 'Unable to receive delivery notifications',
        description: 'Driver is not receiving push notifications for new delivery assignments',
        customerEmail: 'ahmed.driver@wizzdelivery.com',
        customerName: 'Ahmed Al-Rashid',
        priority: 'high',
        status: 'open',
        category: 'app',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        ticketId: 'TKT002',
        subject: 'Payment issue with weekly earnings',
        description: 'Weekly payment did not arrive as expected, showing pending status for 3 days',
        customerEmail: 'sara.driver@wizzdelivery.com',
        customerName: 'Sara Al-Mahmoud',
        priority: 'medium',
        status: 'in-progress',
        category: 'payment',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString()
    },
    {
        ticketId: 'TKT003',
        subject: 'GPS tracking inaccurate',
        description: 'The GPS in the driver app shows incorrect location, affecting delivery route optimization',
        customerEmail: 'mohammed.driver@wizzdelivery.com',
        customerName: 'Mohammed Al-Kaabi',
        priority: 'low',
        status: 'resolved',
        category: 'delivery',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
];

// Sample FAQs
const sampleFAQs = [
    {
        faqId: 'FAQ001',
        question: 'How do I update my delivery availability status?',
        answer: 'You can update your availability status by going to the main dashboard and toggling the "Available for Deliveries" switch. When you\'re available, you\'ll receive delivery requests in your area.',
        category: 'app',
        views: 156,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        faqId: 'FAQ002',
        question: 'When will I receive my weekly payment?',
        answer: 'Weekly payments are processed every Monday for the previous week (Sunday to Saturday). Payments typically arrive within 1-2 business days after processing, depending on your bank.',
        category: 'payment',
        views: 89,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        faqId: 'FAQ003',
        question: 'What should I do if a customer is not available for delivery?',
        answer: 'If a customer is not available, wait at the delivery location for 5 minutes. Then, call the customer using the in-app phone feature. If still no response, mark the delivery as "Customer Not Available" and follow the return procedure.',
        category: 'delivery',
        views: 234,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Sample Knowledge Base Articles
const sampleArticles = [
    {
        articleId: 'KB001',
        title: 'Driver App Complete User Guide',
        description: 'Comprehensive guide covering all features of the WizzCentral driver mobile application',
        content: 'This guide covers login procedures, accepting deliveries, navigation features, payment tracking, and troubleshooting common issues.',
        category: 'user-guide',
        views: 445,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        articleId: 'KB002',
        title: 'Payment and Earnings Troubleshooting',
        description: 'Solutions for common payment-related issues and how to track your earnings',
        content: 'Learn how to track your daily and weekly earnings, understand payment schedules, resolve payment delays, and contact support for payment issues.',
        category: 'payment',
        views: 289,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        articleId: 'KB003',
        title: 'Delivery Best Practices',
        description: 'Guidelines for efficient and professional delivery service',
        content: 'Best practices include: confirming delivery address, communicating with customers, handling special instructions, maintaining vehicle cleanliness, and providing excellent customer service.',
        category: 'delivery',
        views: 312,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

async function insertSampleData() {
    try {
        console.log('Inserting sample support data...');

        // Insert sample tickets
        for (const ticket of sampleTickets) {
            await dynamoDB.send(new PutCommand({
                TableName: 'wizzcentral-support-tickets-dev',
                Item: ticket
            }));
            console.log(`Inserted ticket: ${ticket.ticketId}`);
        }

        // Insert sample FAQs
        for (const faq of sampleFAQs) {
            await dynamoDB.send(new PutCommand({
                TableName: 'wizzcentral-support-faqs-dev',
                Item: faq
            }));
            console.log(`Inserted FAQ: ${faq.faqId}`);
        }

        // Insert sample articles
        for (const article of sampleArticles) {
            await dynamoDB.send(new PutCommand({
                TableName: 'wizzcentral-support-knowledge-base-dev',
                Item: article
            }));
            console.log(`Inserted article: ${article.articleId}`);
        }

        console.log('Sample data insertion completed successfully!');
    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

// Run if called directly
if (require.main === module) {
    insertSampleData();
}

module.exports = { insertSampleData };
