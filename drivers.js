// Drivers Management JavaScript

// Check authentication on page load - TEMPORARILY DISABLED FOR DEBUGGING
function checkAuthentication() {
  // const idToken = sessionStorage.getItem('idToken');
  // const accessToken = sessionStorage.getItem('accessToken');
  
  // if (!idToken || !accessToken) {
  //   console.warn('No authentication tokens found, redirecting to login');
  //   window.location.href = 'index.html';
  //   return false;
  // }
  
  return true;
}

// AWS SDK and authentication setup
let dynamodbClient = null;
const DRIVERS_TABLE = 'WizzUser_users_dev'; // Assuming drivers are also in the users table

// Global logout function
window.logout = async () => {
    try {
        if (AWS && AWS.config && AWS.config.credentials) {
            AWS.config.credentials.clearCachedId();
        }
        sessionStorage.clear();
        localStorage.clear(); // Clear both just to be safe
        window.location.href = 'index.html'; // Stay in pages directory
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html'; // Stay in pages directory
    }
};

// Initialize AWS credentials and DynamoDB client
async function initializeAWS() {
    try {
        // const idToken = sessionStorage.getItem('idToken');
        // const accessToken = sessionStorage.getItem('accessToken');
        
        // if (!idToken || !accessToken) {
        //     console.log('No authentication tokens found. Redirecting to login.');
        //     window.location.href = 'index.html';
        //     return;
        // }

        if (typeof AWS === 'undefined') {
            throw new Error('AWS SDK not loaded.');
        }

        const response = await fetch('../amplify_outputs.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch amplify_outputs.json: ${response.status}`);
        }
        const outputs = await response.json();
        
        const region = outputs.data?.aws_region || 'us-east-1';
        const userPoolId = outputs.auth.user_pool_id;
        const identityPoolId = outputs.auth.identity_pool_id;
        const cognitoProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        AWS.config.region = region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: identityPoolId,
            Logins: {
                [cognitoProvider]: idToken
            }
        });

        await AWS.config.credentials.refreshPromise();
        console.log("Successfully fetched AWS credentials for drivers.");

        dynamodbClient = new AWS.DynamoDB.DocumentClient();
        console.log('AWS initialized successfully for drivers.');
    } catch (error) {
        console.error('Failed to initialize AWS for drivers:', error);
        // window.location.href = 'index.html'; // TEMPORARILY DISABLED FOR DEBUGGING
        throw error;
    }
}

// Load drivers data from DynamoDB - TEMPORARILY USING MOCK DATA FOR DEBUGGING
async function loadDriversData() {
    try {
        console.log('Loading mock drivers data for debugging...');
        
        // Mock drivers data for testing
        drivers = [
            {
                id: 'DRV001',
                name: 'Carlos Rodriguez',
                email: 'carlos.r@wizz.com',
                phone: '+1-555-1234',
                status: 'online',
                location: 'Downtown Area',
                ordersCompleted: 145,
                rating: 4.8,
                earnings: 89.50,
                vehicleType: 'motorcycle',
                avatar: 'https://i.pravatar.cc/40?u=DRV001'
            },
            {
                id: 'DRV002',
                name: 'Ahmed Hassan',
                email: 'ahmed.h@wizz.com',
                phone: '+1-555-5678',
                status: 'busy',
                location: 'North District',
                ordersCompleted: 203,
                rating: 4.9,
                earnings: 125.75,
                vehicleType: 'bicycle',
                avatar: 'https://i.pravatar.cc/40?u=DRV002'
            },
            {
                id: 'DRV003',
                name: 'Maria Santos',
                email: 'maria.s@wizz.com',
                phone: '+1-555-9012',
                status: 'offline',
                location: 'South Area',
                ordersCompleted: 89,
                rating: 4.6,
                earnings: 45.25,
                vehicleType: 'car',
                avatar: 'https://i.pravatar.cc/40?u=DRV003'
            }
        ];

        console.log('Mock drivers loaded:', drivers);
        initializeDriversPage();
        
    } catch (error) {
        console.error('Error loading drivers data:', error);
        const tbody = document.getElementById('driversTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: #e74c3c;">Failed to load drivers data.</td></tr>`;
        }
    }
}

// Driver management functions
let drivers = []; // Will be populated from DynamoDB

// Initialize drivers page
document.addEventListener('DOMContentLoaded', async function() {
    const tbody = document.getElementById('driversTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">Loading drivers...</td></tr>`;
    }
    
    try {
        // await initializeAWS(); // DISABLED FOR DEBUGGING
        await loadDriversData(); // Using mock data
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize drivers page:', error);
    }
});

// Initialize drivers page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Drivers page DOM loaded');
    
    // Check authentication first - TEMPORARILY DISABLED FOR DEBUGGING
    // if (!checkAuthentication()) {
    //     return;
    // }
    
    // Initialize dashboard functionality (sidebar, etc.)
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    // Load drivers data
    loadDriversData();
});

function initializeDriversPage() {
    renderDriversTable();
    updateDriverStats();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterDrivers);
    }

    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterDrivers);
    }
    
    if (ratingFilter) {
        ratingFilter.addEventListener('change', filterDrivers);
    }

    // Add driver form
    const addDriverForm = document.getElementById('addDriverForm');
    if (addDriverForm) {
        addDriverForm.addEventListener('submit', handleAddDriver);
    }
}

function renderDriversTable(driversList = drivers) {
    const tbody = document.getElementById('driversTableBody');
    if (!tbody) return;

    tbody.innerHTML = driversList.map(driver => `
        <tr>
            <td>
                <div class="driver-info">
                    <div class="driver-avatar">
                        <img src="${driver.avatar}" alt="${driver.name}">
                    </div>
                    <div>
                        <div class="driver-name">${driver.name}</div>
                        <div class="driver-id">#${driver.id}</div>
                    </div>
                </div>
            </td>
            <td>${driver.phone}</td>
            <td><span class="status-badge ${driver.status}">${capitalizeFirst(driver.status)}</span></td>
            <td>${driver.location}</td>
            <td>${driver.ordersCompleted}</td>
            <td>
                <div class="rating">
                    <span class="rating-stars">
                        ${generateStars(driver.rating)}
                    </span>
                    <span class="rating-value">${driver.rating}</span>
                </div>
            </td>
            <td>$${driver.earnings.toFixed(2)}</td>
            <td>
                <div class="actions">
                    <button class="btn-action" onclick="viewDriver('${driver.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="editDriver('${driver.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action danger" onclick="suspendDriver('${driver.id}')" title="Suspend">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterDrivers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;

    let filteredDrivers = drivers.filter(driver => {
        const matchesSearch = driver.name.toLowerCase().includes(searchTerm) ||
                            driver.id.toLowerCase().includes(searchTerm) ||
                            driver.phone.includes(searchTerm);
        
        const matchesStatus = !statusFilter || driver.status === statusFilter;
        
        const matchesRating = !ratingFilter || 
                            (ratingFilter === '5' && driver.rating >= 5) ||
                            (ratingFilter === '4' && driver.rating >= 4) ||
                            (ratingFilter === '3' && driver.rating >= 3);

        return matchesSearch && matchesStatus && matchesRating;
    });

    renderDriversTable(filteredDrivers);
}

function updateDriverStats() {
    const onlineDrivers = drivers.filter(d => d.status === 'online').length;
    const deliveringDrivers = drivers.filter(d => d.status === 'delivering').length;
    const totalDrivers = drivers.length;
    const avgRating = (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1);

    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = onlineDrivers;
        statCards[1].querySelector('h3').textContent = deliveringDrivers;
        statCards[2].querySelector('h3').textContent = totalDrivers;
        statCards[3].querySelector('h3').textContent = avgRating;
    }
}

// Modal functions
function openAddDriverModal() {
    const modal = document.getElementById('addDriverModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddDriverModal() {
    const modal = document.getElementById('addDriverModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset form
        document.getElementById('addDriverForm').reset();
    }
}

function handleAddDriver(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newDriver = {
        id: 'DRV' + String(drivers.length + 1).padStart(3, '0'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        status: 'offline',
        location: 'Not specified',
        ordersCompleted: 0,
        rating: 5.0,
        earnings: 0,
        vehicleType: formData.get('vehicleType'),
        avatar: `https://i.pravatar.cc/40?img=${drivers.length + 4}`
    };

    drivers.push(newDriver);
    renderDriversTable();
    updateDriverStats();
    closeAddDriverModal();
    
    // Show success message
    if (window.dashboardFunctions) {
        window.dashboardFunctions.showNotification('Driver added successfully!', 'success');
    }
}

// Driver action functions
function viewDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
        alert(`Driver Details:\n\nName: ${driver.name}\nEmail: ${driver.email}\nPhone: ${driver.phone}\nStatus: ${driver.status}\nOrders: ${driver.ordersCompleted}\nRating: ${driver.rating}\nEarnings: $${driver.earnings}`);
    }
}

function editDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
        // For demo purposes, just show an alert
        alert(`Edit functionality for ${driver.name} would open here.`);
    }
}

function suspendDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver && confirm(`Are you sure you want to suspend ${driver.name}?`)) {
        driver.status = 'suspended';
        renderDriversTable();
        updateDriverStats();
        
        if (window.dashboardFunctions) {
            window.dashboardFunctions.showNotification(`${driver.name} has been suspended.`, 'success');
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('addDriverModal');
    if (e.target === modal) {
        closeAddDriverModal();
    }
});

// Export functions
window.driversManager = {
    openAddDriverModal,
    closeAddDriverModal,
    viewDriver,
    editDriver,
    suspendDriver
};
