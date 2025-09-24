#!/usr/bin/env node
console.log('🚀 Starting WizzCentral Platform...');

try {
    console.log('📍 Current directory:', process.cwd());
    console.log('📍 Node version:', process.version);
    
    // Check if required files exist
    const fs = require('fs');
    const path = require('path');
    
    const serverFile = path.join(__dirname, 'local-dev-server.js');
    console.log('📍 Server file path:', serverFile);
    console.log('📍 Server file exists:', fs.existsSync(serverFile));
    
    // Start the server
    require('./local-dev-server.js');
} catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
