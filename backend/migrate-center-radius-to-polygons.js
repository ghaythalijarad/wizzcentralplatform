#!/usr/bin/env node
/**
 * Migration: Convert legacy center+radius regions to polygon boundaries
 * - Scans the Regions table for items missing `boundary` but having `coordinates.lat/lng[/radius]`
 * - Generates an approximate circle polygon (configurable vertices) and writes to `boundary`
 * - Optionally removes the legacy `coordinates` attribute
 *
 * Usage:
 *   node backend/migrate-center-radius-to-polygons.js \
 *     --table WizzCentral_Regions \
 *     --region us-east-1 \
 *     --vertices 64 \
 *     --batch 25 \
 *     --apply           # actually write updates (omit for dry-run)
 *
 * Env (optional):
 *   AWS_PROFILE=your-profile
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { table: 'WizzCentral_Regions', region: process.env.AWS_REGION || 'us-east-1', vertices: 64, batch: 25, apply: false, removeCoordinates: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if (a === '--table' && next) { out.table = next; i++; }
    else if (a === '--region' && next) { out.region = next; i++; }
    else if (a === '--vertices' && next) { out.vertices = Math.max(16, parseInt(next, 10) || 64); i++; }
    else if (a === '--batch' && next) { out.batch = Math.max(1, parseInt(next, 10) || 25); i++; }
    else if (a === '--apply') { out.apply = true; }
    else if (a === '--keep-coordinates') { out.removeCoordinates = false; }
  }
  return out;
}

function toCirclePolygon(lat, lng, radiusMeters, vertices = 64) {
  // Approximate meters-to-degrees (WGS84 equirectangular)
  const latRad = (lat * Math.PI) / 180;
  const degPerMeterLat = 1 / 110574; // ~ meters per degree latitude
  const degPerMeterLng = 1 / (111320 * Math.cos(latRad) || 1e-9); // prevent div by zero near poles
  const ring = [];
  for (let i = 0; i < vertices; i++) {
    const theta = (2 * Math.PI * i) / vertices;
    const dLat = Math.sin(theta) * radiusMeters * degPerMeterLat;
    const dLng = Math.cos(theta) * radiusMeters * degPerMeterLng;
    const ptLat = Math.max(-90, Math.min(90, lat + dLat));
    let ptLng = lng + dLng;
    // Normalize longitude to [-180, 180]
    if (ptLng > 180) ptLng = ((ptLng + 180) % 360) - 180;
    if (ptLng < -180) ptLng = ((ptLng - 180) % 360) + 180;
    ring.push([Number(ptLng), Number(ptLat)]);
  }
  // close ring
  ring.push([...ring[0]]);
  return { type: 'Polygon', coordinates: [ring] };
}

(async () => {
  const cfg = parseArgs();
  console.log('Starting migration (center+radius -> polygon boundary)');
  console.log(JSON.stringify(cfg, null, 2));

  const ddb = new DynamoDBClient({ region: cfg.region, credentials: process.env.AWS_PROFILE ? undefined : undefined });
  const doc = DynamoDBDocumentClient.from(ddb);

  let lastKey;
  let scanned = 0;
  let candidates = 0;
  let updated = 0;

  do {
    const page = await doc.send(new ScanCommand({
      TableName: cfg.table,
      ProjectionExpression: 'regionId, #b, coordinates',
      ExclusiveStartKey: lastKey,
      ExpressionAttributeNames: { '#b': 'boundary' },
      Limit: 100
    }));
    const items = page.Items || [];
    scanned += items.length;

    const toProcess = items.filter(it => !it.boundary && it.coordinates && (typeof it.coordinates.lat === 'number' || typeof it.coordinates?.center?.lat === 'number'));
    candidates += toProcess.length;

    for (const it of toProcess) {
      const center = {
        lat: Number(it.coordinates.lat ?? it.coordinates.center?.lat ?? 0),
        lng: Number(it.coordinates.lng ?? it.coordinates.center?.lng ?? 0),
      };
      const radius = Number(it.coordinates.radius ?? 3000);
      const boundary = toCirclePolygon(center.lat, center.lng, radius, cfg.vertices);

      console.log(`• ${it.regionId}: center=(${center.lat.toFixed(6)},${center.lng.toFixed(6)}) r=${radius} -> polygon(${cfg.vertices})`);
      if (!cfg.apply) continue; // dry run

      const updates = {
        TableName: cfg.table,
        Key: { regionId: it.regionId },
        UpdateExpression: cfg.removeCoordinates ? 'SET #b = :b REMOVE coordinates' : 'SET #b = :b',
        ConditionExpression: 'attribute_not_exists(#b)',
        ExpressionAttributeNames: { '#b': 'boundary' },
        ExpressionAttributeValues: { ':b': boundary },
      };
      try {
        await doc.send(new UpdateCommand(updates));
        updated += 1;
      } catch (e) {
        console.warn(`  ⚠️ Update skipped/failed for ${it.regionId}: ${e.name || e.message}`);
      }
    }

    lastKey = page.LastEvaluatedKey;
  } while (lastKey);

  console.log('--- Summary ---');
  console.log({ scanned, candidates, updated, apply: cfg.apply });
  if (!cfg.apply) {
    console.log('Dry-run complete. Re-run with --apply to write changes.');
  }
})();
