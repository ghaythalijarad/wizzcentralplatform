#!/usr/bin/env node

/**
 * Merchant Chat Deployment Verification Script
 * Checks all components: API Gateway, Lambda, DynamoDB, and CloudFormation
 * Updated: November 12, 2025
 */

const { execSync } = require('child_process');

const AWS_PROFILE = 'wizz-drivers-ghayth-dev';
const AWS_REGION = 'us-east-1';
const STAGE = process.argv[2] || 'dev';
const API_ID = STAGE === 'dev' ? '7ysrz3rspi' : null; // Only for dev stage

// Helper to run AWS CLI commands
function runAWS(command) {
  try {
    const result = execSync(
      `AWS_PAGER="" aws ${command} --profile ${AWS_PROFILE} --region ${AWS_REGION} --output json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return JSON.parse(result);
  } catch (error) {
    if (error.stderr) {
      return { error: error.stderr.toString() };
    }
    return { error: error.message };
  }
}

console.log('🔍 MERCHANT CHAT DEPLOYMENT VERIFICATION');
console.log('==========================================');
console.log(`   Stage: ${STAGE}`);
console.log(`   Profile: ${AWS_PROFILE}`);
console.log(`   Region: ${AWS_REGION}\n`);

// 1. Check CloudFormation Stack
console.log('📦 1. CloudFormation Stack Status:');
const stackName = `wizzcentral-websocket-${STAGE}`;
console.log(`   Checking: ${stackName}`);
const stack = runAWS(`cloudformation describe-stacks --stack-name ${stackName}`);
if (stack.error) {
  console.log('   ❌ Stack not found or error:', stack.error.split('\n')[0]);
} else {
  const stackInfo = stack.Stacks[0];
  console.log(`   ✅ Status: ${stackInfo.StackStatus}`);
  console.log(`   📅 Last Updated: ${stackInfo.LastUpdatedTime || stackInfo.CreationTime}`);
}
console.log('');

// 2. Check WebSocket API
console.log('📡 2. WebSocket API Gateway:');
let apiId = API_ID;
let api = null;
if (!apiId) {
  // Try to find API by name for non-dev stages
  const apiName = `WizzCentral-Chat-WebSocket-${STAGE}`;
  const apis = runAWS('apigatewayv2 get-apis');
  if (!apis.error && apis.Items) {
    const foundApi = apis.Items.find(a => a.Name === apiName);
    if (foundApi) {
      apiId = foundApi.ApiId;
      console.log(`   Found API by name: ${apiName}`);
    }
  }
}
if (!apiId) {
  console.log('   ❌ API ID not found');
} else {
  console.log(`   Checking API: ${apiId}`);
  api = runAWS(`apigatewayv2 get-api --api-id ${apiId}`);
  if (api.error) {
    console.log('   ❌ API not found:', api.error.split('\n')[0]);
  } else {
    console.log(`   ✅ Name: ${api.Name}`);
    console.log(`   ✅ Endpoint: ${api.ApiEndpoint}`);
    console.log(`   ✅ Route Selection: ${api.RouteSelectionExpression}`);
  }
}
console.log('');

// 3. Check Routes
console.log('🛣️  3. WebSocket Routes:');
let routesData = null;
if (apiId) {
  const routes = runAWS(`apigatewayv2 get-routes --api-id ${apiId}`);
  if (routes.error) {
    console.log('   ❌ Cannot get routes:', routes.error.split('\n')[0]);
  } else {
    routesData = routes;
    const merchantRoute = routes.Items.find(r => r.RouteKey === 'chat_merchant_connect');
    if (merchantRoute) {
      console.log('   ✅ chat_merchant_connect route exists');
      console.log(`      Target: ${merchantRoute.Target}`);
    } else {
      console.log('   ❌ chat_merchant_connect route NOT FOUND');
    }
    
    console.log(`   📊 Total routes: ${routes.Items.length}`);
    routes.Items.forEach(r => {
      console.log(`      - ${r.RouteKey}`);
    });
  }
} else {
  console.log('   ⏭️  Skipped (no API ID)');
}
console.log('');

// 4. Check Lambda Functions
console.log('λ  4. Lambda Functions:');
const lambdaFunctions = [
  `wizzcentral-websocket-${STAGE}-websocketConnect`,
  `wizzcentral-websocket-${STAGE}-liveChatConnect`,
  `wizzcentral-websocket-${STAGE}-liveChatMessage`,
  `wizzcentral-websocket-${STAGE}-websocketDisconnect`
];

for (const funcName of lambdaFunctions) {
  const func = runAWS(`lambda get-function-configuration --function-name ${funcName}`);
  if (func.error) {
    console.log(`   ❌ ${funcName}: NOT FOUND`);
  } else {
    console.log(`   ✅ ${funcName}`);
    console.log(`      Last Modified: ${func.LastModified}`);
    console.log(`      Runtime: ${func.Runtime}`);
    console.log(`      Tables: ${func.Environment?.Variables?.CHAT_SESSIONS_TABLE || 'not set'}`);
  }
}
console.log('');

// 5. Check DynamoDB Tables
console.log('🗄️  5. DynamoDB Tables:');
const tables = [
  `websocket-connections-${STAGE}`,
  `chat-sessions-${STAGE}`,
  `chat-messages-${STAGE}`
];
for (const tableName of tables) {
  const table = runAWS(`dynamodb describe-table --table-name ${tableName}`);
  if (table.error) {
    console.log(`   ❌ ${tableName}: NOT FOUND`);
  } else {
    console.log(`   ✅ ${tableName}`);
    console.log(`      Status: ${table.Table.TableStatus}`);
    console.log(`      Items: ${table.Table.ItemCount || 0}`);
  }
}
console.log('');

// 6. Check Recent Logs
console.log('📊 6. Recent CloudWatch Logs:');
const logGroup = `/aws/lambda/wizzcentral-websocket-${STAGE}-liveChatConnect`;
console.log(`   Checking: ${logGroup}`);
try {
  const logs = execSync(
    `AWS_PAGER="" aws logs tail ${logGroup} --profile ${AWS_PROFILE} --region ${AWS_REGION} --since 30m --format short 2>&1 | head -15`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  if (logs.includes('merchant-chat-deploy') || logs.includes('BUILD_VERSION')) {
    console.log('   ✅ Recent deployment detected!');
    console.log('   📝 Sample logs:');
    console.log(logs.split('\n').slice(0, 5).map(l => `      ${l}`).join('\n'));
  } else if (logs.trim()) {
    console.log('   ⚠️  Logs found but no recent merchant chat deployment:');
    console.log(logs.split('\n').slice(0, 3).map(l => `      ${l}`).join('\n'));
  } else {
    console.log('   ⚠️  No recent logs found');
  }
} catch (error) {
  console.log('   ❌ Cannot access logs:', error.message.split('\n')[0]);
}
console.log('');

// Summary
console.log('==========================================');
console.log('📋 VERIFICATION SUMMARY\n');

const checks = {
  'CloudFormation Stack': !stack.error,
  'WebSocket API': api && !api.error,
  'Merchant Connect Route': !!(routesData && routesData.Items && routesData.Items.some(r => r.RouteKey === 'chat_merchant_connect')),
  'Lambda Functions': lambdaFunctions.every(f => 
    !runAWS(`lambda get-function-configuration --function-name ${f}`).error
  ),
  'DynamoDB Tables': tables.every(t => 
    !runAWS(`dynamodb describe-table --table-name ${t}`).error
  )
};

Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

console.log('');
const allPassed = Object.values(checks).every(v => v);
if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED! Ready to test merchant chat.');
  console.log('\nNext steps:');
  console.log('1. Run: node handshake-test.js');
  console.log('2. Check CloudWatch logs for connection');
  console.log('3. Test from Flutter merchant app');
} else {
  console.log('⚠️  SOME CHECKS FAILED. Deployment may be needed.');
  console.log('\nRecommended action:');
  console.log(`Run: npx serverless deploy -c serverless.websocket.yml --stage ${STAGE} --region ${AWS_REGION}`);
}
console.log('');