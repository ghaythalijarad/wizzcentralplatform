#!/usr/bin/env node

/**
 * Deploy script for static hosting with Amplify Gen 2
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying static website to AWS...');

// Read the amplify outputs to get S3 bucket info
let amplifyOutputs;
try {
  amplifyOutputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));
  console.log('✅ Found amplify_outputs.json');
} catch (error) {
  console.error('❌ amplify_outputs.json not found. Make sure sandbox is running.');
  process.exit(1);
}

// Create a simple build if needed
console.log('📦 Preparing static files...');

// Copy static files to a build directory
const buildDir = 'build';
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Copy HTML, CSS, JS files
const staticFiles = [
  'index.html',
  'dashboard.html', 
  'customers.html',
  'drivers.html',
  'merchants.html',
  'promotions.html',
  'support.html',
  'styles.css',
  'dashboard.css',
  'script.js',
  'dashboard.js',
  'customers.js',
  'drivers.js', 
  'merchants.js',
  'promotions.js',
  'support.js',
  'config.js'
];

staticFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(buildDir, file));
    console.log(`✅ Copied ${file}`);
  }
});

console.log('🎉 Static files prepared in build/ directory');
console.log('\n📋 Next steps:');
console.log('1. Create an S3 bucket for hosting');
console.log('2. Enable static website hosting on the bucket');
console.log('3. Upload the contents of the build/ directory');
console.log('4. Set up CloudFront distribution (optional)');
console.log('\nOr use the AWS Amplify Console to create a new Gen 2 app with hosting.');
