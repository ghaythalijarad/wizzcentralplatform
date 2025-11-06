#!/usr/bin/env node
/**
 * Test Mapbox Token and API Access
 */

const https = require('https');
const fs = require('fs');

console.log('🔍 Testing Mapbox API Access...\n');

// Read token
const envPath = '.env.mapbox';
let token = '';
try {
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/MAPBOX_ACCESS_TOKEN=(.+)/);
  token = match ? match[1].trim() : '';
} catch (e) {
  console.error('❌ Cannot read .env.mapbox');
  process.exit(1);
}

console.log(`Token: ${token ? '✅ Found' : '❌ Missing'}`);
if (!token) process.exit(1);

// Test API call
const testQuery = 'Baghdad, Iraq';
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(testQuery)}.json?access_token=${token}&limit=1`;

console.log(`\n🌐 Testing query: ${testQuery}`);
console.log(`URL: ${url.substring(0, 100)}...`);

https.get(url, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log('\n✅ SUCCESS! API is working');
        console.log(`Found ${result.features?.length || 0} results`);
        if (result.features?.[0]) {
          const f = result.features[0];
          console.log(`Place: ${f.text}`);
          console.log(`Coordinates: ${f.center}`);
          console.log(`Relevance: ${f.relevance}`);
        }
      } catch (e) {
        console.error('❌ JSON Parse Error:', e.message);
      }
    } else {
      console.error('❌ API Error:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Network Error:', err.message);
});
