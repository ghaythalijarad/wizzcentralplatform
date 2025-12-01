/**
 * Top Bar Loader - WizzCentral Platform
 * Dynamically loads the top bar component into pages
 */

(function() {
    'use strict';

    // Function to load top bar
    async function loadTopBar() {
        try {
            // Find the placeholder or create one
            let placeholder = document.getElementById('topbar-placeholder');
            
            if (!placeholder) {
                // If no placeholder exists, insert at the beginning of body
                placeholder = document.createElement('div');
                placeholder.id = 'topbar-placeholder';
                document.body.insertBefore(placeholder, document.body.firstChild);
            }

            // Fetch the top bar HTML (try root path first, then fallback)
            const paths = ['/includes/topbar.html', '/frontend/includes/topbar.html'];
            let response = null;
            for (const p of paths) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const r = await fetch(p);
                    if (r.ok) { response = r; break; }
                } catch (_) { /* try next */ }
            }
            if (!response) {
                throw new Error('Failed to load top bar from known paths');
            }

            const html = await response.text();
            placeholder.innerHTML = html;

            // Dispatch event to indicate top bar is loaded
            document.dispatchEvent(new CustomEvent('topbarLoaded'));
            
            console.log('Top bar loaded successfully');
        } catch (error) {
            console.error('Error loading top bar:', error);
        }
    }

    // Load top bar when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTopBar);
    } else {
        loadTopBar();
    }
})();
