const AWS = require('aws-sdk');
const fs = require('fs');

// Set up AWS clients
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();
const apigateway = new AWS.ApiGatewayV2();

async function findAndUpdateWebSocketFunction() {
    console.log('🔍 Starting comprehensive Lambda function search...');
    
    try {
        // Step 1: Get all Lambda functions
        console.log('📋 Getting all Lambda functions...');
        const allFunctions = await lambda.listFunctions().promise();
        
        console.log(`Found ${allFunctions.Functions.length} total Lambda functions`);
        
        // Step 2: Look for functions with websocket-related names
        const candidates = allFunctions.Functions.filter(func => {
            const name = func.FunctionName.toLowerCase();
            return name.includes('websocket') || 
                   name.includes('socket') || 
                   name.includes('chat') ||
                   name.includes('wizzcentral');
        });
        
        console.log(`Found ${candidates.length} potential WebSocket functions:`);
        candidates.forEach(func => {
            console.log(`  - ${func.FunctionName} (${func.Runtime}, modified: ${func.LastModified})`);
        });
        
        // Step 3: Try to find the function connected to our API Gateway
        console.log('🔌 Checking API Gateway integrations...');
        try {
            const integrations = await apigateway.getIntegrations({ ApiId: '0fs1zdwyzf' }).promise();
            
            for (const integration of integrations.Items) {
                if (integration.IntegrationUri) {
                    console.log(`Found integration URI: ${integration.IntegrationUri}`);
                    
                    // Extract function name from ARN
                    const match = integration.IntegrationUri.match(/functions\/([^\/]+)/);
                    if (match) {
                        const functionName = match[1];
                        console.log(`🎯 Extracted function name: ${functionName}`);
                        
                        // Try to update this function
                        await updateLambdaFunction(functionName);
                        return;
                    }
                }
            }
        } catch (apiError) {
            console.log('⚠️ Could not access API Gateway integrations, trying function names directly');
        }
        
        // Step 4: Try updating each candidate function
        for (const func of candidates) {
            try {
                console.log(`🧪 Attempting to update function: ${func.FunctionName}`);
                await updateLambdaFunction(func.FunctionName);
                console.log(`✅ Successfully updated: ${func.FunctionName}`);
                return;
            } catch (error) {
                console.log(`❌ Failed to update ${func.FunctionName}: ${error.message}`);
            }
        }
        
        throw new Error('Could not find or update any WebSocket Lambda function');
        
    } catch (error) {
        console.error('💥 Search failed:', error.message);
        throw error;
    }
}

async function updateLambdaFunction(functionName) {
    console.log(`🚀 Updating Lambda function: ${functionName}`);
    
    const zipPath = './websocket-handler-fresh.zip';
    
    if (!fs.existsSync(zipPath)) {
        throw new Error(`Deployment package not found: ${zipPath}`);
    }
    
    const zipBuffer = fs.readFileSync(zipPath);
    
    const result = await lambda.updateFunctionCode({
        FunctionName: functionName,
        ZipFile: zipBuffer
    }).promise();
    
    console.log(`✅ Function updated successfully!`);
    console.log(`📝 Function ARN: ${result.FunctionArn}`);
    console.log(`📅 Last Modified: ${result.LastModified}`);
    
    // Wait for the update to complete
    console.log('⏳ Waiting for update to propagate...');
    await lambda.waitFor('functionUpdated', { FunctionName: functionName }).promise();
    
    return result;
}

async function main() {
    try {
        await findAndUpdateWebSocketFunction();
        
        console.log('🎉 Deployment completed successfully!');
        console.log('⏳ Waiting 10 seconds for changes to propagate...');
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('✅ Ready for testing!');
        
    } catch (error) {
        console.error('💥 Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
