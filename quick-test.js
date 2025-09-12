#!/usr/bin/env node

// Quick deployment validation test
const https = require('https');

const AMPLIFY_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com';

function testSite() {
    return new Promise((resolve, reject) => {
        const req = https.get(AMPLIFY_URL, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`\n🧪 Testing ${AMPLIFY_URL}`);
                console.log(`HTTP Status: ${res.statusCode}`);
                console.log(`Content-Length: ${data.length} bytes`);
                
                // Check for various indicators
                const checks = {
                    'Login Page': data.includes('WizzCentral Platform - Login'),
                    'No Redirect Loop': !data.includes('If you are not redirected'),
                    'Has CSS': data.includes('dashboard.css'),
                    'Has Scripts': data.includes('config.js'),
                    'No 404 Content': !data.includes('404') && !data.includes('Not Found')
                };
                
                console.log('\n📋 Content Checks:');
                Object.entries(checks).forEach(([check, passed]) => {
                    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
                });
                
                const allPassed = Object.values(checks).every(Boolean);
                
                if (allPassed && res.statusCode === 200) {
                    console.log('\n🎉 SUCCESS: Platform is deployed and working!');
                    console.log('✅ You can now access the login page');
                    resolve(true);
                } else {
                    console.log('\n⚠️ Issues detected:');
                    if (res.statusCode !== 200) console.log(`  - HTTP ${res.statusCode}`);
                    if (data.includes('If you are not redirected')) {
                        console.log('  - Still showing redirect page');
                    }
                    if (data.length < 1000) {
                        console.log('  - Content too short, might be error page');
                        console.log(`  - First 200 chars: ${data.substring(0, 200)}`);
                    }
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ Request failed: ${err.message}`);
            reject(err);
        });
        
        req.setTimeout(10000, () => {
            console.log('⏰ Request timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function runQuickTest() {
    console.log('🚀 Quick WizzCentral Platform Test');
    console.log('================================');
    
    try {
        const success = await testSite();
        
        if (success) {
            console.log('\n🔗 Next Steps:');
            console.log('1. Test login with: g87_a@yahoo.com / Gha@551987');
            console.log('2. Navigate to dashboard and other pages');
            console.log('3. Test mobile responsiveness');
            console.log('4. Validate live chat functionality');
            
            process.exit(0);
        } else {
            console.log('\n🔄 Deployment may still be in progress...');
            console.log('Check Amplify console: https://console.aws.amazon.com/amplify/home');
            process.exit(1);
        }
    } catch (error) {
        console.log(`\n❌ Test failed: ${error.message}`);
        process.exit(1);
    }
}

runQuickTest();
