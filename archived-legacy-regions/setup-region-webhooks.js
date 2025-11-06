// Setup SNS Topic for Region Status Change Notifications
// Phase 6: Webhook infrastructure setup

const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'us-east-1' });

const TOPIC_NAME = 'WizzCentral-Region-Updates';

/**
 * Create SNS Topic for region updates
 */
async function createSNSTopic() {
    console.log('📢 Creating SNS topic for region updates...');
    
    try {
        // Create topic
        const topicResult = await sns.createTopic({
            Name: TOPIC_NAME,
            Attributes: {
                DisplayName: 'WizzCentral Region Status Updates',
                FifoTopic: 'false'
            },
            Tags: [
                {
                    Key: 'Service',
                    Value: 'WizzCentral'
                },
                {
                    Key: 'Purpose',
                    Value: 'Region Status Notifications'
                }
            ]
        }).promise();
        
        const topicArn = topicResult.TopicArn;
        console.log('✅ SNS Topic created:', topicArn);
        
        // Set topic policy to allow Lambda to publish
        await sns.setTopicAttributes({
            TopicArn: topicArn,
            AttributeName: 'Policy',
            AttributeValue: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com'
                        },
                        Action: 'SNS:Publish',
                        Resource: topicArn
                    }
                ]
            })
        }).promise();
        
        console.log('✅ Topic policy configured');
        
        return topicArn;
        
    } catch (error) {
        if (error.code === 'TopicAlreadyExists') {
            // Get existing topic ARN
            const topics = await sns.listTopics().promise();
            const existingTopic = topics.Topics.find(t => t.TopicArn.includes(TOPIC_NAME));
            if (existingTopic) {
                console.log('ℹ️  Topic already exists:', existingTopic.TopicArn);
                return existingTopic.TopicArn;
            }
        }
        console.error('❌ Error creating SNS topic:', error);
        throw error;
    }
}

/**
 * Subscribe Customer App endpoint to topic
 */
async function subscribeCustomerApp(topicArn, endpoint) {
    console.log('📱 Subscribing Customer App webhook:', endpoint);
    
    try {
        const result = await sns.subscribe({
            TopicArn: topicArn,
            Protocol: 'https',
            Endpoint: endpoint,
            Attributes: {
                FilterPolicy: JSON.stringify({
                    event: ['REGION_STATUS_CHANGED']
                })
            }
        }).promise();
        
        console.log('✅ Customer App subscribed:', result.SubscriptionArn);
        return result.SubscriptionArn;
        
    } catch (error) {
        console.error('❌ Error subscribing Customer App:', error);
        throw error;
    }
}

/**
 * Subscribe Driver App endpoint to topic
 */
async function subscribeDriverApp(topicArn, endpoint) {
    console.log('🚗 Subscribing Driver App webhook:', endpoint);
    
    try {
        const result = await sns.subscribe({
            TopicArn: topicArn,
            Protocol: 'https',
            Endpoint: endpoint,
            Attributes: {
                FilterPolicy: JSON.stringify({
                    event: ['REGION_STATUS_CHANGED']
                })
            }
        }).promise();
        
        console.log('✅ Driver App subscribed:', result.SubscriptionArn);
        return result.SubscriptionArn;
        
    } catch (error) {
        console.error('❌ Error subscribing Driver App:', error);
        throw error;
    }
}

/**
 * Subscribe Merchant App endpoint to topic
 */
async function subscribeMerchantApp(topicArn, endpoint) {
    console.log('🏪 Subscribing Merchant App webhook:', endpoint);
    
    try {
        const result = await sns.subscribe({
            TopicArn: topicArn,
            Protocol: 'https',
            Endpoint: endpoint,
            Attributes: {
                FilterPolicy: JSON.stringify({
                    event: ['REGION_STATUS_CHANGED']
                })
            }
        }).promise();
        
        console.log('✅ Merchant App subscribed:', result.SubscriptionArn);
        return result.SubscriptionArn;
        
    } catch (error) {
        console.error('❌ Error subscribing Merchant App:', error);
        throw error;
    }
}

/**
 * Setup complete webhook infrastructure
 */
async function setupWebhooks(endpoints = {}) {
    console.log('🚀 Setting up Region Update webhooks...\n');
    
    try {
        // Create SNS topic
        const topicArn = await createSNSTopic();
        console.log('\n📋 Topic ARN:', topicArn);
        console.log('⚠️  Add this to your Lambda environment variables:');
        console.log(`   REGION_UPDATES_TOPIC_ARN=${topicArn}\n`);
        
        const subscriptions = [];
        
        // Subscribe Customer App
        if (endpoints.customer) {
            const subArn = await subscribeCustomerApp(topicArn, endpoints.customer);
            subscriptions.push({ app: 'Customer', endpoint: endpoints.customer, arn: subArn });
        }
        
        // Subscribe Driver App
        if (endpoints.driver) {
            const subArn = await subscribeDriverApp(topicArn, endpoints.driver);
            subscriptions.push({ app: 'Driver', endpoint: endpoints.driver, arn: subArn });
        }
        
        // Subscribe Merchant App
        if (endpoints.merchant) {
            const subArn = await subscribeMerchantApp(topicArn, endpoints.merchant);
            subscriptions.push({ app: 'Merchant', endpoint: endpoints.merchant, arn: subArn });
        }
        
        console.log('\n✅ Webhook setup complete!');
        console.log('\n📊 Subscriptions:');
        subscriptions.forEach(sub => {
            console.log(`  ${sub.app}: ${sub.endpoint}`);
            console.log(`  ARN: ${sub.arn}\n`);
        });
        
        // Print webhook payload example
        console.log('📦 Webhook Payload Example:');
        console.log(JSON.stringify({
            event: 'REGION_STATUS_CHANGED',
            timestamp: '2025-11-04T10:00:00.000Z',
            region: {
                regionId: 'REG_001',
                regionName: 'Baghdad Central',
                regionNameArabic: 'بغداد المركز',
                regionType: 'DISTRICT',
                governorate: 'Baghdad',
                status: 'INACTIVE',
                previousStatus: 'ACTIVE'
            },
            affectedRegions: ['REG_001', 'REG_002'],
            affectedCount: 2,
            cascaded: true
        }, null, 2));
        
        return {
            topicArn,
            subscriptions
        };
        
    } catch (error) {
        console.error('❌ Error setting up webhooks:', error);
        throw error;
    }
}

/**
 * Test webhook by sending sample notification
 */
async function testWebhook(topicArn) {
    console.log('🧪 Testing webhook notification...');
    
    try {
        const testMessage = {
            event: 'REGION_STATUS_CHANGED',
            timestamp: new Date().toISOString(),
            region: {
                regionId: 'REG_TEST',
                regionName: 'Test Region',
                regionNameArabic: 'منطقة اختبار',
                regionType: 'DISTRICT',
                status: 'INACTIVE',
                previousStatus: 'ACTIVE'
            },
            affectedRegions: ['REG_TEST'],
            affectedCount: 1,
            cascaded: false,
            test: true
        };
        
        await sns.publish({
            TopicArn: topicArn,
            Message: JSON.stringify({
                default: JSON.stringify(testMessage),
                https: JSON.stringify(testMessage)
            }),
            MessageStructure: 'json',
            MessageAttributes: {
                event: {
                    DataType: 'String',
                    StringValue: 'REGION_STATUS_CHANGED'
                },
                test: {
                    DataType: 'String',
                    StringValue: 'true'
                }
            }
        }).promise();
        
        console.log('✅ Test notification sent successfully');
        console.log('   Check your subscribed endpoints for the message');
        
    } catch (error) {
        console.error('❌ Error testing webhook:', error);
        throw error;
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log(`
📚 Region Webhooks Setup Script

Usage:
  node setup-region-webhooks.js [options]

Options:
  --customer <url>    Customer app webhook endpoint
  --driver <url>      Driver app webhook endpoint
  --merchant <url>    Merchant app webhook endpoint
  --test <topicArn>   Test webhook with sample notification

Examples:
  # Setup webhooks for all apps
  node setup-region-webhooks.js \\
    --customer https://customer-api.wizz.com/webhooks/regions \\
    --driver https://driver-api.wizz.com/webhooks/regions \\
    --merchant https://merchant-api.wizz.com/webhooks/regions

  # Test existing webhook
  node setup-region-webhooks.js --test arn:aws:sns:us-east-1:123456789:WizzCentral-Region-Updates
        `);
        process.exit(0);
    }
    
    if (args.includes('--test')) {
        const topicArn = args[args.indexOf('--test') + 1];
        testWebhook(topicArn)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    } else {
        const endpoints = {};
        
        if (args.includes('--customer')) {
            endpoints.customer = args[args.indexOf('--customer') + 1];
        }
        if (args.includes('--driver')) {
            endpoints.driver = args[args.indexOf('--driver') + 1];
        }
        if (args.includes('--merchant')) {
            endpoints.merchant = args[args.indexOf('--merchant') + 1];
        }
        
        setupWebhooks(endpoints)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
}

module.exports = {
    createSNSTopic,
    subscribeCustomerApp,
    subscribeDriverApp,
    subscribeMerchantApp,
    setupWebhooks,
    testWebhook
};
