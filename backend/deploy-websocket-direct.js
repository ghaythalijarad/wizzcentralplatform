const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();
const apigateway = new AWS.ApiGatewayV2();

async function findWebSocketFunction() {
    console.log('🔍 Searching for WebSocket Lambda function...');
    
    try {
        // First, try to find the API Gateway
        const apis = await apigateway.getApis().promise();
        const wsApi = apis.Items.find(api => 
            api.ApiEndpoint && api.ApiEndpoint.includes('0fs1zdwyzf')
        );
        
        if (wsApi) {
            console.log(`✅ Found WebSocket API: ${wsApi.ApiId} - ${wsApi.Name}`);
            
            // Get integrations for this API
            const integrations = await apigateway.getIntegrations({ ApiId: wsApi.ApiId }).promise();
            
            for (const integration of integrations.Items) {
                if (integration.IntegrationUri && integration.IntegrationUri.includes('lambda')) {
                    const functionArn = integration.IntegrationUri.match(/functions\/(.+?)\/invocations/);
                    if (functionArn) {
                        const functionName = functionArn[1].split(':').pop();
                        console.log(`🎯 Found Lambda function: ${functionName}`);
                        return functionName;
                    }
                }
            }
        }
        
        // If API Gateway method fails, try common naming patterns
        const commonNames = [
            'wizzcentral-websocket-dev-WebSocketHandler',
            'WebSocketHandler',
            'websocket-handler',
            'wizzcentral-websocket-handler',
            'wizzcentral-websocket-dev-websocket-handler',
            'websocket-connections-handler'
        ];
        
        for (const name of commonNames) {
            try {
                await lambda.getFunction({ FunctionName: name }).promise();
                console.log(`✅ Found function with name: ${name}`);
                return name;
            } catch (err) {
                console.log(`❌ Function ${name} not found`);
            }
        }
        
        throw new Error('Could not find WebSocket Lambda function');
        
    } catch (error) {
        console.error('Error finding WebSocket function:', error.message);
        throw error;
    }
}

async function deployFunction(functionName) {
    console.log(`🚀 Deploying to function: ${functionName}`);
    
    const zipPath = path.join(__dirname, 'websocket-handler-fresh.zip');
    
    if (!fs.existsSync(zipPath)) {
        throw new Error(`Deployment package not found: ${zipPath}`);
    }
    
    const zipBuffer = fs.readFileSync(zipPath);
    
    try {
        const result = await lambda.updateFunctionCode({
            FunctionName: functionName,
            ZipFile: zipBuffer
        }).promise();
        
        console.log('✅ Function updated successfully!');
        console.log(`📝 Function ARN: ${result.FunctionArn}`);
        console.log(`📅 Last Modified: ${result.LastModified}`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error updating function:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🎯 Starting WebSocket Lambda deployment...');
        
        const functionName = await findWebSocketFunction();
        await deployFunction(functionName);
        
        console.log('🎉 Deployment completed successfully!');
        console.log('⏳ Waiting 5 seconds for deployment to propagate...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Ready for testing!');
        
    } catch (error) {
        console.error('💥 Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { findWebSocketFunction, deployFunction };
