#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

(async () => {
  try {
    console.log('🔍 Checking current regions in DynamoDB...\n');
    const result = await docClient.send(new ScanCommand({ 
      TableName: 'WizzCentral_Regions' 
    }));
    
    const levels = {};
    result.Items.forEach(item => {
      levels[item.level] = (levels[item.level] || 0) + 1;
    });
    
    console.log('📊 Current DynamoDB Regions by Level:');
    console.log('=====================================');
    Object.entries(levels).forEach(([level, count]) => {
      console.log(`${level.padEnd(15)} : ${count}`);
    });
    console.log('=====================================');
    console.log(`Total Regions: ${result.Items.length}\n`);
    
    // Show active regions
    const active = result.Items.filter(i => i.is_active).length;
    console.log(`✅ Active: ${active}`);
    console.log(`⏸️  Inactive: ${result.Items.length - active}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
