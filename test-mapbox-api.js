#!/usr/bin/env node
/**
 * Simple test to verify Mapbox API access
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.mapbox' });

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

console.log('Testing Mapbox API...');
console.log('Token:', MAPBOX_TOKEN ? 'Found' : 'Missing');

if (!MAPBOX_TOKEN) {
  console.error('ERROR: No token found');
  process.exit(1);
}

const testQuery = 'Najaf, Iraq';
const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(testQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

console.log('Making request to Mapbox...');

fetch(url)
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Success! Got data:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
