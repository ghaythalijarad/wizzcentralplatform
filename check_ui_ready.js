#!/usr/bin/env node
/**
 * Quick UI Readiness Check
 * Verifies all components are ready for UI testing
 */

const { execSync } = require('child_process');

console.log('\n🔍 WizzCentral UI Notification System - Readiness Check');
console.log('='.repeat(60));

let allGood = true;

// Check 1: Server running
console.log('\n1️⃣  Checking server...');
try {
    const result = execSync('lsof -i :3000 | grep LISTEN', { encoding: 'utf-8' });
    if (result.includes('3000')) {
        console.log('   ✅ Server is running on port 3000');
    }
} catch {
    console.log('   ❌ Server is NOT running!');
    console.log('   → Start: node local-dev-server.js');
    allGood = false;
}

// Check 2: AWS credentials
console.log('\n2️⃣  Checking AWS credentials...');
try {
    execSync('aws sts get-caller-identity --profile wizz-drivers-ghayth-dev', { stdio: 'pipe' });
    console.log('   ✅ AWS SSO session is active');
} catch {
    console.log('   ⚠️  AWS SSO session might be expired');
    console.log('   → Refresh: aws sso login --profile wizz-drivers-ghayth-dev');
}

// Check 3: FCM tokens
console.log('\n3️⃣  Checking FCM tokens...');
try {
    const result = execSync(
        'aws dynamodb scan --table-name WhizzMerchants_DeviceTokens --select COUNT --profile wizz-drivers-ghayth-dev --output text',
        { encoding: 'utf-8' }
    );
    const count = result.split('\t')[1];
    if (count > 0) {
        console.log(`   ✅ Found ${count} FCM token(s)`);
    } else {
        console.log('   ⚠️  No FCM tokens found');
    }
} catch (e) {
    console.log('   ⚠️  Could not check FCM tokens');
}

// Check 4: Merchants
console.log('\n4️⃣  Checking merchants...');
try {
    const result = execSync(
        'aws dynamodb scan --table-name WhizzMerchants_Businesses --select COUNT --profile wizz-drivers-ghayth-dev --output text',
        { encoding: 'utf-8' }
    );
    const count = result.split('\t')[1];
    console.log(`   ✅ Found ${count} merchant(s)`);
} catch (e) {
    console.log('   ⚠️  Could not check merchants');
}

// Check 5: Files exist
console.log('\n5️⃣  Checking required files...');
const fs = require('fs');
const files = [
    'frontend/pages/promotions.html',
    'frontend/assets/js/auth-utils.js',
    'backend/lambda/merchant-info-notification.js',
    'config/wizz-business-app-firebase-adminsdk.json'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} NOT FOUND`);
        allGood = false;
    }
});

// Final summary
console.log('\n' + '='.repeat(60));
if (allGood) {
    console.log('🎉 All systems ready for UI testing!');
    console.log('\n📱 Next Steps:');
    console.log('   1. Open: http://localhost:3000/pages/promotions.html');
    console.log('   2. Click: "Send to Merchants" button');
    console.log('   3. Fill form and send');
    console.log('   4. Check iPhone for notification');
} else {
    console.log('⚠️  Some issues detected - fix them before testing');
}
console.log('='.repeat(60) + '\n');
