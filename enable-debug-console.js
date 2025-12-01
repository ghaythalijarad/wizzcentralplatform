// Debug Mode Enabler for WizzCentral Platform
// Paste this entire script into Chrome DevTools Console (Cmd+Option+J)

(function() {
    console.log('🔧 Enabling WizzCentral Debug Mode...');
    
    // Enable debug mode
    sessionStorage.setItem('debugMode', 'true');
    console.log('✅ Debug mode enabled');
    
    // Set a fake token to bypass checks
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('idToken', 'debug-mode-token');
    localStorage.setItem('userEmail', 'debug@whizzcentral.local');
    console.log('✅ Debug credentials set');
    
    console.log('🔄 Reloading page...');
    
    // Reload the page
    setTimeout(() => {
        location.reload();
    }, 500);
})();
