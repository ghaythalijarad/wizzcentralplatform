// Clear all sessions and test login
// Paste this in browser console on index.html

(function clearAndTest() {
    console.log('🧹 Clearing all sessions...');
    
    // Clear all storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ All sessions cleared');
    
    // Check if login form is visible
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Login form is visible');
        
        // Check if AuthService is available
        if (window.AuthService) {
            console.log('✅ AuthService is loaded');
        } else {
            console.log('❌ AuthService not loaded - check auth-service.js');
        }
        
        // Fill form and test
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField && passwordField) {
            emailField.value = 'g87_a@yahoo.com';
            passwordField.value = 'Gha@551987';
            console.log('✅ Form fields filled');
            console.log('💡 Now try clicking the "Sign In" button');
        }
    } else {
        console.log('❌ Login form not found - page may not have loaded properly');
    }
    
    // Reload page to ensure clean state
    setTimeout(() => {
        console.log('🔄 Reloading page in 2 seconds for clean state...');
        location.reload();
    }, 2000);
})();
