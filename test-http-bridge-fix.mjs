#!/usr/bin/env node

/**
 * HTTP Bridge 502 Error Test Script
 * Tests if the Lambda function 502 errors are resolved after environment variable updates
 */

import { spawn } from 'child_process';

console.log('🧪 HTTP BRIDGE 502 ERROR TEST');
console.log('==============================');

async function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`💻 Running: ${command} ${args.join(' ')}`);
        const process = spawn(command, args, { 
            stdio: 'pipe',
            cwd: options.cwd || process.cwd(),
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

async function checkLambdaConfiguration() {
    console.log('\n⚙️  CHECKING LAMBDA CONFIGURATION');
    console.log('================================');
    
    try {
        const result = await runCommand('aws', [
            'lambda', 'list-functions',
            '--query', 'Functions[?contains(FunctionName, `chat-bridge`)].FunctionName',
            '--output', 'text'
        ]);
        
        const functionNames = result.stdout.trim().split('\n').filter(name => name);
        console.log(`Found ${functionNames.length} chat-bridge functions`);
        
        for (const functionName of functionNames) {
            console.log(`\n📋 Checking ${functionName}:`);
            
            try {
                const configResult = await runCommand('aws', [
                    'lambda', 'get-function-configuration',
                    '--function-name', functionName,
                    '--query', 'Environment.Variables',
                    '--output', 'json'
                ]);
                
                const envVars = JSON.parse(configResult.stdout);
                console.log(`  Environment Variables:`, envVars);
                
                // Check for required variables
                const requiredVars = ['WEBSOCKET_CONNECTIONS_TABLE', 'CHAT_SESSIONS_TABLE', 'CHAT_MESSAGES_TABLE'];
                const missingVars = requiredVars.filter(v => !envVars[v]);
                
                if (missingVars.length === 0) {
                    console.log(`  ✅ All required environment variables present`);
                } else {
                    console.log(`  ❌ Missing variables: ${missingVars.join(', ')}`);
                }
                
            } catch (error) {
                console.error(`  ❌ Failed to get config for ${functionName}:`, error.message);
            }
        }
        
        return functionNames;
        
    } catch (error) {
        console.error('❌ Failed to list Lambda functions:', error.message);
        return [];
    }
}

async function testHttpBridge() {
    console.log('\n🧪 TESTING HTTP BRIDGE ENDPOINTS');
    console.log('=================================');
    
    const endpoints = [
        {
            name: 'Send Message',
            url: 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send',
            method: 'POST',
            payload: {
                participantToken: 'test-driver-fix',
                message: 'Test message after Lambda fix - ' + new Date().toLocaleString(),
                contentType: 'text/plain',
                metadata: {
                    senderId: 'test-driver-fix',
                    senderType: 'driver',
                    senderName: 'Test Driver (Lambda Fix)',
                    timestamp: new Date().toISOString(),
                    driverId: 'test-driver-fix',
                    driverName: 'Test Driver',
                    platform: 'LambdaFixTest'
                }
            }
        },
        {
            name: 'Get Chat History',
            url: 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/history',
            method: 'GET'
        }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        console.log(`\n📤 Testing ${endpoint.name}...`);
        
        try {
            let curlArgs = [
                '-X', endpoint.method,
                endpoint.url,
                '-H', 'Content-Type: application/json',
                '--connect-timeout', '10',
                '--max-time', '15',
                '-w', '\\n%{http_code}',
                '-s'
            ];
            
            if (endpoint.payload) {
                curlArgs.push('-d', JSON.stringify(endpoint.payload));
            }
            
            const result = await runCommand('curl', curlArgs);
            
            const lines = result.stdout.trim().split('\n');
            const httpCode = lines[lines.length - 1];
            const responseBody = lines.slice(0, -1).join('\n');
            
            console.log(`  Status: ${httpCode}`);
            console.log(`  Response: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? '...' : ''}`);
            
            const success = httpCode.startsWith('2');
            const is502 = httpCode === '502';
            
            console.log(`  Result: ${success ? '✅ SUCCESS' : is502 ? '❌ 502 ERROR' : '⚠️  OTHER ERROR'}`);
            
            results.push({
                name: endpoint.name,
                httpCode,
                success,
                is502,
                responseBody
            });
            
        } catch (error) {
            console.error(`  ❌ Test failed: ${error.message}`);
            results.push({
                name: endpoint.name,
                httpCode: 'ERROR',
                success: false,
                is502: false,
                error: error.message
            });
        }
    }
    
    return results;
}

async function checkCloudWatchLogs() {
    console.log('\n📊 CHECKING RECENT CLOUDWATCH LOGS');
    console.log('===================================');
    
    try {
        // Get recent log groups for chat-bridge functions
        const result = await runCommand('aws', [
            'logs', 'describe-log-groups',
            '--log-group-name-prefix', '/aws/lambda/',
            '--query', 'logGroups[?contains(logGroupName, `chat-bridge`)].logGroupName',
            '--output', 'text'
        ]);
        
        const logGroups = result.stdout.trim().split('\n').filter(name => name);
        
        for (const logGroup of logGroups) {
            console.log(`\n📋 Recent logs for ${logGroup}:`);
            
            try {
                // Get recent log events (last 10 minutes)
                const startTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago
                
                const logResult = await runCommand('aws', [
                    'logs', 'filter-log-events',
                    '--log-group-name', logGroup,
                    '--start-time', startTime.toString(),
                    '--limit', '10',
                    '--query', 'events[].message',
                    '--output', 'text'
                ]);
                
                if (logResult.stdout.trim()) {
                    const messages = logResult.stdout.trim().split('\n');
                    messages.forEach((msg, i) => {
                        console.log(`  [${i + 1}] ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
                    });
                } else {
                    console.log(`  📝 No recent log events found`);
                }
                
            } catch (error) {
                console.error(`  ❌ Failed to get logs: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to check CloudWatch logs:', error.message);
    }
}

async function main() {
    try {
        console.log('🔍 Starting HTTP Bridge test after Lambda fixes...\n');
        
        // Step 1: Check Lambda configuration
        const functionNames = await checkLambdaConfiguration();
        
        if (functionNames.length === 0) {
            console.log('❌ No chat-bridge Lambda functions found');
            return;
        }
        
        // Step 2: Test HTTP endpoints
        const testResults = await testHttpBridge();
        
        // Step 3: Check CloudWatch logs
        await checkCloudWatchLogs();
        
        // Step 4: Summary
        console.log('\n🎯 TEST RESULTS SUMMARY');
        console.log('=======================');
        
        const successfulTests = testResults.filter(r => r.success);
        const failedTests = testResults.filter(r => !r.success);
        const error502Tests = testResults.filter(r => r.is502);
        
        console.log(`✅ Successful: ${successfulTests.length}/${testResults.length}`);
        console.log(`❌ Failed: ${failedTests.length}/${testResults.length}`);
        console.log(`🚨 502 Errors: ${error502Tests.length}/${testResults.length}`);
        
        if (successfulTests.length === testResults.length) {
            console.log('\n🎉 ALL TESTS PASSED! HTTP Bridge 502 errors are FIXED!');
            console.log('\n📋 Next Steps:');
            console.log('1. ✅ Test message delivery from Flutter app');
            console.log('2. ✅ Verify messages appear in Central Platform live chat');
            console.log('3. ✅ Complete Flutter WebSocket stabilization');
        } else if (error502Tests.length > 0) {
            console.log('\n🚨 502 ERRORS STILL PRESENT');
            console.log('\n🔍 Additional debugging needed:');
            console.log('1. Check Lambda deployment status');
            console.log('2. Verify DynamoDB table permissions');
            console.log('3. Check API Gateway integration');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED (non-502 errors)');
            console.log('\n🔍 Investigation needed:');
            console.log('1. Check authentication requirements');
            console.log('2. Verify request payload format');
            console.log('3. Check API endpoint URLs');
        }
        
        // Detailed results
        console.log('\n📊 DETAILED RESULTS:');
        testResults.forEach(result => {
            console.log(`  ${result.success ? '✅' : '❌'} ${result.name}: ${result.httpCode}`);
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });
        
    } catch (error) {
        console.error('\n❌ Test process failed:', error.message);
    }
}

main().catch(console.error);
