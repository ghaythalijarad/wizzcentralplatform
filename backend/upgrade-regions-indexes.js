#!/usr/bin/env node
/**
 * Upgrade WizzCentral_Regions table: add GSIs and backfill helper attributes
 * - GSIs
 *   • GSI1_ParentLevelName (PK=parent_id, SK=level_name)
 *   • GSI2_Level          (PK=level_n,   SK=name_lower)
 *   • GSI3_IsActive       (PK=is_active_s, SK=level_updated_at)
 * - Backfill attributes per item:
 *   name_lower, name_ar_lower, level_n, is_active_s, level_name, level_updated_at
 */

const { DynamoDBClient, DescribeTableCommand, UpdateTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.REGIONS_TABLE || 'WizzCentral_Regions';
const REGION = process.env.AWS_REGION || 'us-east-1';
const BACKFILL_ONLY = process.argv.includes('--backfill-only') || process.env.ONLY_BACKFILL === '1';

const ddb = new DynamoDBClient({
  region: REGION,
  credentials: process.env.AWS_PROFILE ? undefined : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const doc = DynamoDBDocumentClient.from(ddb);

async function describeTable() {
  const res = await ddb.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
  return res.Table;
}

function gsiExists(table, name) {
  return (table.GlobalSecondaryIndexes || []).some(g => g.IndexName === name);
}

async function ensureGSIs() {
  const desired = [
    {
      IndexName: 'GSI1_ParentLevelName',
      KeySchema: [
        { AttributeName: 'parent_id', KeyType: 'HASH' },
        { AttributeName: 'level_name', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      IndexName: 'GSI2_Level',
      KeySchema: [
        { AttributeName: 'level_n', KeyType: 'HASH' },
        { AttributeName: 'name_lower', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      IndexName: 'GSI3_IsActive',
      KeySchema: [
        { AttributeName: 'is_active_s', KeyType: 'HASH' },
        { AttributeName: 'level_updated_at', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ];

  let table = await describeTable();
  const missing = desired.filter(d => !gsiExists(table, d.IndexName));
  if (!missing.length) {
    console.log('✅ All desired GSIs already exist');
    return;
  }

  for (const gsi of missing) {
    console.log(`➕ Creating GSI: ${gsi.IndexName}`);
    await ddb.send(new UpdateTableCommand({
      TableName: TABLE_NAME,
      GlobalSecondaryIndexUpdates: [{ Create: gsi }]
    }));
    console.log(`⏳ Waiting for GSI to become ACTIVE: ${gsi.IndexName}`);
    await waitForActive(gsi.IndexName);
  }
}

async function waitForActive(indexName, timeoutMs = 20 * 60 * 1000, pollMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const table = await describeTable();
    const tActive = table.TableStatus === 'ACTIVE';
    const gsi = (table.GlobalSecondaryIndexes || []).find(x => x.IndexName === indexName);
    const iActive = !indexName || (gsi && gsi.IndexStatus === 'ACTIVE');
    if (tActive && iActive) {
      console.log(`✅ Active: ${indexName || 'Table'}`);
      return;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, pollMs));
  }
  throw new Error(`Timeout waiting for ACTIVE: ${indexName || 'Table'}`);
}

function computeBackfillAttrs(it) {
  const out = {};
  const levelRaw = it.level_n ?? it.level;
  const levelNum = typeof levelRaw === 'number' ? levelRaw : Number(String(levelRaw).match(/\d+/)?.[0] ?? (
    { country:0, governorate:1, district:2, neighborhood:3 }[String(levelRaw).toLowerCase?.()] ?? NaN
  ));
  if (!Number.isNaN(levelNum)) out.level_n = levelNum;

  const nameLower = String(it.name || '').trim().toLowerCase();
  if (nameLower) out.name_lower = nameLower;
  const nameArLower = String(it.name_ar || '').trim().toLowerCase();
  if (nameArLower) out.name_ar_lower = nameArLower;

  const activeBool = (it.is_active === true || it.is_active === 'true');
  out.is_active_s = activeBool ? 'true' : 'false';

  const updated = it.updated_at || it.updatedAt || new Date().toISOString();
  out.level_name = `L#${out.level_n ?? levelNum ?? 0}#N#${nameLower}`;
  out.level_updated_at = `L#${out.level_n ?? levelNum ?? 0}#U#${updated}`;
  return out;
}

async function backfillAttributes() {
  console.log('\n🔄 Backfilling helper attributes...');
  let startKey;
  let total = 0;
  do {
    const page = await doc.send(new ScanCommand({ TableName: TABLE_NAME, ExclusiveStartKey: startKey, Limit: 100 }));
    for (const item of page.Items || []) {
      const updates = computeBackfillAttrs(item);
      // Skip if already matches
      const needs = Object.entries(updates).some(([k, v]) => item[k] !== v);
      if (!needs) { total++; continue; }
      const names = {}, vals = { ':now': new Date().toISOString() };
      const sets = ['updated_at = :now', 'updatedAt = :now'];
      let idx = 0;
      for (const [k, v] of Object.entries(updates)) {
        idx++;
        names[`#k${idx}`] = k;
        vals[`:v${idx}`] = v;
        sets.push(`#k${idx} = :v${idx}`);
      }
      await doc.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { regionId: item.regionId },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: vals
      }));
      total++;
      if (total % 25 === 0) process.stdout.write('.');
    }
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  console.log(`\n✅ Backfill complete. Items processed: ${total}`);
}

(async () => {
  console.log(`🚀 Upgrading table ${TABLE_NAME} in ${REGION}`);
  if (BACKFILL_ONLY) {
    console.log('ℹ️ BACKFILL-ONLY mode enabled. Skipping GSI creation.');
    await backfillAttributes();
    return;
  }
  const table = await describeTable();
  console.log(`Current GSIs: ${(table.GlobalSecondaryIndexes || []).map(g => g.IndexName).join(', ') || '(none)'}`);
  await ensureGSIs();
  await waitForActive();
  await backfillAttributes();
  console.log('\n🎉 Upgrade finished successfully');
})().catch(err => {
  console.error('\n❌ Upgrade failed:', err);
  if (String(err.message || '').toLowerCase().includes('expired') || String(err.name || '').includes('Expired')) {
    console.error(`\nHint: aws sso login --profile ${process.env.AWS_PROFILE || 'default'}`);
  }
  process.exit(1);
});
