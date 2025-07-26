console.log('merchant-products.js loaded');

// Global logout
window.logout = async () => {
    try {
        if (AWS && AWS.config && AWS.config.credentials) {
            AWS.config.credentials.clearCachedId();
        }
        sessionStorage.clear();
        localStorage.clear(); // Clear both just to be safe
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
};

let dynamoDB;

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

// AWS init
async function initializeAWS() {
    const resp = await fetch('../amplify_outputs.json');
    if (!resp.ok) throw new Error(`Failed loading config: ${resp.status}`);
    const outputs = await resp.json();
    const region = outputs.data.aws_region || 'us-east-1';
    const userPoolId = outputs.auth.user_pool_id;
    const identityPoolId = outputs.auth.identity_pool_id;
    const provider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    AWS.config.update({ region });
    const idToken = sessionStorage.getItem('idToken');
    const credParams = { IdentityPoolId: identityPoolId };
    if (idToken) credParams.Logins = { [provider]: idToken };
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(credParams);
    await AWS.config.credentials.refreshPromise();
    dynamoDB = new AWS.DynamoDB.DocumentClient();
}

// Load categories and map by id
async function loadCategories() {
    const result = await dynamoDB.scan({ TableName: 'order-receiver-categories-dev' }).promise();
    const items = result.Items || [];
    const map = {};
    items.forEach(c => { map[c.categoryId] = c.name || c.name_ar || 'Unknown'; });
    return map;
}

// Load products for businessId
async function loadProducts(businessId) {
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
    const businessId = getBusinessId();
    if (!businessId) {
        showStatus('No business selected', 'error'); return;
    }
    showStatus('Loading products...');
    try {
        await initializeAWS();
        const [categories, products] = await Promise.all([loadCategories(), loadProducts(businessId)]);
        clearStatus();
        renderCategoriesAndProducts(categories, products);
    } catch (err) {
        console.error(err);
        showStatus(`Error: ${err.message}`, 'error');
    }
});
