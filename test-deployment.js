#!/usr/bin/env node

// Test script to validate Amplify deployment
const https = require('https');
const url = require('url');

const AMPLIFY_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com';

async function testUrl(testUrl, expectedContent = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(testUrl);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                'User-Agent': 'WizzCentral-Test/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const result = {
                    url: testUrl,
                    status: res.statusCode,
                    headers: res.headers,
                    contentLength: data.length,
                    hasExpectedContent: expectedContent ? data.includes(expectedContent) : null,
                    isRedirect: res.statusCode >= 300 && res.statusCode < 400,
                    redirectLocation: res.headers.location
                };
                resolve(result);
            });
        });

        req.on('error', (error) => {
            reject({ url: testUrl, error: error.message });
        });

        req.setTimeout(10000, () => {
            req.abort();
            reject({ url: testUrl, error: 'Timeout' });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing WizzCentral Platform Deployment...\n');

    const tests = [
        {
            name: 'Root URL',
            url: AMPLIFY_URL,
            expected: 'WizzCentral'
        },
        {
            name: 'Login Page',
            url: `${AMPLIFY_URL}/index.html`,
            expected: 'WizzCentral Platform - Login'
        },
        {
            name: 'Dashboard Page',
            url: `${AMPLIFY_URL}/pages/dashboard.html`,
            expected: 'Dashboard Overview'
        },
        {
            name: 'Config File',
            url: `${AMPLIFY_URL}/config.js`,
            expected: 'WIZZCENTRAL_CONFIG'
        },
        {
            name: 'Auth Utils',
            url: `${AMPLIFY_URL}/assets/js/auth-utils.js`,
            expected: 'Auth utilities loaded successfully'
        },
        {
            name: 'Sidebar Include',
            url: `${AMPLIFY_URL}/includes/sidebar.html`,
            expected: 'WizzCentral'
        }
    ];

    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const result = await testUrl(test.url, test.expected);
            results.push({ ...test, ...result, success: true });
            
            const status = result.status === 200 ? '✅' : '❌';
            const content = result.hasExpectedContent === null ? '' : 
                           result.hasExpectedContent ? '✅ Content' : '❌ Content';
            
            console.log(`  ${status} ${result.status} (${result.contentLength} bytes) ${content}`);
            
            if (result.isRedirect) {
                console.log(`  🔄 Redirects to: ${result.redirectLocation}`);
            }
        } catch (error) {
            results.push({ ...test, ...error, success: false });
            console.log(`  ❌ Error: ${error.error}`);
        }
        console.log('');
    }

    // Summary
    const successful = results.filter(r => r.success && r.status === 200).length;
    const total = results.length;
    
    console.log('📊 Test Summary:');
    console.log(`✅ Successful: ${successful}/${total}`);
    
    if (successful === total) {
        console.log('🎉 All tests passed! Platform is deployed correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the deployment.');
    }
    
    return results;
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testUrl, runTests };
