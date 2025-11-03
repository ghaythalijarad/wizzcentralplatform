// Test Toggle Functionality Across All Pages
// This script helps debug hamburger menu toggle issues

(function() {
    'use strict';
    
    console.log('🧪 Starting toggle functionality test...');
    
    // Test function
    function testToggleElements() {
        const results = {
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            tests: {}
        };
        
        // Test 1: Check if sidebar exists
        const sidebar = document.getElementById('sidebar');
        results.tests.sidebar_exists = !!sidebar;
        console.log('📋 Sidebar exists:', results.tests.sidebar_exists);
        
        // Test 2: Check if main content exists
        const mainContent = document.getElementById('mainContent');
        results.tests.main_content_exists = !!mainContent;
        console.log('📋 Main content exists:', results.tests.main_content_exists);
        
        // Test 3: Check if menu toggle (hamburger) exists
        const menuToggle = document.getElementById('menuToggle');
        results.tests.menu_toggle_exists = !!menuToggle;
        console.log('📋 Menu toggle (hamburger) exists:', results.tests.menu_toggle_exists);
        
        // Test 4: Check if sidebar toggle exists
        const sidebarToggle = document.getElementById('sidebarToggle');
        results.tests.sidebar_toggle_exists = !!sidebarToggle;
        console.log('📋 Sidebar toggle exists:', results.tests.sidebar_toggle_exists);
        
        // Test 5: Check if navigation manager exists
        results.tests.navigation_manager_exists = !!(window.navigationManager || window.NavigationManager);
        console.log('📋 Navigation manager exists:', results.tests.navigation_manager_exists);
        
        // Test 6: Check current sidebar state
        results.tests.sidebar_collapsed = sidebar ? sidebar.classList.contains('collapsed') : null;
        results.tests.sidebar_active = sidebar ? sidebar.classList.contains('active') : null;
        console.log('📋 Sidebar collapsed:', results.tests.sidebar_collapsed);
        console.log('📋 Sidebar active:', results.tests.sidebar_active);
        
        // Test 7: Test actual toggle functionality
        if (menuToggle && sidebar) {
            try {
                console.log('🧪 Testing menu toggle click...');
                const initialState = sidebar.classList.contains('active');
                menuToggle.click();
                setTimeout(() => {
                    const newState = sidebar.classList.contains('active');
                    results.tests.menu_toggle_works = (initialState !== newState);
                    console.log('📋 Menu toggle works:', results.tests.menu_toggle_works);
                    
                    // Restore original state
                    if (initialState !== newState) {
                        menuToggle.click();
                    }
                }, 100);
            } catch (error) {
                results.tests.menu_toggle_error = error.message;
                console.error('❌ Menu toggle error:', error);
            }
        }
        
        if (sidebarToggle && sidebar) {
            try {
                console.log('🧪 Testing sidebar toggle click...');
                const initialState = sidebar.classList.contains('collapsed');
                sidebarToggle.click();
                setTimeout(() => {
                    const newState = sidebar.classList.contains('collapsed');
                    results.tests.sidebar_toggle_works = (initialState !== newState);
                    console.log('📋 Sidebar toggle works:', results.tests.sidebar_toggle_works);
                    
                    // Restore original state
                    if (initialState !== newState) {
                        sidebarToggle.click();
                    }
                }, 100);
            } catch (error) {
                results.tests.sidebar_toggle_error = error.message;
                console.error('❌ Sidebar toggle error:', error);
            }
        }
        
        // Test 8: Check for event listeners
        if (menuToggle) {
            const events = getEventListeners ? getEventListeners(menuToggle) : 'DevTools required';
            results.tests.menu_toggle_listeners = events;
            console.log('📋 Menu toggle listeners:', events);
        }
        
        // Store results globally for inspection
        window.toggleTestResults = results;
        
        console.log('✅ Toggle functionality test completed');
        console.log('📊 Results:', results);
        
        return results;
    }
    
    // Run test when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', testToggleElements);
    } else {
        testToggleElements();
    }
    
    // Also run after navigation is ready
    document.addEventListener('navigation:ready', () => {
        console.log('🧭 Navigation ready, running toggle test...');
        setTimeout(testToggleElements, 200);
    });
    
    // Global function for manual testing
    window.testToggleFunctionality = testToggleElements;
    
    console.log('🧪 Toggle test script loaded. Run window.testToggleFunctionality() to test manually.');
})();
