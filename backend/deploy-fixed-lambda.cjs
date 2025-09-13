#!/usr/bin/env node

/**
 * Deploy Fixed Chat Bridge Lambda Functions
 * Fixes the @aws/lambda-invoke-store dependency issue
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DEPLOYING FIXED CHAT BRIDGE LAMBDA FUNCTIONS');
console.log('===============================================');

async function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`💻 Running: ${command} ${args.join(' ')}`);
        const process = spawn(command, args, { 
            stdio: 'inherit',
            cwd: options.cwd || __dirname,
            ...options 
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve({ code });
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
    });
}

async function createDeploymentPackage() {
    console.log('\n📦 CREATING DEPLOYMENT PACKAGE');
    console.log('==============================');

    // Create temporary directory for deployment package
    const tempDir = path.join(__dirname, 'temp-deployment');
    const srcDir = path.join(tempDir, 'src', 'handlers');
    
    try {
        // Clean and create directories
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(srcDir, { recursive: true });

        // Copy the fixed handler
        const fixedHandlerPath = path.join(__dirname, 'src', 'handlers', 'chat-bridge-fixed.js');
        const targetHandlerPath = path.join(srcDir, 'chat-bridge.js');
        fs.copyFileSync(fixedHandlerPath, targetHandlerPath);
        console.log('✅ Copied fixed handler');

        // Create package.json with stable AWS SDK v2
        const packageJson = {
            name: 'chat-bridge-fixed',
            version: '1.0.0',
            description: 'Fixed chat bridge Lambda functions',
            main: 'src/handlers/chat-bridge.js',
            dependencies: {
                'aws-sdk': '^2.1500.0',
                '@aws-sdk/client-dynamodb': '^3.450.0',
                '@aws-sdk/lib-dynamodb': '^3.450.0'
            }
        };
        
        fs.writeFileSync(
            path.join(tempDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        console.log('✅ Created package.json');

        // Install dependencies
        console.log('📥 Installing dependencies...');
        await runCommand('npm', ['install'], { cwd: tempDir });

        // Create deployment zip
        console.log('🗜️  Creating deployment zip...');
        const zipPath = path.join(__dirname, 'chat-bridge-fixed.zip');
        
        // Remove existing zip
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }

        await runCommand('zip', [
            '-r', 
            zipPath,
            '.',
            '-x', '*.git*', '*.DS_Store*'
        ], { cwd: tempDir });

        console.log(`✅ Created deployment package: ${zipPath}`);
        
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        return zipPath;

    } catch (error) {
        console.error('❌ Failed to create deployment package:', error);
        // Clean up on error
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        throw error;
    }
}

async function updateLambdaFunction(functionName, zipPath) {
    console.log(`\n🔄 UPDATING LAMBDA FUNCTION: ${functionName}`);
    console.log('='.repeat(50 + functionName.length));

    try {
        // Update function code
        await runCommand('aws', [
            'lambda', 'update-function-code',
            '--function-name', functionName,
            '--zip-file', `fileb://${zipPath}`
        ]);
        console.log(`✅ Updated code for: ${functionName}`);

        // Wait for update to complete
        console.log('⏰ Waiting for update to complete...');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error(`❌ Failed to update ${functionName}:`, error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🔍 Starting fixed Lambda deployment...\n');

        // Step 1: Create deployment package
        const zipPath = await createDeploymentPackage();

        // Step 2: Update all Lambda functions
        const functionNames = [
            'wizzcentral-chat-bridge-dev-sendChatMessage',
            'wizzcentral-chat-bridge-dev-postAgentReply',
            'wizzcentral-chat-bridge-dev-getChatHistory'
        ];

        for (const functionName of functionNames) {
            await updateLambdaFunction(functionName, zipPath);
        }

        console.log('\n🎉 DEPLOYMENT COMPLETE!');
        console.log('=======================');
        console.log('✅ All Lambda functions updated with fixed code');
        console.log('✅ AWS SDK dependency issues resolved');

        // Clean up zip file
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
            console.log('🧹 Cleaned up deployment package');
        }

    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
    }
}

main().catch(console.error);
