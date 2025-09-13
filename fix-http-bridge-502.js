#!/usr/bin/env node

/**
 * HTTP Bridge 502 Error Fix Script
 * Diagnoses and fixes the Lambda function issues causing 502 errors
 */

console.log('🔧 HTTP BRIDGE 502 ERROR DIAGNOSTIC & FIX');
console.log('==========================================');

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`💻 Running: ${command} ${args.join(' ')}`);
        const process = spawn(command, args, { 
            stdio: 'pipe',
            cwd: options.cwd || __dirname,
            ...options 
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
        });
    });
}

async function checkDynamoDBTables() {
    console.log('\n📊 CHECKING DYNAMODB TABLES');
    console.log('============================');
    
    const requiredTables = [
        'websocket-connections-dev',
        'chat-sessions-dev',
        'chat-messages-dev'
    ];
    
    const existingTables = [];
    const missingTables = [];
    
    for (const tableName of requiredTables) {
        try {
            console.log(`🔍 Checking table: ${tableName}`);
            await runCommand('aws', ['dynamodb', 'describe-table', '--table-name', tableName]);
            existingTables.push(tableName);
            console.log(`  ✅ Found: ${tableName}`);
        } catch (error) {
            missingTables.push(tableName);
            console.log(`  ❌ Missing: ${tableName}`);
        }
    }
    
    return { existingTables, missingTables };
}

async function createMissingTables(missingTables) {
    console.log('\n🏗️  CREATING MISSING DYNAMODB TABLES');
    console.log('====================================');
    
    for (const tableName of missingTables) {
        console.log(`🏗️  Creating table: ${tableName}`);
        try {
            if (tableName === 'websocket-connections-dev') {
                await runCommand('aws', [
                    'dynamodb', 'create-table',
                    '--table-name', tableName,
                    '--attribute-definitions',
                    'AttributeName=connectionId,AttributeType=S',
                    'AttributeName=userType,AttributeType=S',
                    '--key-schema',
                    'AttributeName=connectionId,KeyType=HASH',
                    '--billing-mode', 'PAY_PER_REQUEST'
                ]);
            } else if (tableName === 'chat-sessions-dev') {
                await runCommand('aws', [
                    'dynamodb', 'create-table',
                    '--table-name', tableName,
                    '--attribute-definitions',
                    'AttributeName=sessionId,AttributeType=S',
                    '--key-schema',
                    'AttributeName=sessionId,KeyType=HASH',
                    '--billing-mode', 'PAY_PER_REQUEST'
                ]);
            } else if (tableName === 'chat-messages-dev') {
                await runCommand('aws', [
                    'dynamodb', 'create-table',
                    '--table-name', tableName,
                    '--attribute-definitions',
                    'AttributeName=sessionId,AttributeType=S',
                    'AttributeName=messageKey,AttributeType=S',
                    '--key-schema',
                    'AttributeName=sessionId,KeyType=HASH',
                    'AttributeName=messageKey,KeyType=RANGE',
                    '--billing-mode', 'PAY_PER_REQUEST'
                ]);
            }
            
            console.log(`  ✅ Created: ${tableName}`);
            
            // Wait for table to be active
            console.log(`  ⏰ Waiting for ${tableName} to be active...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            
        } catch (error) {
            console.error(`  ❌ Failed to create ${tableName}:`, error.message);
        }
    }
}

async function fixLambdaEnvironmentVariables() {
    console.log('\n⚙️  FIXING LAMBDA ENVIRONMENT VARIABLES');
    console.log('======================================');
    
    // Find the chat bridge Lambda function
    try {
        const result = await runCommand('aws', [
            'lambda', 'list-functions',
            '--query', 'Functions[?contains(FunctionName, `chat-bridge`)].FunctionName',
            '--output', 'text'
        ]);
        
        const functionNames = result.stdout.trim().split('\n').filter(name => name);
        
        if (functionNames.length === 0) {
            console.log('❌ No chat-bridge Lambda functions found');
            return;
        }
        
        for (const functionName of functionNames) {
            console.log(`🔧 Updating environment variables for: ${functionName}`);
            
            try {
                await runCommand('aws', [
                    'lambda', 'update-function-configuration',
                    '--function-name', functionName,
                    '--environment',
                    'Variables={WEBSOCKET_CONNECTIONS_TABLE=websocket-connections-dev,CHAT_SESSIONS_TABLE=chat-sessions-dev,CHAT_MESSAGES_TABLE=chat-messages-dev,AWS_REGION=us-east-1,STAGE=dev}'
                ]);
                console.log(`  ✅ Updated environment variables for: ${functionName}`);
            } catch (error) {
                console.error(`  ❌ Failed to update ${functionName}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to list Lambda functions:', error.message);
    }
}

async function testHttpBridge() {
    console.log('\n🧪 TESTING HTTP BRIDGE');
    console.log('=======================');
    
    const testPayload = {
        participantToken: 'test-driver-fix',
        message: 'Test message after fix - ' + new Date().toLocaleString(),
        contentType: 'text/plain',
        metadata: {
            senderId: 'test-driver-fix',
            senderType: 'driver',
            senderName: 'Test Driver (Fix Validation)',
            timestamp: new Date().toISOString(),
            driverId: 'test-driver-fix',
            driverName: 'Test Driver',
            platform: 'FixValidation'
        }
    };
    
    try {
        console.log('📤 Sending test message...');
        
        const result = await runCommand('curl', [
            '-X', 'POST',
            'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send',
            '-H', 'Content-Type: application/json',
            '-d', JSON.stringify(testPayload),
            '--connect-timeout', '10',
            '--max-time', '15',
            '-w', '%{http_code}'
        ]);
        
        console.log('📨 Response:', result.stdout);
        
        if (result.stdout.includes('200')) {
            console.log('✅ HTTP Bridge is working correctly!');
            return true;
        } else {
            console.log('❌ HTTP Bridge still returning errors');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('🔍 Starting HTTP Bridge diagnostic...\n');
        
        // Step 1: Check DynamoDB tables
        const { existingTables, missingTables } = await checkDynamoDBTables();
        
        console.log(`\n📊 Table Status:`);
        console.log(`   ✅ Existing: ${existingTables.length}`);
        console.log(`   ❌ Missing: ${missingTables.length}`);
        
        // Step 2: Create missing tables
        if (missingTables.length > 0) {
            await createMissingTables(missingTables);
        }
        
        // Step 3: Fix Lambda environment variables
        await fixLambdaEnvironmentVariables();
        
        // Step 4: Wait a moment for changes to take effect
        console.log('\n⏰ Waiting for changes to take effect...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Step 5: Test the HTTP bridge
        const testResult = await testHttpBridge();
        
        console.log('\n🎯 FIX SUMMARY');
        console.log('==============');
        console.log(`DynamoDB Tables: ${missingTables.length > 0 ? '🔧 Fixed' : '✅ OK'}`);
        console.log(`Lambda Environment: 🔧 Updated`);
        console.log(`HTTP Bridge Test: ${testResult ? '✅ WORKING' : '❌ Still Issues'}`);
        
        if (testResult) {
            console.log('\n🎉 HTTP BRIDGE 502 ERROR FIXED SUCCESSFULLY!');
            console.log('\n📋 Next Steps:');
            console.log('1. Test message delivery from Flutter app');
            console.log('2. Verify messages appear in Central Platform');
            console.log('3. Monitor CloudWatch logs for any remaining issues');
        } else {
            console.log('\n🔍 Additional investigation needed:');
            console.log('1. Check CloudWatch logs for the Lambda function');
            console.log('2. Verify IAM permissions for DynamoDB access');
            console.log('3. Check API Gateway configuration');
        }
        
    } catch (error) {
        console.error('\n❌ Fix process failed:', error.message);
        console.log('\n🔧 Manual steps required:');
        console.log('1. Check AWS CLI authentication');
        console.log('2. Verify DynamoDB table creation permissions');
        console.log('3. Check Lambda deployment permissions');
    }
}

main().catch(console.error);
