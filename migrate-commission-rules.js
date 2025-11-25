#!/usr/bin/env node
/**
 * Commission Rules Migration Script
 * Adds merchantId attribute to legacy commission rules that only have conditions.merchantType.
 * Optional dry-run: set DRY_RUN=true
 * Usage: DRY_RUN=true node migrate-commission-rules.js
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const COMMISSIONS_TABLE = process.env.COMMISSIONS_TABLE || 'WizzCentral_Commission_Rules';
const DRY_RUN = process.env.DRY_RUN === 'true';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb = DynamoDBDocumentClient.from(client);

(async () => {
  console.log('🚀 Commission Rules Migration Start');
  console.log(`Table: ${COMMISSIONS_TABLE}`);
  console.log(`Dry Run: ${DRY_RUN}`);

  // Scan all rules (paginate if >1MB)
  let lastKey; let processed = 0; let updated = 0; let skipped = 0;
  do {
    const scanParams = { TableName: COMMISSIONS_TABLE, ExclusiveStartKey: lastKey };
    const scanRes = await ddb.send(new ScanCommand(scanParams));
    const items = scanRes.Items || [];
    for (const item of items) {
      processed++;
      if (item.merchantId) { skipped++; continue; }
      const merchantType = item.conditions?.merchantType || 'unknown';
      // Construct placeholder merchantId so new queries succeed. Pattern allows later real mapping.
      const placeholderMerchantId = `LEGACY_${merchantType}_${item.ruleId}`;
      // Avoid overwriting if already has placeholder from previous run
      if (item.merchantId === placeholderMerchantId) { skipped++; continue; }
      console.log(`→ Migrating rule ${item.ruleId} (merchantType=${merchantType}) -> merchantId=${placeholderMerchantId}`);
      if (!DRY_RUN) {
        const upd = new UpdateCommand({
          TableName: COMMISSIONS_TABLE,
            Key: { ruleId: item.ruleId },
            UpdateExpression: 'SET #merchantId = :m',
            ExpressionAttributeNames: { '#merchantId': 'merchantId' },
            ExpressionAttributeValues: { ':m': placeholderMerchantId }
        });
        await ddb.send(upd);
      }
      updated++;
    }
    lastKey = scanRes.LastEvaluatedKey;
  } while (lastKey);

  console.log('\n✅ Migration complete');
  console.log(`Processed: ${processed}`);
  console.log(`Updated:   ${updated}`);
  console.log(`Skipped:   ${skipped}`);
  if (DRY_RUN) console.log('Dry run mode - no writes performed');
  console.log('\nNext Steps:');
  console.log('1. Create GSI merchantId-priority-index if not present (console or CloudFormation).');
  console.log('2. Replace placeholder merchantIds with real merchantId mapping if available.');
  console.log('3. Remove legacy merchantType-based logic after all rules have real merchantId.');
})();
