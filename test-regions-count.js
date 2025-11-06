// Quick test to verify comprehensive regions data
const fs = require('fs');
const path = require('path');

// Read the server file to extract the regions data
const serverFile = fs.readFileSync(path.join(__dirname, 'local-dev-server.js'), 'utf8');

// Extract the comprehensiveIraqiRegions array (simple pattern matching)
const match = serverFile.match(/const comprehensiveIraqiRegions = \[([\s\S]*?)\];/);

if (match) {
    console.log('✅ Found comprehensiveIraqiRegions array');
    
    // Count Najaf regions by searching for governorate_id: 'najaf'
    const najafMatches = (match[1].match(/governorate_id: 'najaf'/g) || []).length;
    console.log(`📊 Total Najaf regions: ${najafMatches}`);
    
    // Count by level
    const districtMatches = (match[1].match(/level: 'district'[\s\S]*?governorate_id: 'najaf'/g) || []).length;
    const neighborhoodMatches = (match[1].match(/level: 'neighborhood'[\s\S]*?governorate_id: 'najaf'/g) || []).length;
    const governorateMatches = (match[1].match(/level: 'governorate'[\s\S]*?id: 'najaf'/g) || []).length;
    
    console.log(`📍 Najaf breakdown:`);
    console.log(`   - Governorates: ${governorateMatches}`);
    console.log(`   - Districts: ${districtMatches}`);
    console.log(`   - Neighborhoods: ${neighborhoodMatches}`);
    console.log(`   - Total: ${governorateMatches + districtMatches + neighborhoodMatches}`);
    
    // Test server startup
    console.log('\n🚀 Starting server test...');
    
    try {
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        
        // Simulate the regions endpoint
        app.get('/api/regions', (req, res) => {
            // This would normally load from comprehensiveIraqiRegions
            res.json({
                success: true,
                data: [], // We'll populate this in the actual server
                totalCount: najafMatches,
                message: 'Comprehensive Najaf regions loaded successfully'
            });
        });
        
        const server = app.listen(3001, () => {
            console.log('✅ Test server started on port 3001');
            console.log(`📊 Ready to serve ${najafMatches} Najaf regions`);
            
            // Test the endpoint
            setTimeout(() => {
                const http = require('http');
                const req = http.get('http://localhost:3001/api/regions', (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        console.log('🧪 Test response:', JSON.parse(data));
                        server.close();
                        console.log('🛑 Test server stopped');
                    });
                });
            }, 1000);
        });
        
    } catch (error) {
        console.log('❌ Could not start test server:', error.message);
    }
    
} else {
    console.log('❌ Could not find comprehensiveIraqiRegions array');
}
