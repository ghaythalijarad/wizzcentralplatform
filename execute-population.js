const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iraqi Regions Population & Verification');
console.log('==========================================');

try {
    console.log('📊 Step 1: Populating comprehensive Iraqi regions...');
    const populateResult = execSync('node populate-complete-iraqi-regions.js', { 
        cwd: '/Users/ghaythallaheebi/wizzcentralplatform',
        encoding: 'utf8' 
    });
    console.log(populateResult);
    
    console.log('🔍 Step 2: Verifying regions...');
    const verifyResult = execSync('node verify-complete-iraqi-regions.js', { 
        cwd: '/Users/ghaythallaheebi/wizzcentralplatform',
        encoding: 'utf8' 
    });
    console.log(verifyResult);
    
    console.log('✅ All operations completed successfully!');
} catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stdout) console.log('Output:', error.stdout);
    if (error.stderr) console.error('Error output:', error.stderr);
}
