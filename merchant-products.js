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

// Load categories and map by id
async function loadCategories(dynamoDB) {
    const result = await dynamoDB.scan({ TableName: 'order-receiver-categories-dev' }).promise();
    const items = result.Items || [];
    const map = {};
    items.forEach(c => { map[c.categoryId] = c.name || c.name_ar || 'Unknown'; });
    return map;
}

// Load products for businessId
async function loadProducts(businessId, dynamoDB) {
    const params = {
        TableName: 'order-receiver-products-dev',
        FilterExpression: 'businessId = :bid',
        ExpressionAttributeValues: { ':bid': businessId }
    };
    const result = await dynamoDB.scan(params).promise();
    return result.Items || [];
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
        // Initialize AWS using centralized utility
        await AWSUtils.initialize();
        const dynamoDB = AWSUtils.getDynamoDBClient();
        
        const [categories, products] = await Promise.all([loadCategories(dynamoDB), loadProducts(businessId, dynamoDB)]);
        clearStatus();
        renderCategoriesAndProducts(categories, products);
    } catch (err) {
        console.error(err);
        showStatus(`Error: ${err.message}`, 'error');
    }
});
