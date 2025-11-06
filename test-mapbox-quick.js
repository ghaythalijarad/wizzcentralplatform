#!/usr/bin/env node
/**
 * Quick Mapbox Test
 */

require('dotenv').config({ path: '.env.mapbox' });

const token = process.env.MAPBOX_ACCESS_TOKEN;

console.log('🔍 Testing Mapbox Configuration...\n');
console.log('Token present:', token ? 'YES ✅' : 'NO ❌');
console.log('Token length:', token ? token.length : 0);
console.log('Token starts with pk.:', token ? token.startsWith('pk.') : false);

if (token && token.startsWith('pk.')) {
    console.log('\n✅ Mapbox configuration looks good!');
    console.log('You can now run: node scripts/create-all-iraq-regions.js');
} else {
    console.log('\n❌ Mapbox token is missing or invalid');
}
