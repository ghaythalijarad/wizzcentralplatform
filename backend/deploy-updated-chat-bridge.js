#!/usr/bin/env node

/**
 * Deploy Updated Chat Bridge with API Key Support
 * Updates the existing Lambda function with cross-platform API key authentication
 */

const { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Try different possible function names
const possibleFunctionNames = [
    'chat-bridge-handler',
    'WizzCentral-chat-bridge',
    'wizzcentral-chat-bridge',
    'enhanced-websocket-default'
];

async function deployUpdatedChatBridge() {
    console.log('🚀 Deploying Updated Chat Bridge with API Key Support...');

    try {
        // Find the existing function
        const functionName = await findExistingFunction();
        if (!functionName) {
            console.log('❌ No existing chat bridge function found');
            console.log('Available function names to try:', possibleFunctionNames);
            return;
        }

        console.log(`✅ Found existing function: ${functionName}`);

        // Create deployment package
        const zipPath = await createDeploymentPackage();
        console.log('✅ Deployment package created');

        // Update Lambda function
        await updateLambdaFunction(functionName, zipPath);
        console.log('✅ Lambda function updated successfully');

        console.log('\n🎉 Chat Bridge updated with API key support!');
        console.log('🔑 Valid API keys:');
        console.log('   - wizzdriver_mobile_app_v1');
        console.log('   - wizzcentral_platform_v1');
        console.log('📡 Usage: Include X-API-Key header in requests');

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

async function findExistingFunction() {
    for (const name of possibleFunctionNames) {
        try {
            await lambdaClient.send(new GetFunctionCommand({ FunctionName: name }));
            return name;
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                console.log(`⚠️ Error checking function ${name}:`, error.message);
            }
        }
    }
    return null;
}

async function createDeploymentPackage() {
    const zipPath = path.join(__dirname, 'updated-chat-bridge.zip');
    
    // Remove existing zip
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => resolve(zipPath));
        archive.on('error', reject);
        
        archive.pipe(output);
        
        // Add the updated handler file as index.js
        archive.file('src/handlers/chat-bridge.js', { name: 'index.js' });
        
        // Add package.json
        const packageJson = {
            name: 'updated-chat-bridge',
            version: '1.0.0',
            main: 'index.js',
            dependencies: {
                '@aws-sdk/client-apigatewaymanagementapi': '^3.0.0',
                '@aws-sdk/client-dynamodb': '^3.0.0',
                '@aws-sdk/lib-dynamodb': '^3.0.0'
            }
        };
        
        archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });
        archive.finalize();
    });
}

async function updateLambdaFunction(functionName, zipPath) {
    const zipBuffer = fs.readFileSync(zipPath);

    console.log(`📝 Updating function: ${functionName}...`);
    
    await lambdaClient.send(new UpdateFunctionCodeCommand({
        FunctionName: functionName,
        ZipFile: zipBuffer
    }));

    // Clean up zip file
    fs.unlinkSync(zipPath);
}

// Run deployment
deployUpdatedChatBridge();
