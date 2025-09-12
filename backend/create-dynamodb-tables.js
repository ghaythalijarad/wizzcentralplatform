/**
 * DynamoDB Table Creation Script for Enhanced Amazon Connect Features
 * Creates tables for chat history, file metadata, agent management, and analytics
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

const tables = [
  {
    TableName: 'AmazonConnect-ChatHistory-dev',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
      { AttributeName: 'customerId', AttributeType: 'S' },
      { AttributeName: 'customerEmail', AttributeType: 'S' },
      { AttributeName: 'messageId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'customer-index',
        KeySchema: [
          { AttributeName: 'customerId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'email-index',
        KeySchema: [
          { AttributeName: 'customerEmail', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'session-timestamp-index',
        KeySchema: [
          { AttributeName: 'sessionId', KeyType: 'HASH' },
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
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'AmazonConnect' },
      { Key: 'Environment', Value: 'dev' },
      { Key: 'Feature', Value: 'ChatHistory' }
    ]
  },
  {
    TableName: 'AmazonConnect-FileMetadata-dev',
    KeySchema: [
      { AttributeName: 'fileId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'fileId', AttributeType: 'S' },
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'session-files-index',
        KeySchema: [
          { AttributeName: 'sessionId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'AmazonConnect' },
      { Key: 'Environment', Value: 'dev' },
      { Key: 'Feature', Value: 'FileAttachments' }
    ]
  },
  {
    TableName: 'AmazonConnect-AgentManagement-dev',
    KeySchema: [
      { AttributeName: 'agentId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'agentId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'lastUpdated', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'status-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'lastUpdated', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'AmazonConnect' },
      { Key: 'Environment', Value: 'dev' },
      { Key: 'Feature', Value: 'AgentManagement' }
    ]
  },
  {
    TableName: 'AmazonConnect-Analytics-dev',
    KeySchema: [
      { AttributeName: 'eventId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'eventId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
      { AttributeName: 'eventType', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
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
      },
      {
        IndexName: 'event-type-index',
        KeySchema: [
          { AttributeName: 'eventType', KeyType: 'HASH' },
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
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    SSESpecification: {
      SSEEnabled: true
    },
    Tags: [
      { Key: 'Service', Value: 'AmazonConnect' },
      { Key: 'Environment', Value: 'dev' },
      { Key: 'Feature', Value: 'Analytics' }
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
    
  } catch (error) {
    console.error(`❌ Error creating table ${tableConfig.TableName}:`, error);
    throw error;
  }
}

async function createAllTables() {
  console.log('🚀 Starting DynamoDB table creation for Enhanced Amazon Connect...');
  console.log(`📍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`📊 Tables to create: ${tables.length}`);
  console.log('');

  try {
    for (const table of tables) {
      await createTable(table);
      console.log('');
    }

    console.log('🎉 All tables created successfully!');
    console.log('');
    console.log('📋 Summary:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.TableName}`);
    });
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Deploy the serverless functions');
    console.log('   2. Configure API Gateway endpoints');
    console.log('   3. Set up S3 bucket for file attachments');
    console.log('   4. Configure Amazon Connect instance (optional)');
    console.log('   5. Test the enhanced chat features');

  } catch (error) {
    console.error('💥 Failed to create tables:', error);
    process.exit(1);
  }
}

// Sample data for testing
const sampleAgents = [
  {
    agentId: 'agent-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    status: 'available',
    skills: ['general', 'billing', 'technical'],
    languages: ['en', 'es'],
    departments: ['support', 'technical'],
    maxConcurrentSessions: 3,
    currentSessions: 0,
    totalSessions: 156,
    averageRating: 4.8,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    agentId: 'agent-002',
    name: 'Ahmed Al-Rahman',
    email: 'ahmed.alrahman@company.com',
    status: 'available',
    skills: ['general', 'orders', 'language-ar'],
    languages: ['en', 'ar'],
    departments: ['support', 'orders'],
    maxConcurrentSessions: 2,
    currentSessions: 0,
    totalSessions: 89,
    averageRating: 4.9,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    agentId: 'agent-003',
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    status: 'away',
    skills: ['technical', 'billing', 'priority-handling'],
    languages: ['en'],
    departments: ['technical', 'billing'],
    maxConcurrentSessions: 4,
    currentSessions: 0,
    totalSessions: 203,
    averageRating: 4.7,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

async function insertSampleData() {
  const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  console.log('📝 Inserting sample agent data...');

  try {
    for (const agent of sampleAgents) {
      await docClient.send(new PutCommand({
        TableName: 'AmazonConnect-AgentManagement-dev',
        Item: agent
      }));
      console.log(`   ✅ Added agent: ${agent.name}`);
    }
    console.log('✅ Sample data inserted successfully');
  } catch (error) {
    console.error('❌ Failed to insert sample data:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Enhanced Amazon Connect DynamoDB Setup');
    console.log('');
    console.log('Usage:');
    console.log('  node create-dynamodb-tables.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --sample-data    Insert sample agent data after table creation');
    console.log('  --help, -h       Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  AWS_REGION       AWS region (default: us-east-1)');
    console.log('  AWS_PROFILE      AWS profile to use');
    return;
  }

  await createAllTables();

  if (args.includes('--sample-data')) {
    await insertSampleData();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createAllTables,
  insertSampleData,
  tables,
  sampleAgents
};
