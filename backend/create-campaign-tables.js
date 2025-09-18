/**
 * DynamoDB Table Creation Script for Campaign Condition Engine
 * Creates the missing tables for campaign conditions and usage tracking
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

const campaignTables = [
  // Main Campaigns Table
  {
    TableName: 'WizzCentral_Campaigns',
    KeySchema: [
      { AttributeName: 'campaignId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'campaignId', AttributeType: 'S' },
      { AttributeName: 'type', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'startDate', AttributeType: 'S' },
      { AttributeName: 'endDate', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'type-status-index',
        KeySchema: [
          { AttributeName: 'type', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'status-startDate-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'startDate', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'createdAt-index',
        KeySchema: [
          { AttributeName: 'createdAt', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    },
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'WizzCentral' },
      { Key: 'Environment', Value: 'production' },
      { Key: 'Feature', Value: 'Campaigns' },
      { Key: 'Component', Value: 'ConditionEngine' }
    ]
  },

  // Campaign Conditions Table
  {
    TableName: 'WizzCentral_Campaign_Conditions',
    KeySchema: [
      { AttributeName: 'conditionId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'conditionId', AttributeType: 'S' },
      { AttributeName: 'campaignId', AttributeType: 'S' },
      { AttributeName: 'conditionType', AttributeType: 'S' },
      { AttributeName: 'conditionOrder', AttributeType: 'N' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'campaignId-conditionOrder-index',
        KeySchema: [
          { AttributeName: 'campaignId', KeyType: 'HASH' },
          { AttributeName: 'conditionOrder', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'conditionType-index',
        KeySchema: [
          { AttributeName: 'conditionType', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'campaignId-index',
        KeySchema: [
          { AttributeName: 'campaignId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 15,
      WriteCapacityUnits: 15
    },
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'WizzCentral' },
      { Key: 'Environment', Value: 'production' },
      { Key: 'Feature', Value: 'CampaignConditions' },
      { Key: 'Component', Value: 'ConditionEngine' }
    ]
  },

  // Campaign Usage Tracking Table
  {
    TableName: 'WizzCentral_Campaign_Usage',
    KeySchema: [
      { AttributeName: 'usageId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'usageId', AttributeType: 'S' },
      { AttributeName: 'campaignId', AttributeType: 'S' },
      { AttributeName: 'customerId', AttributeType: 'S' },
      { AttributeName: 'usageDate', AttributeType: 'S' },
      { AttributeName: 'orderId', AttributeType: 'S' },
      { AttributeName: 'restaurantId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'campaignId-usageDate-index',
        KeySchema: [
          { AttributeName: 'campaignId', KeyType: 'HASH' },
          { AttributeName: 'usageDate', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        }
      },
      {
        IndexName: 'customerId-usageDate-index',
        KeySchema: [
          { AttributeName: 'customerId', KeyType: 'HASH' },
          { AttributeName: 'usageDate', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        }
      },
      {
        IndexName: 'orderId-index',
        KeySchema: [
          { AttributeName: 'orderId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'restaurantId-usageDate-index',
        KeySchema: [
          { AttributeName: 'restaurantId', KeyType: 'HASH' },
          { AttributeName: 'usageDate', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 20,
      WriteCapacityUnits: 20
    },
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    },
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'WizzCentral' },
      { Key: 'Environment', Value: 'production' },
      { Key: 'Feature', Value: 'CampaignUsage' },
      { Key: 'Component', Value: 'Analytics' }
    ]
  },

  // Campaign Analytics Table
  {
    TableName: 'WizzCentral_Campaign_Analytics',
    KeySchema: [
      { AttributeName: 'analyticsId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'analyticsId', AttributeType: 'S' },
      { AttributeName: 'campaignId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
      { AttributeName: 'metricType', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'campaignId-date-index',
        KeySchema: [
          { AttributeName: 'campaignId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'metricType-timestamp-index',
        KeySchema: [
          { AttributeName: 'metricType', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'date-index',
        KeySchema: [
          { AttributeName: 'date', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'WizzCentral' },
      { Key: 'Environment', Value: 'production' },
      { Key: 'Feature', Value: 'CampaignAnalytics' },
      { Key: 'Component', Value: 'Reporting' }
    ]
  }
];

async function createTable(tableConfig) {
  try {
    console.log(`Creating table: ${tableConfig.TableName}`);
    
    // Check if table already exists
    try {
      await dynamoClient.send(new DescribeTableCommand({ TableName: tableConfig.TableName }));
      console.log(`✅ Table ${tableConfig.TableName} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, proceed with creation
    }

    const result = await dynamoClient.send(new CreateTableCommand(tableConfig));
    console.log(`✅ Table ${tableConfig.TableName} created successfully`);
    console.log(`   Table ARN: ${result.TableDescription.TableArn}`);
    
    // Wait for table to become active
    console.log(`   Waiting for table to become active...`);
    await waitForTableActive(tableConfig.TableName);
    console.log(`   Table ${tableConfig.TableName} is now active`);
    
  } catch (error) {
    console.error(`❌ Error creating table ${tableConfig.TableName}:`, error);
    throw error;
  }
}

async function waitForTableActive(tableName, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      if (result.Table.TableStatus === 'ACTIVE') {
        return;
      }
      console.log(`   Table status: ${result.Table.TableStatus}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error checking table status:`, error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error(`Table ${tableName} did not become active within expected time`);
}

async function createAllCampaignTables() {
  console.log('🚀 Starting DynamoDB table creation for Campaign Condition Engine...');
  console.log(`📍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`📊 Tables to create: ${campaignTables.length}`);
  console.log('');

  try {
    for (const table of campaignTables) {
      await createTable(table);
      console.log('');
    }

    console.log('🎉 All campaign tables created successfully!');
    console.log('');
    console.log('📋 Summary:');
    campaignTables.forEach(table => {
      console.log(`   ✅ ${table.TableName}`);
    });
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test table creation with sample data');
    console.log('   2. Verify GSI functionality');
    console.log('   3. Configure application to use new tables');
    console.log('   4. Run enhanced targeting tests');
    console.log('   5. Deploy condition engine features');

  } catch (error) {
    console.error('💥 Failed to create tables:', error);
    process.exit(1);
  }
}

// Sample data for testing
const sampleCampaigns = [
  {
    campaignId: 'camp_new_customer_2025',
    title: 'New Customer Welcome',
    code: 'WELCOME25',
    type: 'new_customer',
    description: 'Welcome discount for new customers',
    discountType: 'percentage',
    discountValue: 25,
    status: 'active',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    usageLimit: 1000,
    usage: 0,
    isActive: true,
    targetSegments: ['new'],
    enhancedTargeting: {
      customerSegments: {
        enabled: true,
        predefinedSegments: ['new'],
        logic: 'AND'
      }
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    campaignId: 'camp_weekend_special_2025',
    title: 'Weekend Family Special',
    code: 'WEEKEND20',
    type: 'special_occasion',
    description: 'Weekend discount for family orders',
    discountType: 'percentage',
    discountValue: 20,
    status: 'active',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    usageLimit: 0, // Unlimited
    usage: 0,
    isActive: true,
    occasions: ['weekend'],
    enhancedTargeting: {
      occasions: {
        enabled: true,
        recurringSchedules: [
          {
            name: 'Weekend Special',
            daysOfWeek: [5, 6], // Friday, Saturday
            timeRange: {
              start: '12:00',
              end: '22:00'
            }
          }
        ]
      }
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

const sampleConditions = [
  {
    conditionId: 'cond_new_customer_001',
    campaignId: 'camp_new_customer_2025',
    conditionType: 'customer',
    conditionName: 'new_customer',
    parameters: {
      maxOrders: 0
    },
    operator: 'AND',
    conditionOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    conditionId: 'cond_weekend_time_001',
    campaignId: 'camp_weekend_special_2025',
    conditionType: 'time',
    conditionName: 'day_of_week',
    parameters: {
      daysOfWeek: [5, 6],
      timeRange: {
        start: '12:00',
        end: '22:00'
      }
    },
    operator: 'AND',
    conditionOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

async function insertSampleData() {
  console.log('📝 Inserting sample campaign data...');
  
  try {
    // Insert sample campaigns
    for (const campaign of sampleCampaigns) {
      const params = {
        TableName: 'WizzCentral_Campaigns',
        Item: campaign
      };
      await dynamoClient.send(new PutItemCommand(params));
      console.log(`   ✅ Inserted campaign: ${campaign.title}`);
    }
    
    // Insert sample conditions
    for (const condition of sampleConditions) {
      const params = {
        TableName: 'WizzCentral_Campaign_Conditions',
        Item: condition
      };
      await dynamoClient.send(new PutItemCommand(params));
      console.log(`   ✅ Inserted condition: ${condition.conditionName}`);
    }
    
    console.log('✅ Sample data inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('WizzCentral Campaign Condition Engine DynamoDB Setup');
    console.log('');
    console.log('Usage:');
    console.log('  node create-campaign-tables.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --sample-data    Insert sample campaign data after table creation');
    console.log('  --help, -h       Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  AWS_REGION       AWS region (default: us-east-1)');
    console.log('  AWS_PROFILE      AWS profile to use');
    return;
  }

  await createAllCampaignTables();

  if (args.includes('--sample-data')) {
    await insertSampleData();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createAllCampaignTables,
  insertSampleData,
  campaignTables,
  sampleCampaigns,
  sampleConditions
};
