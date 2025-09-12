console.log('merchant-products.js loaded');

// Status messages
function showStatus(msg, type='info') {
    const el = document.getElementById('status-message');
    if (el) { el.textContent = msg; el.className = `table-status-${type}`; el.style.display = 'block'; }
}
function clearStatus() {
    const el = document.getElementById('status-message'); if (el) el.style.display = 'none';
}

// Parse businessId
function getBusinessId() {
    return new URLSearchParams(window.location.search).get('businessId');
}

// Load categories from API
async function loadCategories() {
    const idToken = sessionStorage.getItem('idToken');
    const response = await fetch(`${window.WIZZCENTRAL_CONFIG.API_BASE_URL}/categories`, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to load categories: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load categories');
    }
    
    return result.data.categories || {};
}

// Load products for businessId from API
async function loadProducts(businessId) {
    const idToken = sessionStorage.getItem('idToken');
    const response = await fetch(`${window.WIZZCENTRAL_CONFIG.API_BASE_URL}/merchants/${businessId}/products`, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load products');
    }
    
    return result.data.products || [];
}

// Render grouped by category
function renderCategoriesAndProducts(categoryMap, products) {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '';
    const grouped = products.reduce((acc, p) => {
        const cid = p.categoryId || p.category_id || 'uncategorized';
        (acc[cid] = acc[cid] || []).push(p);
        return acc;
    }, {});
    for (const cid in grouped) {
        const title = categoryMap[cid] || 'Uncategorized';
        const section = document.createElement('section');
        section.innerHTML = `<h2>${title}</h2><div class="products-grid"></div>`;
        const grid = section.querySelector('.products-grid');
        grouped[cid].forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/100'" />
                <h3>${p.name || p.name_ar}</h3>
                <p>${p.description || p.description_ar || ''}</p>
                <p class="price">${p.price != null ? '$' + p.price : 'N/A'}</p>
            `;
            grid.appendChild(card);
        });
        container.appendChild(section);
    }
}

function refreshPage() { window.location.reload(); }

// On load
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof initializeDashboard === 'function') initializeDashboard();
    
    // Check authentication using centralized utility
    if (!Auth.requireAuthentication()) return;
    
    const businessId = getBusinessId();
    if (!businessId) {
        showStatus('No business selected', 'error'); return;
    }
    showStatus('Loading products...');
    try {
        // Use API endpoints instead of direct DynamoDB access
        const [categories, products] = await Promise.all([loadCategories(), loadProducts(businessId)]);
        clearStatus();
        renderCategoriesAndProducts(categories, products);
    } catch (err) {
        console.error(err);
        showStatus(`Error: ${err.message}`, 'error');
    }
});
