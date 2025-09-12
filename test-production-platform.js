#!/usr/bin/env node
// Production Platform Test Script for WizzCentral on Amplify
// Tests: navigation, auth, dashboard loading, API endpoints, mobile responsiveness

const puppeteer = require('puppeteer');

const BASE_URL = 'https://main.d2f5oacwil9cbi.amplifyapp.com';

async function testPlatform() {
    console.log('🚀 Starting WizzCentral Platform Production Test...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ Console Error: ${msg.text()}`);
            } else if (msg.text().includes('✅') || msg.text().includes('🧭')) {
                console.log(`📝 App Log: ${msg.text()}`);
            }
        });

        // Test 1: Root redirect
        console.log('1️⃣ Testing root URL redirect...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        if (finalUrl.includes('/frontend/index.html')) {
            console.log('✅ Root redirect working: ' + finalUrl);
        } else {
            console.log('❌ Root redirect failed: ' + finalUrl);
        }

        // Test 2: Login page functionality
        console.log('\n2️⃣ Testing login page...');
        await page.goto(`${BASE_URL}/frontend/index.html`, { waitUntil: 'networkidle0' });
        
        // Check if login form is present
        const loginForm = await page.$('#loginForm');
        if (loginForm) {
            console.log('✅ Login form found');
            
            // Check if test credentials are pre-filled
            const emailValue = await page.$eval('#email', el => el.value);
            if (emailValue.includes('@')) {
                console.log('✅ Test credentials pre-filled');
            }
        } else {
            console.log('❌ Login form not found');
        }

        // Test 3: Dashboard access (bypass auth for testing)
        console.log('\n3️⃣ Testing dashboard access...');
        await page.goto(`${BASE_URL}/frontend/pages/dashboard.html?test=true`, { 
            waitUntil: 'networkidle0' 
        });
        await page.waitForTimeout(3000);

        // Check if dashboard loads
        const dashboardTitle = await page.$eval('title', el => el.textContent);
        if (dashboardTitle.includes('Dashboard')) {
            console.log('✅ Dashboard page loads');
        }

        // Check if sidebar loads
        const sidebar = await page.$('#sidebar');
        if (sidebar) {
            console.log('✅ Sidebar navigation loaded');
            
            // Check navigation links
            const navLinks = await page.$$('.nav-link');
            console.log(`✅ Found ${navLinks.length} navigation links`);
        } else {
            console.log('❌ Sidebar not found');
        }

        // Check if stats cards load
        const statsCards = await page.$$('.card');
        if (statsCards.length >= 6) {
            console.log(`✅ Dashboard stats cards loaded (${statsCards.length} cards)`);
        } else {
            console.log(`⚠️ Only ${statsCards.length} stats cards found`);
        }

        // Test 4: Navigation functionality
        console.log('\n4️⃣ Testing navigation...');
        try {
            // Test clicking on a navigation link
            const merchantsLink = await page.$('a[href*="merchants"]');
            if (merchantsLink) {
                await merchantsLink.click();
                await page.waitForTimeout(2000);
                
                const currentUrl = page.url();
                if (currentUrl.includes('merchants.html')) {
                    console.log('✅ Navigation to merchants page works');
                } else {
                    console.log('❌ Navigation failed: ' + currentUrl);
                }
            }
        } catch (error) {
            console.log('⚠️ Navigation test error:', error.message);
        }

        // Test 5: Mobile responsiveness
        console.log('\n5️⃣ Testing mobile responsiveness...');
        await page.setViewport({ width: 375, height: 667 }); // iPhone SE
        await page.waitForTimeout(1000);
        
        const menuToggle = await page.$('#menuToggle');
        if (menuToggle) {
            console.log('✅ Mobile menu toggle found');
            
            // Test mobile menu
            await menuToggle.click();
            await page.waitForTimeout(500);
            
            const sidebarActive = await page.$eval('#sidebar', el => 
                el.classList.contains('active')
            ).catch(() => false);
            
            if (sidebarActive) {
                console.log('✅ Mobile sidebar opens correctly');
            } else {
                console.log('⚠️ Mobile sidebar may not be working');
            }
        }

        // Test 6: Error checking
        console.log('\n6️⃣ Checking for JavaScript errors...');
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
        });
        
        await page.waitForTimeout(2000);
        
        if (errors.length === 0) {
            console.log('✅ No JavaScript errors detected');
        } else {
            console.log(`❌ Found ${errors.length} JavaScript errors:`);
            errors.forEach(error => console.log(`   - ${error}`));
        }

        // Test 7: Performance check
        console.log('\n7️⃣ Basic performance check...');
        const metrics = await page.metrics();
        console.log(`📊 Page Metrics:`);
        console.log(`   - DOM Nodes: ${metrics.Nodes}`);
        console.log(`   - JS Heap Used: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
        console.log(`   - Layouts: ${metrics.LayoutCount}`);

        console.log('\n🎉 Platform test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Check if puppeteer is available
(async () => {
    try {
        await testPlatform();
    } catch (error) {
        if (error.message.includes('puppeteer')) {
            console.log('⚠️ Puppeteer not available. Installing...');
            console.log('Run: npm install puppeteer');
            console.log('\nAlternatively, test manually:');
            console.log(`🌐 Root: ${BASE_URL}`);
            console.log(`🔐 Login: ${BASE_URL}/frontend/index.html`);
            console.log(`📊 Dashboard: ${BASE_URL}/frontend/pages/dashboard.html?test=true`);
            console.log(`👥 Customers: ${BASE_URL}/frontend/pages/customers.html?test=true`);
            console.log(`🏪 Merchants: ${BASE_URL}/frontend/pages/merchants.html?test=true`);
        } else {
            console.error('Test error:', error);
        }
    }
})();
