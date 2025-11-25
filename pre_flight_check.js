#!/usr/bin/env node

/**
 * Pre-Flight Check: Verify everything is ready for push notification testing
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 PRE-FLIGHT CHECK: Push Notification System\n');
console.log('━'.repeat(70));

let allGood = true;

// 1. Check Firebase service account file
console.log('\n1️⃣  Checking Firebase Admin SDK configuration...');
const serviceAccountPath = path.join(__dirname, 'config/wizz-business-app-firebase-adminsdk.json');
if (fs.existsSync(serviceAccountPath)) {
    console.log('   ✅ Firebase service account file exists');
    try {
        const serviceAccount = require(serviceAccountPath);
        if (serviceAccount.project_id === 'wizz-business-app') {
            console.log('   ✅ Project ID matches: wizz-business-app');
        } else {
            console.log(`   ⚠️  Project ID mismatch: ${serviceAccount.project_id}`);
            allGood = false;
        }
    } catch (e) {
        console.log('   ❌ Failed to parse service account file');
        allGood = false;
    }
} else {
    console.log('   ❌ Firebase service account file NOT FOUND');
    console.log('      Expected at:', serviceAccountPath);
    allGood = false;
}

// 2. Check .env file
console.log('\n2️⃣  Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('   ✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_PATH')) {
        console.log('   ✅ FIREBASE_SERVICE_ACCOUNT_PATH is configured');
    } else {
        console.log('   ⚠️  FIREBASE_SERVICE_ACCOUNT_PATH not found in .env');
    }
} else {
    console.log('   ⚠️  .env file not found (using defaults)');
}

// 3. Check firebase-admin package
console.log('\n3️⃣  Checking firebase-admin package...');
try {
    const admin = require('firebase-admin');
    console.log('   ✅ firebase-admin package installed');
} catch (e) {
    console.log('   ❌ firebase-admin package NOT installed');
    console.log('      Run: npm install firebase-admin');
    allGood = false;
}

// 4. Check server is running
console.log('\n4️⃣  Checking if WizzCentral server is running...');
const { exec } = require('child_process');
exec('ps aux | grep -E "node.*local-dev-server" | grep -v grep', (err, stdout) => {
    if (stdout && stdout.trim()) {
        console.log('   ✅ Server is running');
        
        // Check server logs for Firebase initialization
        const serverLogPath = path.join(__dirname, 'server.log');
        if (fs.existsSync(serverLogPath)) {
            const logs = fs.readFileSync(serverLogPath, 'utf-8');
            const lastLogs = logs.split('\n').slice(-100).join('\n');
            
            if (lastLogs.includes('Firebase Admin SDK initialized successfully')) {
                console.log('   ✅ Firebase Admin SDK initialized in server');
            } else if (lastLogs.includes('Failed to initialize Firebase Admin SDK')) {
                console.log('   ❌ Firebase Admin SDK FAILED to initialize');
                console.log('      Check server.log for details');
                allGood = false;
            } else {
                console.log('   ⚠️  Cannot determine Firebase initialization status');
            }
        }
    } else {
        console.log('   ❌ Server is NOT running');
        console.log('      Start with: node local-dev-server.js');
        allGood = false;
    }
    
    // 5. Check AWS credentials
    console.log('\n5️⃣  Checking AWS credentials...');
    exec('aws sts get-caller-identity --profile wizz-drivers-ghayth-dev 2>&1', (err, stdout, stderr) => {
        if (stdout && !stderr.includes('Error')) {
            console.log('   ✅ AWS credentials are valid');
        } else {
            console.log('   ❌ AWS credentials expired or invalid');
            console.log('      Run: aws sso login --profile wizz-drivers-ghayth-dev');
            allGood = false;
        }
        
        // Final summary
        console.log('\n' + '━'.repeat(70));
        if (allGood) {
            console.log('\n🎉 ALL SYSTEMS GO! Ready to test push notifications.\n');
            console.log('📋 NEXT STEPS:');
            console.log('   1. Close WhizzMerchants app completely on iPhone');
            console.log('   2. Reopen the app and log in');
            console.log('   3. Press home button to minimize (app in background)');
            console.log('   4. Run: node test_backend_notification.js');
            console.log('   5. Check your iPhone for the notification 🔔\n');
        } else {
            console.log('\n⚠️  ISSUES DETECTED - Please fix the problems above before testing.\n');
        }
    });
});
