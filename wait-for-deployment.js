#!/usr/bin/env node

const https = require('https');

async function checkSite() {
    return new Promise((resolve, reject) => {
        https.get('https://main.d2f5oacwil9cbi.amplifyapp.com/', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const isLoginPage = data.includes('WizzCentral Platform - Login');
                const isRedirectPage = data.includes('If you are not redirected automatically');
                
                resolve({
                    status: res.statusCode,
                    isLoginPage,
                    isRedirectPage,
                    title: data.match(/<title[^>]*>([^<]+)</title>/)?.[1] || 'No title',
                    firstLine: data.split('\n')[0]
                });
            });
        }).on('error', reject);
    });
}

async function waitForDeployment() {
    console.log('🔄 Waiting for Amplify deployment to complete...\n');
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes
    
    while (attempts < maxAttempts) {
        try {
            const result = await checkSite();
            console.log(`Attempt ${attempts + 1}: Status ${result.status} - ${result.title}`);
            
            if (result.isLoginPage) {
                console.log('\n✅ Success! Login page is now live.');
                console.log('🌐 Visit: https://main.d2f5oacwil9cbi.amplifyapp.com/');
                return true;
            } else if (result.isRedirectPage) {
                console.log('   Still showing redirect page, waiting...');
            } else {
                console.log(`   Unexpected content: ${result.firstLine}`);
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
    }
    
    console.log('\n⏰ Timeout reached. Please check Amplify Console manually.');
    return false;
}

if (require.main === module) {
    waitForDeployment().catch(console.error);
}

module.exports = { checkSite, waitForDeployment };
